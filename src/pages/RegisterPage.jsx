import { Form, SubmitButton } from '../components/Form.jsx';
import React, { useState } from 'react';
import { AuthAlert, AuthInput, AuthLayout } from '../components/AuthLayout.jsx';
import { api, tokenStore } from '../lib/apiClient.js';
import { setAuthenticatedSession } from '../lib/demoSession.js';
import { navigate } from '../lib/navigation.js';

export function RegisterPage() {
  const [error, setError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    const values = new FormData(event.currentTarget);
    setError('');
    setConfirmError('');
    if (values.get('password') !== values.get('confirmPassword')) {
      setConfirmError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setSubmitting(true);
    try {
      const tokens = await api.auth.signup({ username: values.get('username').trim(), email: values.get('email').trim(), password: values.get('password') });
      tokenStore.set(tokens);
      navigate(setAuthenticatedSession(await api.users.me()).home);
    } catch (requestError) {
      tokenStore.clear();
      setError(requestError.message || 'Không thể đăng ký tài khoản.');
    } finally { setSubmitting(false); }
  }
  return <AuthLayout title="Đăng ký tài khoản" description="Tạo tài khoản sinh viên để bắt đầu học tập.">
    <AuthAlert error>{error}</AuthAlert>
    <Form onSubmit={submit}>
      <label htmlFor="register-username">Tên đăng nhập</label>
      <AuthInput id="register-username" name="username" autoComplete="username" placeholder="Nhập tên đăng nhập" required />
      <label htmlFor="register-email">Email</label>
      <AuthInput id="register-email" name="email" type="email" autoComplete="email" placeholder="Nhập địa chỉ email" required />
      <label htmlFor="register-password">Mật khẩu</label>
      <AuthInput id="register-password" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="Ít nhất 8 ký tự" required onChange={() => setConfirmError('')} />
      <label htmlFor="register-confirm">Xác nhận mật khẩu</label>
      <AuthInput id="register-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} placeholder="Nhập lại mật khẩu" required error={confirmError} onChange={() => setConfirmError('')} />
      <button className="login-submit" disabled={submitting}>{submitting ? 'Đang đăng ký…' : 'Đăng ký'}</button>
    </Form>
    <a href="/login" className="auth-link">Đã có tài khoản? Đăng nhập</a>
  </AuthLayout>;
}
