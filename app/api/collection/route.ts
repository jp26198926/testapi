import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import {
  apiSuccess,
  apiSuccessWithPagination,
  ERRORS,
} from "@/lib/api/response";
import {
  createCollectionSchema,
  paginationSchema,
} from "@/lib/api/validation";
import { canCreateCollection } from "@/lib/api/plans";
import { toSlug } from "@/lib/utils";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { isAdmin } from "@/lib/api/admin";

// GET /api/collection — list user's collections
export async function GET(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const url = new URL(request.url);
  const parsed = paginationSchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  const { page, limit } = parsed.success
    ? parsed.data
    : { page: 1, limit: 20 };

  const userCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.userId, user.id))
    .orderBy(collections.createdAt)
    .limit(limit)
    .offset((page - 1) * limit);

  const totalResult = await db
    .select({ count: count() })
    .from(collections)
    .where(eq(collections.userId, user.id));
  const total = totalResult[0]?.count ?? 0;

  return apiSuccessWithPagination(userCollections, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/collection — create a collection
export async function POST(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  // Rate limit
  const rl = checkRateLimit(user.id, isAdmin(user) ? "admin" : "free");
  if (!rl.allowed) return ERRORS.RATE_LIMITED();

  const body = await request.json();
  const parsed = createCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return ERRORS.BAD_REQUEST(
      parsed.error.issues.map((i) => i.message).join("; ")
    );
  }

  const canCreate = await canCreateCollection(user.id, user);
  if (!canCreate) {
    return ERRORS.COLLECTION_LIMIT_REACHED();
  }

  // Check name uniqueness for this user
  const existingName = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.userId, user.id),
        eq(collections.name, parsed.data.name)
      )
    )
    .limit(1);

  if (existingName.length > 0) {
    return ERRORS.BAD_REQUEST("A collection with this name already exists.");
  }

  const slug = toSlug(parsed.data.name);

  const [newCollection] = await db
    .insert(collections)
    .values({
      userId: user.id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      isPublic: false,
    })
    .returning();

  return apiSuccess(newCollection, 201);
}
