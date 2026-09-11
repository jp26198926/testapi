import { requireAuth } from "@/lib/api/auth";
import { requireAdmin } from "@/lib/api/admin";
import { apiSuccess, ERRORS } from "@/lib/api/response";
import { uploadImage } from "@/lib/cloudinary";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

// POST /api/upload — admin only, upload image to Cloudinary
export async function POST(request: Request) {
  let user;
  try {
    ({ user } = await requireAuth());
  } catch {
    return ERRORS.UNAUTHORIZED();
  }
  requireAdmin(user);

  const formData = await request.formData();
  const file = formData.get("image");

  if (!file || !(file instanceof File)) {
    return ERRORS.BAD_REQUEST("No image file provided.");
  }

  if (!file.type.startsWith("image/")) {
    return ERRORS.BAD_REQUEST("File must be an image.");
  }

  if (file.size > MAX_SIZE) {
    return ERRORS.BAD_REQUEST("Image must be 2MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await uploadImage(buffer, "testapi");
    return apiSuccess({ url: result.url });
  } catch {
    return ERRORS.BAD_REQUEST("Failed to upload image.");
  }
}
