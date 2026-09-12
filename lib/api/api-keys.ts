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

function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET || "fallback-dev-key";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptApiKey(raw: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(raw, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptApiKey(encrypted: string): string {
  const [ivHex, tagHex, dataHex] = encrypted.split(":");
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
