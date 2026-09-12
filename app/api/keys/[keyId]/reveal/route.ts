import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, ERRORS } from "@/lib/api/response";
import { decryptApiKey } from "@/lib/api/api-keys";

// GET /api/keys/[keyId]/reveal — return decrypted API key
export async function GET(
  request: Request,
  { params }: { params: Promise<{ keyId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { keyId } = await params;

  const key = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      encryptedKey: apiKeys.encryptedKey,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, user.id)))
    .limit(1);

  if (key.length === 0) {
    return ERRORS.NOT_FOUND();
  }

  if (!key[0].encryptedKey) {
    return ERRORS.NOT_FOUND("Key was created before encryption was enabled.");
  }

  const raw = decryptApiKey(key[0].encryptedKey);
  return apiSuccess({ key: raw });
}
