import React, { useState } from 'react';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { navigate } from '../lib/navigation.js';
import { demoRoles, setDemoSession } from '../lib/demoSession.js';

export function LoginPage() {
  useDocumentMeta({ title: 'Đăng nhập · PTIT Physics', bodyClass: 'login-body' });
  const [role, setRole] = useState('STUDENT');
  const enterDemo = () => navigate(setDemoSession(role).home);

  return (
    <main className="login-page">
      <div className="login-layout">
        <header className="login-brand">
          <img src={`${import.meta.env.BASE_URL}ptitlogo.png`} alt="Logo PTIT" width="54" height="69" />
          <div>
            <strong>
              HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG
            </strong>
            <span>HỆ THỐNG HỌC TẬP VÀ THÍ NGHIỆM VẬT LÝ</span>
          </div>
        </header>
        <section className="login-panel" aria-labelledby="login-title">

          <form
            onSubmit={(event) => {
              event.preventDefault();
              enterDemo();
            }}
          >
            <label htmlFor="student-id">Tên đăng nhập</label>
            <input
              id="student-id"
              name="studentId"
              type="text"
              autoComplete="username"
              placeholder="Nhập tên đăng nhập"
            />
            <label htmlFor="login-password">Mật khẩu</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
            />
            <button className="login-submit" type="submit">
              Đăng nhập
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-body-sm font-semibold text-[#475569]">Chế độ dựng giao diện · chọn vai trò để kiểm tra phân quyền</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.entries(demoRoles).map(([key, item]) => (
                <button key={key} type="button" onClick={() => setRole(key)} className={`rounded-lg border px-3 py-2 text-left text-body-sm font-semibold transition-colors ${role === key ? 'border-primary bg-[#FEE2E2] text-primary' : 'border-[#CBD5E1] bg-white text-[#475569]'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="login-divider">
          </div>
          <a href="auth_access.html" className="block text-center text-body-sm font-semibold text-primary">Đăng ký hoặc khôi phục mật khẩu</a>
          <button className="login-microsoft" type="button" onClick={enterDemo}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path fill="#f25022" d="M0 0h9v9H0z" />
              <path fill="#7fba00" d="M11 0h9v9h-9z" />
              <path fill="#00a4ef" d="M0 11h9v9H0z" />
              <path fill="#ffb900" d="M11 11h9v9h-9z" />
            </svg>
            Đăng nhập demo với vai trò đã chọn
          </button>
        </section>
      </div>
    </main>
  );
}
