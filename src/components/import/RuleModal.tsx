import { useEffect } from "react";
import { RuleForm, type RuleFormInitialValues, type RuleFormSubmitData } from "../rules/RuleForm";
import type { Category } from "../../types";

interface RuleModalProps {
  isOpen: boolean;
  /** B1 (row already matched by a rule): false — pattern/regex read-only, two actions.
   *  B2 (unmatched row): true — pattern/regex editable, one action. */
  patternEditable: boolean;
  rule: RuleFormInitialValues;
  categories: Category[];
  /** B1 only — "Currently assigned to: {category} / {subcategory}". */
  currentAssignmentLabel?: string;
  /** B1 only — impact statement when > 0. */
  matchedCount?: number;
  loading?: boolean;
  error?: Error | null;
  /** B1 only. */
  onJustThisOne?: () => void;
  onSave: (data: RuleFormSubmitData) => void;
  onCancel: () => void;
}

export function RuleModal({
  isOpen,
  patternEditable,
  rule,
  categories,
  currentAssignmentLabel,
  matchedCount = 0,
  loading = false,
  error = null,
  onJustThisOne,
  onSave,
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
      <div className="relative w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute -top-8 right-0 text-text-tertiary hover:text-text-primary transition-colors"
        >
          ✕
        </button>

        <h3 className="mb-2 pr-6 text-lg font-semibold text-text-primary">
          {patternEditable ? "Create a rule from this transaction" : (
            <>This row matches rule &ldquo;{rule.pattern}&rdquo;</>
          )}
        </h3>

        <RuleForm
          categories={categories}
          initialValues={rule}
          onSubmit={onSave}
          onCancel={onCancel}
          loading={loading}
          error={error}
          patternDisabled={!patternEditable}
          renderActions={(submit, canSubmit) =>
            patternEditable ? (
              <div className="flex gap-3">
                <button
                  onClick={submit}
                  disabled={loading || !canSubmit}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "var(--accent-gradient)" }}
                >
                  {loading ? "Creating…" : "Create rule + apply to this row"}
                </button>
                <button
                  onClick={onCancel}
                  className="rounded-lg border border-border-default px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentAssignmentLabel && (
                  <p className="italic text-text-secondary text-sm">
                    Currently assigned to: {currentAssignmentLabel}
                  </p>
                )}
                {matchedCount > 0 && (
                  <p className="rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-2 text-xs text-text-secondary">
                    This will update rule &ldquo;{rule.pattern}&rdquo; and reassign {matchedCount} past
                    transaction{matchedCount === 1 ? "" : "s"}.
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={submit}
                    disabled={loading || !canSubmit}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: "var(--accent-gradient)" }}
                  >
                    {loading ? "Updating…" : "This one + all past matches"}
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
            )
          }
        />
      </div>
    </div>
  );
}
