import React from 'react';
import { FormField } from './FormField.jsx';
import { materialSourceParts } from '../lib/materialSources.js';

export function VideoSourceFields({ initial = {}, busy = false }) {
  const sourceUrl = materialSourceParts(initial.sourceCitation).find((part) => part.url)?.url || initial.fileUrl || '';
  return (
    <FormField
      label="Đường dẫn nguồn video"
      name="sourceCitation"
      type="url"
      required
      defaultValue={sourceUrl}
      placeholder="https://www.youtube.com/watch?v=…"
      disabled={busy}
    />
  );
}
