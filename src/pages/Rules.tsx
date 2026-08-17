import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRules, createRule, updateRule, deleteRule } from "../api/client";
import { useCategories } from "../hooks/useCategories";
import { usePagination } from "../hooks/usePagination";
import { useConfirmDelete } from "../hooks/useConfirmDelete";
import { PaginationControls } from "../components/common/PaginationControls";
import { ConfirmDeleteModal } from "../components/ui/ConfirmDeleteModal";
import { CategoryLabel } from "../components/categories/CategoryIcon";
import { RuleForm } from "../components/rules/RuleForm";
import type { Rule } from "../types";

export function Rules() {
  const queryClient = useQueryClient();
  const rulesQ  = useQuery({ queryKey: ["rules"], queryFn: getRules });
  const catQ    = useCategories();

  const [showAdd, setShowAdd]   = useState(false);
  const [editId, setEditId]     = useState<number | null>(null);
  const [filter, setFilter]     = useState("");

  const createM = useMutation({
    mutationFn: createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      setShowAdd(false);
    },
  });

  const updateM = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateRule>[1] }) =>
      updateRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      setEditId(null);
    },
  });

  const deleteM = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });

  const rules = rulesQ.data ?? [];
  const categoryIconByName = useMemo<Record<string, string | null>>(
    () => Object.fromEntries((catQ.data ?? []).map((c) => [c.name, c.icon])),
    [catQ.data],
  );
  const filtered = filter
    ? rules.filter(
        (r) =>
          r.pattern.toLowerCase().includes(filter.toLowerCase()) ||
          r.category.toLowerCase().includes(filter.toLowerCase()) ||
          r.subcategory.toLowerCase().includes(filter.toLowerCase()),
      )
    : rules;

  const { page, setPage, pageSize, setPageSize, totalPages, pageItems } = usePagination(filtered, {
    initialPageSize: 50,
    resetKey: filter,
  });

  const confirmDelete = useConfirmDelete<Rule>();

  return (
    <div className="px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Pattern Rules</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {rules.length} rules · lower priority number = matched first
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent-gradient)" }}
        >
          + Add Rule
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Filter by pattern, category, subcategory…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
      />

      {/* Add form */}
      {showAdd && (
        <RuleForm
          categories={catQ.data ?? []}
          onSubmit={(data) => createM.mutate(data)}
          onCancel={() => setShowAdd(false)}
          loading={createM.isPending}
          error={createM.error}
        />
      )}

      {/* Rules table */}
      {rulesQ.isLoading ? (
        <div className="text-text-tertiary text-sm">Loading rules…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-secondary">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-tertiary">
                {["Priority", "Pattern", "Regex", "Category", "Subcategory", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((rule) => (
                <>
                  <tr key={rule.id} className="border-b border-border-subtle transition-colors hover:bg-bg-hover">
                    <td className="px-4 py-3 font-mono text-xs text-text-tertiary">{rule.priority}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-primary max-w-[320px] truncate" title={rule.pattern}>
                      {rule.pattern}
                    </td>
                    <td className="px-4 py-3">
                      {rule.is_regex ? (
                        <span className="rounded px-1.5 py-0.5 text-xs bg-blue-900/40 text-blue-400 font-mono">regex</span>
                      ) : (
                        <span className="text-text-tertiary text-xs">literal</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-primary">
                      <CategoryLabel icon={categoryIconByName[rule.category]} name={rule.category} />
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{rule.subcategory}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditId(editId === rule.id ? null : rule.id)}
                          className="rounded px-2 py-1 text-xs border border-border-default text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete.requestDelete(rule)}
                          className="rounded px-2 py-1 text-xs border border-red-900/60 text-red-400 hover:bg-red-950/40 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editId === rule.id && (
                    <tr key={`${rule.id}-edit`} className="bg-bg-tertiary">
                      <td colSpan={6} className="px-4 py-4">
                        <RuleForm
                          categories={catQ.data ?? []}
                          initialValues={rule}
                          onSubmit={(data) => updateM.mutate({ id: rule.id, payload: data })}
                          onCancel={() => setEditId(null)}
                          loading={updateM.isPending}
                          error={updateM.error}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                    No rules found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!rulesQ.isLoading && filtered.length > 0 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <ConfirmDeleteModal
        isOpen={confirmDelete.isOpen}
        variant="danger"
        title="Delete rule?"
        description={
          confirmDelete.target
            ? `You are about to delete: ${confirmDelete.target.pattern} → ${confirmDelete.target.category} / ${confirmDelete.target.subcategory}`
            : ""
        }
        onConfirm={() => confirmDelete.confirm((rule) => deleteM.mutate(rule.id))}
        onCancel={confirmDelete.cancel}
      />
    </div>
  );
}
