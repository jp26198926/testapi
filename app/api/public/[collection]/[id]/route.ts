import { db } from "@/lib/db";
import { collections, records } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { apiSuccess, ERRORS } from "@/lib/api/response";

// GET /api/public/[collection]/[id] — get a single record from a public collection
export async function GET(
  request: Request,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  const { collection: slug, id } = await params;

  const col = await db
    .select()
    .from(collections)
    .where(
      and(eq(collections.slug, slug), eq(collections.isPublic, true))
    )
    .limit(1);

  if (col.length === 0) {
    return ERRORS.NOT_FOUND("Public collection not found.");
  }

  const record = await db
    .select()
    .from(records)
    .where(
      and(eq(records.id, id), eq(records.collectionId, col[0].id))
    )
    .limit(1);

  if (record.length === 0) {
    return ERRORS.NOT_FOUND("Record not found.");
  }

  const r = record[0];
  return apiSuccess({
    id: r.id,
    ...((r.data as Record<string, unknown>) || {}),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  });
}
