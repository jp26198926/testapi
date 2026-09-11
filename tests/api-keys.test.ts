import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey } from "@/lib/api/api-keys";

describe("generateApiKey", () => {
  it("returns raw key, hash, and prefix", () => {
    const { raw, hash, prefix } = generateApiKey();
    expect(raw).toBeTruthy();
    expect(hash).toBeTruthy();
    expect(prefix).toBeTruthy();
  });

  it("raw key starts with pk_live_ prefix", () => {
    const { raw } = generateApiKey();
    expect(raw).toMatch(/^pk_live_/);
  });

  it("prefix is first 12 chars of raw key", () => {
    const { raw, prefix } = generateApiKey();
    expect(prefix).toBe(raw.slice(0, 12));
  });

  it("hash is 64-char hex (SHA-256)", () => {
    const { hash } = generateApiKey();
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates unique keys", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.raw).not.toBe(key2.raw);
    expect(key1.hash).not.toBe(key2.hash);
  });
});

describe("hashApiKey", () => {
  it("produces consistent hashes", () => {
    const key = "pk_live_test123";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("produces different hashes for different keys", () => {
    expect(hashApiKey("key1")).not.toBe(hashApiKey("key2"));
  });

  it("returns 64-char hex string", () => {
    const hash = hashApiKey("test");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
