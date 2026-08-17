import { useEffect, useMemo, useState } from "react";
import type { PeriodFilter, AverageMode, Scale } from "../types";
import { useTransactions } from "../hooks/useTransactions";
import { useCategoryMaps } from "../hooks/useCategories";
import { useExpenses } from "../hooks/useExpenses";
import { useIncome } from "../hooks/useIncome";
import { useGbpDisplayRate } from "../hooks/useCurrency";
import { cosmeticConversion } from "../lib/aggregation";
import { ExpensesChart } from "../components/charts/ExpensesChart";
import { IncomeChart } from "../components/charts/IncomeChart";
import { TypicalMonthChart } from "../components/charts/TypicalMonthChart";
import {
  PeriodFilter as PeriodFilterControl,
  ScaleRadio,
  AverageSelect,
  CompensateToggle,
  ShowInternalToggle,
  CurrencyToggle,
} from "../components/controls/Controls";

const TYPICAL_MONTH_INTERNAL_NOTE =
  "Internal transfers are always excluded here, regardless of the toggle above — " +
  "this chart is for budgeting intuition and intrabank moves are noise there.";

const INTERNAL_HIDDEN_WHILE_COMPENSATING_NOTE =
  "Hidden while Compensate is on — refund compensation is about isolating true " +
  "spending, and internal transfers aren't spending.";

export function Dashboard() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("Last 12 Months");
  const [scale, setScale]               = useState<Scale>("Month");
  const [averageMode, setAverageMode]   = useState<AverageMode>("Off");
  const [compensate, setCompensate]     = useState(false);
  const [showInternal, setShowInternal] = useState(false);
  const [currency, setCurrency]         = useState<"EUR" | "GBP">("EUR");

  const { data: transactions = [], isLoading, error } = useTransactions();
  const { categoryNames, categoryIconByName, compensationMap } = useCategoryMaps();
  const gbpDisplay = useGbpDisplayRate();

  // Refund compensation is about isolating true spending — Internal transfers
  // are administrative, not spending, so the two toggles are mutually exclusive.
  const effectiveIncludeInternal = compensate ? false : showInternal;

  const expenses = useExpenses({
    transactions, periodFilter, scale, averageMode, compensate, compensationMap, categoryNames,
    includeInternal: effectiveIncludeInternal,
  });
  const income = useIncome(transactions, periodFilter, scale, averageMode);

  // Falls back to EUR if the stored GBP rate disappears out from under a live GBP
  // selection (e.g. deleted in Admin) — the toggle's disabled state alone can't
  // prevent this since it only guards the click handler, not existing state.
  useEffect(() => {
    if (currency === "GBP" && gbpDisplay.rate == null) setCurrency("EUR");
  }, [currency, gbpDisplay.rate]);

  const currencySymbol = currency === "GBP" ? "£" : "€";
  const displayRate = currency === "GBP" && gbpDisplay.rate != null ? gbpDisplay.rate : 1;

  const expensesData = useMemo(
    () => cosmeticConversion(expenses.data, displayRate),
    [expenses.data, displayRate],
  );
  const incomeData = useMemo(
    () => cosmeticConversion(income.data, displayRate),
    [income.data, displayRate],
  );
  const typicalMonthData = useMemo(
    () => expenses.typicalMonth.map((d) => ({ ...d, amount: d.amount * displayRate })),
    [expenses.typicalMonth, displayRate],
  );
  const unmatchedRefundsDisplay = expenses.unmatchedRefunds * displayRate;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-text-tertiary">Loading transactions…</div>;
  }
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-red-400">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          {expenses.transactionCount.toLocaleString()} transactions over {expenses.monthCount} month{expenses.monthCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-end rounded-xl border border-border-subtle bg-bg-secondary p-4">
        <PeriodFilterControl value={periodFilter} onChange={setPeriodFilter} />
        <ScaleRadio value={scale} onChange={setScale} />
        <AverageSelect value={averageMode} onChange={setAverageMode} />
        <CompensateToggle value={compensate} onChange={setCompensate} />
        <ShowInternalToggle
          value={effectiveIncludeInternal}
          onChange={setShowInternal}
          disabled={compensate}
          disabledReason={INTERNAL_HIDDEN_WHILE_COMPENSATING_NOTE}
        />
        <CurrencyToggle
          value={currency}
          onChange={setCurrency}
          disabled={gbpDisplay.rate == null}
          disabledReason="Add a GBP rate in Admin to enable"
        />
      </div>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium text-text-primary">Expenses</h2>
          {compensate && expenses.unmatchedRefunds > 0 && (
            <p className="text-sm text-text-tertiary">ℹ️ {currencySymbol}{unmatchedRefundsDisplay.toFixed(2)} in unmatched refunds not applied</p>
          )}
        </div>
        <p className="mb-4 text-xs text-text-tertiary">Double-click a category in the legend to focus it.</p>
        <ExpensesChart data={expensesData} categoryOrder={expenses.categoryOrder} scale={scale} averageMode={averageMode} categoryIcons={categoryIconByName} currencySymbol={currencySymbol} />
      </section>

      {(averageMode !== "Off" || expenses.typicalMonth.length > 0) && (
        <section className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
          <h2 className="mb-4 flex items-center gap-1.5 text-lg font-medium text-text-primary">
            📅 Typical Month
            <span
              className="cursor-help text-sm text-text-tertiary"
              title={TYPICAL_MONTH_INTERNAL_NOTE}
            >
              ⓘ
            </span>
          </h2>
          <TypicalMonthChart data={typicalMonthData} monthCount={expenses.monthCount} categoryIcons={categoryIconByName} currencySymbol={currencySymbol} />
        </section>
      )}

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="mb-4 text-lg font-medium text-text-primary">Income</h2>
        <IncomeChart data={incomeData} categoryOrder={income.categoryOrder} scale={scale} averageMode={averageMode} categoryIcons={categoryIconByName} currencySymbol={currencySymbol} />
      </section>
    </div>
  );
}
