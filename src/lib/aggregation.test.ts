import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AggregatedData, Transaction } from "../types";
import {
  aggregateExpenses,
  aggregateExpensesCompensated,
  aggregateIncome,
  applyAverage,
  countMonthsInPeriod,
  filterByPeriod,
  getCategoryOrder,
  getTypicalMonth,
} from "./aggregation";

// ── Fixture helpers ──────────────────────────────────────────────────────────

let nextId = 1;

function tx(overrides: Partial<Transaction> & { date_operation: string }): Transaction {
  const defaults: Transaction = {
    id: nextId++,
    date_operation: overrides.date_operation,
    label: "CARTE X PARIS",
    debit: null,
    credit: null,
    extra_context: null,
    original_currency: "EUR",
    original_amount: null,
    category: null,
    subcategory: null,
    category_id: null,
    subcategory_id: null,
    assignment_method: null,
    matched_rule_id: null,
    source_file: null,
    imported_at: null,
  };
  return { ...defaults, ...overrides } as Transaction;
}

/** Order-independent comparison helper — the aggregation functions don't promise
 * a specific category ordering within a period (that's getCategoryOrder's job). */
function byPeriodCategory(rows: AggregatedData[]) {
  return [...rows].sort(
    (a, b) => a.period.localeCompare(b.period) || a.category.localeCompare(b.category),
  );
}

// ── filterByPeriod ───────────────────────────────────────────────────────────

describe("filterByPeriod", () => {
  const NOW = new Date("2025-07-15T00:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const txs = [
    tx({ date_operation: "2024-06-01" }), // before every window
    tx({ date_operation: "2024-07-15" }), // exactly 12 months before now
    tx({ date_operation: "2024-12-31" }), // before YTD start
    tx({ date_operation: "2025-01-01" }), // exactly start of year
    tx({ date_operation: "2025-01-15" }), // exactly 6 months before now
    tx({ date_operation: "2025-04-01" }), // just before the 3-month window
    tx({ date_operation: "2025-04-15" }), // exactly 3 months before now
    tx({ date_operation: "2025-07-15" }), // exactly now
    tx({ date_operation: "2025-08-01" }), // in the future
  ];

  it("Max returns every transaction unchanged", () => {
    expect(filterByPeriod(txs, "Max")).toEqual(txs);
  });

  it("YTD includes from Jan 1 of the current year through now, inclusive", () => {
    expect(filterByPeriod(txs, "YTD").map((t) => t.date_operation)).toEqual([
      "2025-01-01",
      "2025-01-15",
      "2025-04-01",
      "2025-04-15",
      "2025-07-15",
    ]);
  });

  it("Last 12 Months includes exactly 12 months back through now, inclusive", () => {
    expect(filterByPeriod(txs, "Last 12 Months").map((t) => t.date_operation)).toEqual([
      "2024-07-15",
      "2024-12-31",
      "2025-01-01",
      "2025-01-15",
      "2025-04-01",
      "2025-04-15",
      "2025-07-15",
    ]);
  });

  it("Last 6 Months includes exactly 6 months back through now, inclusive", () => {
    expect(filterByPeriod(txs, "Last 6 Months").map((t) => t.date_operation)).toEqual([
      "2025-01-15",
      "2025-04-01",
      "2025-04-15",
      "2025-07-15",
    ]);
  });

  it("Last 3 Months includes exactly 3 months back through now, inclusive", () => {
    expect(filterByPeriod(txs, "Last 3 Months").map((t) => t.date_operation)).toEqual([
      "2025-04-15",
      "2025-07-15",
    ]);
  });

  it("excludes transactions dated after now for every window except Max", () => {
    for (const filterType of ["YTD", "Last 12 Months", "Last 6 Months", "Last 3 Months"]) {
      const result = filterByPeriod(txs, filterType);
      expect(result.some((t) => t.date_operation === "2025-08-01")).toBe(false);
    }
  });
});

// ── countMonthsInPeriod ───────────────────────────────────────────────────────

