import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { Category, ColumnMapping, ProcessedTransaction } from "../../types";
import { categoryOptionLabel } from "../categories/CategoryIcon";

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm " +
  "text-text-primary focus:border-accent-primary focus:outline-none " +
  "focus:ring-2 focus:ring-accent-primary/20 transition-colors";

const selectCls = inputCls;
const labelCls = "block text-xs font-medium uppercase tracking-wider text-text-tertiary mb-1";

// ── FileDropzone ──────────────────────────────────────────────────────────────

interface FileDropzoneProps {
  onUpload: (file: File, sep: string) => void;
  loading: boolean;
  error?: Error | null;
}

export function FileDropzone({ onUpload, loading, error }: FileDropzoneProps) {
  const [sep, setSep] = useState(",");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setSelectedFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "text/plain": [".txt"] },
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed " +
          "p-12 transition-colors cursor-pointer " +
          (isDragActive
            ? "border-accent-primary bg-accent-primary/5"
            : "border-border-default hover:border-border-subtle hover:bg-bg-hover")
        }
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">📂</div>
        {selectedFile ? (
          <p className="text-text-primary font-medium">{selectedFile.name}</p>
        ) : (
          <>
            <p className="text-text-primary font-medium">
              {isDragActive ? "Drop your CSV here" : "Drag & drop a CSV file"}
            </p>
            <p className="mt-1 text-sm text-text-tertiary">or click to browse</p>
          </>
        )}
      </div>

      <div className="flex items-end gap-4">
        <div className="w-40">
          <label className={labelCls}>Separator</label>
          <select className={selectCls} value={sep} onChange={(e) => setSep(e.target.value)}>
            <option value=",">, (comma)</option>
            <option value=";">; (semicolon)</option>
            <option value="\t">⇥ (tab)</option>
          </select>
        </div>

        <button
          disabled={!selectedFile || loading}
          onClick={() => selectedFile && onUpload(selectedFile, sep)}
          className={
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity " +
            (!selectedFile || loading
              ? "cursor-not-allowed opacity-40 bg-accent-primary"
              : "bg-accent-primary hover:opacity-90")
          }
          style={{ background: "var(--accent-gradient)" }}
        >
          {loading ? "Loading preview…" : "Upload & Preview →"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
}

// ── PreviewTable ──────────────────────────────────────────────────────────────

interface PreviewTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
}

