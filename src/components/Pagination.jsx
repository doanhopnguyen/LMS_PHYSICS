import React from 'react';
import { usePagination } from '../hooks/usePagination.js';

function pageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const values = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sorted = [...values].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) result.push(`ellipsis-${page}`);
    result.push(page);
  });
  return result;
}

export function Pagination({ currentPage, pageSize, totalItems, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const first = totalItems ? (safePage - 1) * pageSize + 1 : 0;
  const last = Math.min(safePage * pageSize, totalItems);
  if (totalItems <= pageSize && !onPageSizeChange) return null;

  return (
    <nav className="mt-4 flex flex-col gap-3 border-t border-[#E2E8F0] pt-4 lg:flex-row lg:items-center lg:justify-between" aria-label="Phân trang">
      <div className="flex flex-wrap items-center gap-3 text-body-sm text-[#64748B]">
        <span>Hiển thị {first}–{last} trong {totalItems}</span>
        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            Số dòng/trang
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-9 border border-[#CBD5E1] bg-white px-3"
            >
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button type="button" aria-label="Trang trước" disabled={safePage === 1} onClick={() => onPageChange(safePage - 1)} className="h-9 rounded-full border border-[#CBD5E1] px-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
          <span className="hidden sm:inline">Trước</span><span className="material-symbols-outlined sm:hidden">chevron_left</span>
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {pageNumbers(safePage, totalPages).map((page) =>
            typeof page === 'string' ? <span key={page} className="px-1 text-[#94A3B8]">…</span> : (
              <button key={page} type="button" aria-label={`Trang ${page}`} aria-current={page === safePage ? 'page' : undefined} onClick={() => onPageChange(page)} className={`h-9 min-w-9 rounded-full px-2 text-body-sm font-semibold ${page === safePage ? 'bg-primary text-white' : 'border border-[#CBD5E1] bg-white text-[#475569]'}`}>{page}</button>
            )
          )}
        </div>
        <span className="text-body-sm font-semibold sm:hidden">Trang {safePage} / {totalPages}</span>
        <button type="button" aria-label="Trang sau" disabled={safePage === totalPages} onClick={() => onPageChange(safePage + 1)} className="h-9 rounded-full border border-[#CBD5E1] px-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
          <span className="hidden sm:inline">Sau</span><span className="material-symbols-outlined sm:hidden">chevron_right</span>
        </button>
      </div>
    </nav>
  );
}

export function PaginatedCollection({ items, resetKeys = [], pageSize = 10, children }) {
  const pagination = usePagination(items, resetKeys, pageSize);
  return (
    <>
      {children(pagination.pageItems)}
      <Pagination currentPage={pagination.currentPage} pageSize={pagination.pageSize} totalItems={items.length} onPageChange={pagination.setCurrentPage} onPageSizeChange={pagination.setPageSize} />
    </>
  );
}
