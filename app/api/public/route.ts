import { db } from "@/lib/db";
import { collections, records } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { apiSuccess, apiSuccessWithPagination, ERRORS } from "@/lib/api/response";
import { paginationSchema } from "@/lib/api/validation";

// GET /api/public — list public collections with record counts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = paginationSchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };

  const publicCollections = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      description: collections.description,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .where(eq(collections.isPublic, true))
    .limit(limit)
    .offset((page - 1) * limit);

  const totalResult = await db
    .select({ count: count() })
    .from(collections)
    .where(eq(collections.isPublic, true));
  const total = totalResult[0]?.count ?? 0;

  return apiSuccessWithPagination(publicCollections, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