export function PreviewTable({ columns, rows }: PreviewTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-tertiary">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-bg-secondary" : "bg-bg-primary"}>
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 text-text-primary whitespace-nowrap max-w-[200px] truncate">
                  {String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── ColumnMapper ──────────────────────────────────────────────────────────────

interface ColumnMapperProps {
  columns: string[];
  onSubmit: (mapping: ColumnMapping) => void;
  loading: boolean;
  error?: Error | null;
}

export function ColumnMapper({ columns, onSubmit, loading, error }: ColumnMapperProps) {
  const [dateCol, setDateCol]         = useState(columns[0] ?? "");
  const [labelCols, setLabelCols]     = useState<string[]>([columns[1] ?? ""].filter(Boolean));
  const [amountMode, setAmountMode]   = useState<"separate" | "combined">("separate");
  const [debitCol, setDebitCol]       = useState("");
  const [creditCol, setCreditCol]     = useState("");
  const [amountCol, setAmountCol]     = useState("");
  const [extraCol, setExtraCol]       = useState("");
  const [currency, setCurrency]       = useState("EUR");
  const [sep, setSep]                 = useState(",");

  function toggleLabelCol(col: string) {
    setLabelCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  }

  function handleSubmit() {
    const mapping: ColumnMapping = {
      date_column: dateCol,
      label_columns: labelCols.length ? labelCols : [dateCol],
      amount_mode: amountMode,
      source_currency: currency,
      sep,
      ...(amountMode === "separate" && debitCol ? { debit_column: debitCol } : {}),
      ...(amountMode === "separate" && creditCol ? { credit_column: creditCol } : {}),
      ...(amountMode === "combined" && amountCol ? { amount_column: amountCol } : {}),
      ...(extraCol ? { extra_context_column: extraCol } : {}),
    };
    onSubmit(mapping);
  }

  return (
    <div className="space-y-6">
      {/* Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Date column *</label>
          <select className={selectCls} value={dateCol} onChange={(e) => setDateCol(e.target.value)}>
            {columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Separator</label>
          <select className={selectCls} value={sep} onChange={(e) => setSep(e.target.value)}>
            <option value=",">, (comma)</option>
            <option value=";">; (semicolon)</option>
            <option value="\t">⇥ (tab)</option>
          </select>
        </div>
      </div>

      {/* Label columns (multi-select) */}
      <div>
        <label className={labelCls}>Label columns * (concatenated with " - ")</label>
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => (
            <button
              key={col}
              onClick={() => toggleLabelCol(col)}
              className={
                "rounded px-2 py-1 text-xs font-medium border transition-colors " +
                (labelCols.includes(col)
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-text-secondary hover:bg-bg-hover")
              }
            >
              {labelCols.includes(col) ? `✓ ${col}` : col}
            </button>
          ))}
        </div>
      </div>

      {/* Amount mode */}
      <div>
        <label className={labelCls}>Amount mode *</label>
        <div className="flex gap-2">
          {(["separate", "combined"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setAmountMode(mode)}
              className={
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors " +
                (amountMode === mode
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-text-secondary hover:bg-bg-hover")
              }
            >
              {mode === "separate" ? "Separate debit/credit" : "Combined amount"}
            </button>
          ))}
        </div>
      </div>

      {amountMode === "separate" ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Debit column</label>
            <select className={selectCls} value={debitCol} onChange={(e) => setDebitCol(e.target.value)}>
              <option value="">— none —</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Credit column</label>
            <select className={selectCls} value={creditCol} onChange={(e) => setCreditCol(e.target.value)}>
              <option value="">— none —</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      ) : (
        <div>
          <label className={labelCls}>Amount column (negative = debit)</label>
          <select className={selectCls} value={amountCol} onChange={(e) => setAmountCol(e.target.value)}>
            <option value="">— select —</option>
            {columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Currency + extra context */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Currency</label>
          <select className={selectCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP → EUR</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Extra context column (optional)</label>
          <select className={selectCls} value={extraCol} onChange={(e) => setExtraCol(e.target.value)}>
            <option value="">— none —</option>
            {columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-400">
          {error.message}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !dateCol || !labelCols.length}
        className="w-full rounded-lg py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: "var(--accent-gradient)" }}
      >
        {loading ? "Processing…" : "Process & Match Rules →"}
      </button>
    </div>
  );
}

// ── ResultsEditor ─────────────────────────────────────────────────────────────

interface ResultsEditorProps {
  rows: ProcessedTransaction[];
  categories: Category[];
  onUpdateRow: (index: number, updated: Partial<ProcessedTransaction>) => void;
  onConfirm: () => void;
  loading: boolean;
  stats: { total: number; matched: number; unmatched: number } | null;
}

export function ResultsEditor({
  rows, categories, onUpdateRow, onConfirm, loading,
}: ResultsEditorProps) {
  function handleCategoryChange(index: number, catName: string) {
    const cat = categories.find((c) => c.name === catName);
    if (!cat) return;
    onUpdateRow(index, {
      category: cat.name,
      subcategory: cat.subcategories[0]?.name ?? null,
      subcategory_id: cat.subcategories[0]?.id ?? null,
      assignment_method: "manual",
      matched_rule_id: null,
    });
  }

  function handleSubcategoryChange(index: number, row: ProcessedTransaction, subId: number) {
    const cat   = categories.find((c) => c.name === row.category);
    const sub   = cat?.subcategories.find((s) => s.id === subId);
    if (!sub) return;
    onUpdateRow(index, { subcategory: sub.name, subcategory_id: sub.id, assignment_method: "manual" });
  }

  const matched   = rows.filter((r) => r.subcategory_id != null).length;
  const unmatched = rows.length - matched;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex gap-4 text-sm">
        <span className="text-text-secondary">
          Total: <strong className="text-text-primary">{rows.length}</strong>
        </span>
        <span className="text-green-400">
          Matched: <strong>{matched}</strong>
        </span>
        <span className="text-yellow-400">
          Unmatched: <strong>{unmatched}</strong>
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border-subtle max-h-[50vh]">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border-subtle bg-bg-tertiary">
              {["Date", "Label", "Debit", "Credit", "Category", "Subcategory"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-secondary whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const cat = categories.find((c) => c.name === row.category);
              const isMatched = row.subcategory_id != null;
              return (
                <tr key={i} className={
                  "border-b border-border-subtle transition-colors " +
                  (isMatched ? "bg-bg-secondary" : "bg-yellow-950/20")
                }>
                  <td className="px-3 py-1.5 text-text-secondary whitespace-nowrap font-mono">
                    {row.date_operation}
                  </td>
                  <td className="px-3 py-1.5 text-text-primary max-w-[280px] truncate" title={row.label}>
                    {row.label}
                    {row.rule_pattern && (
                      <span className="ml-1 text-text-tertiary">({row.rule_pattern})</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-red-400">
                    {row.debit != null ? `€${row.debit.toFixed(2)}` : ""}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-green-400">
                    {row.credit != null ? `€${row.credit.toFixed(2)}` : ""}
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      className="rounded border border-border-subtle bg-bg-primary px-2 py-0.5 text-xs text-text-primary"
                      value={row.category ?? ""}
                      onChange={(e) => handleCategoryChange(i, e.target.value)}
                    >
                      <option value="">— unassigned —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{categoryOptionLabel(c.icon, c.name)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      className="rounded border border-border-subtle bg-bg-primary px-2 py-0.5 text-xs text-text-primary"
                      value={row.subcategory_id ?? ""}
                      onChange={(e) => handleSubcategoryChange(i, row, Number(e.target.value))}
                      disabled={!cat}
                    >
                      <option value="">— select —</option>
                      {cat?.subcategories.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={onConfirm}
        disabled={loading}
        className="w-full rounded-lg py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "var(--accent-gradient)" }}
      >
        {loading ? "Importing…" : `Confirm Import (${rows.length} transactions)`}
      </button>
    </div>
  );
}
