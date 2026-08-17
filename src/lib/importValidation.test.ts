import { describe, expect, it } from "vitest";
import { validateDateColumn, validateAmountColumn } from "./importValidation";

function rows(column: string, values: (string | null)[]): Record<string, unknown>[] {
  return values.map((v) => ({ [column]: v }));
}

// ── validateDateColumn ───────────────────────────────────────────────────────

describe("validateDateColumn", () => {
  it("returns green with a converted example when a sample is unambiguously day-first", () => {
    const r = rows("Date", ["16/01/2026", "17/01/2026", "18/01/2026"]);
    const result = validateDateColumn(r, "Date");
    expect(result.level).toBe("green");
    expect(result.message).toBe("✓ 16/01/2026 → 2026-01-16");
  });

  it("returns hint-only when every sample parses but no day exceeds 12 (ambiguous)", () => {
    const r = rows("Date", ["05/01/2026", "06/01/2026", "07/01/2026"]);
    const result = validateDateColumn(r, "Date");
    expect(result.level).toBe("hint");
    expect(result.message).toBeNull();
  });

  it("returns red when nothing in the sample parses as a date", () => {
    const r = rows("Label", ["CARTE X PARIS", "VIR SEPA", "PRLV EDF"]);
    const result = validateDateColumn(r, "Label");
    expect(result.level).toBe("red");
    expect(result.rawSamples).toEqual(["CARTE X PARIS", "VIR SEPA", "PRLV EDF"]);
  });

  it("only considers the first 3 non-empty values", () => {
    const r = rows("Date", ["05/01/2026", "06/01/2026", "07/01/2026", "20/01/2026"]);
    const result = validateDateColumn(r, "Date");
    // The 4th value (day 20, unambiguous) is never looked at, so this stays hint-only.
    expect(result.level).toBe("hint");
  });

  it("skips empty values when gathering samples", () => {
    const r = rows("Date", ["", "20/01/2026", null]);
    const result = validateDateColumn(r, "Date");
    expect(result.level).toBe("green");
  });
});

// ── validateAmountColumn — separate mode ─────────────────────────────────────

describe("validateAmountColumn (separate)", () => {
  it("is silent when no column is selected", () => {
    const r = rows("Debit", ["23,03"]);
    expect(validateAmountColumn(r, "", "separate")).toEqual({ level: "silent", message: null });
  });

  it("is silent when the selected column has no non-empty values (expected in a debit-heavy statement)", () => {
    const r = rows("Credit", ["", null, ""]);
    const result = validateAmountColumn(r, "Credit", "separate");
    expect(result.level).toBe("silent");
  });

  it("is green with comma-decimal message when all values parse", () => {
    const r = rows("Debit", ["23,03", "8,50"]);
    const result = validateAmountColumn(r, "Debit", "separate");
    expect(result.level).toBe("green");
    expect(result.message).toBe("✓ Comma decimal detected — '23,03' → €23.03");
  });

  it("is green with dot-decimal message when values use a dot", () => {
    const r = rows("Debit", ["23.03"]);
    const result = validateAmountColumn(r, "Debit", "separate");
    expect(result.message).toBe("✓ Dot decimal detected — '23.03' → €23.03");
  });

  it("is amber when some values parse and some don't", () => {
    const r = rows("Debit", ["23,03", "PRLV SFR"]);
    const result = validateAmountColumn(r, "Debit", "separate");
    expect(result.level).toBe("amber");
    expect(result.rawSamples).toEqual(["PRLV SFR"]);
  });

  it("is red when non-empty values exist but none parse", () => {
    const r = rows("Debit", ["PRLV SFR", "VIR SEPA"]);
    const result = validateAmountColumn(r, "Debit", "separate");
    expect(result.level).toBe("red");
  });
});

// ── validateAmountColumn — combined mode ─────────────────────────────────────

describe("validateAmountColumn (combined)", () => {
  it("is red (not silent) when the column has no non-empty values", () => {
    const r = rows("Amount", ["", null]);
    const result = validateAmountColumn(r, "Amount", "combined");
    expect(result.level).toBe("red");
    expect(result.message).toBe("⚠ No values detected in this column — check your selection");
  });

  it("labels a negative value as debit and a positive value as credit", () => {
    const negative = validateAmountColumn(rows("Amount", ["-23,03"]), "Amount", "combined");
    expect(negative.message).toBe("✓ Comma decimal detected — '-23,03' → debit €23.03");

    const positive = validateAmountColumn(rows("Amount", ["42,00"]), "Amount", "combined");
    expect(positive.message).toBe("✓ Comma decimal detected — '42,00' → credit €42.00");
  });

  it("does not require sign uniformity across samples for green", () => {
    const r = rows("Amount", ["-23,03", "10,00", "-5,50"]);
    expect(validateAmountColumn(r, "Amount", "combined").level).toBe("green");
  });

  it("is amber when some values parse and some don't", () => {
    const r = rows("Amount", ["-23,03", "garbage"]);
    expect(validateAmountColumn(r, "Amount", "combined").level).toBe("amber");
  });
});
