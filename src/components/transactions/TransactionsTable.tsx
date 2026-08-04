import { useState } from "react";
import type { Transaction, Category } from "../../types";

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onAssign: (id: number, subcategoryId: number) => void;
  maxRows?: number;
}

export function TransactionsTable({ transactions, categories, onAssign, maxRows = 50 }: Props) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const visible = transactions.slice(0, maxRows);

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-tertiary">
            {["Date", "Label", "Debit", "Credit", "Category", "Subcategory", "Method"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-secondary whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((tx) => {
            const cat = categories.find((c) => c.name === tx.category);
            const isExpanded = expandedRow === tx.id;
            return (
              <tr
                key={tx.id}
                className={"border-b border-border-subtle transition-colors cursor-pointer " + (isExpanded ? "bg-bg-tertiary" : "hover:bg-bg-hover")}
                onClick={() => setExpandedRow(isExpanded ? null : tx.id)}
              >
                <td className="px-4 py-2 font-mono text-xs text-text-secondary whitespace-nowrap">
                  {tx.date_operation.slice(0, 10)}
                </td>
                <td className="px-4 py-2 text-text-primary max-w-xs truncate" title={tx.label}>
                  {tx.label}
                </td>
                <td className="px-4 py-2 text-right font-mono text-red-400">
                  {tx.debit != null ? `€${tx.debit.toFixed(2)}` : ""}
                </td>
                <td className="px-4 py-2 text-right font-mono text-green-400">
                  {tx.credit != null ? `€${tx.credit.toFixed(2)}` : ""}
                </td>
                <td className="px-4 py-2">
                  {isExpanded ? (
                    <select
                      className="rounded border border-border-default bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
                      value={tx.category ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const c = categories.find((c) => c.name === e.target.value);
                        if (c?.subcategories[0]) onAssign(tx.id, c.subcategories[0].id);
                      }}
                    >
                      <option value="">— unassigned —</option>
                      {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  ) : (
                    <span className={tx.category ? "text-text-primary" : "text-text-tertiary italic"}>
                      {tx.category ?? "unassigned"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {isExpanded && cat ? (
                    <select
                      className="rounded border border-border-default bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
                      value={tx.subcategory_id ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onAssign(tx.id, Number(e.target.value))}
                    >
                      {cat.subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-text-secondary text-xs">{tx.subcategory ?? "—"}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {tx.assignment_method ? (
                    <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + (tx.assignment_method === "rule" ? "bg-accent-primary/10 text-accent-primary" : "bg-green-900/30 text-green-400")}>
                      {tx.assignment_method}
                    </span>
                  ) : (
                    <span className="rounded-full px-2 py-0.5 text-xs bg-yellow-900/30 text-yellow-400">unassigned</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {transactions.length > maxRows && (
        <p className="px-4 py-3 text-sm text-text-tertiary border-t border-border-subtle">
          Showing {maxRows} of {transactions.length} transactions
        </p>
      )}
    </div>
  );
}
