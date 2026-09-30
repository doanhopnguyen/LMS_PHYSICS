import React from 'react';
import { Button } from './Button.jsx';

export function PasswordResetDialog({ student, onCancel, onConfirm }) {
  if (!student) return null;
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-transparent p-3" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="relative flex h-[min(560px,calc(100dvh-24px))] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border-2 border-primary bg-white p-5 shadow-xl md:p-6" role="alertdialog" aria-modal="true" aria-labelledby="reset-password-title">
        <button type="button" aria-label="Đóng" onClick={onCancel} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-[#FEF2F2]"><span className="material-symbols-outlined">close</span></button>
        <p className="text-label-md font-bold text-primary">QUẢN LÝ SINH VIÊN</p>
        <h2 id="reset-password-title" className="mt-1 text-headline-md font-bold">Reset mật khẩu sinh viên</h2>
        <dl className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-[#F8FAFC] p-4 sm:grid-cols-2">
          <div><dt className="text-body-sm text-[#64748B]">Sinh viên</dt><dd className="mt-1 font-semibold">{student.name}</dd></div>
          <div><dt className="text-body-sm text-[#64748B]">Mã sinh viên</dt><dd className="mt-1 font-semibold">{student.id}</dd></div>
          {student.email && <div className="sm:col-span-2"><dt className="text-body-sm text-[#64748B]">Email/tài khoản</dt><dd className="mt-1 font-semibold">{student.email}</dd></div>}
        </dl>
        <p className="mt-5 text-body-md">Bạn có chắc chắn muốn gửi yêu cầu reset mật khẩu cho sinh viên này?</p>
        <p className="mt-3 text-body-sm text-[#64748B]">Chế độ xem thử: chưa đặt lại mật khẩu.</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>Hủy</Button>
          <Button icon="lock_reset" onClick={() => onConfirm(student)}>Reset mật khẩu</Button>
        </div>
      </section>
    </div>
  );
}
