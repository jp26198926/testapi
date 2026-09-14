import { requireAuth } from "@/lib/api/auth";
import { ERRORS, apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserPlan } from "@/lib/api/plans";

// GET /api/subscriptions — get current user's subscription (app-managed)
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
