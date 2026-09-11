import { db } from "@/lib/db";
import { collections, records } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, ERRORS } from "@/lib/api/response";
import { updateRecordSchema } from "@/lib/api/validation";

// Helper to verify record ownership through collection
async function verifyRecordOwnership(
  userId: string,
  collectionId: string,
  recordId: string
) {
  const col = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.id, collectionId),
        eq(collections.userId, userId)
      )
    )
    .limit(1);

  if (col.length === 0) return null;

  const rec = await db
    .select()
    .from(records)
    .where(
      and(
        eq(records.id, recordId),
        eq(records.collectionId, collectionId)
      )
    )
    .limit(1);

  return rec.length > 0 ? rec[0] : null;
}

// GET /api/collections/[collectionId]/records/[recordId]
export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ collectionId: string; recordId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId, recordId } = await params;
  const record = await verifyRecordOwnership(
    user.id,
    collectionId,
    recordId
  );

  if (!record) return ERRORS.NOT_FOUND();

  return apiSuccess({
    id: record.id,
    data: record.data,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

// PATCH /api/collections/[collectionId]/records/[recordId] — partial update
export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ collectionId: string; recordId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId, recordId } = await params;
  const record = await verifyRecordOwnership(
    user.id,
    collectionId,
    recordId
  );

  if (!record) return ERRORS.NOT_FOUND();

  const body = await request.json();
  const parsed = updateRecordSchema.safeParse(body);
  if (!parsed.success) {
    return ERRORS.BAD_REQUEST(
      parsed.error.issues.map((i) => i.message).join("; ")
    );
  }

  // Merge existing data with new data
  const mergedData = {
    ...((record.data as Record<string, unknown>) || {}),
    ...parsed.data.data,
  };

  const [updated] = await db
    .update(records)
    .set({ data: mergedData, updatedAt: new Date() })
    .where(eq(records.id, recordId))
    .returning();

  return apiSuccess({
    id: updated.id,
    data: updated.data,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

// PUT /api/collections/[collectionId]/records/[recordId] — full replace
export async function PUT(
  request: Request,
  {
    params,
  }: { params: Promise<{ collectionId: string; recordId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId, recordId } = await params;
  const record = await verifyRecordOwnership(
    user.id,
    collectionId,
    recordId
  );

  if (!record) return ERRORS.NOT_FOUND();

  const body = await request.json();
  const parsed = updateRecordSchema.safeParse(body);
  if (!parsed.success) {
    return ERRORS.BAD_REQUEST(
      parsed.error.issues.map((i) => i.message).join("; ")
    );
  }

  const [updated] = await db
    .update(records)
    .set({ data: parsed.data.data, updatedAt: new Date() })
    .where(eq(records.id, recordId))
    .returning();

  return apiSuccess({
    id: updated.id,
    data: updated.data,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

// DELETE /api/collections/[collectionId]/records/[recordId]
export async function DELETE(
  request: Request,
  {
    params,
  }: { params: Promise<{ collectionId: string; recordId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId, recordId } = await params;
  const record = await verifyRecordOwnership(
    user.id,
    collectionId,
    recordId
  );

  if (!record) return ERRORS.NOT_FOUND();

  await db.delete(records).where(eq(records.id, recordId));

  return new Response(null, { status: 204 });
}