describe("countMonthsInPeriod", () => {
  it("returns 0 for an empty list", () => {
    expect(countMonthsInPeriod([])).toBe(0);
  });

  it("returns 1 when every transaction falls in the same month", () => {
    const txs = [
      tx({ date_operation: "2025-03-01" }),
      tx({ date_operation: "2025-03-15" }),
      tx({ date_operation: "2025-03-31" }),
    ];
    expect(countMonthsInPeriod(txs)).toBe(1);
  });

  it("counts distinct months across a year boundary", () => {
    const txs = [
      tx({ date_operation: "2024-12-20" }),
      tx({ date_operation: "2024-12-31" }),
      tx({ date_operation: "2025-01-05" }),
    ];
    expect(countMonthsInPeriod(txs)).toBe(2);
  });

  it("counts every distinct month across a longer span, ignoring duplicates within a month", () => {
    const txs = [
      tx({ date_operation: "2025-01-10" }),
      tx({ date_operation: "2025-02-11" }),
      tx({ date_operation: "2025-02-20" }),
      tx({ date_operation: "2025-04-01" }),
    ];
    expect(countMonthsInPeriod(txs)).toBe(3);
  });
});

// ── aggregateExpenses (also exercises the shared aggregateTransactions core) ──

describe("aggregateExpenses", () => {
  it("zero-fills every period × category combination across the full date range (monthly)", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 62.5 }),
      tx({ date_operation: "2025-02-14", category: "Transport", debit: 30 }),
      tx({ date_operation: "2025-03-05", category: "Groceries", debit: 78.2 }),
    ];

    const result = byPeriodCategory(aggregateExpenses(txs, "Month"));

    expect(result).toEqual(
      byPeriodCategory([
        { period: "2025-01-01", category: "Groceries", value: 62.5 },
        { period: "2025-01-01", category: "Transport", value: 0 },
        { period: "2025-02-01", category: "Groceries", value: 0 },
        { period: "2025-02-01", category: "Transport", value: 30 },
        { period: "2025-03-01", category: "Groceries", value: 78.2 },
        { period: "2025-03-01", category: "Transport", value: 0 },
      ]),
    );
  });

  it("zero-fills weekly buckets, anchored to Monday", () => {
    const txs = [
      tx({ date_operation: "2025-01-06", category: "Groceries", debit: 100 }), // Monday
      tx({ date_operation: "2025-01-20", category: "Transport", debit: 50 }), // Monday, 2 weeks later
    ];

    const result = byPeriodCategory(aggregateExpenses(txs, "Week"));

    expect(result).toEqual(
      byPeriodCategory([
        { period: "2025-01-06", category: "Groceries", value: 100 },
        { period: "2025-01-06", category: "Transport", value: 0 },
        { period: "2025-01-13", category: "Groceries", value: 0 },
        { period: "2025-01-13", category: "Transport", value: 0 },
        { period: "2025-01-20", category: "Groceries", value: 0 },
        { period: "2025-01-20", category: "Transport", value: 50 },
      ]),
    );
  });

  it("zero-fills daily buckets", () => {
    const txs = [
      tx({ date_operation: "2025-03-10", category: "Groceries", debit: 20 }),
      tx({ date_operation: "2025-03-12", category: "Transport", debit: 30 }),
    ];

    const result = byPeriodCategory(aggregateExpenses(txs, "Day"));

    expect(result).toEqual(
      byPeriodCategory([
        { period: "2025-03-10", category: "Groceries", value: 20 },
        { period: "2025-03-10", category: "Transport", value: 0 },
        { period: "2025-03-11", category: "Groceries", value: 0 },
        { period: "2025-03-11", category: "Transport", value: 0 },
        { period: "2025-03-12", category: "Groceries", value: 0 },
        { period: "2025-03-12", category: "Transport", value: 30 },
      ]),
    );
  });

  it("excludes Income, Benefits, and Refund categories even when debit > 0", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 50 }),
      tx({ date_operation: "2025-01-08", category: "Income", debit: 10 }),
      tx({ date_operation: "2025-01-08", category: "Benefits", debit: 10 }),
      tx({ date_operation: "2025-01-08", category: "Refund", debit: 10 }),
    ];
    expect(aggregateExpenses(txs, "Month")).toEqual([
      { period: "2025-01-01", category: "Groceries", value: 50 },
    ]);
  });

  it("excludes null/zero/negative debit rows and unassigned (null category) rows", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 50 }),
      tx({ date_operation: "2025-01-09", category: "Groceries", debit: null }),
      tx({ date_operation: "2025-01-10", category: "Groceries", debit: 0 }),
      tx({ date_operation: "2025-01-11", category: "Groceries", debit: -5 }),
      tx({ date_operation: "2025-01-12", category: null, debit: 20 }),
    ];
    expect(aggregateExpenses(txs, "Month")).toEqual([
      { period: "2025-01-01", category: "Groceries", value: 50 },
    ]);
  });

  it("returns an empty array when there are no transactions", () => {
    expect(aggregateExpenses([], "Month")).toEqual([]);
  });

  it("excludes Internal by default (includeInternal omitted)", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 50 }),
      tx({ date_operation: "2025-01-08", category: "Internal", debit: 200 }),
    ];
    expect(aggregateExpenses(txs, "Month")).toEqual([
      { period: "2025-01-01", category: "Groceries", value: 50 },
    ]);
  });

  it("excludes Internal when includeInternal is explicitly false", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 50 }),
      tx({ date_operation: "2025-01-08", category: "Internal", debit: 200 }),
    ];
    expect(aggregateExpenses(txs, "Month", false)).toEqual([
      { period: "2025-01-01", category: "Groceries", value: 50 },
    ]);
  });

  it("includes Internal rows when includeInternal is true, without dropping the other exclusions", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 50 }),
      tx({ date_operation: "2025-01-08", category: "Internal", debit: 200 }),
      tx({ date_operation: "2025-01-08", category: "Income", debit: 10 }),
    ];
    expect(byPeriodCategory(aggregateExpenses(txs, "Month", true))).toEqual(
      byPeriodCategory([
        { period: "2025-01-01", category: "Groceries", value: 50 },
        { period: "2025-01-01", category: "Internal", value: 200 },
      ]),
    );
  });
});

