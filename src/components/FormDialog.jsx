import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button.jsx';
export function FormDialog({
  title,
  onClose,
  busy,
  wide = false,
  reader = false,
  compact = false,
  expandable = false,
  children,
  dialogRole = 'dialog',
  describedBy,
  initialFocusRef,
  contentClassName = '',
}) {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const titleId = useId();
  useEffect(() => {
    if (!expanded) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [expanded]);
  useEffect(() => {
    const previous = document.activeElement;
    (initialFocusRef?.current || ref.current)?.focus();
    return () => previous?.focus?.();
  }, []);
  const dialog = (
    <div
      className={`fixed inset-0 ${dialogRole === 'alertdialog' ? 'z-[1200]' : 'z-[1100]'} flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] transition-all ${expanded ? 'p-0' : reader ? 'p-2 sm:p-3' : 'p-4'}`}
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role={dialogRole}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        className={`form-dialog flex w-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl ${expanded ? 'h-[100dvh] max-h-[100dvh] max-w-none' : reader ? 'h-[calc(100dvh-16px)] max-h-[calc(100dvh-16px)] max-w-[1600px] sm:h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-24px)]' : `max-h-[calc(100dvh-32px)] ${compact ? 'max-w-md' : wide ? 'max-w-5xl' : 'max-w-2xl'}`}`}
        onKeyDown={(e) => {
          // Events from a nested portal belong to its own dialog and focus trap.
          if (!ref.current.contains(e.target)) return;
          if (e.key === 'Escape' && !busy) onClose();
          if (e.key === 'Tab') {
            const nodes = [
              ...ref.current.querySelectorAll(
                'button:not(:disabled):not([tabindex="-1"]),input:not(:disabled):not([tabindex="-1"]),select:not(:disabled):not([tabindex="-1"]),textarea:not(:disabled),a[href]'
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
        <div
          className={`flex shrink-0 items-center justify-between gap-3 border-b border-[#E2E8F0] ${reader ? 'px-3 py-1' : 'px-4 py-4 sm:px-6'}`}
        >
          <h2
            id={titleId}
            className={`min-w-0 font-medium ${reader ? 'truncate text-body-sm' : 'break-words text-headline-sm'}`}
          >
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            {expandable && (
              <Button
                variant="ghost"
                className="w-9 px-0"
                aria-label={expanded ? 'Thu nhỏ' : 'Mở rộng toàn màn hình'}
                title={expanded ? 'Thu nhỏ' : 'Mở rộng toàn màn hình'}
                aria-pressed={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {expanded ? 'fullscreen_exit' : 'fullscreen'}
                </span>
              </Button>
            )}
            <button
              type="button"
              aria-label="Đóng"
              disabled={busy}
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-primary hover:bg-[#FEF2F2] transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div
          className={`min-h-0 min-w-0 flex-1 ${reader ? 'flex flex-col overflow-hidden' : `overflow-y-auto overscroll-contain ${contentClassName || 'p-4 sm:p-6'}`}`}
        >
          {children}
        </div>
      </section>
    </div>
  );
  return typeof document === 'undefined' ? dialog : createPortal(dialog, document.body);
}
