import { LoadingIndicator } from './LoadingIndicator.jsx';
import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient.js';
import { Button } from './Button.jsx';

export function useCloCatalog(subjectIds) {
  const key = [...new Set(subjectIds.filter(Boolean))].sort().join('|');
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: [], loading: Boolean(key), error: '' });
  useEffect(() => {
    let alive = true;
    setState({ data: [], loading: Boolean(key), error: '' });
    if (key)
      Promise.all(key.split('|').map((id) => api.clos.list(id))).then(
        (lists) => alive && setState({ data: lists.flat(), loading: false, error: '' }),
        (error) => alive && setState({ data: [], loading: false, error: error.message })
      );
    return () => {
      alive = false;
    };
  }, [key, version]);
  return { ...state, reload: () => setVersion((value) => value + 1) };
}

export function CloPicker({ resource, value, onChange, disabled = false, subjectId }) {
  const rows = resource.data.filter((row) => row.subjectId === subjectId).sort((a, b) => a.orderIndex - b.orderIndex);
  const missing = value.filter((id) => !rows.some((row) => row.cloId === id));
  return (
    <fieldset className="min-w-0 space-y-3" disabled={disabled || resource.loading}>
      <legend className="mb-2 font-semibold">Chuẩn đầu ra (CLO)</legend>
      {!subjectId ? (
        <p className="text-body-sm text-slate-500">Chọn học phần để xem CLO.</p>
      ) : resource.loading ? (
        <LoadingIndicator inline className="text-body-sm text-slate-500">Đang tải CLO…</LoadingIndicator>
      ) : resource.error ? (
        <div role="alert" className="text-body-sm text-red-700">
          {resource.error}{' '}
          <Button variant="secondary" onClick={resource.reload} disabled={disabled}>
            Thử lại
          </Button>
        </div>
      ) : (
        <>
          {!rows.length && !missing.length && <p className="text-body-sm text-slate-500">Học phần chưa có CLO.</p>}
          <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
            {rows.map((clo) => (
              <label
                key={clo.cloId}
                className="flex min-w-0 items-start gap-3 rounded-xl border border-[#E2E8F0] p-3 text-body-sm"
              >
                <input
                  type="checkbox"
                  aria-label={`Chọn ${clo.cloCode}`}
                  checked={value.includes(clo.cloId)}
                  disabled={disabled || (!clo.isActive && !value.includes(clo.cloId))}
                  className="mt-1 shrink-0 accent-[#E52220]"
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...new Set([...value, clo.cloId])]
                        : value.filter((id) => id !== clo.cloId)
                    )
                  }
                />
                <span className="min-w-0 break-words">
                  <strong>{clo.cloCode}</strong>
                  {!clo.isActive && <span className="ml-2 text-amber-700">Ngừng hoạt động</span>}
                  <span className="mt-1 block text-slate-500">{clo.description}</span>
                </span>
              </label>
            ))}
          </div>
          {missing.map((id) => (
            <label key={id} className="flex items-center gap-3 text-body-sm text-amber-700">
              <input
                type="checkbox"
                checked
                aria-label="Bỏ CLO không còn tồn tại"
                onChange={() => onChange(value.filter((valueId) => valueId !== id))}
              />
              CLO không còn tồn tại — bỏ chọn trước khi lưu.
            </label>
          ))}
        </>
      )}
    </fieldset>
  );
}

export function CloLabels({ ids = [], rows }) {
  if (!ids.length) return <span className="text-slate-500">Chưa gắn CLO</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {ids.map((id) => {
        const clo = rows.find((row) => row.cloId === id);
        return (
          <span
            key={id}
            title={clo?.description}
            className={`rounded-full px-2 py-0.5 text-body-sm ${clo?.isActive ? 'bg-surface-container-low text-primary' : 'bg-slate-100 text-slate-500'}`}
          >
            {clo?.cloCode || 'CLO chưa tải'}
            {clo && !clo.isActive ? ' · ngừng' : ''}
          </span>
        );
      })}
    </div>
  );
}
