import { db } from "@/lib/db";
import { collections, records } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import {
  apiSuccess,
  apiSuccessWithPagination,
  ERRORS,
} from "@/lib/api/response";
import {
  createRecordSchema,
  paginationSchema,
} from "@/lib/api/validation";
import { canCreateRecord } from "@/lib/api/plans";
import { checkRateLimit } from "@/lib/api/rate-limit";

// GET /api/collection/[collectionId]/[slug] — list records
export async function GET(
  request: Request,
  { params }: { params: Promise<{ collectionId: string; slug: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId, slug } = await params;
  const url = new URL(request.url);
  const parsed = paginationSchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  const { page, limit } = parsed.success
    ? parsed.data
    : { page: 1, limit: 20 };

  // Verify ownership and slug
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

  if (col.length === 0 || col[0].slug !== slug) {
    return ERRORS.NOT_FOUND();
  }

  const recordList = await db
    .select()
    .from(records)
    .where(eq(records.collectionId, collectionId))
    .orderBy(records.createdAt)
    .limit(limit)
    .offset((page - 1) * limit);

  const totalResult = await db
    .select({ count: count() })
    .from(records)
    .where(eq(records.collectionId, collectionId));
  const total = totalResult[0]?.count ?? 0;

  return apiSuccessWithPagination(
    recordList.map((r) => ({
      id: r.id,
      data: r.data,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
}

// POST /api/collection/[collectionId]/[slug] — create a record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ collectionId: string; slug: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const { collectionId, slug } = await params;

  // Rate limit
  const rl = checkRateLimit(user.id, "free");
  if (!rl.allowed) return ERRORS.RATE_LIMITED();

  // Verify ownership and slug
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

  if (col.length === 0 || col[0].slug !== slug) {
    return ERRORS.NOT_FOUND();
  }

  // Check plan limits
  const canCreate = await canCreateRecord(user.id, collectionId);
  if (!canCreate) {
    return ERRORS.RECORD_LIMIT_REACHED();
  }

  const body = await request.json();
  const parsed = createRecordSchema.safeParse(body);
  if (!parsed.success) {
    return ERRORS.BAD_REQUEST(
      parsed.error.issues.map((i) => i.message).join("; ")
    );
  }

  const [newRecord] = await db
    .insert(records)
    .values({
      collectionId,
      data: parsed.data.data,
    })
    .returning();

  return apiSuccess(
    {
      id: newRecord.id,
      data: newRecord.data,
      createdAt: newRecord.createdAt,
      updatedAt: newRecord.updatedAt,
    },
    201
  );
}
