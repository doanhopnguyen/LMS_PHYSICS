import React from 'react';

export function DataTable({ columns, rows, renderRow }) {
  return <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]"><table className="w-full text-left text-body-sm"><thead className="bg-[#F8FAFC] text-[#64748B]"><tr>{columns.map((column) => <th key={column} className="px-3 py-2.5 font-semibold whitespace-nowrap">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <React.Fragment key={row.id ?? index}>{renderRow(row, index)}</React.Fragment>)}</tbody></table></div>;
}
