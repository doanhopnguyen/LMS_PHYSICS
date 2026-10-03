import React from 'react';
import { labReportSchemas } from '../lib/labReportSchema.js';

const labels = {
  schemaVersion: 'Phiên bản',
  experimentType: 'Thí nghiệm',
  units: 'Đơn vị',
  measurements: 'Bảng số liệu',
  notes: 'Nhận xét',
  trial: 'Lần đo',
  evidenceUrl: 'Liên kết minh chứng',
  ...Object.fromEntries(
    Object.values(labReportSchemas).flatMap((schema) => schema.fields.map((field) => [field.key, field.label]))
  ),
};
const labelOf = (key, units) => `${labels[key] || key}${units?.[key] ? ` (${units[key]})` : ''}`;

function JsonValue({ value, units }) {
  if (value === null) return <span className="text-slate-400">—</span>;
  if (typeof value !== 'object') {
    const text = typeof value === 'boolean' ? (value ? 'Có' : 'Không') : String(value);
    return (
      <span
        className={`whitespace-pre-wrap break-words ${typeof value === 'number' ? 'font-semibold tabular-nums text-primary' : 'text-slate-700'}`}
      >
        {text || '—'}
      </span>
    );
  }
  if (Array.isArray(value)) {
    if (!value.length) return <p className="text-slate-400">Chưa có số liệu.</p>;
    const tabular = value.every(
      (row) =>
        row &&
        !Array.isArray(row) &&
        typeof row === 'object' &&
        Object.values(row).every((cell) => cell === null || typeof cell !== 'object')
    );
    if (tabular) {
      const columns = [...new Set(value.flatMap((row) => Object.keys(row)))];
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                {columns.map((key) => (
                  <th key={key} className="whitespace-nowrap px-4 py-3 font-medium">
                    {labelOf(key, units)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((row, index) => (
                <tr key={index} className="border-t border-slate-200 even:bg-slate-50">
                  {columns.map((key) => (
                    <td key={key} className="px-4 py-3">
                      <JsonValue value={row[key] ?? null} units={units} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {value.map((entry, index) => (
          <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-body-sm font-medium text-slate-500">{index + 1}</p>
            <JsonValue value={entry} units={units} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
      {Object.entries(value).map(([key, entry]) => (
        <div
          key={key}
          className={`min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 ${(entry !== null && typeof entry === 'object') || key === 'notes' ? 'sm:col-span-2' : ''}`}
        >
          <dt className="mb-2 text-body-sm font-medium text-slate-500">{labelOf(key)}</dt>
          <dd className="min-w-0 text-body-sm">
            <JsonValue
              value={key === 'experimentType' ? labReportSchemas[entry]?.title || entry : entry}
              units={value.units || units}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function JsonDataView({ value }) {
  let data = value;
  if (typeof value === 'string') {
    try {
      data = JSON.parse(value);
    } catch {
      return (
        <p className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-body-sm">
          {value}
        </p>
      );
    }
  }
  return <JsonValue value={data} />;
}
