import { useState } from "react";
import type { Category } from "../../types";
import { useUpdateCategory } from "../../hooks/useCategories";
import { CategoryIcon } from "./CategoryIcon";

interface RowProps {
  category: Category;
}

function CategoryIconRow({ category }: RowProps) {
  const [value, setValue] = useState(category.icon ?? "");
  const updateM = useUpdateCategory();
  const dirty = value.trim() !== (category.icon ?? "");

  function save() {
    if (!dirty) return;
    updateM.mutate({ id: category.id, name: category.name, icon: value.trim() || null });
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border-subtle bg-bg-tertiary px-4 py-3">
      <CategoryIcon icon={value.trim() || null} size="lg" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{category.name}</p>
        <p className="text-xs text-text-tertiary">
          {category.subcategories.length} subcategor{category.subcategories.length === 1 ? "y" : "ies"}
        </p>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder="Paste emoji…"
        className="w-28 rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-center text-lg text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
      />

      <span className="w-16 flex-none text-right text-xs text-text-tertiary">
        {updateM.isPending ? "Saving…" : dirty ? "Unsaved" : updateM.isSuccess ? "Saved" : ""}
      </span>
    </div>
  );
}

export function CategoryIconEditor({ categories }: { categories: Category[] }) {
  if (!categories.length) {
    return <p className="text-sm text-text-tertiary">No categories yet.</p>;
  }
  return (
    <div className="space-y-2">
      {categories.map((c) => (
        <CategoryIconRow key={c.id} category={c} />
      ))}
    </div>
  );
}
