import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/api/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Rate limit state is in-memory, each test gets a fresh key
  });

  it("allows requests within limit", () => {
    const result = checkRateLimit("test-user-1", "free");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it("blocks requests after limit exceeded", () => {
    const key = `test-block-${Date.now()}`;
    // Exhaust the limit
    for (let i = 0; i < 120; i++) {
      checkRateLimit(key, "free");
    }
    const result = checkRateLimit(key, "free");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("anonymous tier has lower limit", () => {
    const key = `test-anon-${Date.now()}`;
    for (let i = 0; i < 60; i++) {
      checkRateLimit(key, "anonymous");
    }
    const result = checkRateLimit(key, "anonymous");
    expect(result.allowed).toBe(false);
  });

  it("pro tier has higher limit", () => {
    const key = `test-pro-${Date.now()}`;
    // Should not block after 120 (free limit)
    for (let i = 0; i < 120; i++) {
      const result = checkRateLimit(key, "pro");
      expect(result.allowed).toBe(true);
    }
  });
});
