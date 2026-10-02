import { FormDialog as SharedFormDialog } from './FormDialog.jsx';
import React from 'react';
import { Button } from './Button.jsx';

export function PasswordResetDialog({ student, onCancel, onConfirm }) {
  if (!student) return null;
  return (
    <SharedFormDialog title={<>Reset mật khẩu sinh viên</>} onClose={onCancel} dialogRole="alertdialog" compact>
      <p className="text-label-md font-bold text-primary">QUẢN LÝ SINH VIÊN</p>

      <dl className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-[#F8FAFC] p-4 sm:grid-cols-2">
        <div>
          <dt className="text-body-sm text-[#64748B]">Sinh viên</dt>
          <dd className="mt-1 font-semibold">{student.name}</dd>
        </div>
        <div>
          <dt className="text-body-sm text-[#64748B]">Mã sinh viên</dt>
          <dd className="mt-1 font-semibold">{student.id}</dd>
        </div>
        {student.email && (
          <div className="sm:col-span-2">
            <dt className="text-body-sm text-[#64748B]">Email/tài khoản</dt>
            <dd className="mt-1 font-semibold">{student.email}</dd>
          </div>
        )}
      </dl>
      <p className="mt-5 text-body-md">Bạn có chắc chắn muốn gửi yêu cầu reset mật khẩu cho sinh viên này?</p>
      <p className="mt-3 text-body-sm text-[#64748B]">Chế độ xem thử: chưa đặt lại mật khẩu.</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button icon="lock_reset" onClick={() => onConfirm(student)}>
          Reset mật khẩu
        </Button>
      </div>
    </SharedFormDialog>
  );
}
