import { useMemo } from "react";
import type { Transaction, AggregatedData, Scale } from "../types";
import {
  filterByPeriod,
  aggregateExpenses,
  aggregateExpensesCompensated,
  applyAverage,
  countMonthsInPeriod,
  getCategoryOrder,
  getTypicalMonth,
} from "../lib/aggregation";

interface UseExpensesOptions {
  transactions: Transaction[];
  periodFilter: string;
  scale: Scale;
  averageMode: string;
  compensate: boolean;
  compensationMap?: Record<number, number>;
  categoryNames?: Record<number, string>;
}

export function useExpenses({
  transactions,
  periodFilter,
  scale,
  averageMode,
  compensate,
  compensationMap = {},
  categoryNames = {},
}: UseExpensesOptions) {
  return useMemo(() => {
    const filtered = filterByPeriod(transactions, periodFilter);

    let aggregated: AggregatedData[];
    let unmatchedRefunds = 0;

    if (compensate && Object.keys(compensationMap).length) {
      [aggregated, unmatchedRefunds] = aggregateExpensesCompensated(
        filtered,
        scale,
        compensationMap,
        categoryNames,
      );
    } else {
      aggregated = aggregateExpenses(filtered, scale);
    }

    const averaged        = applyAverage(aggregated, filtered, averageMode);
    const categoryOrder   = getCategoryOrder(averaged);
    const monthCount      = countMonthsInPeriod(filtered);
    const typicalMonth    = averageMode !== "Off"
      ? getTypicalMonth(filtered, averageMode)
      : [];

    return {
      data: averaged,
      categoryOrder,
      monthCount,
      transactionCount: filtered.length,
      unmatchedRefunds,
      typicalMonth,
    };
  }, [transactions, periodFilter, scale, averageMode, compensate, compensationMap, categoryNames]);
}
