import { db } from "@/lib/db";
import { subscriptions, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST /api/webhooks/paypal — PayPal webhook handler
export async function POST(request: Request) {
  const body = await request.json();

  // TODO: Verify PayPal webhook signature in production
  // const headers = request.headers;
  // const signature = headers.get("paypal-transmission-sig");
  // Verify using PayPal's webhook verification API

  const eventType = body.event_type;
  const resource = body.resource;

  if (!eventType || !resource) {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const subscriptionId = resource.id || resource.billing_agreement_id;
  if (!subscriptionId) {
    return Response.json({ error: "Missing subscription ID" }, { status: 400 });
  }

  // Find subscription by PayPal subscription ID
  const existingSub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.providerSubscriptionId, subscriptionId))
    .limit(1);

  switch (eventType) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.RENEWED": {
      if (existingSub.length > 0) {
        await db
          .update(subscriptions)
          .set({
            status: "active",
            plan: "pro",
            currentPeriodStart: new Date(
              resource.start_time || Date.now()
            ),
            currentPeriodEnd: new Date(
              resource.billing_info?.next_billing_time ||
                Date.now() + 30 * 86400000
            ),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.providerSubscriptionId, subscriptionId));
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.CANCELLED": {
      if (existingSub.length > 0) {
        await db
          .update(subscriptions)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.providerSubscriptionId, subscriptionId));
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.SUSPENDED": {
      if (existingSub.length > 0) {
        await db
          .update(subscriptions)
          .set({
            status: "suspended",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.providerSubscriptionId, subscriptionId));
      }
      break;
    }

    case "BILLING.SUBSCRIPTION.EXPIRED": {
      if (existingSub.length > 0) {
        await db
          .update(subscriptions)
          .set({
            status: "expired",
            plan: "free",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.providerSubscriptionId, subscriptionId));
      }
      break;
    }

    case "PAYMENT.SALE.COMPLETED": {
      // Payment succeeded — ensure subscription stays active
      if (existingSub.length > 0) {
        if (existingSub[0].status !== "active") {
          await db
            .update(subscriptions)
            .set({ status: "active", updatedAt: new Date() })
            .where(eq(subscriptions.providerSubscriptionId, subscriptionId));
        }
        await db.insert(payments).values({
          userId: existingSub[0].userId,
          subscriptionId: existingSub[0].id,
          providerPaymentId: resource.id || null,
          amount: resource.amount?.total || "0",
          currency: resource.amount?.currency || "USD",
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
          .where(eq(subscriptions.providerSubscriptionId, subscriptionId));
        await db.insert(payments).values({
          userId: existingSub[0].userId,
          subscriptionId: existingSub[0].id,
          providerPaymentId: resource.id || null,
          amount: resource.amount?.total || "0",
          currency: resource.amount?.currency || "USD",
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
          .where(eq(subscriptions.providerSubscriptionId, subscriptionId));
        await db.insert(payments).values({
          userId: existingSub[0].userId,
          subscriptionId: existingSub[0].id,
          providerPaymentId: resource.id || null,
          amount: resource.amount?.total || "0",
          currency: resource.amount?.currency || "USD",
          status: "refunded",
          description: "Payment refunded",
        });
      }
      break;
    }

    default:
      // Acknowledge unhandled events
      break;
  }

  return Response.json({ received: true });
}
