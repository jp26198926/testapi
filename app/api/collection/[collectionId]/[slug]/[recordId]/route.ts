import { db } from "@/lib/db";
import { collections, records } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, ERRORS } from "@/lib/api/response";
import { updateRecordSchema } from "@/lib/api/validation";
import { parsePositiveInt } from "@/lib/api/params";

// Helper to verify record ownership through collection, including slug check
async function verifyRecordOwnership(
  userId: string,
  collectionId: number,
  slug: string,
  recordId: number
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

  if (col.length === 0 || col[0].slug !== slug) return null;

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

// GET /api/collection/[collectionId]/[slug]/[recordId] (public read)
export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ collectionId: string; slug: string; recordId: string }> }
) {
  const { collectionId: rawColId, slug, recordId: rawRecId } = await params;
  const collectionId = parsePositiveInt(rawColId);
  const recordId = parsePositiveInt(rawRecId);
  if (collectionId === null || recordId === null) {
    return ERRORS.BAD_REQUEST("Invalid ID parameter.");
  }

  const col = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (col.length === 0 || col[0].slug !== slug) {
    return ERRORS.NOT_FOUND();
  }

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

  if (rec.length === 0) return ERRORS.NOT_FOUND();

  const r = rec[0];
  return apiSuccess({
    id: r.id,
    data: r.data,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  });
}

// PATCH /api/collection/[collectionId]/[slug]/[recordId] — partial update
export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ collectionId: string; slug: string; recordId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId: rawColId, slug, recordId: rawRecId } = await params;
  const collectionId = parsePositiveInt(rawColId);
  const recordId = parsePositiveInt(rawRecId);
  if (collectionId === null || recordId === null) {
    return ERRORS.BAD_REQUEST("Invalid ID parameter.");
  }
  const record = await verifyRecordOwnership(
    user.id,
    collectionId,
    slug,
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

// PUT /api/collection/[collectionId]/[slug]/[recordId] — full replace
export async function PUT(
  request: Request,
  {
    params,
  }: { params: Promise<{ collectionId: string; slug: string; recordId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId: rawColId, slug, recordId: rawRecId } = await params;
  const collectionId = parsePositiveInt(rawColId);
  const recordId = parsePositiveInt(rawRecId);
  if (collectionId === null || recordId === null) {
    return ERRORS.BAD_REQUEST("Invalid ID parameter.");
  }
  const record = await verifyRecordOwnership(
    user.id,
    collectionId,
    slug,
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

// DELETE /api/collection/[collectionId]/[slug]/[recordId]
export async function DELETE(
  request: Request,
  {
    params,
  }: { params: Promise<{ collectionId: string; slug: string; recordId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId: rawColId, slug, recordId: rawRecId } = await params;
  const collectionId = parsePositiveInt(rawColId);
  const recordId = parsePositiveInt(rawRecId);
  if (collectionId === null || recordId === null) {
    return ERRORS.BAD_REQUEST("Invalid ID parameter.");
  }
  const record = await verifyRecordOwnership(
    user.id,
    collectionId,
    slug,
    recordId
  );

  if (!record) return ERRORS.NOT_FOUND();

  await db.delete(records).where(eq(records.id, recordId));

  return new Response(null, { status: 204 });
}
