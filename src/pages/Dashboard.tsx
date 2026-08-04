import { useState } from "react";
import type { PeriodFilter, AverageMode, Scale } from "../types";
import { useTransactions } from "../hooks/useTransactions";
import { useCategoryMaps } from "../hooks/useCategories";
import { useExpenses } from "../hooks/useExpenses";
import { useIncome } from "../hooks/useIncome";
import { ExpensesChart } from "../components/charts/ExpensesChart";
import { IncomeChart } from "../components/charts/IncomeChart";
import { TypicalMonthChart } from "../components/charts/TypicalMonthChart";
import {
  PeriodFilter as PeriodFilterControl,
  ScaleRadio,
  AverageSelect,
  CompensateToggle,
} from "../components/controls/Controls";

export function Dashboard() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("Last 12 Months");
  const [scale, setScale]               = useState<Scale>("Month");
  const [averageMode, setAverageMode]   = useState<AverageMode>("Off");
  const [compensate, setCompensate]     = useState(false);

  const { data: transactions = [], isLoading, error } = useTransactions();
  const { categoryNames, compensationMap } = useCategoryMaps();

  const expenses = useExpenses({
    transactions, periodFilter, scale, averageMode, compensate, compensationMap, categoryNames,
  });
  const income = useIncome(transactions, periodFilter, scale, averageMode);

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
      </div>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium text-text-primary">Expenses</h2>
          {compensate && expenses.unmatchedRefunds > 0 && (
            <p className="text-sm text-text-tertiary">ℹ️ €{expenses.unmatchedRefunds.toFixed(2)} in unmatched refunds not applied</p>
          )}
        </div>
        <p className="mb-4 text-xs text-text-tertiary">Double-click a category in the legend to focus it.</p>
        <ExpensesChart data={expenses.data} categoryOrder={expenses.categoryOrder} scale={scale} averageMode={averageMode} />
      </section>

      {averageMode !== "Off" && expenses.typicalMonth.length > 0 && (
        <section className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
          <h2 className="mb-4 text-lg font-medium text-text-primary">📅 Typical Month</h2>
          <TypicalMonthChart data={expenses.typicalMonth} monthCount={expenses.monthCount} />
        </section>
      )}

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="mb-4 text-lg font-medium text-text-primary">Income</h2>
        <IncomeChart data={income.data} categoryOrder={income.categoryOrder} scale={scale} averageMode={averageMode} />
      </section>
    </div>
  );
}
