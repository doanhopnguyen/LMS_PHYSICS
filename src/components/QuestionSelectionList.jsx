import React from 'react';
import { Pagination } from './Pagination.jsx';
import { ActionMenu } from './ActionMenu.jsx';
import { usePagination } from '../hooks/usePagination.js';

export function QuestionSelectionList({ rows, columns, cells, onView, getActions }) {
  const identity = rows.map((row) => row.questionId).join('|');
  const pagination = usePagination(rows, [identity]);
  if (!rows.length) return <p className="py-4 text-body-sm text-slate-500">Chưa có câu hỏi trong đề.</p>;
  return (
    <>
      <ol className="divide-y divide-slate-200">
        {pagination.pageItems.map((row, index) => {
          const values = cells(row);
          const number = (pagination.currentPage - 1) * pagination.pageSize + index + 1;
          return (
            <li key={row.questionId || number} className="flex min-w-0 items-start gap-3 py-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-body-sm font-semibold text-primary">
                {number}
              </span>
              <div className="min-w-0 flex-1">
                <div className="whitespace-pre-wrap break-words text-body-md leading-6 text-slate-800">{values[0]}</div>
                <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-slate-500">
                  {values.slice(1).map((value, valueIndex) => (
                    <div key={columns[valueIndex + 1]} className="flex min-w-0 gap-1">
                      <dt>{columns[valueIndex + 1]}:</dt>
                      <dd className="min-w-0 break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <ActionMenu
                label={`Thao tác câu hỏi ${number}`}
                items={[onView && { label: 'Xem chi tiết', onSelect: () => onView(row) }, ...(getActions?.(row) || [])]}
              />
            </li>
          );
        })}
      </ol>
      {rows.length > 10 && (
        <Pagination
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          totalItems={rows.length}
          onPageChange={pagination.setCurrentPage}
          onPageSizeChange={pagination.setPageSize}
        />
      )}
    </>
  );
}
