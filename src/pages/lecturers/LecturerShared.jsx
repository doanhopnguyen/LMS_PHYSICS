import React, { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../../lib/apiClient.js';
import { itemsOf, loadAllPages, displayName, labelOf, safeUrl } from '../../lib/lecturerUtils.js';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
export { FormDialog as Modal } from '../../components/FormDialog.jsx';
export { FormField as Field } from '../../components/FormField.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
export { Button, Card, SelectField, itemsOf, displayName, labelOf };
export { Tabs } from '../../components/Tabs.jsx';
export { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
export const idPath = (value) => encodeURIComponent(value);
export const routeParam = (key) => new URLSearchParams(window.location.search).get(key) || '';
export function useQueryState(key) {
  const [value, setValue] = useState(() => routeParam(key));
  return [
    value,
    (next) => {
      setValue(next);
      const url = new URL(window.location.href);
      if (next) url.searchParams.set(key, next);
      else url.searchParams.delete(key);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    },
  ];
}
export const dateText = (value) =>
  value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('vi-VN') : '—';
export function useResource(path, all = false) {
  const [version, refresh] = useState(0);
  const key = `${path}|${all}|${version}`;
  const [state, setState] = useState({ key: '', data: null, loading: false, error: '' });
  useEffect(() => {
    let live = true;
    setState({ key, data: null, loading: Boolean(path), error: '' });
    if (path)
      (all ? loadAllPages(apiRequest, path) : apiRequest(path)).then(
        (data) => live && setState({ key, data, loading: false, error: '' }),
        (error) => live && setState({ key, data: null, loading: false, error: error.message })
      );
    return () => {
      live = false;
    };
  }, [key, path, all]);
  return {
    ...(state.key === key ? state : { data: null, loading: Boolean(path), error: '' }),
    enabled: Boolean(path),
    reload: () => refresh((v) => v + 1),
  };
}
export function Resource({ value, children, empty = 'Chọn bộ lọc để xem dữ liệu.' }) {
  if (!value.enabled) return <Card className="mt-4 p-5">{empty}</Card>;
  if (value.loading)
    return (
      <p className="p-5" role="status">
        Đang tải dữ liệu…
      </p>
    );
  if (value.error)
    return (
      <div className="my-4 rounded-xl border border-red-200 p-4" role="alert">
        {value.error}{' '}
        <Button variant="secondary" onClick={value.reload}>
          Thử lại
        </Button>
      </div>
    );
  return children(value.data);
}
export function Lookup({ resource, label, idKey, value, onChange, placeholder = 'Chọn', required = false, ...props }) {
  const rows = itemsOf(resource.data);
  return (
    <div className="lookup-field">
      <SelectField
        label={label}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        disabled={resource.loading || Boolean(resource.error) || !rows.length}
        {...props}
      >
        <option value="">
          {resource.loading
            ? 'Đang tải…'
            : resource.error
              ? 'Không tải được danh sách'
              : !rows.length
                ? 'Chưa có dữ liệu'
                : placeholder}
        </option>
        {rows.map((row) => (
          <option key={row[idKey]} value={row[idKey]}>
            {idKey === 'subjectId' && row.subjectCode ? `${row.subjectCode} · ` : ''}
            {displayName(row)}
            {idKey === 'semesterId' && row.academicYear ? ` · ${row.academicYear}` : ''}
          </option>
        ))}
      </SelectField>
      {resource.error && (
        <Button variant="secondary" onClick={resource.reload}>
          Thử lại {label.toLowerCase()}
        </Button>
      )}
    </div>
  );
}
export function Table({ columns, rows, cells, server = false, asCards = false }) {
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
                className="flex min-h-56 flex-col p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEE2E2] text-primary">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div className="mt-4 space-y-2">
                  {dataValues.map((value, valueIndex) => (
                    <div key={columns[valueIndex]}>
                      <p className="text-label-sm text-[#64748B]">{columns[valueIndex]}</p>
                      <div className={valueIndex === 0 ? 'font-bold' : 'text-body-sm'}>{value ?? '—'}</div>
                    </div>
                  ))}
                </div>
                {action && <div className="mt-auto flex justify-end pt-4">{action}</div>}
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
    <Card className="mt-4 overflow-auto p-4">
      {rows.length ? (
        <DataTable
          columns={columns}
          rows={rows}
          paginate={!server}
          renderRow={(row, i) => (
            <tr className="border-t" key={i}>
              {cells(row).map((cell, index) => (
                <td className="p-3 align-top" key={index}>
                  {cell ?? '—'}
                </td>
              ))}
            </tr>
          )}
        />
      ) : (
        <p>Chưa có dữ liệu phù hợp.</p>
      )}
    </Card>
  );
}
export function Pager({ data, page, onChange }) {
  return (
    <Pagination
      currentPage={page + 1}
      pageSize={data?.size || 20}
      totalItems={data?.totalElements ?? itemsOf(data).length}
      onPageChange={(value) => onChange(value - 1)}
    />
  );
}
export function FileLink({ url, children = 'Mở tài liệu' }) {
  const href = safeUrl(url);
  return href ? (
    <a className="font-semibold text-primary underline" target="_blank" rel="noreferrer" href={href}>
      {children}
    </a>
  ) : (
    <span>Chưa có liên kết hợp lệ</span>
  );
}
export function Gap({ children }) {
  return (
    <Card className="my-4 border-amber-200 p-4">
      <p className="mt-1 text-body-sm text-[#64748B]">{children}</p>
    </Card>
  );
}
export function useMutation() {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const run = async (operation, success = 'Đã lưu thay đổi.') => {
    if (lock.current) return { ok: false };
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await operation();
      setNotice(success);
      return { ok: true, data };
    } catch (e) {
      setError(e.message || 'Không thể thực hiện thao tác.');
      return { ok: false };
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const confirm = (title, operation, done) => {
    setError('');
    setConfirmation({ title, operation, done });
  };
  const feedback = (
    <>
      <AuthAlert>{notice}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      {confirmation && (
        <ConfirmDialog
          title={confirmation.title}
          description="Thay đổi sẽ được áp dụng trực tiếp vào dữ liệu của hệ thống."
          busy={busy}
          onCancel={() => !busy && setConfirmation(null)}
          onConfirm={async () => {
            const result = await run(confirmation.operation);
            if (result.ok) {
              confirmation.done?.(result.data);
              setConfirmation(null);
            }
          }}
        />
      )}
    </>
  );
  return {
    run,
    confirm,
    feedback,
    busy,
    error,
    setError,
    setNotice,
    clear: () => {
      setError('');
      setNotice('');
    },
  };
}