// ── aggregateIncome ───────────────────────────────────────────────────────────

describe("aggregateIncome", () => {
  it("includes only Income and Benefits categories, credit-based, zero-filled", () => {
    const txs = [
      tx({ date_operation: "2025-01-03", category: "Income", credit: 2500 }),
      tx({ date_operation: "2025-02-20", category: "Benefits", credit: 130 }),
    ];

    const result = byPeriodCategory(aggregateIncome(txs, "Month"));

    expect(result).toEqual(
      byPeriodCategory([
        { period: "2025-01-01", category: "Income", value: 2500 },
        { period: "2025-01-01", category: "Benefits", value: 0 },
        { period: "2025-02-01", category: "Income", value: 0 },
        { period: "2025-02-01", category: "Benefits", value: 130 },
      ]),
    );
  });

  it("excludes Refund and expense categories, and null/zero/negative credit", () => {
    const txs = [
      tx({ date_operation: "2025-01-03", category: "Income", credit: 2500 }),
      tx({ date_operation: "2025-01-04", category: "Refund", credit: 15 }),
      tx({ date_operation: "2025-01-05", category: "Groceries", credit: 5 }),
      tx({ date_operation: "2025-01-06", category: "Income", credit: null }),
      tx({ date_operation: "2025-01-07", category: "Income", credit: 0 }),
      tx({ date_operation: "2025-01-08", category: "Income", credit: -1 }),
    ];
    expect(aggregateIncome(txs, "Month")).toEqual([
      { period: "2025-01-01", category: "Income", value: 2500 },
    ]);
  });
});

// ── aggregateExpensesCompensated ──────────────────────────────────────────────

