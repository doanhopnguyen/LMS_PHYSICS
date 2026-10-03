import React, { useContext } from 'react';
import { Card } from './Card.jsx';
import { Pagination, PaginationContext } from './Pagination.jsx';
import { usePagination } from '../hooks/usePagination.js';

export function DataTable({
  columns = [],
  rows,
  renderRow,
  asCards = false,
  cells,
  paginate = true,
  tableClassName = '',
  headerRows,
  caption,
  footer,
}) {
  const externalPagination = useContext(PaginationContext);
  const identity = JSON.stringify(rows.map((row) => row.id ?? row));
  const pagination = usePagination(rows, [identity]);
  const managed = paginate && !externalPagination;
  const visible = managed ? pagination.pageItems : rows;
  if (asCards) {
    return (
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.length ? (
          rows.map((row, index) => {
            const values = cells(row);
            const action = React.isValidElement(values.at(-1)) ? values.at(-1) : null;
            const dataValues = action ? values.slice(0, -1) : values;
            return (
              <Card
                as="article"
                variant="accent"
                key={row.id || row.materialId || row.questionId || index}
                className="flex min-w-0 flex-col p-4"
              >
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {dataValues.map((value, valueIndex) => (
                    <div
                      key={columns[valueIndex]}
                      className={`min-w-0 break-words ${valueIndex === 0 ? 'col-span-2' : ''}`}
                    >
                      <dt className="text-label-sm text-[#64748B]">{columns[valueIndex]}</dt>
                      <dd className={valueIndex === 0 ? 'mt-1 font-semibold leading-6' : 'mt-1 text-body-sm'}>{value ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
                {action && <div className="mt-auto flex justify-end pt-3">{action}</div>}
              </Card>
            );
          })
        ) : (
          <Card className="p-5 text-[#64748B]">Chưa có dữ liệu phù hợp.</Card>
        )}
      </div>
    );
  }
  return (
    <>
      <div className="data-table overflow-x-auto rounded-xl">
        <table className={`data-table__table w-full text-left text-body-sm ${tableClassName}`}>
          {caption}
          <thead>
            {headerRows || (
              <tr>
                {columns.map((column, index) => (
                  <th key={index} scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                    {column}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <React.Fragment key={row.id ?? index}>
                {renderRow(row, managed ? (pagination.currentPage - 1) * pagination.pageSize + index : index)}
              </React.Fragment>
            ))}
          </tbody>
          {footer}
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
