import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getExchangeRates } from "../api/client";

/**
 * Most recent GBP→EUR rate, inverted for display. Stored rates are EUR-per-GBP
 * (the import-time multiplier applied to native GBP amounts to get EUR) — since
 * the DB spine is always EUR, showing it in GBP means dividing by that rate, so
 * the inversion happens once here rather than at every call site.
 */
export function useGbpDisplayRate() {
  const ratesQ = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: getExchangeRates,
    staleTime: 10 * 60 * 1000,
  });

  const rate = useMemo(() => {
    const gbpRates = (ratesQ.data ?? []).filter(
      (r) => r.from_currency === "GBP" && r.to_currency === "EUR",
    );
    if (!gbpRates.length) return null;
    const latest = gbpRates.reduce((a, b) => (b.year_month > a.year_month ? b : a));
    return 1 / latest.rate;
  }, [ratesQ.data]);

  return { rate, isLoading: ratesQ.isLoading };
}
