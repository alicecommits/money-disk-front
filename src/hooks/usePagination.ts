import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

interface UsePaginationOptions {
  initialPageSize?: number;
  /** Page resets to 1 whenever this value changes (e.g. a search or filter string). */
  resetKey?: unknown;
}

export function usePagination<T>(items: T[], options?: UsePaginationOptions) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(options?.initialPageSize ?? 50);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.resetKey]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page_ = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((page_ - 1) * pageSize, page_ * pageSize),
    [items, page_, pageSize],
  );

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return {
    page: page_,
    setPage,
    pageSize,
    setPageSize: changePageSize,
    totalPages,
    totalItems,
    pageItems,
  };
}
