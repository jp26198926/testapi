import { requireAuth } from "@/lib/api/auth";
import { ERRORS, apiSuccess } from "@/lib/api/response";
import { createSubscription } from "@/lib/paypal";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
    .limit(1);

  return apiSuccess({
    plan,
    subscription: sub.length > 0 ? sub[0] : null,
  });
}

// POST /api/subscriptions — create a PayPal subscription
export async function POST() {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  try {
    const { id, approvalUrl } = await createSubscription();

    // Store pending subscription
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
