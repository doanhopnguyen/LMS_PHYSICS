import React from 'react';
import { Button } from './Button.jsx';
import { FormField } from './FormField.jsx';
import { emptyLabTrial, MIN_LAB_TRIALS, MAX_LAB_TRIALS } from '../lib/labReportSchema.js';

export function LabMeasurementTable({ schema, rows, onChange, errors = {}, disabled = false }) {
  const update = (index, key, value) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <legend className="text-title-md font-semibold">Bảng số liệu · {schema.title}</legend>
      <p className="text-body-sm text-slate-500">Nhập ít nhất {MIN_LAB_TRIALS} lần đo theo đơn vị ghi trên bảng.</p>
      {schema.hint && <p className="text-body-sm text-slate-500">{schema.hint}</p>}
      <div className="relative max-w-full overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-body-sm">
          <caption className="sr-only">Số liệu đo cho bài {schema.title}</caption>
          <thead className="bg-red-50 text-left">
            <tr>
              <th scope="col" className="p-3 whitespace-nowrap">Lần đo</th>
              {schema.fields.map((field) => <th key={field.key} scope="col" className="min-w-40 p-3">{field.label} ({field.unit})</th>)}
              <th scope="col" className="p-3"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-slate-200">
                <th scope="row" className="p-3 align-top">{index + 1}</th>
                {schema.fields.map((field) => (
                  <td key={field.key} className="p-3 align-top">
                    <FormField
                      label={<span className="sr-only">{field.label} ({field.unit}), lần đo {index + 1}</span>}
                      name={`measurement-${index}-${field.key}`}
                      type="number" inputMode={field.integer ? 'numeric' : 'decimal'}
                      required min={field.positive ? 0 : undefined} step={field.integer ? 1 : 'any'}
                      value={row[field.key]} onChange={(event) => update(index, field.key, event.target.value)}
                      error={errors[`${index}.${field.key}`]} disabled={disabled}
                    />
                  </td>
                ))}
                <td className="p-3 align-top">
                  <Button variant="ghost" icon="delete" aria-label={`Xóa lần đo ${index + 1}`}
                    disabled={disabled || rows.length <= MIN_LAB_TRIALS} onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {errors.rows && <p role="alert" className="text-body-sm text-red-700">{errors.rows}</p>}
      <Button variant="secondary" icon="add" disabled={disabled || rows.length >= MAX_LAB_TRIALS}
        onClick={() => onChange([...rows, emptyLabTrial(schema)])}>Thêm lần đo</Button>
    </fieldset>
  );
}
