import { describe, it, expect } from "vitest";
import {
  createCollectionSchema,
  createRecordSchema,
  paginationSchema,
  createApiKeySchema,
} from "@/lib/api/validation";

describe("createCollectionSchema", () => {
  it("accepts valid input", () => {
    const result = createCollectionSchema.safeParse({
      name: "My Collection",
      description: "A test collection",
    });
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = createCollectionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createCollectionSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects names over 100 chars", () => {
    const result = createCollectionSchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects special characters in name", () => {
    const result = createCollectionSchema.safeParse({
      name: "hello@world",
    });
    expect(result.success).toBe(false);
  });

  it("allows hyphens and underscores", () => {
    const result = createCollectionSchema.safeParse({
      name: "my-collection_v2",
    });
    expect(result.success).toBe(true);
  });
});

describe("createRecordSchema", () => {
  it("accepts valid JSON object", () => {
    const result = createRecordSchema.safeParse({
      data: { name: "John", age: 30 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = createRecordSchema.safeParse({ data: {} });
    expect(result.success).toBe(true);
  });

  it("rejects non-object data", () => {
    const result = createRecordSchema.safeParse({ data: "string" });
    expect(result.success).toBe(false);
  });

  it("rejects missing data field", () => {
    const result = createRecordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("paginationSchema", () => {
  it("defaults to page 1, limit 20", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("accepts custom values", () => {
    const result = paginationSchema.safeParse({ page: "3", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("caps limit at 100", () => {
    const result = paginationSchema.safeParse({ limit: "500" });
    expect(result.success).toBe(false);
  });

  it("rejects page 0", () => {
    const result = paginationSchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });
});

describe("createApiKeySchema", () => {
  it("accepts valid input", () => {
    const result = createApiKeySchema.safeParse({ name: "My Key" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createApiKeySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional expiresInDays", () => {
    const result = createApiKeySchema.safeParse({
      name: "Key",
      expiresInDays: 30,
    });
    expect(result.success).toBe(true);
  });
});
