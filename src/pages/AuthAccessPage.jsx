import React, { useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { Tabs } from '../components/Tabs.jsx';
import { navigate } from '../lib/navigation.js';
import { api, tokenStore } from '../lib/apiClient.js';
import { setAuthenticatedSession } from '../lib/demoSession.js';

export function AuthAccessPage() {
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (tab, event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setError(''); setFeedback(''); setSubmitting(true);
    try {
      if (tab === 'SIGNUP') {
        const tokens = await api.auth.signup({ username: values.get('username'), email: values.get('email'), password: values.get('password') });
        tokenStore.set(tokens);
        const session = setAuthenticatedSession(await api.users.me());
        navigate(session.home);
        return;
      }
      if (tab === 'FORGOT') await api.auth.forgotPassword(values.get('email'));
      else await api.auth.resetPassword({ token: values.get('token'), newPassword: values.get('password') });
      setFeedback(tab === 'FORGOT' ? 'Đã gửi hướng dẫn đặt lại mật khẩu qua email.' : 'Mật khẩu đã được đặt lại. Bạn có thể đăng nhập lại.');
    } catch (requestError) { setError(requestError.message || 'Yêu cầu không thành công.'); }
    finally { setSubmitting(false); }
  };
  return <main className="min-h-screen bg-[#F8FAFC] p-5 flex items-center justify-center"><Card className="w-full max-w-xl p-6 md:p-8"><a href="login.html" onClick={(event) => { event.preventDefault(); navigate('login.html'); }} className="text-body-sm font-semibold text-primary">← Về đăng nhập</a><h1 className="mt-4 text-headline-md font-bold">Tài khoản và khôi phục truy cập</h1><p className="mt-2 text-body-md text-[#64748B]">Đăng ký và khôi phục truy cập trực tiếp qua hệ thống.</p><div className="mt-6"><Tabs items={[{ id: 'SIGNUP', label: 'Đăng ký sinh viên' }, { id: 'FORGOT', label: 'Quên mật khẩu' }, { id: 'RESET', label: 'Đặt lại mật khẩu' }]}>{(tab) => <form className="pt-5 space-y-4" onSubmit={(event) => submit(tab, event)}><label className="block text-body-sm font-semibold">{tab === 'RESET' ? 'Mã xác thực' : tab === 'SIGNUP' ? 'Tên đăng nhập' : 'Email'}<input name={tab === 'RESET' ? 'token' : tab === 'SIGNUP' ? 'username' : 'email'} required className="mt-2 h-11 w-full rounded-xl border border-[#CBD5E1] px-3" /></label>{tab === 'SIGNUP' && <label className="block text-body-sm font-semibold">Email<input name="email" required type="email" className="mt-2 h-11 w-full rounded-xl border border-[#CBD5E1] px-3" /></label>}{tab !== 'FORGOT' && <label className="block text-body-sm font-semibold">Mật khẩu mới<input name="password" required type="password" minLength="8" className="mt-2 h-11 w-full rounded-xl border border-[#CBD5E1] px-3" /></label>}<Button type="submit" disabled={submitting}>{submitting ? 'Đang xử lý…' : tab === 'SIGNUP' ? 'Tạo tài khoản' : tab === 'FORGOT' ? 'Gửi mã qua email' : 'Đặt lại mật khẩu'}</Button></form>}</Tabs></div>{feedback && <p className="mt-5 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] px-4 py-3 text-body-sm text-[#15803D]">{feedback}</p>}{error && <p className="mt-5 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-body-sm text-[#B91C1C]" role="alert">{error}</p>}</Card></main>;
}
