import { useEffect, useMemo, useState } from 'react';

export function usePagination(items, resetKeys = [], initialPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => setCurrentPage(1), resetKeys);
  useEffect(() => setCurrentPage((page) => Math.min(Math.max(1, page), totalPages)), [totalPages]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [safePage, items, pageSize]);
  const setPageSize = (size) => {
    setPageSizeState(size);
    setCurrentPage(1);
  };

  return { currentPage: safePage, pageSize, pageItems, setCurrentPage, setPageSize, totalPages };
}
