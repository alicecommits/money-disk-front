import { useState, type ReactNode } from "react";
import { categoryOptionLabel } from "../categories/CategoryIcon";
import type { Category } from "../../types";

export interface RuleFormInitialValues {
  pattern?: string;
  is_regex?: boolean;
  category?: string;
  subcategory_id?: number;
  priority?: number;
}

export interface RuleFormSubmitData {
  pattern: string;
  is_regex: boolean;
  subcategory_id: number;
  priority?: number;
}

interface RuleFormProps {
  categories: Category[];
  initialValues?: RuleFormInitialValues;
  onSubmit: (data: RuleFormSubmitData) => void;
  onCancel: () => void;
  loading: boolean;
  error?: Error | null;
  /** Disables pattern text input + regex checkbox, with an explanatory caption. */
  patternDisabled?: boolean;
  /** Overrides the default Save/Cancel row. Called with a `submit` trigger and whether the form is currently valid. */
  renderActions?: (submit: () => void, canSubmit: boolean) => ReactNode;
}

export function RuleForm({
  categories, initialValues, onSubmit, onCancel, loading, error,
  patternDisabled = false, renderActions,
}: RuleFormProps) {
  const [pattern,   setPattern]   = useState(initialValues?.pattern ?? "");
  const [isRegex,   setIsRegex]   = useState(initialValues?.is_regex ?? false);
  const [catName,   setCatName]   = useState(initialValues?.category ?? "");
  const [subId,     setSubId]     = useState<number | "">(initialValues?.subcategory_id ?? "");
  const [priority,  setPriority]  = useState<number | "">(initialValues?.priority ?? "");

  const cat = categories.find((c) => c.name === catName);
  const canSubmit = Boolean(pattern) && subId !== "";

  function submit() {
    if (!canSubmit) return;
    onSubmit({
      pattern,
      is_regex: isRegex,
      subcategory_id: Number(subId),
      ...(priority !== "" ? { priority: Number(priority) } : {}),
    });
  }

  const inputCls =
    "rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary " +
    "focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20";
  const disabledCls = " opacity-50 cursor-not-allowed";

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
              className={inputCls + " w-full font-mono" + (patternDisabled ? disabledCls : "")}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              disabled={patternDisabled}
              placeholder="e.g. AUCHAN or ^CARTE.*PARIS"
            />
            {patternDisabled && (
              <p className="mt-1 text-xs text-text-tertiary">
                To modify this rule's pattern, go to the Rules admin page.
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={isRegex}
              onChange={(e) => setIsRegex(e.target.checked)}
              disabled={patternDisabled}
              className={"accent-accent-primary" + (patternDisabled ? disabledCls : "")}
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

      {renderActions ? renderActions(submit, canSubmit) : (
        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={loading || !canSubmit}
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
      )}
    </div>
  );
}
