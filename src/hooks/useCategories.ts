import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, getCompensationMap, updateCategory } from "../api/client";
import type { Category } from "../types";
import { useMemo } from "react";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });
}

/** Flat {categoryName: icon} map — chart legends/tooltips only carry category names, not full Category objects. */
export function useCategoryIconMap(): Record<string, string | null> {
  const categoriesQ = useCategories();
  return useMemo(() => {
    if (!categoriesQ.data) return {};
    return Object.fromEntries(categoriesQ.data.map((c) => [c.name, c.icon]));
  }, [categoriesQ.data]);
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, icon }: { id: number; name: string; icon: string | null }) =>
      updateCategory(id, { name, icon }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
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

  const categoryIconByName = useMemo<Record<string, string | null>>(() => {
    if (!categoriesQ.data) return {};
    return Object.fromEntries(categoriesQ.data.map((c) => [c.name, c.icon]));
  }, [categoriesQ.data]);

  return {
    categoriesLoading: categoriesQ.isLoading || compMapQ.isLoading,
    categories: categoriesQ.data ?? [],
    categoryNames,
    categoryIconByName,
    compensationMap,
  };
}
