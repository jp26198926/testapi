import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, ERRORS } from "@/lib/api/response";

// DELETE /api/keys/[keyId] — revoke an API key
export async function DELETE(
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
    .select()
    .from(apiKeys)
    .where(
      and(eq(apiKeys.id, keyId), eq(apiKeys.userId, user.id))
    )
    .limit(1);

  if (key.length === 0) {
    return ERRORS.NOT_FOUND();
  }

  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, keyId));

  return apiSuccess({ message: "API key revoked." });
}