describe("aggregateExpensesCompensated", () => {
  const categoryNames = { 1: "Groceries", 4: "Leisure" };

  it("subtracts a matched refund from its target category in the same period", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 300 }),
      tx({ date_operation: "2025-01-22", category: "Refund", subcategory_id: 501, credit: 120 }),
    ];
    const compensationMap = { 501: 1 };

    const [result, unmatched] = aggregateExpensesCompensated(txs, "Month", compensationMap, categoryNames);

    expect(result).toEqual([{ period: "2025-01-01", category: "Groceries", value: 180 }]);
    expect(unmatched).toBe(0);
  });

  it("clamps a category's compensated expenses at zero — they must never go negative", () => {
    const txs = [
      tx({ date_operation: "2025-02-05", category: "Leisure", debit: 50 }),
      tx({ date_operation: "2025-02-15", category: "Refund", subcategory_id: 502, credit: 80 }),
    ];
    const compensationMap = { 502: 4 };

    const [result, unmatched] = aggregateExpensesCompensated(txs, "Month", compensationMap, categoryNames);

    expect(result).toEqual([{ period: "2025-02-01", category: "Leisure", value: 0 }]);
    expect(unmatched).toBe(0);
  });

  it("reports a refund with no compensation-map entry as unmatched", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 300 }),
      tx({ date_operation: "2025-01-25", category: "Refund", subcategory_id: 999, credit: 40 }),
    ];
    const compensationMap = { 501: 1 }; // 999 is absent

    const [result, unmatched] = aggregateExpensesCompensated(txs, "Month", compensationMap, categoryNames);

    expect(result).toEqual([{ period: "2025-01-01", category: "Groceries", value: 300 }]);
    expect(unmatched).toBe(40);
  });

  it("reports a refund with no subcategory_id as unmatched", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 300 }),
      tx({ date_operation: "2025-01-27", category: "Refund", subcategory_id: null, credit: 15 }),
    ];
    const compensationMap = { 501: 1 };

    const [result, unmatched] = aggregateExpensesCompensated(txs, "Month", compensationMap, categoryNames);

    expect(result).toEqual([{ period: "2025-01-01", category: "Groceries", value: 300 }]);
    expect(unmatched).toBe(15);
  });

  it("sums multiple unmatched refunds together", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 300 }),
      tx({ date_operation: "2025-01-25", category: "Refund", subcategory_id: 999, credit: 40 }),
      tx({ date_operation: "2025-01-27", category: "Refund", subcategory_id: null, credit: 15 }),
    ];
    const compensationMap = { 501: 1 };

    const [, unmatched] = aggregateExpensesCompensated(txs, "Month", compensationMap, categoryNames);

    expect(unmatched).toBe(55);
  });

  it("returns an empty result and 0 unmatched when there are no expense transactions at all", () => {
    const txs = [tx({ date_operation: "2025-01-03", category: "Income", credit: 2500 })];
    expect(aggregateExpensesCompensated(txs, "Month", {}, {})).toEqual([[], 0]);
  });

  // ── Result-grid coverage: the grid's period and category axes must span both
  // `expenses` AND matched refunds, not `expenses` alone — otherwise a refund's
  // effect can fall outside what the grid was built to show and go missing.
  // (These three cases previously produced wrong output; see the written
  // summary for the bug writeup and the fix that made these pass.)

  it("shows a matched refund's target category even when it has no expense transactions of its own", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 300 }),
      // "Leisure" never appears as an expense anywhere in this dataset.
      tx({ date_operation: "2025-01-25", category: "Refund", subcategory_id: 502, credit: 25 }),
    ];
    const compensationMap = { 502: 4 }; // 4 -> "Leisure" per categoryNames above

    const [result, unmatched] = aggregateExpensesCompensated(txs, "Month", compensationMap, categoryNames);

    // "Leisure" now gets a row — clamped to 0, since there was no expense to
    // reduce — instead of disappearing from the output entirely.
    expect(result).toEqual([
      { period: "2025-01-01", category: "Groceries", value: 300 },
      { period: "2025-01-01", category: "Leisure", value: 0 },
    ]);
    expect(unmatched).toBe(0);
  });

  it("extends the period range to cover a refund dated outside the expense min/max range", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 300 }),
      tx({ date_operation: "2025-02-05", category: "Groceries", debit: 200 }),
      // Refund dated in March — after the fix, the grid's period axis now
      // extends to cover it instead of stopping at the expense-only range.
      tx({ date_operation: "2025-03-10", category: "Refund", subcategory_id: 501, credit: 90 }),
    ];
    const compensationMap = { 501: 1 };

    const [result, unmatched] = aggregateExpensesCompensated(txs, "Month", compensationMap, categoryNames);

    // Jan/Feb are untouched (the refund isn't in either period), and March now
    // appears with a clamped 0 rather than being silently excluded.
    expect(result).toEqual([
      { period: "2025-01-01", category: "Groceries", value: 300 },
      { period: "2025-02-01", category: "Groceries", value: 200 },
      { period: "2025-03-01", category: "Groceries", value: 0 },
    ]);
    expect(unmatched).toBe(0);
  });

  it("still reports an unmatched refund even when the period has no expense transactions", () => {
    const txs = [
      tx({ date_operation: "2025-01-25", category: "Refund", subcategory_id: 999, credit: 40 }), // unmatched
    ];
    const compensationMap = { 501: 1 };

    const [result, unmatched] = aggregateExpensesCompensated(txs, "Month", compensationMap, categoryNames);

    // No expenses to build a grid from, but the unmatched refund is still counted.
    expect(result).toEqual([]);
    expect(unmatched).toBe(40);
  });
});

// ── applyAverage ──────────────────────────────────────────────────────────────

