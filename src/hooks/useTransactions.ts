import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTransactions, assignTransaction } from "../api/client";
import type { Transaction } from "../types";

export const TRANSACTIONS_KEY = ["transactions"] as const;

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: TRANSACTIONS_KEY,
    queryFn: getTransactions,
    staleTime: 5 * 60 * 1000, // cache 5 minutes
  });
}

export function useAssignTransaction() {
  const queryClient = useQueryClient();
  return async (id: number, subcategory_id: number, method = "manual") => {
    await assignTransaction(id, subcategory_id, method);
    await queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
  };
}
