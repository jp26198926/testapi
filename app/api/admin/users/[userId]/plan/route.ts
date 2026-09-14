import { z } from "zod";
import { db } from "@/lib/db";
import { users, subscriptions, plans as plansTable } from "@/lib/db/schema";
import { requireAuth } from "@/lib/api/auth";
import { requireAdmin } from "@/lib/api/admin";
import { apiSuccess, ERRORS } from "@/lib/api/response";
import { eq, desc, asc } from "drizzle-orm";

const changePlanSchema = z.object({
  plan: z.enum(["free", "pro"]),
});

async function guardAdmin() {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return { error: ERRORS.UNAUTHORIZED() } as const;
  }
  try {
    requireAdmin(user);
  } catch {
    return { error: ERRORS.FORBIDDEN() } as const;
  }
  return { user } as const;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const guard = await guardAdmin();
  if ("error" in guard) return guard.error;

  const { userId } = await params;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existing.length === 0) return ERRORS.NOT_FOUND("User not found.");

  const body = await request.json();
  const parsed = changePlanSchema.safeParse(body);
  if (!parsed.success)
    return ERRORS.BAD_REQUEST("Plan must be 'free' or 'pro'.");
  const { plan } = parsed.data;

  const existingSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.updatedAt));

  const now = new Date();

  if (plan === "pro") {
    const planRows = await db
      .select()
      .from(plansTable)
      .where(eq(plansTable.isActive, true))
      .orderBy(asc(plansTable.sortOrder));
    const proPlan = planRows.find((p) => p.name.toLowerCase().includes("pro"));
    const durationDays = proPlan?.durationDays ?? 30;
    const periodEnd = new Date(now.getTime() + durationDays * 86_400_000);

    if (existingSubs.length > 0) {
      const target = existingSubs[0];
      await db
        .update(subscriptions)
        .set({
          plan: "pro",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, target.id));
    } else {
      await db.insert(subscriptions).values({
        userId,
        provider: "admin",
        plan: "pro",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    }
  } else {
    for (const s of existingSubs) {
      if (s.status === "active") {
        await db
          .update(subscriptions)
          .set({
            plan: "free",
            status: "cancelled",
            currentPeriodEnd: now,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, s.id));
      }
    }
  }

  const refreshed = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.updatedAt));

  return apiSuccess({ userId, plan, subscriptions: refreshed });
}
