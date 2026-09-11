import crypto from "crypto";

const API_KEY_PREFIX = "pk_live_";
const API_KEY_BYTES = 32;

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(API_KEY_BYTES);
  const raw = `${API_KEY_PREFIX}${randomBytes.toString("base64url")}`;
  const hash = hashApiKey(raw);
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}
