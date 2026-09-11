import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, ERRORS } from "@/lib/api/response";
import { createApiKeySchema } from "@/lib/api/validation";
import { generateApiKey } from "@/lib/api/api-keys";
import { checkRateLimit } from "@/lib/api/rate-limit";

// GET /api/keys — list user's API keys (no secrets)
export async function GET() {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const keys = await db
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
    .where(eq(apiKeys.userId, user.id))
    .orderBy(apiKeys.createdAt);

  return apiSuccess(keys);
}

// POST /api/keys — create a new API key
export async function POST(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const rl = checkRateLimit(user.id, "free");
  if (!rl.allowed) return ERRORS.RATE_LIMITED();

  const body = await request.json();
  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return ERRORS.BAD_REQUEST(
      parsed.error.issues.map((i) => i.message).join("; ")
    );
  }

  const { raw, hash, prefix } = generateApiKey();

  const expiresAt = parsed.data.expiresInDays
    ? new Date(Date.now() + parsed.data.expiresInDays * 86400000)
    : null;

  const [newKey] = await db
    .insert(apiKeys)
    .values({
      userId: user.id,
      name: parsed.data.name,
      keyHash: hash,
      keyPrefix: prefix,
      expiresAt,
    })
    .returning();

  // Return the raw key only on creation
  return apiSuccess(
    {
      id: newKey.id,
      name: newKey.name,
      key: raw, // shown only once
      keyPrefix: prefix,
      expiresAt: newKey.expiresAt,
      createdAt: newKey.createdAt,
    },
    201
  );
}
