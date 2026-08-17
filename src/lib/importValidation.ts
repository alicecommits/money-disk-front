import { parse, isValid, getDate, format } from "date-fns";

// ── Shared helpers ───────────────────────────────────────────────────────────

/** Non-empty, trimmed values for a column across the (already-capped, ~5-row)
 * preview sample. `limit` caps how many are considered — date validation only
 * looks at the first 3 per spec; amount validation has no stated cap, so it
 * naturally covers the whole preview sample. */
function nonEmptySamples(
  rows: Record<string, unknown>[],
  column: string,
  limit = Infinity,
): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const v = row[column];
    if (v == null) continue;
    const s = String(v).trim();
    if (s === "") continue;
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

// ── Date column ───────────────────────────────────────────────────────────────

export interface DateColumnValidation {
  level: "green" | "hint" | "red";
  message: string | null;
  rawSamples?: string[];
}

// Both zero-padded and unpadded DD/MM/YYYY — real bank exports aren't always
// consistent about leading zeros. Anything outside day-first YYYY-out formats
// is intentionally NOT attempted here: the backend's contract (Task 3, money-
// disk-back) is DD/MM/YYYY only, so this mirrors that rather than trying to
// guess arbitrary formats.
const DATE_FORMATS = ["dd/MM/yyyy", "d/M/yyyy", "dd/M/yyyy", "d/MM/yyyy"];

function parseDayFirst(raw: string): Date | null {
  for (const fmt of DATE_FORMATS) {
    const parsed = parse(raw, fmt, new Date());
    if (isValid(parsed)) return parsed;
  }
  return null;
}

export function validateDateColumn(
  rows: Record<string, unknown>[],
  column: string,
): DateColumnValidation {
  const samples = nonEmptySamples(rows, column, 3);
  const parsedSamples = samples.map((raw) => ({ raw, parsed: parseDayFirst(raw) }));
  const anyParsed = parsedSamples.some((s) => s.parsed != null);

  if (!anyParsed) {
    return {
      level: "red",
      message: "⚠ No dates detected in this column — check your selection",
      rawSamples: samples,
    };
  }

  // GREEN requires an unambiguous DD/MM/YYYY sample (day > 12) — otherwise every
  // sample could just as easily be MM/DD/YYYY, and claiming certainty would be
  // dishonest. HINT-only is the correct state there, not a downgraded green.
  const unambiguous = parsedSamples.find((s) => s.parsed != null && getDate(s.parsed) > 12);
  if (unambiguous?.parsed) {
    return {
      level: "green",
      message: `✓ ${unambiguous.raw} → ${format(unambiguous.parsed, "yyyy-MM-dd")}`,
    };
  }

  return { level: "hint", message: null };
}

// ── Amount columns (separate debit/credit, or combined signed) ────────────────

export type AmountColumnMode = "separate" | "combined";

export interface AmountColumnValidation {
  level: "green" | "amber" | "red" | "silent";
  message: string | null;
  rawSamples?: string[];
}

function parseAmount(raw: string): number | null {
  const n = parseFloat(raw.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function greenAmountMessage(example: string, mode: AmountColumnMode): string {
  const value = parseAmount(example);
  // Guaranteed non-null — only called once `example` has already parsed successfully.
  const styleLabel = example.includes(",") ? "Comma" : example.includes(".") ? "Dot" : null;
  const amountPart =
    mode === "combined"
      ? `${value! < 0 ? "debit" : "credit"} €${Math.abs(value!).toFixed(2)}`
      : `€${Math.abs(value!).toFixed(2)}`;
  const prefix = styleLabel ? `${styleLabel} decimal detected` : "Amounts parse correctly";
  return `✓ ${prefix} — '${example}' → ${amountPart}`;
}

export function validateAmountColumn(
  rows: Record<string, unknown>[],
  column: string,
  mode: AmountColumnMode,
): AmountColumnValidation {
  // No column picked yet is a distinct state from "picked, but the sampled rows
  // happen to be empty" — the latter is what SILENT/RED-for-combined describe.
  // Blocking Next before the user has even reached a selector would be premature.
  if (!column) return { level: "silent", message: null };

  const samples = nonEmptySamples(rows, column);

  if (samples.length === 0) {
    return mode === "combined"
      ? { level: "red", message: "⚠ No values detected in this column — check your selection" }
      : { level: "silent", message: null };
  }

  const parsed = samples.map((raw) => ({ raw, value: parseAmount(raw) }));
  const failed = parsed.filter((p) => p.value == null).map((p) => p.raw);

  if (failed.length === samples.length) {
    return {
      level: "red",
      message: "⚠ Could not parse amounts in this column — check your selection",
      rawSamples: failed,
    };
  }

  if (failed.length > 0) {
    return {
      level: "amber",
      message:
        "⚠ Some values in this column could not be parsed as amounts — possible formatting issue in the CSV",
      rawSamples: failed,
    };
  }

  const styled = samples.find((s) => s.includes(",") || s.includes("."));
  return { level: "green", message: greenAmountMessage(styled ?? samples[0], mode) };
}
