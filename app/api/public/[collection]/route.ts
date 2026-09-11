import { db } from "@/lib/db";
import { collections, records } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import {
  apiSuccess,
  apiSuccessWithPagination,
  ERRORS,
} from "@/lib/api/response";
import { paginationSchema } from "@/lib/api/validation";

// GET /api/public/[collection] — list records in a public collection
export async function GET(
  request: Request,
  { params }: { params: Promise<{ collection: string }> }
) {
  const { collection: slug } = await params;
  const url = new URL(request.url);
  const parsed = paginationSchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  const { page, limit } = parsed.success
    ? parsed.data
    : { page: 1, limit: 20 };

  // Find the public collection by slug
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

  const collection = col[0];

  const recordList = await db
    .select()
    .from(records)
    .where(eq(records.collectionId, collection.id))
    .orderBy(records.createdAt)
    .limit(limit)
    .offset((page - 1) * limit);

  const totalResult = await db
    .select({ count: count() })
    .from(records)
    .where(eq(records.collectionId, collection.id));
  const total = totalResult[0]?.count ?? 0;

  return apiSuccessWithPagination(
    recordList.map((r) => ({
      id: r.id,
      ...((r.data as Record<string, unknown>) || {}),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
}
