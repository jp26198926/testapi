import { db } from "@/lib/db";
import { users, collections, subscriptions } from "@/lib/db/schema";
import { requireAuth } from "@/lib/api/auth";
import { requireAdmin } from "@/lib/api/admin";
import { apiSuccessWithPagination, ERRORS } from "@/lib/api/response";
import { paginationSchema } from "@/lib/api/validation";
import { count, desc, eq, and, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }
  try {
    requireAdmin(user);
  } catch {
    return ERRORS.FORBIDDEN();
  }

  const url = new URL(request.url);
  const parsed = paginationSchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return ERRORS.BAD_REQUEST("Invalid pagination.");
  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const [totalRow] = await db.select({ value: count() }).from(users);
  const total = totalRow?.value ?? 0;

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const userIds = userRows.map((u) => u.id);

  const countRows = userIds.length
    ? await db
        .select({ userId: collections.userId, value: count() })
        .from(collections)
        .where(inArray(collections.userId, userIds))
        .groupBy(collections.userId)
    : [];
  const countMap = new Map(countRows.map((r) => [r.userId, r.value]));

  const subRows = userIds.length
    ? await db
        .select()
        .from(subscriptions)
        .where(
          and(
            inArray(subscriptions.userId, userIds),
            eq(subscriptions.status, "active")
          )
        )
    : [];

  function resolvePlan(uid: string): "free" | "pro" {
    for (const s of subRows) {
      if (
        s.userId === uid &&
        s.plan !== "free" &&
        s.currentPeriodEnd &&
        new Date(s.currentPeriodEnd) > new Date()
      ) {
        return "pro";
      }
    }
    return "free";
  }

  const data = userRows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    plan: resolvePlan(u.id),
    collectionCount: countMap.get(u.id) ?? 0,
    isAdmin: u.email === process.env.ADMIN_EMAIL,
  }));

  return apiSuccessWithPagination(data, {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
