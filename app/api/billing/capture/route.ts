import { requireAuth } from "@/lib/api/auth";
import { ERRORS, apiSuccess } from "@/lib/api/response";
import { captureOrder, getOrder, toPayPalAmount } from "@/lib/paypal";
import { db } from "@/lib/db";
import { plans, payments, subscriptions } from "@/lib/db/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import { getUserPlan } from "@/lib/api/plans";

function extractCustomId(order: {
  custom_id?: string;
  purchase_units?: Array<{ custom_id?: string }>;
}): string {
  return order.purchase_units?.[0]?.custom_id || order.custom_id || "";
}

async function abandonOtherPending(userId: string, keepPaymentId?: string) {
  const conditions = [eq(payments.userId, userId), eq(payments.status, "pending")];
  if (keepPaymentId) {
    conditions.push(ne(payments.id, keepPaymentId));
  }
  await db
    .update(payments)
    .set({
      status: "abandoned",
      description: "Abandoned checkout",
    })
    .where(and(...conditions));
}

async function grantPlanAccess(params: {
  userId: string;
  planId: string;
  paymentId: string;
  captureId?: string;
  skipAmountCheck?: boolean;
  capturedAmount?: { value: string; currency_code: string };
}) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, params.planId), eq(plans.isActive, true)))
    .limit(1);

  if (!plan) {
    return { error: "Plan no longer available." as const };
  }
  if (plan.amount == null || Number(plan.amount) <= 0) {
    return { error: "Invalid plan pricing." as const };
  }

  if (!params.skipAmountCheck && params.capturedAmount) {
    const expected = toPayPalAmount(plan.amount);
    const got = Number(params.capturedAmount.value).toFixed(2);
    const expectedCurrency = (plan.currency || "USD").toUpperCase();
    const gotCurrency = (
      params.capturedAmount.currency_code || "USD"
    ).toUpperCase();

    if (got !== expected || gotCurrency !== expectedCurrency) {
      await db
        .update(payments)
        .set({
          status: "mismatch",
          description: `AMOUNT MISMATCH expected ${expected} ${expectedCurrency} got ${got} ${gotCurrency}`,
        })
        .where(eq(payments.id, params.paymentId));
      return { error: "Captured amount does not match plan." as const };
    }
  }

  const now = new Date();
  const days = plan.durationDays || 30;
  const ms = days * 24 * 60 * 60 * 1000;
  const planName = plan.name.toLowerCase();

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, params.userId))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);

  const isStillActivePaid =
    existing &&
    existing.status === "active" &&
    existing.plan !== "free" &&
    existing.currentPeriodEnd &&
    new Date(existing.currentPeriodEnd) > now;

  if (isStillActivePaid) {
    const base = Math.max(
      new Date(existing.currentPeriodEnd!).getTime(),
      now.getTime()
    );
    await db
      .update(subscriptions)
      .set({
        plan: planName,
        status: "active",
        currentPeriodStart: existing.currentPeriodStart ?? now,
        currentPeriodEnd: new Date(base + ms),
        updatedAt: now,
      })
      .where(eq(subscriptions.id, existing.id));
  } else if (existing) {
    await db
      .update(subscriptions)
      .set({
        plan: planName,
        status: "active",
        providerSubscriptionId: null,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + ms),
        updatedAt: now,
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      userId: params.userId,
      provider: "paypal",
      providerSubscriptionId: null,
      plan: planName,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + ms),
    });
  }

  const description = params.captureId
    ? `${plan.name} ${days}d — capture ${params.captureId}`
    : `${plan.name} ${days}d — granted`;

  await db
    .update(payments)
    .set({ status: "completed", description })
    .where(eq(payments.id, params.paymentId));

  await abandonOtherPending(params.userId, params.paymentId);

  return { plan, days };
}

