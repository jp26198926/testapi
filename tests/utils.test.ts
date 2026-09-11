import { describe, it, expect } from "vitest";
import { toSlug } from "@/lib/utils";

describe("toSlug", () => {
  it("converts to lowercase", () => {
    expect(toSlug("My Collection")).toBe("my-collection");
  });

  it("replaces spaces with hyphens", () => {
    expect(toSlug("hello world")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(toSlug("hello@world!")).toBe("helloworld");
  });

  it("collapses multiple hyphens", () => {
    expect(toSlug("a---b")).toBe("a-b");
  });

  it("trims and strips leading/trailing hyphens", () => {
    expect(toSlug("  -hello-  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(toSlug("")).toBe("");
  });
});
