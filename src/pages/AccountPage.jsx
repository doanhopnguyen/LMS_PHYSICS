import React, { useState } from 'react';
import { AppShell } from '../components/AppShell.jsx';
import { PageContainer } from '../components/PageContainer.jsx';
import { PageTitle } from '../components/PageTitle.jsx';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { AuthAlert } from '../components/AuthLayout.jsx';
import { api } from '../lib/apiClient.js';
import { getDemoSession, setAuthenticatedSession } from '../lib/demoSession.js';
import { useApiData } from '../hooks/useApiData.js';
import { studentNavItems, studentFooterItems } from '../components/Sidebar.jsx';
import { lecturerNavigation, lecturerUtilityNavigation } from '../data/lecturerData.js';
import { adminNavigation } from '../data/adminData.js';
import { taNavigation, taUtilityNavigation } from '../data/taNavigation.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Tabs } from '../components/Tabs.jsx';

const navigationByRole = {
  STUDENT: { items: studentNavItems, utility: studentFooterItems, current: 'profile_settings.html', eyebrow: 'TÀI KHOẢN SINH VIÊN' },
  INSTRUCTOR: { items: lecturerNavigation, utility: lecturerUtilityNavigation, current: 'account.html', eyebrow: 'KHU VỰC GIẢNG VIÊN' },
  ADMIN: { items: adminNavigation, utility: [], current: 'account.html', eyebrow: 'QUẢN TRỊ HỆ THỐNG' },
  TA: { items: taNavigation, utility: taUtilityNavigation, current: 'account.html', eyebrow: 'KHU VỰC TRỢ GIẢNG' },
};

