import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, ERRORS } from "@/lib/api/response";
import { updateCollectionSchema } from "@/lib/api/validation";
import { toSlug } from "@/lib/utils";

// GET /api/collections/[collectionId] — get single collection
export async function GET(
  request: Request,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId } = await params;

  const col = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.id, collectionId),
        eq(collections.userId, user.id)
      )
    )
    .limit(1);

  if (col.length === 0) {
    return ERRORS.NOT_FOUND();
  }

  return apiSuccess(col[0]);
}

// PATCH /api/collections/[collectionId] — update collection
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId } = await params;
  const body = await request.json();
  const parsed = updateCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return ERRORS.BAD_REQUEST(
      parsed.error.issues.map((i) => i.message).join("; ")
    );
  }

  // Verify ownership
  const col = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.id, collectionId),
        eq(collections.userId, user.id)
      )
    )
    .limit(1);

  if (col.length === 0) {
    return ERRORS.NOT_FOUND();
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (parsed.data.name) {
    updates.name = parsed.data.name;
    updates.slug = toSlug(parsed.data.name);
  }
  if (parsed.data.description !== undefined) {
    updates.description = parsed.data.description;
  }

  const [updated] = await db
    .update(collections)
    .set(updates)
    .where(eq(collections.id, collectionId))
    .returning();

  return apiSuccess(updated);
}

// DELETE /api/collections/[collectionId] — delete collection and its records
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId } = await params;

  const col = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.id, collectionId),
        eq(collections.userId, user.id)
      )
    )
    .limit(1);

  if (col.length === 0) {
    return ERRORS.NOT_FOUND();
  }

  // Records cascade on delete (ON DELETE CASCADE in schema)
  await db.delete(collections).where(eq(collections.id, collectionId));

  return new Response(null, { status: 204 });
}
