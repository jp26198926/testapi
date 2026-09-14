import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { requireAuth } from "@/lib/api/auth";
import { requireAdmin } from "@/lib/api/admin";
import { apiSuccess, ERRORS } from "@/lib/api/response";
import { eq, asc } from "drizzle-orm";

// GET /api/plans — public returns active plans; ?all=true returns all (admin)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const showAll = url.searchParams.get("all") === "true";

  if (showAll) {
    let user;
    try {
      ({ user } = await requireAuth());
    } catch {
      return ERRORS.UNAUTHORIZED();
    }
    requireAdmin(user);

    const allPlans = await db.select().from(plans).orderBy(asc(plans.sortOrder));
    return apiSuccess(allPlans);
  }

  const activePlans = await db
    .select({
      id: plans.id,
      name: plans.name,
      price: plans.price,
      amount: plans.amount,
      currency: plans.currency,
      durationDays: plans.durationDays,
      features: plans.features,
      isActive: plans.isActive,
      sortOrder: plans.sortOrder,
    })
    .from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(asc(plans.sortOrder));

  return apiSuccess(activePlans);
}

// POST /api/plans — admin only, create a plan
export async function POST(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }
  requireAdmin(user);

  const body = await request.json();

  if (!body.name || !body.price) {
    return ERRORS.BAD_REQUEST("Name and price are required.");
  }

  const [created] = await db
    .insert(plans)
    .values({
      name: body.name,
      price: body.price,
      amount:
        body.amount == null
          ? null
          : typeof body.amount === "number"
            ? String(body.amount.toFixed(2))
            : String(body.amount),
      currency:
        typeof body.currency === "string" && body.currency.length === 3
          ? body.currency.toUpperCase()
          : "USD",
      durationDays:
        typeof body.durationDays === "number" &&
        Number.isInteger(body.durationDays) &&
        body.durationDays >= 1 &&
        body.durationDays <= 3650
          ? body.durationDays
          : 30,
      features: body.features ?? [],
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  return apiSuccess(created, 201);
}
