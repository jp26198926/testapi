import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { requireAuth } from "@/lib/api/auth";
import { requireAdmin } from "@/lib/api/admin";
import { apiSuccess, ERRORS } from "@/lib/api/response";

// GET /api/settings — public, returns site settings for layouts
export async function GET() {
  const rows = await db.select().from(siteSettings).limit(1);
  const settings = rows[0] ?? { appName: "TESTAPI", logoUrl: null, faviconUrl: null };
  return apiSuccess(settings);
}

// PATCH /api/settings — admin only
export async function PATCH(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }
  requireAdmin(user);

  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.appName === "string") updates.appName = body.appName;
  if (typeof body.logoUrl === "string" || body.logoUrl === null) updates.logoUrl = body.logoUrl;
  if (typeof body.faviconUrl === "string" || body.faviconUrl === null) updates.faviconUrl = body.faviconUrl;

  const rows = await db.select().from(siteSettings).limit(1);
  if (rows.length === 0) {
    const [created] = await db.insert(siteSettings).values(updates).returning();
    return apiSuccess(created);
  }

  const [updated] = await db
    .update(siteSettings)
    .set(updates)
    .returning();

  return apiSuccess(updated);
}
