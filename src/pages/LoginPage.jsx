import React from 'react';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { navigate } from '../lib/navigation.js';

export function LoginPage() {
  useDocumentMeta({ title: 'Đăng nhập · PTIT Physics', bodyClass: 'login-body' });
  const enterDemo = () => navigate('dashboard.html');

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
            <label htmlFor="student-id">Mã sinh viên</label>
            <input
              id="student-id"
              name="studentId"
              type="text"
              autoComplete="username"
              placeholder="Nhập mã sinh viên"
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

          <div className="login-divider">
          </div>
          <button className="login-microsoft" type="button" onClick={enterDemo}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path fill="#f25022" d="M0 0h9v9H0z" />
              <path fill="#7fba00" d="M11 0h9v9h-9z" />
              <path fill="#00a4ef" d="M0 11h9v9H0z" />
              <path fill="#ffb900" d="M11 11h9v9h-9z" />
            </svg>
            Đăng nhập bằng Microsoft
          </button>
        </section>
      </div>
    </main>
  );
}
