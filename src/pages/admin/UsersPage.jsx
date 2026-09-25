import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormDialog as UserModal } from '../../components/FormDialog.jsx';
import React, { useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { api } from '../../lib/apiClient.js';
import { getDemoSession } from '../../lib/demoSession.js';
import { useApiData, listItems } from '../../hooks/useApiData.js';

const roles = { STUDENT: 'Sinh viên', INSTRUCTOR: 'Giảng viên', TA: 'Trợ giảng', ADMIN: 'Quản trị viên' };

function UserProfileModal({ user, profile, loading, error, onClose }) {
  return (
    <UserModal title={`Hồ sơ · ${user.username}`} onClose={onClose}>
      {loading ? (
        <p role="status">Đang tải hồ sơ…</p>
      ) : error ? (
        <p className="text-primary" role="alert">
          {error}
        </p>
      ) : (
        <dl className="grid grid-cols-1 gap-4 text-body-sm sm:grid-cols-2">
          {[
            ['Họ và tên', profile?.fullName],
            ['Mã sinh viên', profile?.studentCode],
            ['Số điện thoại', profile?.phone],
            ['Ngày sinh', profile?.dateOfBirth],
            ['Giới tính', profile?.gender],
            ['Email', user.email],
            ['Vai trò', roles[user.role] || user.role],
            ['Trạng thái', user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[#64748B]">{label}</dt>
              <dd className="mt-1 break-words font-semibold">{value || 'Chưa cập nhật'}</dd>
            </div>
          ))}
          {profile?.bio && (
            <div className="sm:col-span-2">
              <dt className="text-[#64748B]">Giới thiệu</dt>
              <dd className="mt-1 whitespace-pre-line">{profile.bio}</dd>
            </div>
          )}
        </dl>
      )}
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </UserModal>
  );
}
export function UsersPage() {
  const [page, setPage] = useState(0);
  const [sortDirection, setSortDirection] = useState('asc');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [profile, setProfile] = useState(null);
  const [searchedUser, setSearchedUser] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const resource = useApiData(`/api/v1/users/admin/users?page=${page}&size=20&sort=username,${sortDirection}`);
  const isCurrentUser = (user) => user.userId === getDemoSession()?.userId;
  const rows = searchedUser ? [searchedUser] : listItems(resource.data);
  const replaceUser = (updatedUser) =>
    resource.updateData((data) => {
      const replace = (user) => (user.userId === updatedUser.userId ? { ...user, ...updatedUser } : user);
      return Array.isArray(data) ? data.map(replace) : { ...data, content: listItems(data).map(replace) };
    });
  const removeUser = (userId) =>
    resource.updateData((data) => {
      const users = listItems(data).filter((user) => user.userId !== userId);
      if (Array.isArray(data)) return users;
      return {
        ...data,
        content: users,
        numberOfElements: users.length,
        totalElements: Math.max(0, (data?.totalElements || users.length + 1) - 1),
      };
    });
  const addUser = (newUser) =>
    resource.updateData((data) => {
      if (Array.isArray(data)) return data;
      const totalElements = (data?.totalElements || 0) + 1;
      if (page !== 0) return { ...data, totalElements, totalPages: Math.ceil(totalElements / (data?.size || 20)) };
      const compare = (first, second) =>
        first.username.localeCompare(second.username) * (sortDirection === 'asc' ? 1 : -1);
      const content = [...listItems(data), newUser].sort(compare).slice(0, data?.size || 20);
      return {
        ...data,
        content,
        numberOfElements: content.length,
        totalElements,
        totalPages: Math.ceil(totalElements / (data?.size || 20)),
      };
    });
  const startRequest = () => {
    setBusy(true);
    setError('');
    setMessage('');
  };
  async function createUser(body) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const newUser = await api.users.adminCreate(body);
      addUser(newUser);
      setCreating(false);
      setMessage('Đã tạo người dùng.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function updateStatus(target) {
    if (!target) return;
    const status = target.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updatedUser = await api.users.adminUpdateStatus(target.userId, { status });
      replaceUser(updatedUser);
      setSearchedUser((user) => (user?.userId === updatedUser.userId ? { ...user, ...updatedUser } : user));
      setConfirm(null);
      setMessage(`Đã ${status === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản ${updatedUser.username}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function updateUser(event) {
    event.preventDefault();
    if (!editing) return;
    startRequest();
    try {
      const updatedUser = await api.users.adminUpdate(
        editing.userId,
        Object.fromEntries(new FormData(event.currentTarget))
      );
      replaceUser(updatedUser);
      setSearchedUser((user) => (user?.userId === updatedUser.userId ? { ...user, ...updatedUser } : user));
      setEditing(null);
      setMessage(`Đã cập nhật ${updatedUser.username}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function openProfile(user) {
    setProfile({ user, loading: true, error: '', data: null });
    try {
      const data = await api.users.adminGetProfile(user.userId);
      setProfile({ user, loading: false, error: '', data });
    } catch (e) {
      setProfile({ user, loading: false, error: e.message, data: null });
    }
  }
  async function findUser(event) {
    event.preventDefault();
    const username = new FormData(event.currentTarget).get('username').trim();
    if (!username) {
      setSearchedUser(null);
      return;
    }
    startRequest();
    try {
      const user = await api.users.getByUsername(username);
      setSearchedUser(user);
      setMessage(`Đã tìm thấy tài khoản ${user.username}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function runConfirmedAction() {
    if (!confirm) return;
    if (confirm.type === 'status') return updateStatus(confirm.user);
    startRequest();
    try {
      await api.users.deleteByUsername(confirm.user.username);
      removeUser(confirm.user.userId);
      setSearchedUser(null);
      setConfirm(null);
      setMessage(`Đã xóa tài khoản ${confirm.user.username}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminPageShell
      currentPage="admin_users.html"
      title="Người dùng & phân quyền"
      description="Tạo tài khoản và quản lý trạng thái truy cập."
    >
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      <Card className="mt-5 p-5">
        <Form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={findUser}>
          <label className="flex-1 font-semibold">
            Tìm theo tên đăng nhập
            <input
              name="username"
              autoComplete="off"
              placeholder="Nhập username chính xác"
              className="mt-2 block w-full rounded-xl border p-3 font-normal"
            />
          </label>
          <SubmitButton type="submit" disabled={busy} icon="search">
            Tìm kiếm
          </SubmitButton>
          {searchedUser && (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setSearchedUser(null)}>
              Xóa lọc
            </Button>
          )}
          <Button type="button" disabled={busy} onClick={() => setCreating(true)}>
            Tạo tài khoản
          </Button>
        </Form>
      </Card>
      {creating && (
        <UserModal busy={busy} title="Tạo tài khoản" onClose={() => !busy && setCreating(false)}>
          <Form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              createUser(Object.fromEntries(new FormData(event.currentTarget)));
            }}
          >
            <label>
              Tên đăng nhập
              <input
                name="username"
                minLength={4}
                maxLength={255}
                required
                autoComplete="off"
                className="mt-2 block w-full rounded-xl border p-3"
              />
            </label>
            <label>
              Email
              <input name="email" type="email" required className="mt-2 block w-full rounded-xl border p-3" />
            </label>
            <label>
              Mật khẩu ban đầu
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                className="mt-2 block w-full rounded-xl border p-3"
              />
            </label>
            <label>
              Vai trò
              <select name="role" className="mt-2 block w-full rounded-xl border p-3">
                {Object.entries(roles).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-3 md:col-span-2">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setCreating(false)}>
                Hủy
              </Button>
              <SubmitButton type="submit" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Tạo tài khoản'}
              </SubmitButton>
            </div>
          </Form>
        </UserModal>
      )}
      {editing && (
        <UserModal busy={busy} title={`Cập nhật · ${editing.username}`} onClose={() => !busy && setEditing(null)}>
          <Form className="space-y-4" onSubmit={updateUser}>
            <label className="block">
              Email
              <input
                name="email"
                type="email"
                defaultValue={editing.email}
                required
                disabled={busy}
                className="mt-2 block w-full rounded-xl border p-3"
              />
            </label>
            <label className="block">
              Vai trò
              <select
                name="role"
                defaultValue={editing.role}
                disabled={busy}
                className="mt-2 block w-full rounded-xl border p-3"
              >
                {Object.entries(roles).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setEditing(null)}>
                Hủy
              </Button>
              <SubmitButton type="submit" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
              </SubmitButton>
            </div>
          </Form>
        </UserModal>
      )}
      {profile && (
        <UserProfileModal
          user={profile.user}
          profile={profile.data}
          loading={profile.loading}
          error={profile.error}
          onClose={() => setProfile(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={
            confirm.type === 'delete'
              ? 'Xóa tài khoản'
              : `${confirm.user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'} tài khoản`
          }
          description={
            confirm.type === 'delete'
              ? `Bạn có chắc muốn xóa vĩnh viễn tài khoản ${confirm.user.username}?`
              : `Bạn có chắc muốn ${confirm.user.status === 'ACTIVE' ? 'khóa' : 'mở khóa'} tài khoản ${confirm.user.username}?`
          }
          confirmLabel={
            confirm.type === 'delete'
              ? 'Xóa tài khoản'
              : confirm.user.status === 'ACTIVE'
                ? 'Khóa tài khoản'
                : 'Mở khóa tài khoản'
          }
          busy={busy}
          onCancel={() => !busy && setConfirm(null)}
          onConfirm={runConfirmedAction}
        />
      )}
      <Card className="mt-5 overflow-x-auto p-5">
        {resource.loading && !searchedUser ? (
          <p role="status">Đang tải…</p>
        ) : resource.error && !searchedUser ? (
          <p role="alert">
            {resource.error} <Button onClick={resource.reload}>Thử lại</Button>
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-sm text-[#64748B]">
                {searchedUser
                  ? 'Kết quả tìm kiếm theo username'
                  : `${resource.data?.totalElements ?? rows.length} người dùng`}
              </p>
              <label className="text-body-sm">
                Sắp xếp username
                <select
                  value={sortDirection}
                  disabled={busy || Boolean(searchedUser)}
                  onChange={(event) => {
                    setSortDirection(event.target.value);
                    setPage(0);
                  }}
                  className="ml-2 rounded-lg border p-2"
                >
                  <option value="asc">A → Z</option>
                  <option value="desc">Z → A</option>
                </select>
              </label>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {['Tên đăng nhập', 'Email', 'Vai trò', 'Trạng thái', 'Thao tác'].map((label) => (
                    <th className="p-3" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.userId} className="border-t">
                    <td className="p-3 font-medium">{user.username}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{roles[user.role] || user.role}</td>
                    <td className="p-3">
                      <StatusBadge tone={user.status === 'ACTIVE' ? 'success' : 'primary'}>
                        {user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                      </StatusBadge>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" icon="visibility" onClick={() => openProfile(user)}>
                          Hồ sơ
                        </Button>
                        <Button
                          variant="secondary"
                          icon="edit"
                          disabled={busy || isCurrentUser(user)}
                          onClick={() => setEditing(user)}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy || isCurrentUser(user)}
                          onClick={() => setConfirm({ type: 'status', user })}
                        >
                          {user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                        </Button>
                        <Button
                          variant="ghost"
                          icon="delete"
                          disabled={busy || isCurrentUser(user)}
                          onClick={() => setConfirm({ type: 'delete', user })}
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="p-3">Chưa có người dùng.</p>}
            {!searchedUser && (
              <div className="mt-4 flex items-center gap-3">
                <Button disabled={!page || busy} onClick={() => setPage(page - 1)}>
                  Trước
                </Button>
                <span>
                  Trang {page + 1} / {resource.data?.totalPages || 1}
                </span>
                <Button
                  disabled={busy || page + 1 >= (resource.data?.totalPages || 1)}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </AdminPageShell>
  );
}
