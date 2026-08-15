import { useState } from "react";
import { categoryOptionLabel } from "../categories/CategoryIcon";
import type { Category, Rule } from "../../types";

interface RuleFormProps {
  categories: Category[];
  initialValues?: Rule;
  onSubmit: (data: { pattern: string; is_regex: boolean; subcategory_id: number; priority?: number }) => void;
  onCancel: () => void;
  loading: boolean;
  error?: Error | null;
}

export function RuleForm({ categories, initialValues, onSubmit, onCancel, loading, error }: RuleFormProps) {
  const [pattern,   setPattern]   = useState(initialValues?.pattern ?? "");
  const [isRegex,   setIsRegex]   = useState(initialValues?.is_regex ?? false);
  const [catName,   setCatName]   = useState(initialValues?.category ?? "");
  const [subId,     setSubId]     = useState<number | "">(initialValues?.subcategory_id ?? "");
  const [priority,  setPriority]  = useState<number | "">(initialValues?.priority ?? "");

  const cat = categories.find((c) => c.name === catName);

  const inputCls =
    "rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary " +
    "focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20";

  return (
    <div className="rounded-lg border border-border-default bg-bg-secondary p-4 space-y-4">
      <h3 className="text-sm font-medium text-text-primary">
        {initialValues ? "Edit Rule" : "New Rule"}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Pattern */}
        <div className="col-span-2 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-text-tertiary mb-1">Pattern</label>
            <input
              type="text"
              className={inputCls + " w-full font-mono"}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. AUCHAN or ^CARTE.*PARIS"
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={isRegex}
              onChange={(e) => setIsRegex(e.target.checked)}
              className="accent-accent-primary"
            />
            Regex
          </label>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-text-tertiary mb-1">Category</label>
          <select
            className={inputCls + " w-full"}
            value={catName}
            onChange={(e) => { setCatName(e.target.value); setSubId(""); }}
          >
            <option value="">— select —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{categoryOptionLabel(c.icon, c.name)}</option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div>
          <label className="block text-xs font-medium text-text-tertiary mb-1">Subcategory</label>
          <select
            className={inputCls + " w-full"}
            value={subId}
            onChange={(e) => setSubId(Number(e.target.value))}
            disabled={!cat}
          >
            <option value="">— select —</option>
            {cat?.subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-text-tertiary mb-1">
            Priority (blank = auto)
          </label>
          <input
            type="number"
            className={inputCls + " w-full"}
            value={priority}
            onChange={(e) => setPriority(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="auto"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error.message}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => {
            if (!pattern || !subId) return;
            onSubmit({
              pattern,
              is_regex: isRegex,
              subcategory_id: Number(subId),
              ...(priority !== "" ? { priority: Number(priority) } : {}),
            });
          }}
          disabled={loading || !pattern || !subId}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--accent-gradient)" }}
        >
          {loading ? "Saving…" : "Save Rule"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-border-default px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
