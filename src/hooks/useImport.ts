import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importPreview, importProcess, importConfirm } from "../api/client";
import type {
  ImportStep,
  ColumnMapping,
  ProcessedTransaction,
  ImportResult,
} from "../types";
import { TRANSACTIONS_KEY } from "./useTransactions";

interface PreviewData {
  columns: string[];
  preview: Record<string, unknown>[];
  filename: string;
}

export function useImport() {
  const queryClient = useQueryClient();

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [step, setStep]               = useState<ImportStep>("upload");
  const [file, setFile]               = useState<File | null>(null);
  const [separator, setSeparator]     = useState(",");
  const [preview, setPreview]         = useState<PreviewData | null>(null);
  const [mapping, setMapping]         = useState<ColumnMapping | null>(null);
  const [rows, setRows]               = useState<ProcessedTransaction[]>([]);
  const [processStats, setStats]      = useState<{ total: number; matched: number; unmatched: number } | null>(null);
  const [importResult, setResult]     = useState<ImportResult | null>(null);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const previewMutation = useMutation({
    mutationFn: ({ f, sep }: { f: File; sep: string }) => importPreview(f, sep),
    onSuccess: (data) => {
      setPreview(data);
      setStep("mapping");
    },
  });

  const processMutation = useMutation({
    mutationFn: ({ f, m }: { f: File; m: ColumnMapping }) =>
      importProcess(f, { ...m }),
    onSuccess: (data) => {
      setRows(data.rows);
      setStats(data.stats);
      setStep("review");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: ({ r, name }: { r: ProcessedTransaction[]; name: string }) =>
      importConfirm(r, name),
    onSuccess: async (data) => {
      setResult(data);
      setStep("done");
      // Invalidate transaction cache so dashboard reloads
      await queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  function uploadFile(f: File, sep = ",") {
    setFile(f);
    setSeparator(sep);
    previewMutation.mutate({ f, sep });
  }

  function processMapping(m: ColumnMapping) {
    if (!file) return;
    setMapping(m);
    processMutation.mutate({ f: file, m });
  }

  function updateRow(index: number, updated: Partial<ProcessedTransaction>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...updated } : r)));
  }

  function confirmImport() {
    const name = file?.name ?? "unknown.csv";
    confirmMutation.mutate({ r: rows, name });
  }

  function reset() {
    setStep("upload");
    setFile(null);
    setSeparator(",");
    setPreview(null);
    setMapping(null);
    setRows([]);
    setStats(null);
    setResult(null);
    previewMutation.reset();
    processMutation.reset();
    confirmMutation.reset();
  }

  return {
    // State
    step, file, separator, preview, mapping, rows, processStats, importResult,
    // Actions
    uploadFile, processMapping, updateRow, confirmImport, reset,
    // Loading/error
    previewLoading:  previewMutation.isPending,
    processLoading:  processMutation.isPending,
    confirmLoading:  confirmMutation.isPending,
    previewError:    previewMutation.error,
    processError:    processMutation.error,
    confirmError:    confirmMutation.error,
  };
}
