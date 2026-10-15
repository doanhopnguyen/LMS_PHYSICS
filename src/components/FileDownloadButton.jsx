import React, { useRef, useState } from 'react';
import { api } from '../lib/apiClient.js';

export function FileDownloadButton({
  file,
  children = 'Tải tài liệu',
  className = 'font-semibold text-primary underline',
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  return (
    <span>
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={async () => {
          if (lock.current) return;
          lock.current = true;
          setBusy(true);
          setError('');
          try {
            await api.files.download(file);
          } catch (failure) {
            setError(failure.message || 'Không thể tải tệp.');
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      >
        {busy ? 'Đang tải…' : children}
      </button>
      {error && (
        <span role="alert" className="mt-1 block text-body-sm text-primary">
          {error}
        </span>
      )}
    </span>
  );
}
