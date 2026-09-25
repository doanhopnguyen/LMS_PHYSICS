import React, { useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { apiRequest } from '../../lib/apiClient.js';
import { getDemoSession } from '../../lib/demoSession.js';
import { useApiData, listItems } from '../../hooks/useApiData.js';

const roles = { STUDENT: 'Sinh viên', INSTRUCTOR: 'Giảng viên', TA: 'Trợ giảng', ADMIN: 'Quản trị viên' };
export function UsersPage() {
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState(null);
  const resource = useApiData(`/api/v1/users/admin/users?page=${page}&size=20`);
  async function save(path, method, body) {
    setBusy(true); setError(''); setMessage('');
    try { await apiRequest(path, { method, body }); setCreating(false); setTarget(null); resource.reload(); setMessage('Đã cập nhật người dùng.'); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <AdminPageShell currentPage="admin_users.html" title="Người dùng & phân quyền" description="Tạo tài khoản và quản lý trạng thái truy cập." actions={<Button disabled={busy} onClick={() => setCreating(!creating)}>{creating ? 'Đóng biểu mẫu' : 'Tạo tài khoản'}</Button>}>
    <AuthAlert>{message}</AuthAlert><AuthAlert error>{error}</AuthAlert>
    {creating && <Card className="mt-5 p-6"><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); save('/api/v1/users/admin/create-user', 'POST', Object.fromEntries(new FormData(event.currentTarget))); }}>
      <label>Tên đăng nhập<input name="username" minLength={4} maxLength={255} required autoComplete="off" className="mt-2 block w-full rounded-xl border p-3" /></label>
      <label>Email<input name="email" type="email" required className="mt-2 block w-full rounded-xl border p-3" /></label>
      <label>Mật khẩu ban đầu<input name="password" type="password" minLength={8} required autoComplete="new-password" className="mt-2 block w-full rounded-xl border p-3" /></label>
      <label>Vai trò<select name="role" className="mt-2 block w-full rounded-xl border p-3">{Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Tạo tài khoản'}</Button>
    </form></Card>}
    {target && <Card className="mt-5 p-5" role="alertdialog" aria-label="Xác nhận thay đổi trạng thái"><p>{target.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'} tài khoản {target.username}?</p><div className="mt-3 flex gap-3"><Button disabled={busy} onClick={() => save(`/api/v1/users/admin/users/${encodeURIComponent(target.userId)}/status`, 'PUT', { status: target.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' })}>Xác nhận</Button><Button variant="secondary" disabled={busy} onClick={() => setTarget(null)}>Hủy</Button></div></Card>}
    <Card className="mt-5 overflow-x-auto p-5">{resource.loading ? <p role="status">Đang tải…</p> : resource.error ? <p role="alert">{resource.error} <Button onClick={resource.reload}>Thử lại</Button></p> : <><table className="w-full text-left text-sm"><thead><tr>{['Tên đăng nhập', 'Email', 'Vai trò', 'Trạng thái', 'Thao tác'].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{listItems(resource.data).map((user) => <tr key={user.userId} className="border-t"><td className="p-3">{user.username}</td><td className="p-3">{user.email}</td><td className="p-3">{roles[user.role] || user.role}</td><td className="p-3">{user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}</td><td className="p-3"><Button variant="secondary" disabled={busy || user.userId === getDemoSession()?.userId} onClick={() => setTarget(user)}>{user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}</Button></td></tr>)}</tbody></table>{listItems(resource.data).length === 0 && <p className="p-3">Chưa có người dùng.</p>}<div className="mt-4 flex items-center gap-3"><Button disabled={!page} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page + 1} / {resource.data?.totalPages || 1}</span><Button disabled={page + 1 >= (resource.data?.totalPages || 1)} onClick={() => setPage(page + 1)}>Sau</Button></div></>}</Card>
  </AdminPageShell>;
}
