import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  subMonths,
  format,
  isAfter,
  isBefore,
} from "date-fns";

import type {
  AggregatedData,
  CategoryTotal,
  Scale,
  Transaction,
} from "../types";

// ── Constants ─────────────────────────────────────────────────────────────────

export const EXPENSE_EXCLUSIONS = ["Income", "Benefits", "Refund", "Internal"];
export const INCOME_CATEGORIES = ["Income", "Benefits"];
export const REFUND_CATEGORIES = ["Refund"];
export const INTERNAL_CATEGORY = "Internal";

// Muted grey (mirrors --text-tertiary in index.css) so Internal reads as
// "administrative", never mistaken for a real spending category.
export const INTERNAL_CHART_COLOR = "#71717a";

export const CHART_COLORS = [
  "#7c5cff",
  "#06b6d4",
  "#f472b6",
  "#22c55e",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#a78bfa",
  "#2dd4bf",
  "#fb923c",
];

// ── Date utilities ────────────────────────────────────────────────────────────

function floorToPeriod(date: Date, scale: Scale): Date {
  switch (scale) {
    case "Day":
      return startOfDay(date);
    case "Week":
      return startOfWeek(date, { weekStartsOn: 1 }); // Monday
    case "Month":
      return startOfMonth(date);
  }
}

function generatePeriods(start: Date, end: Date, scale: Scale): Date[] {
  switch (scale) {
    case "Day":
      return eachDayOfInterval({ start, end });
    case "Week":
      return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    case "Month":
      return eachMonthOfInterval({ start, end });
  }
}

// ── Period filtering ──────────────────────────────────────────────────────────

export function filterByPeriod(
  transactions: Transaction[],
  filterType: string,
): Transaction[] {
  if (filterType === "Max") return transactions;

  const now = new Date();
  let start: Date;

  switch (filterType) {
    case "YTD":
      start = startOfYear(now);
      break;
    case "Last 12 Months":
      start = subMonths(now, 12);
      break;
    case "Last 6 Months":
      start = subMonths(now, 6);
      break;
    case "Last 3 Months":
      start = subMonths(now, 3);
      break;
    default:
      return transactions;
  }

  return transactions.filter((tx) => {
    const d = new Date(tx.date_operation);
    return !isBefore(d, start) && !isAfter(d, now);
  });
}

export function countMonthsInPeriod(transactions: Transaction[]): number {
  if (!transactions.length) return 0;
  const months = new Set(
    transactions.map((tx) => tx.date_operation.slice(0, 7)),
  );
  return months.size;
}

// ── Core aggregation ──────────────────────────────────────────────────────────

/**
 * Aggregate transactions by (period, category), zero-filling the full grid.
 * Mirrors Python's aggregate_transactions().
 */
function aggregateTransactions(
  transactions: Transaction[],
  valueCol: "debit" | "credit",
  scale: Scale,
  categoryCol: "category" | "subcategory" = "category",
): AggregatedData[] {
  if (!transactions.length) return [];

  const withPeriod = transactions
    .map((tx) => ({
      period: floorToPeriod(new Date(tx.date_operation), scale),
      category: (tx[categoryCol] ?? "") as string,
      value: (tx[valueCol] ?? 0) as number,
    }))
    .filter((tx) => tx.category);

  if (!withPeriod.length) return [];

  const periodTimes = withPeriod.map((tx) => tx.period.getTime());
  const minPeriod = new Date(Math.min(...periodTimes));
  const maxPeriod = new Date(Math.max(...periodTimes));

  const allPeriods = generatePeriods(minPeriod, maxPeriod, scale);
  const categories = [...new Set(withPeriod.map((tx) => tx.category))];

  // Build aggregation map
  const aggMap = new Map<string, number>();
  for (const tx of withPeriod) {
    const periodKey = format(tx.period, "yyyy-MM-dd");
    const key = `${periodKey}|${tx.category}`;
    aggMap.set(key, (aggMap.get(key) ?? 0) + tx.value);
  }

  // Zero-filled grid
  const result: AggregatedData[] = [];
  for (const period of allPeriods) {
    const periodStr = format(period, "yyyy-MM-dd");
    for (const category of categories) {
      result.push({
        period: periodStr,
        category,
        value: aggMap.get(`${periodStr}|${category}`) ?? 0,
      });
    }
  }

  return result;
}

