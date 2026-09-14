import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { requireAuth } from "@/lib/api/auth";
import { requireAdmin } from "@/lib/api/admin";
import { apiSuccess, ERRORS } from "@/lib/api/response";
import { eq } from "drizzle-orm";

// PATCH /api/plans/[planId] — admin only
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }
  requireAdmin(user);

  const { planId } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.price === "string") updates.price = body.price;
  if (Array.isArray(body.features)) updates.features = body.features;
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
  if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;
  if (typeof body.paypalPlanId === "string" || body.paypalPlanId === null) {
    updates.paypalPlanId = body.paypalPlanId;
  }

  const [updated] = await db
    .update(plans)
    .set(updates)
    .where(eq(plans.id, planId))
    .returning();

  if (!updated) return ERRORS.NOT_FOUND();
  return apiSuccess(updated);
}

// DELETE /api/plans/[planId] — admin only
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }
  requireAdmin(user);

  const { planId } = await params;
  const deleted = await db.delete(plans).where(eq(plans.id, planId)).returning();

  if (deleted.length === 0) return ERRORS.NOT_FOUND();
  return new Response(null, { status: 204 });
}
