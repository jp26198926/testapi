import { requireAuth } from "@/lib/api/auth";
import { isAdmin } from "@/lib/api/admin";
import { apiSuccess, ERRORS } from "@/lib/api/response";

// GET /api/admin/check — returns whether current user is admin
export async function GET() {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }

  return apiSuccess({ isAdmin: isAdmin(user) });
}
