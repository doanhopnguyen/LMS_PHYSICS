import React, { useContext } from 'react';
import { Pagination, PaginationContext } from './Pagination.jsx';
import { usePagination } from '../hooks/usePagination.js';

export function DataTable({ columns, rows, renderRow, paginate = true }) {
  const externalPagination = useContext(PaginationContext);
  const identity = JSON.stringify(rows.map((row) => row.id ?? row));
  const pagination = usePagination(rows, [identity]);
  const managed = paginate && !externalPagination;
  const visible = managed ? pagination.pageItems : rows;
  return (
    <>
      <div className="data-table overflow-x-auto rounded-xl border border-[#E2E8F0]">
        <table className="data-table__table w-full text-left text-body-sm">
          <thead className="bg-[#F8FAFC] text-[#64748B]">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <React.Fragment key={row.id ?? index}>
                {renderRow(row, managed ? (pagination.currentPage - 1) * pagination.pageSize + index : index)}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {managed && rows.length > 10 && (
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
