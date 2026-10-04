import React, { useState } from 'react';
import { SelectField } from './SelectField.jsx';
import { FormField } from './FormField.jsx';
import { materialSourceParts } from '../lib/materialSources.js';

export function VideoSourceFields({ initial = {}, busy = false }) {
  const sourceUrl = materialSourceParts(initial.sourceCitation).find((part) => part.url)?.url || '';
  const [mode, setMode] = useState(sourceUrl || !initial.fileUrl ? 'link' : 'upload');
  return (
    <>
      <SelectField label="Nguồn video" value={mode} disabled={busy} onChange={(event) => setMode(event.target.value)}>
        <option value="link">Đường dẫn video</option>
        <option value="upload">Tải video lên</option>
      </SelectField>
      {mode === 'link' ? (
        <FormField
          label="Đường dẫn nguồn video"
          name="sourceCitation"
          type="url"
          required
          defaultValue={sourceUrl}
          placeholder="https://www.youtube.com/watch?v=…"
          disabled={busy}
        />
      ) : (
        <>
          <FormField bare type="hidden" name="sourceCitation" value="" readOnly />
          {initial.fileUrl && <p className="text-body-sm text-slate-500">Đã có video. Chọn tệp khác để thay thế.</p>}
          <FormField
            label={initial.fileUrl ? 'Tải video khác' : 'Tải video lên'}
            name="file"
            type="file"
            accept="video/*,.mp4,.webm,.mov,.m4v"
            required={!initial.fileUrl}
            disabled={busy}
          />
        </>
      )}
    </>
  );
}
