import { useMemo } from "react";
import type { Transaction, Scale } from "../types";
import {
  filterByPeriod,
  aggregateIncome,
  applyAverage,
  countMonthsInPeriod,
  getCategoryOrder,
} from "../lib/aggregation";

export function useIncome(
  transactions: Transaction[],
  periodFilter: string,
  scale: Scale,
  averageMode: string,
) {
  return useMemo(() => {
    const filtered  = filterByPeriod(transactions, periodFilter);
    const aggregated = aggregateIncome(filtered, scale);
    const averaged   = applyAverage(aggregated, filtered, averageMode);

    return {
      data: averaged,
      categoryOrder: getCategoryOrder(averaged),
      monthCount: countMonthsInPeriod(filtered),
    };
  }, [transactions, periodFilter, scale, averageMode]);
}