// POST /api/billing/capture — capture a PayPal order and grant/extend paid plan
export async function POST(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const body = await request.json().catch(() => ({}));
  const orderId =
    typeof body?.orderId === "string" ? body.orderId.trim() : null;
  if (!orderId) return ERRORS.BAD_REQUEST("orderId is required.");

  let [pending] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerPaymentId, orderId))
    .limit(1);

  if (pending && pending.userId !== user.id) {
    return ERRORS.FORBIDDEN("Checkout session belongs to another account.");
  }

  if (!pending) {
    let order;
    try {
      order = await getOrder(orderId);
    } catch {
      return ERRORS.NOT_FOUND("Checkout session not found.");
    }

    const customId = extractCustomId(order);
    const [orderUserId, orderPlanId] = customId.split(":");
    if (orderUserId !== user.id) {
      return ERRORS.FORBIDDEN("Order does not belong to you.");
    }

    const [recoveryPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, orderPlanId))
      .limit(1);
    if (!recoveryPlan?.amount || Number(recoveryPlan.amount) <= 0) {
      return ERRORS.NOT_FOUND("Checkout session not found.");
    }

    const inserted = await db
      .insert(payments)
      .values({
        userId: user.id,
        providerPaymentId: orderId,
        amount: toPayPalAmount(recoveryPlan.amount),
        currency: recoveryPlan.currency || "USD",
        status: "pending",
        description: `${recoveryPlan.name} (${recoveryPlan.durationDays} days)`,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted[0]) {
      pending = inserted[0];
    } else {
      [pending] = await db
        .select()
        .from(payments)
        .where(eq(payments.providerPaymentId, orderId))
        .limit(1);
    }

    if (!pending || pending.userId !== user.id) {
      return ERRORS.NOT_FOUND("Checkout session not found.");
    }
  }

  if (pending.status === "completed") {
    const planNow = await getUserPlan(user.id);
    return apiSuccess({ alreadyCaptured: true, plan: planNow });
  }

  let captured = null;
  let alreadyCapturedAtPayPal = false;

  try {
    captured = await captureOrder(orderId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Capture failed.";
    if (!msg.includes("ORDER_ALREADY_CAPTURED")) {
      return ERRORS.BAD_REQUEST(msg);
    }
    alreadyCapturedAtPayPal = true;
    try {
      captured = await getOrder(orderId);
    } catch {
      return ERRORS.BAD_REQUEST(
        "Order was already captured but could not be loaded from PayPal."
      );
    }
  }

  const capture = captured.purchase_units?.[0]?.payments?.captures?.[0];
  const orderOk =
    alreadyCapturedAtPayPal ||
    captured.status === "COMPLETED" ||
    capture?.status === "COMPLETED";

  if (!orderOk) {
    return ERRORS.BAD_REQUEST("Payment was not completed at PayPal.");
  }

  const customId = extractCustomId(captured);
  let orderPlanId = "";
  if (customId.includes(":")) {
    const [orderUserId, planIdFromCustom] = customId.split(":");
    // Only enforce custom_id ownership when PayPal actually returned one
    if (orderUserId && orderUserId !== user.id) {
      return ERRORS.FORBIDDEN("Order does not belong to you.");
    }
    orderPlanId = planIdFromCustom || "";
  }

  // Resolve plan when custom_id is missing/malformed (PayPal sometimes omits it)
  if (!orderPlanId) {
    const descName = (pending.description || "").split(" (")[0]?.trim().toLowerCase();
    const activePlans = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true));
    const matched =
      (descName
        ? activePlans.find((p) => p.name.toLowerCase() === descName)
        : undefined) ||
      activePlans.find((p) => p.name.toLowerCase() === "pro") ||
      activePlans.find((p) => p.amount != null && Number(p.amount) > 0);
    if (!matched) {
      return ERRORS.BAD_REQUEST("Could not resolve plan for this payment.");
    }
    orderPlanId = matched.id;
  }

  const grant = await grantPlanAccess({
    userId: user.id,
    planId: orderPlanId,
    paymentId: pending.id,
    captureId: capture?.id,
    skipAmountCheck: alreadyCapturedAtPayPal && !capture,
    capturedAmount: capture?.amount,
  });

  if ("error" in grant) {
    return ERRORS.BAD_REQUEST(grant.error);
  }

  const effectivePlan = await getUserPlan(user.id);
  return apiSuccess({
    plan: effectivePlan,
    periodDays: grant.days,
    alreadyCaptured: alreadyCapturedAtPayPal,
  });
}
