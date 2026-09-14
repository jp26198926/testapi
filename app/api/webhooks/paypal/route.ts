import { db } from "@/lib/db";
import { webhookEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/paypal";

// POST /api/webhooks/paypal — optional backup for abandoned checkout returns.
// Primary grant path is POST /api/billing/capture after PayPal redirect.
export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    return Response.json(
      { error: "PAYPAL_WEBHOOK_ID not configured" },
      { status: 500 }
    );
  }

  const raw = await request.text();
  let body: { id?: string; event_type?: string };
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
  const eventId = body.id;
  if (!eventType || !eventId) {
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

  // One-time Orders flow: capture-after-return is authoritative.
  // PAYMENT.CAPTURE.COMPLETED is logged for audit only (no grant here).
  if (eventType !== "PAYMENT.CAPTURE.COMPLETED") {
    return Response.json({ received: true, ignored: eventType });
  }

  return Response.json({ received: true });
}
