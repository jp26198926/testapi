import { db } from "@/lib/db";
import { users, collections, apiKeys, subscriptions } from "@/lib/db/schema";
import { requireAuth } from "@/lib/api/auth";
import { requireAdmin } from "@/lib/api/admin";
import { apiSuccess, ERRORS } from "@/lib/api/response";
import { eq, desc } from "drizzle-orm";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const guard = await guardAdmin();
  if ("error" in guard) return guard.error;

  const { userId } = await params;

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (userRows.length === 0) return ERRORS.NOT_FOUND("User not found.");
  const userRow = userRows[0];

  const collectionRows = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      isPublic: collections.isPublic,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(desc(collections.createdAt));

  const apiKeyRows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));

  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.updatedAt));

  let plan: "free" | "pro" = "free";
  for (const s of subRows) {
    if (
      s.plan !== "free" &&
      s.status === "active" &&
      s.currentPeriodEnd &&
      new Date(s.currentPeriodEnd) > new Date()
    ) {
      plan = "pro";
      break;
    }
  }

  return apiSuccess({
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    emailVerified: userRow.emailVerified,
    createdAt: userRow.createdAt,
    isAdmin: userRow.email === process.env.ADMIN_EMAIL,
    plan,
    collections: collectionRows,
    apiKeys: apiKeyRows,
    subscriptions: subRows.map((s) => ({
      id: s.id,
      provider: s.provider,
      plan: s.plan,
      status: s.status,
      currentPeriodStart: s.currentPeriodStart,
      currentPeriodEnd: s.currentPeriodEnd,
      createdAt: s.createdAt,
    })),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const guard = await guardAdmin();
  if ("error" in guard) return guard.error;

  const { userId } = await params;

  if (userId === guard.user.id) {
    return ERRORS.BAD_REQUEST("You cannot delete your own admin account.");
  }

  const existing = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existing.length === 0) return ERRORS.NOT_FOUND("User not found.");

  if (existing[0].email === process.env.ADMIN_EMAIL) {
    return ERRORS.BAD_REQUEST("Cannot delete the admin account.");
  }

  await db.delete(users).where(eq(users.id, userId));

  return new Response(null, { status: 204 });
}
