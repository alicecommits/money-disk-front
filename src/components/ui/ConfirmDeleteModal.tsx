import { useEffect } from "react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  body?: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
}

const VARIANT_CONFIRM_CLS: Record<"danger" | "warning", string> = {
  danger: "bg-red-600 hover:bg-red-500",
  warning: "bg-amber-600 hover:bg-amber-500",
};

const VARIANT_DEFAULT_LABEL: Record<"danger" | "warning", string> = {
  danger: "Delete",
  warning: "Skip",
};

export function ConfirmDeleteModal({
  isOpen, onConfirm, onCancel, title, description, body, confirmLabel, variant = "danger",
}: ConfirmDeleteModalProps) {
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
        className="relative w-full max-w-md rounded-xl border border-border-default bg-bg-secondary p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-4 top-4 text-text-tertiary hover:text-text-primary transition-colors"
        >
          ✕
        </button>

        <h3 className="pr-6 text-lg font-semibold text-text-primary">{title}</h3>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
        {body && <p className="mt-3 text-xs text-text-tertiary">{body}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border-default px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={"rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors " + VARIANT_CONFIRM_CLS[variant]}
          >
            {confirmLabel ?? VARIANT_DEFAULT_LABEL[variant]}
          </button>
        </div>
      </div>
    </div>
  );
}
