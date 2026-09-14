import { requireAuth } from "@/lib/api/auth";
import { ERRORS, apiSuccessWithPagination } from "@/lib/api/response";
import { paginationSchema } from "@/lib/api/validation";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq, and, desc, count, lt } from "drizzle-orm";

// GET /api/payments — paginated payment records for current user
export async function GET(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  // Self-heal: pending checkouts older than 15 minutes are abandoned
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  await db
    .update(payments)
    .set({ status: "abandoned", description: "Abandoned checkout" })
    .where(
      and(
        eq(payments.userId, user.id),
        eq(payments.status, "pending"),
        lt(payments.createdAt, cutoff)
      )
    );

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
