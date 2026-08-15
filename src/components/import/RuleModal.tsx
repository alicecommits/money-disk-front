import { useEffect } from "react";
import { RuleForm } from "../rules/RuleForm";
import type { Category, Rule } from "../../types";

interface RuleModalProps {
  isOpen: boolean;
  mode: "update";
  initialPattern: string;
  initialIsRegex: boolean;
  initialSubcategoryId: number;
  currentAssignmentLabel: string;
  matchedRuleId: number;
  matchedCount: number;
  newAssignmentLabel: string;
  loading?: boolean;
  onJustThisOne: () => void;
  onUpdateRuleAndReassign: () => void;
  onCancel: () => void;
}

export function RuleModal({
  isOpen,
  initialPattern,
  initialIsRegex,
  currentAssignmentLabel,
  matchedCount,
  newAssignmentLabel,
  loading = false,
  onJustThisOne,
  onUpdateRuleAndReassign,
  onCancel,
}: RuleModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-lg rounded-xl border border-border-default bg-bg-secondary p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-4 top-4 text-text-tertiary hover:text-text-primary transition-colors"
        >
          ✕
        </button>

        <h3 className="pr-6 text-lg font-semibold text-text-primary">
          This row matches rule &ldquo;{initialPattern}&rdquo;
          {Boolean(initialIsRegex) && <span className="ml-1 text-xs text-text-tertiary">(regex)</span>}
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          Currently {currentAssignmentLabel}. You picked{" "}
          <strong className="text-text-primary">{newAssignmentLabel}</strong>.
        </p>

        {matchedCount > 0 && (
          <p className="mt-3 rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-2 text-xs text-text-secondary">
            This will update rule &ldquo;{initialPattern}&rdquo; and reassign {matchedCount} past
            transaction{matchedCount === 1 ? "" : "s"} to {newAssignmentLabel}.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onUpdateRuleAndReassign}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "var(--accent-gradient)" }}
          >
            {loading ? "Updating…" : `This one + all past "${initialPattern}" transactions`}
          </button>
          <button
            onClick={onJustThisOne}
            disabled={loading}
            className="rounded-lg border border-border-default px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            Just this one
          </button>
        </div>
      </div>
    </div>
  );
}

// ── RulePatternEditorModal ──────────────────────────────────────────────────
// Second step after "This one + all past …" — lets the admin tweak the
// pattern/regex/priority before it's saved and bulk-applied.

interface RulePatternEditorModalProps {
  isOpen: boolean;
  rule: Rule;
  categories: Category[];
  loading?: boolean;
  error?: Error | null;
  onSave: (data: { pattern: string; is_regex: boolean; subcategory_id: number; priority?: number }) => void;
  onCancel: () => void;
}

export function RulePatternEditorModal({
  isOpen, rule, categories, loading = false, error = null, onSave, onCancel,
}: RulePatternEditorModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div className="relative w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute -top-8 right-0 text-text-tertiary hover:text-text-primary transition-colors"
        >
          ✕
        </button>
        <RuleForm
          categories={categories}
          initialValues={rule}
          onSubmit={onSave}
          onCancel={onCancel}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
