import { requireAuth } from "@/lib/api/auth";
import { ERRORS, apiSuccess } from "@/lib/api/response";
import { createSubscription } from "@/lib/paypal";
import { db } from "@/lib/db";
import { subscriptions, plans } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { getUserPlan } from "@/lib/api/plans";

// GET /api/subscriptions — get current user's subscription
export async function GET() {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const plan = await getUserPlan(user.id);

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);

  return apiSuccess({
    plan,
    subscription: sub.length > 0 ? sub[0] : null,
  });
}

// POST /api/subscriptions — create a PayPal subscription
export async function POST(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const current = await getUserPlan(user.id);
  if (current === "pro") {
    return ERRORS.CONFLICT("You already have an active Pro subscription.");
  }

  const body = await request.json().catch(() => ({}));
  const planId = typeof body?.planId === "string" ? body.planId : undefined;

  let paypalPlanId: string | undefined;
  if (planId) {
    const [row] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.isActive, true)))
      .limit(1);
    paypalPlanId = row?.paypalPlanId ?? undefined;
  } else {
    const activePlans = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(asc(plans.sortOrder));
    const pro =
      activePlans.find((p) => p.name.toLowerCase() === "pro") ??
      activePlans[0];
    paypalPlanId = pro?.paypalPlanId ?? undefined;
  }

  try {
    const { id, approvalUrl } = await createSubscription(paypalPlanId);

    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(subscriptions)
        .set({
          providerSubscriptionId: id,
          status: "pending",
          plan: "pro",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, user.id));
    } else {
      await db.insert(subscriptions).values({
        userId: user.id,
        provider: "paypal",
        providerSubscriptionId: id,
        plan: "pro",
        status: "pending",
      });
    }

    return apiSuccess({ subscriptionId: id, approvalUrl });
  } catch (err) {
    return ERRORS.BAD_REQUEST(
      err instanceof Error ? err.message : "Failed to create subscription."
    );
  }
}
