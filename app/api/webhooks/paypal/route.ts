import { db } from "@/lib/db";
import { subscriptions, payments, webhookEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/paypal";

// POST /api/webhooks/paypal — PayPal webhook handler
export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    return Response.json(
      { error: "PAYPAL_WEBHOOK_ID not configured" },
      { status: 500 }
    );
  }

  const raw = await request.text();
  let body: {
    id?: string;
    event_type?: string;
    resource?: Record<string, unknown>;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const authAlgo = request.headers.get("paypal-auth-algo") ?? "";
  const certUrl = request.headers.get("paypal-cert-url") ?? "";
  const transmissionId = request.headers.get("paypal-transmission-id") ?? "";
  const transmissionSig = request.headers.get("paypal-transmission-sig") ?? "";
  const transmissionTime =
    request.headers.get("paypal-transmission-time") ?? "";

  if (
    !authAlgo ||
    !certUrl ||
    !transmissionId ||
    !transmissionSig ||
    !transmissionTime
  ) {
    return Response.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  let verified = false;
  try {
    verified = await verifyWebhookSignature({
      authAlgo,
      certUrl,
      transmissionId,
      transmissionSig,
      transmissionTime,
      webhookId,
      webhookEvent: body,
    });
  } catch {
    verified = false;
  }

  if (!verified) {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const eventType = body.event_type;
  const resource = body.resource as Record<string, unknown> | undefined;
  const eventId = body.id;

  if (!eventType || !resource || !eventId) {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const inserted = await db
    .insert(webhookEvents)
    .values({
      provider: "paypal",
      providerEventId: eventId,
      eventType,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted.length === 0) {
    return Response.json(
      { received: true, duplicate: true },
      { status: 200 }
    );
  }

  try {
    await handleEvent(eventType, resource);
  } catch {
    await db.delete(webhookEvents).where(eq(webhookEvents.id, inserted[0].id));
    return Response.json({ error: "handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}

async function handleEvent(
  eventType: string,
  resource: Record<string, unknown>
) {
  const subscriptionId =
    (resource.id as string) || (resource.billing_agreement_id as string);
  if (!subscriptionId) return;

  const existingSub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.providerSubscriptionId, subscriptionId))
    .limit(1);

  const amount = resource.amount as
    | { total?: string; currency?: string }
    | undefined;

  switch (eventType) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.RENEWED": {
      if (existingSub.length > 0) {
        const billingInfo = resource.billing_info as
          | { next_billing_time?: string }
          | undefined;
        await db
          .update(subscriptions)
          .set({
            status: "active",
            plan: "pro",
            currentPeriodStart: new Date(
              (resource.start_time as string) || Date.now()
            ),
            currentPeriodEnd: new Date(
              billingInfo?.next_billing_time || Date.now() + 30 * 86400000
            ),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existingSub[0].id));
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.CANCELLED": {
      if (existingSub.length > 0) {
        await db
          .update(subscriptions)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(subscriptions.id, existingSub[0].id));
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.SUSPENDED": {
      if (existingSub.length > 0) {
        await db
          .update(subscriptions)
          .set({ status: "suspended", updatedAt: new Date() })
          .where(eq(subscriptions.id, existingSub[0].id));
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.EXPIRED": {
      if (existingSub.length > 0) {
        await db
          .update(subscriptions)
          .set({ status: "expired", updatedAt: new Date() })
          .where(eq(subscriptions.id, existingSub[0].id));
      }
      break;
    }

    case "PAYMENT.SALE.COMPLETED": {
      if (existingSub.length > 0) {
        if (existingSub[0].status !== "active") {
          await db
            .update(subscriptions)
            .set({ status: "active", updatedAt: new Date() })
            .where(eq(subscriptions.id, existingSub[0].id));
        }
        await db.insert(payments).values({
          userId: existingSub[0].userId,
          subscriptionId: existingSub[0].id,
          providerPaymentId: (resource.id as string) || null,
          amount: amount?.total || "0",
          currency: amount?.currency || "USD",
          status: "completed",
          description: "Subscription payment",
        });
      }
      break;
    }

    case "PAYMENT.SALE.DENIED": {
      if (existingSub.length > 0) {
        await db
          .update(subscriptions)
          .set({ updatedAt: new Date() })
          .where(eq(subscriptions.id, existingSub[0].id));
        await db.insert(payments).values({
          userId: existingSub[0].userId,
          subscriptionId: existingSub[0].id,
          providerPaymentId: (resource.id as string) || null,
          amount: amount?.total || "0",
          currency: amount?.currency || "USD",
          status: "denied",
          description: "Payment denied",
        });
      }
      break;
    }

    case "PAYMENT.SALE.REFUNDED": {
      if (existingSub.length > 0) {
        await db
          .update(subscriptions)
          .set({ updatedAt: new Date() })
          .where(eq(subscriptions.id, existingSub[0].id));
        await db.insert(payments).values({
          userId: existingSub[0].userId,
          subscriptionId: existingSub[0].id,
          providerPaymentId: (resource.id as string) || null,
          amount: amount?.total || "0",
          currency: amount?.currency || "USD",
          status: "refunded",
          description: "Payment refunded",
        });
      }
      break;
    }

    default:
      break;
  }
}
