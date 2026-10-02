import React, { useId, useRef } from 'react';
import { Button } from './Button.jsx';
import { FormDialog } from './FormDialog.jsx';

export function ConfirmDialog({ title, description, confirmLabel = 'Xác nhận', busy = false, onCancel, onConfirm }) {
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
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE2E2] text-primary">
        <span className="material-symbols-outlined">warning</span>
      </span>
      <p id={descriptionId} className="mt-2 text-body-md text-[#64748B]">
        {description}
      </p>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
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
