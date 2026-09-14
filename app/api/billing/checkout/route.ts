import { requireAuth } from "@/lib/api/auth";
import { ERRORS, apiSuccess } from "@/lib/api/response";
import { createOrder, toPayPalAmount } from "@/lib/paypal";
import { db } from "@/lib/db";
import { plans, payments } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

// POST /api/billing/checkout — create a one-time PayPal order
export async function POST(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const body = await request.json().catch(() => ({}));
  const planId = typeof body?.planId === "string" ? body.planId : undefined;

  let plan;
  if (planId) {
    [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.isActive, true)))
      .limit(1);
  } else {
    const active = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(asc(plans.sortOrder));
    plan = active.find((p) => p.name.toLowerCase() === "pro") ?? active[0];
  }

  if (!plan) {
    return ERRORS.NOT_FOUND("No payable plan configured.");
  }
  if (plan.amount == null || Number(plan.amount) <= 0) {
    return ERRORS.BAD_REQUEST("This plan does not require payment.");
  }

  const amount = toPayPalAmount(plan.amount);
  const currency = plan.currency || "USD";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    // Drop any abandoned checkouts so Payment Records stays clean
    await db
      .update(payments)
      .set({ status: "abandoned", description: "Abandoned checkout" })
      .where(and(eq(payments.userId, user.id), eq(payments.status, "pending")));

    const { id: orderId, approvalUrl } = await createOrder({
      amount,
      currency,
      customId: `${user.id}:${plan.id}`,
      description: `${plan.name} — ${plan.durationDays} days`,
      returnUrl: `${appUrl}/billing?checkout=return`,
      cancelUrl: `${appUrl}/billing?cancelled=true`,
    });

    await db.insert(payments).values({
      userId: user.id,
      providerPaymentId: orderId,
      amount,
      currency,
      status: "pending",
      description: `${plan.name} (${plan.durationDays} days)`,
    });

    return apiSuccess({ orderId, approvalUrl });
  } catch (err) {
    return ERRORS.BAD_REQUEST(
      err instanceof Error ? err.message : "Failed to start checkout."
    );
  }
}
