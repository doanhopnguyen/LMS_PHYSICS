import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const API_ERROR_EVENT = 'ptit-api-error';

export function ApiErrorToasts() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onError = (event) => {
      const message = String(event.detail?.message || 'Yêu cầu không thể hoàn tất.');
      const id = `${Date.now()}-${Math.random()}`;
      const detail = event.detail || {};
      setItems((current) =>
        [
          ...current,
          {
            id,
            message,
            status: detail.status,
            method: detail.method,
            path: detail.path,
            statusText: detail.statusText,
            details: detail.details,
          },
        ].slice(-3)
      );
      window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 2000);
    };
    window.addEventListener(API_ERROR_EVENT, onError);
    return () => window.removeEventListener(API_ERROR_EVENT, onError);
  }, []);

  if (!items.length) return null;
  return createPortal(
    <div className="api-toast-stack" aria-live="assertive" aria-relevant="additions">
      {items.map((item) => (
        <div key={item.id} className="form-alert form-alert--error api-toast" role="alert">
          <span className="material-symbols-outlined" aria-hidden="true">
            error
          </span>
          <span>
            <strong>{item.message}</strong>
            {(item.status || item.path || item.details) && (
              <details className="api-toast__details">
                <summary>Chi tiết kỹ thuật</summary>
                <code>
                  {[
                    item.status && `HTTP ${item.status}${item.statusText ? ` ${item.statusText}` : ''}`,
                    item.method && item.path && `${item.method} ${item.path}`,
                    item.details,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </code>
              </details>
            )}
          </span>
          <button
            type="button"
            onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
            aria-label="Đóng thông báo lỗi"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
