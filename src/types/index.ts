export interface Transaction {
  id: number;
  date_operation: string;
  label: string;
  debit: number | null;
  credit: number | null;
  extra_context: string | null;
  original_currency: string;
  original_amount: number | null;
  category: string | null;
  subcategory: string | null;
  category_id: number | null;
  subcategory_id: number | null;
  assignment_method: "rule" | "manual" | null;
  matched_rule_id: number | null;
  source_file: string | null;
  imported_at: string | null;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  subcategories: Subcategory[];
}

export interface Rule {
  id: number;
  priority: number;
  pattern: string;
  is_regex: boolean;
  subcategory_id: number;
  category: string;
  subcategory: string;
}

export interface ExchangeRate {
  id: number;
  year_month: string;
  from_currency: string;
  to_currency: string;
  rate: number;
}

// Aggregation types (client-side)
export interface AggregatedData {
  period: string; // ISO date string "yyyy-MM-dd"
  category: string;
  value: number;
}

export interface CategoryTotal {
  category: string;
  amount: number;
}

// Import flow
export type ImportStep = "upload" | "mapping" | "review" | "done";

export interface ColumnMapping {
  date_column: string;
  label_columns: string[];
  amount_mode: "separate" | "combined";
  debit_column?: string;
  credit_column?: string;
  amount_column?: string;
  extra_context_column?: string;
  source_currency: string;
  sep: string;
}

export interface ProcessedTransaction {
  date_operation: string;
  label: string;
  debit: number | null;
  credit: number | null;
  extra_context: string | null;
  original_currency: string;
  original_amount: number | null;
  category: string | null;
  subcategory: string | null;
  subcategory_id: number | null;
  assignment_method: "rule" | "manual" | null;
  matched_rule_id: number | null;
  rule_pattern: string | null;
}

export interface ProcessResult {
  rows: ProcessedTransaction[];
  stats: { total: number; matched: number; unmatched: number };
  conversion_stats: ConversionStats | null;
}

export interface ConversionStats {
  converted: number;
  missing_rates: string[];
  from: string;
  to: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

// UI constants
export const PERIOD_FILTERS = [
  "Max",
  "YTD",
  "Last 12 Months",
  "Last 6 Months",
  "Last 3 Months",
] as const;

export const AVERAGE_MODES = [
  "Off",
  "Over 12 Months",
  "Over Max",
  "Over Current Period",
] as const;

export const SCALE_OPTIONS = ["Day", "Week", "Month"] as const;

export type PeriodFilter = (typeof PERIOD_FILTERS)[number];
export type AverageMode = (typeof AVERAGE_MODES)[number];
export type Scale = (typeof SCALE_OPTIONS)[number];
