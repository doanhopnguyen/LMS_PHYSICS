import React, { useState } from 'react';
import { AuthInput, AuthLayout } from '../components/AuthLayout.jsx';
import { navigate } from '../lib/navigation.js';
import { setAuthenticatedSession } from '../lib/demoSession.js';
import { api, tokenStore } from '../lib/apiClient.js';

export function LoginPage() {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const signIn = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError('');
    setSubmitting(true);
    try {
      const tokens = await api.auth.signin({ username: form.get('username'), password: form.get('password') });
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
    <AuthLayout title="Đăng nhập" description="Chào mừng bạn trở lại hệ thống học tập Vật lý.">

          <form
            onSubmit={signIn}
          >
            <label htmlFor="student-id">Tên đăng nhập</label>
            <AuthInput
              id="student-id"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Nhập tên đăng nhập"
              required
            />
            <label htmlFor="login-password">Mật khẩu</label>
            <AuthInput
              id="login-password"
              error={error}
              onChange={() => setError('')}
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              required
            />
            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>

          <div className="login-divider">
          </div>
          <button className="auth-secondary" type="button" onClick={() => navigate('register.html')}>Đăng ký tài khoản mới</button>
          <a href="/reset_password" className="auth-link">Quên mật khẩu?</a>
    </AuthLayout>
  );
}
