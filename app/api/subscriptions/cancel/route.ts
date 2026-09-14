import { requireAuth } from "@/lib/api/auth";
import { ERRORS, apiSuccess } from "@/lib/api/response";
import { cancelSubscription } from "@/lib/paypal";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and, desc, isNotNull } from "drizzle-orm";

// POST /api/subscriptions/cancel — cancel the user's active subscription
export async function POST() {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const rows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active"),
        isNotNull(subscriptions.providerSubscriptionId)
      )
    )
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);

  const sub = rows[0];
  if (!sub?.providerSubscriptionId) {
    return ERRORS.NOT_FOUND("No active subscription to cancel.");
  }

  try {
    await cancelSubscription(sub.providerSubscriptionId, "Cancelled by user");
  } catch (err) {
    return ERRORS.BAD_REQUEST(
      err instanceof Error ? err.message : "Cancel failed."
    );
  }

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id));

  return apiSuccess({ status: "cancelled" });
}
