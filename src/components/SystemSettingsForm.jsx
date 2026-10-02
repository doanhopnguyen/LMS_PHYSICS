import React, { useEffect, useMemo, useState } from 'react';
import { Card } from './Card.jsx';
import { Form, SubmitButton } from './Form.jsx';
import { FormField } from './FormField.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import { basicSettings, settingsPayload } from '../lib/basicSettings.js';

export function SystemSettingsForm({ rows, busy, onSave }) {
  const fields = useMemo(() => basicSettings(rows), [rows]);
  const [values, setValues] = useState({});
  useEffect(() => {
    setValues(Object.fromEntries(fields.map(({ key, value }) => [key, value])));
  }, [fields]);
  return (
    <Card className="mt-5 p-5">
      <SectionHeader title="Cấu hình cơ bản" />
      {fields.length ? (
        <Form
          className="mt-5 app-form--two-columns"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) onSave(settingsPayload(fields, values));
          }}
        >
          {fields.map(({ key, label, min, max, step }) => (
            <FormField
              key={key}
              label={label}
              name={key}
              type="number"
              min={min}
              max={max}
              step={step}
              value={values[key] ?? ''}
              required
              disabled={busy}
              onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
            />
          ))}
          <div className="flex justify-end md:col-span-2">
            <SubmitButton busy={busy} disabled={busy}>
              Lưu cấu hình
            </SubmitButton>
          </div>
        </Form>
      ) : (
        <p className="mt-4 text-body-sm text-slate-500">Chưa có cấu hình cơ bản.</p>
      )}
    </Card>
  );
}
