import { Card } from '../components/Card.jsx';
import React, { useState } from 'react';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { navigate } from '../lib/navigation.js';
import { demoRoles, setAuthenticatedSession, setDemoSession } from '../lib/demoSession.js';
import { api, tokenStore } from '../lib/apiClient.js';

export function LoginPage() {
  useDocumentMeta({ title: 'Đăng nhập · PTIT Physics', bodyClass: 'login-body' });
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const enterDemo = () => navigate(setDemoSession(role).home);
  const signIn = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError('');
    setSubmitting(true);
    try {
      const tokens = await api.auth.signin({ username: form.get('studentId'), password: form.get('password') });
      tokenStore.set(tokens);
      const user = await api.users.me();
      const session = setAuthenticatedSession(user);
      navigate(session.home);
    } catch (requestError) {
      tokenStore.clear();
      setError(requestError.message || 'Đăng nhập không thành công.');
    } finally {
      setSubmitting(false);
    }
  };

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
            onSubmit={signIn}
          >
            <label htmlFor="student-id">Tên đăng nhập</label>
            <input
              id="student-id"
              name="studentId"
              type="text"
              autoComplete="username"
              placeholder="Nhập tên đăng nhập"
              required
            />
            <label htmlFor="login-password">Mật khẩu</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              required
            />
            <button className="login-submit" type="submit">
              {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
            {error && <p className="mt-3 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-body-sm text-[#B91C1C]" role="alert">{error}</p>}
          </form>

          <Card as="div" className="mt-5 bg-[#F8FAFC] p-4">
            <p className="text-body-sm font-semibold text-[#475569]">Vai trò đăng nhập</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.entries(demoRoles).map(([key, item]) => (
                <button key={key} type="button" onClick={() => setRole(key)} className={`rounded-lg border px-3 py-2 text-left text-body-sm font-semibold transition-colors ${role === key ? 'border-primary bg-[#FEE2E2] text-primary' : 'border-[#CBD5E1] bg-white text-[#475569]'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </Card>

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