// ── Expense / income aggregation ──────────────────────────────────────────────

/** EXPENSE_EXCLUSIONS, minus Internal when the caller opts in to seeing it. */
function expenseExclusionsFor(includeInternal: boolean): string[] {
  return includeInternal
    ? EXPENSE_EXCLUSIONS.filter((c) => c !== INTERNAL_CATEGORY)
    : EXPENSE_EXCLUSIONS;
}

export function aggregateExpenses(
  transactions: Transaction[],
  scale: Scale,
  includeInternal = false,
): AggregatedData[] {
  const exclusions = expenseExclusionsFor(includeInternal);
  const filtered = transactions.filter(
    (tx) =>
      tx.category &&
      !exclusions.includes(tx.category) &&
      tx.debit != null &&
      tx.debit > 0,
  );
  return aggregateTransactions(filtered, "debit", scale);
}

export function aggregateIncome(
  transactions: Transaction[],
  scale: Scale,
): AggregatedData[] {
  const filtered = transactions.filter(
    (tx) =>
      tx.category &&
      INCOME_CATEGORIES.includes(tx.category) &&
      tx.credit != null &&
      tx.credit > 0,
  );
  return aggregateTransactions(filtered, "credit", scale);
}

export function aggregateExpensesCompensated(
  transactions: Transaction[],
  scale: Scale,
  compensationMap: Record<number, number>,
  categoryNames: Record<number, string>,
  includeInternal = false,
): [AggregatedData[], number] {
  const exclusions = expenseExclusionsFor(includeInternal);
  const withCat = transactions.filter((tx) => tx.category != null);

  const expenses = withCat.filter(
    (tx) =>
      !exclusions.includes(tx.category!) &&
      tx.debit != null &&
      tx.debit > 0,
  );

  // Build expense aggregation map
  const expAgg = new Map<string, number>();
  for (const tx of expenses) {
    const periodStr = format(
      floorToPeriod(new Date(tx.date_operation), scale),
      "yyyy-MM-dd",
    );
    const key = `${periodStr}|${tx.category}`;
    expAgg.set(key, (expAgg.get(key) ?? 0) + (tx.debit ?? 0));
  }

  // Match refunds to a target category via the compensation map; anything that
  // doesn't resolve is tallied separately rather than silently dropped.
  const refunds = withCat.filter(
    (tx) =>
      REFUND_CATEGORIES.includes(tx.category!) &&
      tx.credit != null &&
      tx.credit > 0,
  );

  let unmatchedTotal = 0;
  const matchedRefunds: { period: Date; category: string; credit: number }[] =
    [];

  for (const refund of refunds) {
    const sid = refund.subcategory_id;
    const targetCatId = sid != null ? compensationMap[sid] : undefined;
    if (targetCatId == null) {
      unmatchedTotal += refund.credit ?? 0;
      continue;
    }

    const targetCategory = categoryNames[targetCatId];
    if (!targetCategory) {
      unmatchedTotal += refund.credit ?? 0;
      continue;
    }

    matchedRefunds.push({
      period: floorToPeriod(new Date(refund.date_operation), scale),
      category: targetCategory,
      credit: refund.credit ?? 0,
    });
  }

  if (!expenses.length && !matchedRefunds.length) return [[], unmatchedTotal];

  for (const { period, category, credit } of matchedRefunds) {
    const key = `${format(period, "yyyy-MM-dd")}|${category}`;
    expAgg.set(key, Math.max(0, (expAgg.get(key) ?? 0) - credit));
  }

  // Build result grid — span every period and category touched by either an
  // expense or a matched refund, so a refund's effect is never silently dropped
  // just because its category or date falls outside what `expenses` alone covers.
  const expenseDates = expenses.map((tx) =>
    new Date(tx.date_operation).getTime(),
  );
  const refundPeriodDates = matchedRefunds.map((r) => r.period.getTime());
  const allDates = [...expenseDates, ...refundPeriodDates];
  const minPeriod = floorToPeriod(new Date(Math.min(...allDates)), scale);
  const maxPeriod = floorToPeriod(new Date(Math.max(...allDates)), scale);
  const allPeriods = generatePeriods(minPeriod, maxPeriod, scale);

  const categories = [
    ...new Set([
      ...expenses.map((tx) => tx.category!),
      ...matchedRefunds.map((r) => r.category),
    ]),
  ];

  const result: AggregatedData[] = [];
  for (const period of allPeriods) {
    const periodStr = format(period, "yyyy-MM-dd");
    for (const category of categories) {
      result.push({
        period: periodStr,
        category,
        value: expAgg.get(`${periodStr}|${category}`) ?? 0,
      });
    }
  }

  return [result, unmatchedTotal];
}

