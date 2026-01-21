import { describe, expect, it } from "vitest";

describe("Example Test", () => {
  it("should pass basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string comparison", () => {
    expect("hello").toBe("hello");
  });
});
