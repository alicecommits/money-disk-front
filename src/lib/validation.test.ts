import { describe, expect, it } from "vitest";
import { isValidDateOperation } from "./validation";

describe("isValidDateOperation", () => {
  it("accepts a well-formed ISO date", () => {
    expect(isValidDateOperation("2026-01-16")).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidDateOperation(null)).toBe(false);
  });

  it("rejects non-ISO formats", () => {
    expect(isValidDateOperation("16/01/2026")).toBe(false);
    expect(isValidDateOperation("2026/01/16")).toBe(false);
    expect(isValidDateOperation("Jan 16, 2026")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidDateOperation("")).toBe(false);
  });

  it("rejects a string with the right shape but non-digit characters", () => {
    expect(isValidDateOperation("202X-01-16")).toBe(false);
  });
});
