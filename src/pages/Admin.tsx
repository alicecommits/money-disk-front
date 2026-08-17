import { useTransactions, useAssignTransaction } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import { useImport } from "../hooks/useImport";
import { TransactionsTable } from "../components/transactions/TransactionsTable";
import { FileDropzone, PreviewTable, ColumnMapper, ResultsEditor } from "../components/import/ImportWizard";
import { CategoryIconEditor } from "../components/categories/CategoryIconEditor";

const STEP_LABELS = ["Upload", "Map Columns", "Review", "Done"];

export function Admin() {
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] }                          = useCategories();
  const assignTransaction                                  = useAssignTransaction();
  const w                                                  = useImport();

  const unassigned   = transactions.filter((tx) => tx.category == null);
  const currentStep  = ["upload", "mapping", "review", "done"].indexOf(w.step);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Admin</h1>
        <p className="mt-1 text-sm text-text-tertiary">Import CSV files and review unassigned transactions</p>
      </div>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-medium text-text-primary">Import CSV</h2>
          {w.step !== "upload" && (
            <button onClick={w.reset} className="text-sm text-text-tertiary hover:text-text-primary transition-colors">← Start over</button>
          )}
        </div>

        {/* Stepper */}
        <div className="mb-6 flex items-center">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors " +
                  (i < currentStep ? "bg-accent-primary text-white" : i === currentStep ? "border border-accent-primary text-accent-primary bg-accent-primary/10" : "border border-border-default text-text-tertiary bg-bg-tertiary")
                }>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span className={"text-xs font-medium " + (i === currentStep ? "text-text-primary" : "text-text-tertiary")}>{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && <div className={"flex-1 h-px mx-3 " + (i < currentStep ? "bg-accent-primary" : "bg-border-subtle")} />}
            </div>
          ))}
        </div>

        {w.step === "upload" && (
          <FileDropzone onUpload={w.uploadFile} loading={w.previewLoading} error={w.previewError as Error | null} />
        )}

        {w.step === "mapping" && w.preview && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-medium text-text-secondary">CSV Preview</h3>
              <PreviewTable columns={w.preview.columns} rows={w.preview.preview as Record<string, unknown>[]} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-text-secondary">Column Mapping</h3>
              <ColumnMapper columns={w.preview.columns} previewRows={w.preview.preview as Record<string, unknown>[]} onSubmit={w.processMapping} loading={w.processLoading} error={w.processError as Error | null} />
            </div>
          </div>
        )}

        {w.step === "review" && (
          <ResultsEditor rows={w.rows} categories={categories} onUpdateRow={w.updateRow} onRemoveRow={w.removeRow} onConfirm={w.confirmImport} loading={w.confirmLoading} stats={w.processStats} />
        )}

        {w.step === "done" && w.importResult && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="text-5xl">🎉</div>
            <h3 className="text-xl font-semibold text-text-primary">Import complete!</h3>
            <div className="flex gap-6 text-sm">
              <span className="text-green-400">✓ <strong>{w.importResult.imported}</strong> imported</span>
              <span className="text-text-tertiary">{w.importResult.skipped} skipped (duplicates)</span>
            </div>
            <button onClick={w.reset} className="mt-2 rounded-lg border border-border-default px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors">
              Import another file
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-text-primary">Categories</h2>
          <p className="mt-1 text-sm text-text-tertiary">
            Paste an emoji to set a category's icon — your OS emoji picker works here too.
          </p>
        </div>
        <CategoryIconEditor categories={categories} />
      </section>

      {!txLoading && unassigned.length > 0 && (
        <section className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-text-primary">Needs Review</h2>
            <span className="rounded-full bg-yellow-900/30 px-3 py-0.5 text-sm font-medium text-yellow-400">{unassigned.length} unassigned</span>
          </div>
          <TransactionsTable transactions={unassigned} categories={categories} onAssign={assignTransaction} maxRows={100} />
        </section>
      )}

      {!txLoading && unassigned.length === 0 && transactions.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-green-900 bg-green-950/20 p-4">
          <span className="text-green-400">✓</span>
          <p className="text-sm text-green-400">All {transactions.length} transactions are categorised.</p>
        </div>
      )}
    </div>
  );
}
