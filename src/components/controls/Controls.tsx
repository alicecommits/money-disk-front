import type { PeriodFilter, AverageMode, Scale } from "../../types";
import { PERIOD_FILTERS, AVERAGE_MODES, SCALE_OPTIONS } from "../../types";

// ── Shared primitives ─────────────────────────────────────────────────────────

const selectCls =
  "rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm " +
  "text-text-primary focus:border-accent-primary focus:outline-none " +
  "focus:ring-2 focus:ring-accent-primary/20 transition-colors";

// ── PeriodFilter ──────────────────────────────────────────────────────────────

interface PeriodFilterProps {
  value: PeriodFilter;
  onChange: (v: PeriodFilter) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        Period
      </label>
      <select
        className={selectCls}
        value={value}
        onChange={(e) => onChange(e.target.value as PeriodFilter)}
      >
        {PERIOD_FILTERS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── ScaleRadio ────────────────────────────────────────────────────────────────

interface ScaleRadioProps {
  value: Scale;
  onChange: (v: Scale) => void;
}

export function ScaleRadio({ value, onChange }: ScaleRadioProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        Aggregate by
      </label>
      <div className="flex rounded-lg border border-border-default bg-bg-tertiary overflow-hidden">
        {SCALE_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={
              "flex-1 px-3 py-2 text-sm font-medium transition-colors " +
              (value === s
                ? "bg-accent-primary text-white"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary")
            }
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── AverageSelect ─────────────────────────────────────────────────────────────

interface AverageSelectProps {
  value: AverageMode;
  onChange: (v: AverageMode) => void;
}

export function AverageSelect({ value, onChange }: AverageSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        Average
      </label>
      <select
        className={selectCls}
        value={value}
        onChange={(e) => onChange(e.target.value as AverageMode)}
      >
        {AVERAGE_MODES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── CompensateToggle ──────────────────────────────────────────────────────────

interface CompensateToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function CompensateToggle({ value, onChange }: CompensateToggleProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        Refunds
      </label>
      <button
        onClick={() => onChange(!value)}
        className={
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium " +
          "transition-colors " +
          (value
            ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
            : "border-border-default bg-bg-tertiary text-text-secondary hover:bg-bg-hover")
        }
      >
        <span
          className={
            "relative inline-flex h-4 w-7 flex-shrink-0 rounded-full transition-colors " +
            (value ? "bg-accent-primary" : "bg-border-default")
          }
        >
          <span
            className={
              "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform " +
              (value ? "translate-x-3.5" : "translate-x-0.5")
            }
          />
        </span>
        Compensate
      </button>
    </div>
  );
}

// ── ShowInternalToggle ────────────────────────────────────────────────────────

interface ShowInternalToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function ShowInternalToggle({
  value,
  onChange,
  disabled = false,
  disabledReason,
}: ShowInternalToggleProps) {
  return (
    <div className="flex flex-col gap-1 w-[220px]">
      <label className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        Transfers
      </label>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className={
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium " +
          "transition-colors " +
          (disabled
            ? "cursor-help border-border-subtle bg-bg-tertiary/50 text-text-tertiary"
            : value
              ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
              : "border-border-default bg-bg-tertiary text-text-secondary hover:bg-bg-hover")
        }
      >
        <span
          className={
            "relative inline-flex h-4 w-7 flex-shrink-0 rounded-full transition-colors " +
            (value && !disabled ? "bg-accent-primary" : "bg-border-default")
          }
        >
          <span
            className={
              "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform " +
              (value && !disabled ? "translate-x-3.5" : "translate-x-0.5")
            }
          />
        </span>
        {disabled ? "Internal off (hover FYI)" : "Show internal transfers"}
      </button>
    </div>
  );
}
