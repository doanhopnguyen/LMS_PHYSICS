import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { apiRequest } from '../../lib/apiClient.js';
import { loadAllPages } from '../../lib/lecturerUtils.js';

export const param = (name) => new URLSearchParams(window.location.search).get(name) || '';
export const matches = (query, ...values) =>
  values.join(' ').toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'));
export function useCollection(path) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: [], loading: Boolean(path), error: '' });
  useEffect(() => {
    let alive = true;
    setState({ data: [], loading: Boolean(path), error: '' });
    if (path)
      loadAllPages(apiRequest, path).then(
        (data) => alive && setState({ data, loading: false, error: '' }),
        (error) => alive && setState({ data: [], loading: false, error: error.message })
      );
    return () => {
      alive = false;
    };
  }, [path, version]);
  return { ...state, reload: () => setVersion((v) => v + 1) };
}
export function ResourceState({ resource, children }) {
  if (resource.loading)
    return (
      <p role="status" className="py-8 text-center text-slate-500">
        Đang tải…
      </p>
    );
  if (resource.error)
    return (
      <div role="alert" className="py-6 text-red-700">
        {resource.error}{' '}
        <Button variant="secondary" onClick={resource.reload}>
          Thử lại
        </Button>
      </div>
    );
  return children;
}
export function SearchToolbar({ search, onSearch, children }) {
  return (
    <Card className="sticky top-20 z-10 mb-5 flex flex-wrap items-end gap-4 rounded-2xl p-4 shadow-sm">
      <FormField
        label="Tìm kiếm"
        type="search"
        placeholder="Tìm theo tên hoặc mã…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        wrapperClassName="min-w-0 flex-1 basis-64"
      />
      {children}
    </Card>
  );
}
export function PagedCards({ rows, render, resetKey = '', grid = true, compactPagination = false }) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  useEffect(() => setPage(1), [resetKey]);
  const safePage = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
  return (
    <>
      {!rows.length && <Card className="p-8 text-center text-slate-500">Không có dữ liệu phù hợp.</Card>}
      <div className={grid ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
        {rows.slice((safePage - 1) * size, safePage * size).map(render)}
      </div>
      <Pagination
        currentPage={safePage}
        pageSize={size}
        totalItems={rows.length}
        onPageChange={setPage}
        onPageSizeChange={
          compactPagination
            ? undefined
            : (value) => {
                setSize(value);
                setPage(1);
              }
        }
      />
    </>
  );
}