export function AccountPage() {
  const account = useApiData('/api/v1/users/me');
  const profile = useApiData('/api/v1/users/me/profile');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const session = getDemoSession();
  const navigation = navigationByRole[session?.role] || navigationByRole.STUDENT;
  const user = session ? { ...session, role: session.label } : undefined;
  async function save(event, kind) {
    event.preventDefault(); const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    setMessage(''); setError('');
    if (kind === 'password' && body.newPassword !== body.confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setBusy(true);
    try {
      if (kind === 'password') { await api.users.changePassword({ oldPassword: body.oldPassword, newPassword: body.newPassword }); form.reset(); }
      else if (kind === 'profile') { const updated = await api.users.updateProfile({ ...profile.data, ...body }); setAuthenticatedSession(account.data, updated); profile.updateData(updated); setEditing(''); }
      else { const updated = await api.users.updateMe(body); setAuthenticatedSession(updated, profile.data || {}); account.updateData(updated); setEditing(''); }
      setMessage('Đã lưu thay đổi.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const field = (label, name, value = '', type = 'text', required = false) => <label className="account-field" key={name}>{label}{required && <span className="text-primary" aria-hidden="true"> *</span>}<input name={name} type={type} defaultValue={value ?? ''} required={required} disabled={busy} autoComplete={type === 'password' ? name === 'oldPassword' ? 'current-password' : 'new-password' : ({ username: 'username', email: 'email', fullName: 'name', phone: 'tel' })[name]} minLength={type === 'password' && name !== 'oldPassword' ? 8 : undefined} className="rounded-xl" /></label>;
  return <AppShell currentPage={navigation.current} title="Tài khoản & bảo mật · PTIT Physics LMS" user={user} homeHref={session?.home} navigationItems={navigation.items} utilityItems={navigation.utility} showChatLauncher={session?.role === 'STUDENT'}>
    <PageContainer className="account-page"><PageTitle eyebrow={navigation.eyebrow} title="Tài khoản & bảo mật" description="Quản lý hồ sơ cá nhân và mật khẩu của bạn." />
      <AuthAlert>{message}</AuthAlert><AuthAlert error>{error}</AuthAlert>
      {(account.loading || profile.loading) ? <Card className="account-state p-8" role="status"><span className="material-symbols-outlined" aria-hidden="true">account_circle</span><p>Đang tải hồ sơ…</p></Card> : (account.error || profile.error) ? <Card className="account-state p-8"><span className="material-symbols-outlined" aria-hidden="true">cloud_off</span><p role="alert">{account.error || profile.error}</p><Button variant="secondary" onClick={() => { account.reload(); profile.reload(); }}>Thử lại</Button></Card> : <div className="account-layout">
        <aside className="account-summary">
          <Card className="p-6">
            <div className="account-avatar" aria-hidden="true">{session?.initials || 'TK'}</div>
            <h2 className="mt-4 text-headline-sm font-bold break-words">{profile.data?.fullName || account.data?.username}</h2>
            <p className="mt-1 text-body-sm text-[#64748B]">{session?.label}</p>
            <div className="mt-4"><StatusBadge tone={account.data?.status === 'ACTIVE' ? 'success' : 'neutral'}>{account.data?.status === 'ACTIVE' ? 'Đang hoạt động' : account.data?.status || '—'}</StatusBadge></div>
            <dl className="account-summary-details"><div><dt>Tên đăng nhập</dt><dd>{account.data?.username}</dd></div><div><dt>Email</dt><dd>{account.data?.email}</dd></div>{profile.data?.studentCode && <div><dt>Mã sinh viên</dt><dd>{profile.data.studentCode}</dd></div>}</dl>
          </Card>
          <div className="account-security-note"><span className="material-symbols-outlined" aria-hidden="true">shield_lock</span><p>Giữ mật khẩu riêng tư và sử dụng email bạn thường xuyên kiểm tra để khôi phục tài khoản.</p></div>
        </aside>
        <div className="account-forms"><Card className="p-5 md:p-6"><Tabs items={[{ id: 'account', label: 'Thông tin tài khoản' }, { id: 'profile', label: 'Hồ sơ cá nhân' }, { id: 'password', label: 'Đổi mật khẩu' }]}>{(tab) => tab === 'account' ? <section><p className="account-description">Tên đăng nhập và email liên hệ của bạn.</p>{editing === 'account' ? <form onSubmit={(e) => save(e, 'account')} key={JSON.stringify(account.data)}><div className="account-field-grid">{field('Tên đăng nhập', 'username', account.data?.username, 'text', true)}{field('Email', 'email', account.data?.email, 'email', true)}</div><div className="account-form-actions"><Button type="button" variant="secondary" disabled={busy} onClick={() => setEditing('')}>Hủy</Button><Button icon="save" type="submit" disabled={busy}>Lưu thay đổi</Button></div></form> : <><dl className="account-summary-details"><div><dt>Tên đăng nhập</dt><dd>{account.data?.username}</dd></div><div><dt>Email</dt><dd>{account.data?.email}</dd></div></dl><div className="account-form-actions"><Button icon="edit" onClick={() => setEditing('account')}>Chỉnh sửa</Button></div></>}</section> : tab === 'profile' ? <section><p className="account-description">Thông tin hiển thị trên hồ sơ của bạn trong hệ thống.</p>{editing === 'profile' ? <form onSubmit={(e) => save(e, 'profile')} key={JSON.stringify(profile.data)}><div className="account-field-grid">{field('Họ và tên', 'fullName', profile.data?.fullName)}{field('Số điện thoại', 'phone', profile.data?.phone, 'tel')}</div><label className="account-field mt-5">Giới thiệu<textarea name="bio" defaultValue={profile.data?.bio ?? ''} rows={3} disabled={busy} className="rounded-xl" placeholder="Viết vài dòng giới thiệu về bạn…" /></label><div className="account-form-actions"><Button type="button" variant="secondary" disabled={busy} onClick={() => setEditing('')}>Hủy</Button><Button icon="save" type="submit" disabled={busy}>Lưu thay đổi</Button></div></form> : <><dl className="account-summary-details"><div><dt>Họ và tên</dt><dd>{profile.data?.fullName || 'Chưa cập nhật'}</dd></div><div><dt>Số điện thoại</dt><dd>{profile.data?.phone || 'Chưa cập nhật'}</dd></div><div><dt>Giới thiệu</dt><dd>{profile.data?.bio || 'Chưa cập nhật'}</dd></div></dl><div className="account-form-actions"><Button icon="edit" onClick={() => setEditing('profile')}>Chỉnh sửa</Button></div></>}</section> : <section><p className="account-description">Mật khẩu mới cần có ít nhất 8 ký tự.</p><form onSubmit={(e) => save(e, 'password')}><div className="account-password-current">{field('Mật khẩu hiện tại', 'oldPassword', '', 'password', true)}</div><div className="account-field-grid mt-5">{field('Mật khẩu mới', 'newPassword', '', 'password', true)}{field('Xác nhận mật khẩu mới', 'confirmPassword', '', 'password', true)}</div><div className="account-form-actions"><Button icon="lock_reset" type="submit" disabled={busy}>Đổi mật khẩu</Button></div></form></section>}</Tabs></Card></div>
      </div>}
    </PageContainer>
  </AppShell>;
}