describe("applyAverage", () => {
  const aggregated: AggregatedData[] = [
    { period: "2025-01-01", category: "Groceries", value: 300 },
    { period: "2025-02-01", category: "Groceries", value: 600 },
  ];

  it("Off returns the aggregated values unchanged", () => {
    expect(applyAverage(aggregated, [], "Off")).toEqual(aggregated);
  });

  it("Over 12 Months divides every value by 12, regardless of the filtered transaction span", () => {
    const filtered = [tx({ date_operation: "2025-01-15" })]; // single month — irrelevant to this mode
    expect(applyAverage(aggregated, filtered, "Over 12 Months")).toEqual([
      { period: "2025-01-01", category: "Groceries", value: 25 },
      { period: "2025-02-01", category: "Groceries", value: 50 },
    ]);
  });

  it("Over Max divides by the distinct month count of the filtered transactions", () => {
    const filtered = [
      tx({ date_operation: "2025-01-10" }),
      tx({ date_operation: "2025-02-10" }),
      tx({ date_operation: "2025-03-10" }),
    ]; // 3 distinct months
    expect(applyAverage(aggregated, filtered, "Over Max")).toEqual([
      { period: "2025-01-01", category: "Groceries", value: 100 },
      { period: "2025-02-01", category: "Groceries", value: 200 },
    ]);
  });

  it("Over Current Period uses the same divisor logic as Over Max", () => {
    const filtered = [tx({ date_operation: "2025-01-10" }), tx({ date_operation: "2025-02-10" })]; // 2 months
    expect(applyAverage(aggregated, filtered, "Over Current Period")).toEqual([
      { period: "2025-01-01", category: "Groceries", value: 150 },
      { period: "2025-02-01", category: "Groceries", value: 300 },
    ]);
  });

  it("does not divide by zero — falls back to the raw values when the filtered list is empty", () => {
    expect(applyAverage(aggregated, [], "Over Max")).toEqual(aggregated);
  });
});

// ── getTypicalMonth ───────────────────────────────────────────────────────────

describe("getTypicalMonth", () => {
  it("returns [] for an empty transaction list", () => {
    expect(getTypicalMonth([], "Off")).toEqual([]);
  });

  it("returns [] when there are no qualifying expense transactions", () => {
    const txs = [tx({ date_operation: "2025-01-03", category: "Income", credit: 2500 })];
    expect(getTypicalMonth(txs, "Off")).toEqual([]);
  });

  it("sums debits per category and sorts ascending by amount (Off = no averaging)", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 200 }),
      tx({ date_operation: "2025-02-09", category: "Groceries", debit: 100 }),
      tx({ date_operation: "2025-01-12", category: "Transport", debit: 45 }),
    ];
    expect(getTypicalMonth(txs, "Off")).toEqual([
      { category: "Transport", amount: 45 },
      { category: "Groceries", amount: 300 },
    ]);
  });

  it("Over 12 Months divides totals by 12", () => {
    const txs = [tx({ date_operation: "2025-01-08", category: "Groceries", debit: 1200 })];
    expect(getTypicalMonth(txs, "Over 12 Months")).toEqual([{ category: "Groceries", amount: 100 }]);
  });

  it("always excludes Internal, regardless of the includeInternal toggle elsewhere — getTypicalMonth has no such parameter", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 100 }),
      tx({ date_operation: "2025-01-09", category: "Internal", debit: 5000 }),
    ];
    expect(getTypicalMonth(txs, "Off")).toEqual([{ category: "Groceries", amount: 100 }]);
  });

  it("Over Max divides by the distinct month count of ALL passed-in transactions, not just the expense ones", () => {
    const txs = [
      tx({ date_operation: "2025-01-08", category: "Groceries", debit: 100 }),
      tx({ date_operation: "2025-02-09", category: "Transport", debit: 50 }),
      // March has income only — no expense — but still counts toward the divisor.
      tx({ date_operation: "2025-03-03", category: "Income", credit: 2500 }),
    ];
    expect(getTypicalMonth(txs, "Over Max")).toEqual([
      { category: "Transport", amount: 50 / 3 },
      { category: "Groceries", amount: 100 / 3 },
    ]);
  });
});

// ── getCategoryOrder ──────────────────────────────────────────────────────────

describe("getCategoryOrder", () => {
  it("orders categories descending by total value summed across all periods", () => {
    const data: AggregatedData[] = [
      { period: "2025-01-01", category: "Groceries", value: 200 },
      { period: "2025-02-01", category: "Groceries", value: 100 },
      { period: "2025-01-01", category: "Transport", value: 45 },
      { period: "2025-02-01", category: "Transport", value: 30 },
      { period: "2025-01-01", category: "Rent", value: 900 },
      { period: "2025-02-01", category: "Rent", value: 900 },
    ];
    // Totals: Rent=1800, Groceries=300, Transport=75
    expect(getCategoryOrder(data)).toEqual(["Rent", "Groceries", "Transport"]);
  });

  it("returns an empty array for empty input", () => {
    expect(getCategoryOrder([])).toEqual([]);
  });
});
