import { requireAuth } from "@/lib/api/auth";
import { ERRORS, apiSuccessWithPagination } from "@/lib/api/response";
import { paginationSchema } from "@/lib/api/validation";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";

// GET /api/payments — paginated payment records for current user
export async function GET(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  const url = new URL(request.url);
  const params = paginationSchema.safeParse({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  });

  if (!params.success) {
    return ERRORS.BAD_REQUEST("Invalid pagination parameters.");
  }

  const { page, limit } = params.data;
  const offset = (page - 1) * limit;

  const [totalResult] = await db
    .select({ value: count() })
    .from(payments)
    .where(eq(payments.userId, user.id));

  const total = totalResult.value;
  const totalPages = Math.ceil(total / limit);

  const data = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .offset(offset);

  return apiSuccessWithPagination(data, { page, limit, total, totalPages });
}
