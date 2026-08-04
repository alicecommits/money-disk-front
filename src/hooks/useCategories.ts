import { useQuery } from "@tanstack/react-query";
import { getCategories, getCompensationMap } from "../api/client";
import type { Category } from "../types";
import { useMemo } from "react";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCompensationMap() {
  return useQuery<Record<string, number>>({
    queryKey: ["compensation-map"],
    queryFn: getCompensationMap,
    staleTime: 10 * 60 * 1000,
  });
}

/** Returns compensation map with numeric keys and a flat {id: name} category map. */
export function useCategoryMaps() {
  const categoriesQ = useCategories();
  const compMapQ    = useCompensationMap();

  const categoryNames = useMemo<Record<number, string>>(() => {
    if (!categoriesQ.data) return {};
    return Object.fromEntries(categoriesQ.data.map((c) => [c.id, c.name]));
  }, [categoriesQ.data]);

  const compensationMap = useMemo<Record<number, number>>(() => {
    if (!compMapQ.data) return {};
    return Object.fromEntries(
      Object.entries(compMapQ.data).map(([k, v]) => [Number(k), v]),
    );
  }, [compMapQ.data]);

  return {
    categoriesLoading: categoriesQ.isLoading || compMapQ.isLoading,
    categories: categoriesQ.data ?? [],
    categoryNames,
    compensationMap,
  };
}
