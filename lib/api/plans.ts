import { db } from "@/lib/db";
import { apiKeys, subscriptions, collections } from "@/lib/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";
import { hashApiKey } from "./api-keys";
import { isAdmin } from "./admin";
import type { User } from "better-auth";

export async function getUserPlan(
  userId: string
): Promise<"free" | "pro"> {
  const sub = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  if (sub.length > 0) {
    const s = sub[0];
    if (
      s.plan === "pro" &&
      s.currentPeriodEnd &&
      new Date(s.currentPeriodEnd) > new Date()
    ) {
      return "pro";
    }
  }
  return "free";
}

export async function getCollectionCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(collections)
    .where(eq(collections.userId, userId));
  return result[0]?.count ?? 0;
}

export async function canCreateCollection(
  userId: string,
  user?: User
): Promise<boolean> {
  if (user && isAdmin(user)) return true;
  const plan = await getUserPlan(userId);
  if (plan === "pro") return true;
  const currentCount = await getCollectionCount(userId);
  return currentCount < 5;
}

export async function getRecordCount(collectionId: string): Promise<number> {
  const { records } = await import("@/lib/db/schema");
  const result = await db
    .select({ count: count() })
    .from(records)
    .where(eq(records.collectionId, collectionId));
  return result[0]?.count ?? 0;
}

export async function canCreateRecord(
  userId: string,
  collectionId: string,
  user?: User
): Promise<boolean> {
  if (user && isAdmin(user)) return true;
  const plan = await getUserPlan(userId);
  if (plan === "pro") return true;
  const currentCount = await getRecordCount(collectionId);
  return currentCount < 50;
}

export async function authenticateApiKey(
  key: string
): Promise<string | null> {
  const hash = hashApiKey(key);
  const result = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash))
    .limit(1);

  if (result.length === 0) return null;

  const apiKey = result[0];
  if (apiKey.revokedAt) return null;
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) return null;

  // Update last used
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

  return apiKey.userId;
}
