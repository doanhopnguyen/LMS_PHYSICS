import { Form, SubmitButton } from '../components/Form.jsx';
import React, { useState } from 'react';
import { AuthAlert, AuthInput, AuthLayout } from '../components/AuthLayout.jsx';
import { api } from '../lib/apiClient.js';

export function ResetPasswordPage() {
  const initialToken = new URLSearchParams(window.location.search).get('token') || '';
  const [step, setStep] = useState(initialToken ? 'RESET' : 'EMAIL');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    const values = new FormData(event.currentTarget);
    setError('');
    setFieldErrors({});
    setFeedback('');
    if (step === 'RESET' && values.get('password') !== values.get('confirmPassword')) {
      setFieldErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    setSubmitting(true);
    try {
      if (step === 'EMAIL') {
        await api.auth.forgotPassword(email.trim());
        setFeedback('Đã gửi email hướng dẫn. Vui lòng kiểm tra hộp thư và nhập mã xác thực bên dưới.');
        setStep('RESET');
      } else {
        await api.auth.resetPassword({ token: values.get('token').trim(), newPassword: values.get('password') });
        setFeedback('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
        setStep('DONE');
      }
    } catch (requestError) {
      const message = requestError.message || 'Yêu cầu không thành công. Vui lòng thử lại.';
      if (step === 'RESET' && /token|mã xác thực/i.test(message)) setFieldErrors({ token: message });
      else setError(message);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <AuthLayout
      title={step === 'EMAIL' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
      description={
        step === 'EMAIL'
          ? 'Nhập email tài khoản để nhận mã đặt lại mật khẩu.'
          : step === 'RESET'
            ? 'Nhập mã nhận qua email và tạo mật khẩu mới.'
            : 'Mật khẩu của bạn đã được cập nhật.'
      }
    >
      <AuthAlert>{feedback}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      {step !== 'DONE' && (
        <Form key={step} onSubmit={submit}>
          {step === 'EMAIL' ? (
            <>
              <label htmlFor="reset-email">Email</label>
              <AuthInput
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Nhập email đã đăng ký"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </>
          ) : (
            <>
              <label htmlFor="reset-token">Mã xác thực</label>
              <AuthInput
                id="reset-token"
                name="token"
                autoComplete="one-time-code"
                defaultValue={initialToken}
                placeholder="Nhập mã trong email"
                required
                autoFocus
                error={fieldErrors.token}
                onChange={() => setFieldErrors((current) => ({ ...current, token: '' }))}
              />
              <label htmlFor="reset-password">Mật khẩu mới</label>
              <AuthInput
                id="reset-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder="Ít nhất 8 ký tự"
                required
                onChange={() => setFieldErrors((current) => ({ ...current, confirmPassword: '' }))}
              />
              <label htmlFor="reset-confirm">Xác nhận mật khẩu mới</label>
              <AuthInput
                id="reset-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder="Nhập lại mật khẩu mới"
                required
                error={fieldErrors.confirmPassword}
                onChange={() => setFieldErrors((current) => ({ ...current, confirmPassword: '' }))}
              />
            </>
          )}
          <button className="login-submit" disabled={submitting}>
            {submitting ? 'Đang xử lý…' : step === 'EMAIL' ? 'Gửi mã qua email' : 'Đặt lại mật khẩu'}
          </button>
          {step === 'RESET' && (
            <button
              className="auth-secondary auth-resend"
              type="button"
              disabled={submitting}
              onClick={() => {
                setStep('EMAIL');
                setError('');
                setFeedback('');
              }}
            >
              Gửi lại
            </button>
          )}
        </Form>
      )}
      <a href="/login" className="auth-link">
        Về đăng nhập
      </a>
    </AuthLayout>
  );
}
