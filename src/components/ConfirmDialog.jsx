import React, { useId, useRef } from 'react';
import { Button } from './Button.jsx';
import { FormDialog } from './FormDialog.jsx';

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Xác nhận',
  busy = false,
  onCancel,
  onConfirm,
  error,
}) {
  const cancelButtonRef = useRef(null);

  const descriptionId = useId();

  return (
    <FormDialog
      title={title}
      onClose={onCancel}
      busy={busy}
      compact
      dialogRole="alertdialog"
      describedBy={descriptionId}
      initialFocusRef={cancelButtonRef}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-primary">
          <span className="material-symbols-outlined text-xl">warning</span>
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <p id={descriptionId} className="text-body-md text-[#475569]">
            {description}
          </p>
          {error && (
            <p role="alert" className="mt-2 text-body-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
        <Button ref={cancelButtonRef} type="button" variant="secondary" disabled={busy} onClick={onCancel}>
          Hủy
        </Button>
        <Button type="button" disabled={busy} onClick={onConfirm}>
          {busy ? 'Đang xử lý…' : confirmLabel}
        </Button>
      </div>
    </FormDialog>
  );
}
