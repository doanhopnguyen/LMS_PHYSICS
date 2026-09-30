import React, { useEffect, useId, useRef } from 'react';
import { Button } from './Button.jsx';
export function FormDialog({ title, onClose, busy, wide = false, children }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    return () => previous?.focus?.();
  }, []);
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-transparent p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`form-dialog flex h-[min(760px,calc(100dvh-32px))] w-full flex-col overflow-hidden rounded-2xl border-2 border-primary bg-white shadow-xl ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !busy) onClose();
          if (e.key === 'Tab') {
            const nodes = [
              ...ref.current.querySelectorAll(
                'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]'
              ),
            ];
            const first = nodes[0],
              last = nodes.at(-1);
            if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#FECACA] px-6 py-4">
          <h2 id={titleId} className="text-headline-sm font-medium">
            {title}
          </h2>
          <button type="button" aria-label="Đóng" disabled={busy} onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-[#FEF2F2] disabled:opacity-60"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </section>
    </div>
  );
}
