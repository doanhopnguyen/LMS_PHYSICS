import React, { useEffect, useRef } from 'react';
import { Button } from './Button.jsx';

export function ConfirmDialog({ title, description, confirmLabel = 'Xác nhận', onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#0F172A]/45 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE2E2] text-primary"><span className="material-symbols-outlined">warning</span></span>
        <h2 id="confirm-dialog-title" className="mt-4 text-headline-md font-bold">{title}</h2>
        <p id="confirm-dialog-description" className="mt-2 text-body-md text-[#64748B]">{description}</p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button ref={cancelButtonRef} type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
          <Button type="button" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  );
}
