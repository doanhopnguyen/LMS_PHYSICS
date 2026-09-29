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
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#0F172A]/45 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`form-dialog max-h-[calc(100dvh-32px)] w-full ${wide ? 'max-w-6xl' : 'max-w-2xl'} overflow-auto rounded-2xl bg-white p-6 shadow-xl`}
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
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-headline-sm font-medium">
            {title}
          </h2>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Đóng
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