// ── Averaging ─────────────────────────────────────────────────────────────────

export function applyAverage(
  aggregated: AggregatedData[],
  filtered: Transaction[],
  mode: string,
): AggregatedData[] {
  if (mode === "Off") return aggregated;

  let divisor: number;
  switch (mode) {
    case "Over 12 Months":
      divisor = 12;
      break;
    case "Over Max":
    case "Over Current Period":
      divisor = countMonthsInPeriod(filtered);
      break;
    default:
      return aggregated;
  }
  if (divisor === 0) return aggregated;

  return aggregated.map((row) => ({ ...row, value: row.value / divisor }));
}

export function getTypicalMonth(
  transactions: Transaction[],
  averageMode: string,
): CategoryTotal[] {
  if (!transactions.length) return [];

  const expenses = transactions.filter(
    (tx) =>
      tx.category &&
      !EXPENSE_EXCLUSIONS.includes(tx.category) &&
      tx.debit != null &&
      tx.debit > 0,
  );
  if (!expenses.length) return [];

  const totals = new Map<string, number>();
  for (const tx of expenses) {
    const cat = tx.category!;
    totals.set(cat, (totals.get(cat) ?? 0) + (tx.debit ?? 0));
  }

  let divisor: number;
  switch (averageMode) {
    case "Over 12 Months":
      divisor = 12;
      break;
    case "Over Max":
    case "Over Current Period":
      divisor = countMonthsInPeriod(transactions);
      break;
    default:
      divisor = 1;
  }

  const result = Array.from(totals.entries()).map(([category, amount]) => ({
    category,
    amount: divisor > 0 ? amount / divisor : amount,
  }));

  // Ascending for horizontal bar (largest at bottom)
  return result.sort((a, b) => a.amount - b.amount);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Cosmetic GBP display transform — rescales already-aggregated EUR values by a
 * single rate. Never re-runs filter/aggregate/average; the EUR spine underneath
 * is untouched (Design decisions: GBP is display-only).
 */
export function cosmeticConversion(
  data: AggregatedData[],
  rate: number,
): AggregatedData[] {
  return data.map((row) => ({ ...row, value: row.value * rate }));
}

export function getCategoryOrder(data: AggregatedData[]): string[] {
  const totals = new Map<string, number>();
  for (const row of data) {
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.value);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([cat]) => cat);
}

export function getCategoryTotals(
  transactions: Transaction[],
): CategoryTotal[] {
  const expenses = transactions.filter(
    (tx) =>
      tx.category &&
      !EXPENSE_EXCLUSIONS.includes(tx.category) &&
      tx.debit != null &&
      tx.debit > 0,
  );
  const totals = new Map<string, number>();
  for (const tx of expenses) {
    const cat = tx.category!;
    totals.set(cat, (totals.get(cat) ?? 0) + (tx.debit ?? 0));
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** Pivot AggregatedData[] into Recharts-friendly format. */
export function pivotForRecharts(
  data: AggregatedData[],
  categories: string[],
): Record<string, string | number>[] {
  const byPeriod = new Map<string, Record<string, string | number>>();

  // Ensure every period has every category key (as 0) before filling
  for (const row of data) {
    if (!byPeriod.has(row.period)) {
      const entry: Record<string, string | number> = { period: row.period };
      for (const cat of categories) entry[cat] = 0;
      byPeriod.set(row.period, entry);
    }
    byPeriod.get(row.period)![row.category] = row.value;
  }

  return [...byPeriod.values()].sort((a, b) =>
    String(a.period).localeCompare(String(b.period)),
  );
}

/** Format a period string for display based on scale. */
export function formatPeriodLabel(periodStr: string, scale: Scale): string {
  const d = new Date(periodStr);
  switch (scale) {
    case "Day":
      return format(d, "d MMM yy");
    case "Week":
      return format(d, "'W'ww yy");
    case "Month":
      return format(d, "MMM yyyy");
  }
}

export function formatEuro(value: number, symbol = "€"): string {
  return `${symbol}${Math.round(value).toLocaleString("fr-FR")}`;
}
