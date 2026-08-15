import type {
  Category,
  Rule,
  Transaction,
  ExchangeRate,
  ProcessedTransaction,
  ImportResult,
} from "../types";

const BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ── Transactions ──────────────────────────────────────────────────────────────

export const getTransactions = (): Promise<Transaction[]> =>
  request("/transactions");

export const assignTransaction = (
  id: number,
  subcategory_id: number,
  method = "manual",
): Promise<{ ok: boolean }> =>
  request(`/transactions/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ subcategory_id, method }),
  });

// ── Categories ────────────────────────────────────────────────────────────────

export const getCategories = (): Promise<Category[]> =>
  request("/categories");

export const addCategory = (name: string): Promise<Category> =>
  request("/categories", { method: "POST", body: JSON.stringify({ name }) });

export const addSubcategory = (
  category_id: number,
  name: string,
): Promise<{ id: number; category_id: number; name: string }> =>
  request("/subcategories", {
    method: "POST",
    body: JSON.stringify({ category_id, name }),
  });

export const updateCategory = (
  id: number,
  payload: { name: string; icon: string | null },
): Promise<{ ok: boolean }> =>
  request(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

// ── Rules ─────────────────────────────────────────────────────────────────────

export const getRules = (): Promise<Rule[]> => request("/rules");

export const createRule = (payload: {
  pattern: string;
  is_regex: boolean;
  subcategory_id: number;
  priority?: number;
}): Promise<Rule> =>
  request("/rules", { method: "POST", body: JSON.stringify(payload) });

export const updateRule = (
  id: number,
  payload: Partial<{
    pattern: string;
    is_regex: boolean;
    subcategory_id: number;
    priority: number;
  }>,
): Promise<Rule> =>
  request(`/rules/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteRule = (id: number): Promise<void> =>
  request(`/rules/${id}`, { method: "DELETE" });

export const reorderRules = (orderedIds: number[]): Promise<{ ok: boolean }> =>
  request("/rules/reorder", { method: "POST", body: JSON.stringify(orderedIds) });

export const bulkAssignByRule = (
  rule_id: number,
  subcategory_id: number,
): Promise<{ updated: number }> =>
  request("/transactions/bulk-assign-by-rule", {
    method: "POST",
    body: JSON.stringify({ rule_id, subcategory_id }),
  });

// ── Currency ──────────────────────────────────────────────────────────────────

export const getExchangeRates = (): Promise<ExchangeRate[]> =>
  request("/currency/rates");

export const addExchangeRate = (payload: {
  year_month: string;
  from_currency: string;
  to_currency?: string;
  rate: number;
}): Promise<{ ok: boolean }> =>
  request("/currency/rates", { method: "POST", body: JSON.stringify(payload) });

export const deleteExchangeRate = (id: number): Promise<void> =>
  request(`/currency/rates/${id}`, { method: "DELETE" });

// ── Refunds ───────────────────────────────────────────────────────────────────

export const getCompensationMap = (): Promise<Record<string, number>> =>
  request("/refunds/compensation-map");

// ── Import flow (multipart) ───────────────────────────────────────────────────

/** Step 1: upload file, get columns + preview rows */
export async function importPreview(
  file: File,
  sep = ",",
): Promise<{ columns: string[]; preview: Record<string, unknown>[]; filename: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("sep", sep);

  const res = await fetch(`${BASE}/import/preview`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Step 2: apply column mapping + pattern matching */
export async function importProcess(
  file: File,
  mapping: object,
): Promise<{
  rows: ProcessedTransaction[];
  stats: { total: number; matched: number; unmatched: number };
  conversion_stats: unknown;
}> {
  const form = new FormData();
  form.append("file", file);
  form.append("mapping_json", JSON.stringify(mapping));

  const res = await fetch(`${BASE}/import/process`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Step 3: confirm / save transactions */
export async function importConfirm(
  rows: ProcessedTransaction[],
  source_file: string,
): Promise<ImportResult> {
  const res = await fetch(`${BASE}/import/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows, source_file }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
