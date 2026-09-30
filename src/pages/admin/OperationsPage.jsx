import { Form, SubmitButton } from '../../components/Form.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { api, apiRequest } from '../../lib/apiClient.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';

const settingTitle = (key) =>
  String(key || 'Cấu hình hệ thống')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function BulkSettingsEditor({ rows, busy, onSave }) {
  const [values, setValues] = useState({});
  useEffect(() => {
    setValues(Object.fromEntries(rows.map((item) => [item.settingKey, item.settingValue ?? ''])));
  }, [rows]);
  return (
    <Card className="mt-5 p-5">
      <h2 className="text-lg font-bold">Thiết lập hệ thống</h2>
      <p className="mt-1 text-sm text-slate-600">Điều chỉnh giá trị cho từng cấu hình, sau đó nhấn lưu một lần ở cuối trang.</p>
      <Form
        className="mt-4 grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(values);
        }}
      >
        {rows.map((item) => (
          <label key={item.settingKey} className="block rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold">
            <span className="block text-base text-slate-900">{settingTitle(item.settingKey)}</span>
            <span className="mt-1 block font-mono text-xs font-normal text-slate-500">{item.settingKey}</span>
            {item.description && <span className="mt-2 block font-normal text-slate-600">{item.description}</span>}
            <input
              value={values[item.settingKey] ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, [item.settingKey]: event.target.value }))}
              className="mt-3 block w-full rounded-xl border p-3 font-normal"
              disabled={busy}
              required
            />
          </label>
        ))}
        <div className="md:col-span-2">
          <SubmitButton disabled={busy} type="submit">
            Lưu tất cả cấu hình
          </SubmitButton>
        </div>
      </Form>
    </Card>
  );
}

function DashboardRegenerator({ classes, busy, onRegenerate }) {
  const [classId, setClassId] = useState('');
  const rows = listItems(classes.data);
  return (
    <Card className="mt-5 p-5">
      <h2 className="text-lg font-bold">Tái tạo dashboard lớp</h2>
      <p className="mt-1 text-sm text-slate-600">Tạo lại số liệu tổng hợp cho một lớp sau khi dữ liệu thay đổi.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <select
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
          disabled={busy || classes.loading}
          className="min-w-0 flex-1 rounded-xl border p-3"
        >
          <option value="">Chọn lớp học</option>
          {rows.map((item) => (
            <option key={item.classId} value={item.classId}>
              {item.classCode} · {item.className}
            </option>
          ))}
        </select>
        <Button disabled={!classId || busy} onClick={() => onRegenerate(classId)} icon="refresh">
          Tái tạo dashboard
        </Button>
      </div>
    </Card>
  );
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '—';
}

function displayUser(item, usersById) {
  if (item.username || item.userName || item.fullName) return item.fullName || item.username || item.userName;
  const user = usersById.get(item.userId);
  return user?.fullName || user?.username || user?.email || '—';
}

function ChangeDialog({ item, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#0F172A]/45 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết thay đổi"
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold">Chi tiết thay đổi</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <pre className="overflow-auto rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap">
            {item.oldValue || 'Không có giá trị cũ.'}
          </pre>
          <pre className="overflow-auto rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap">
            {item.newValue || 'Không có giá trị mới.'}
          </pre>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </section>
    </div>
  );
}

export function OperationsPage() {
  const [tab, setTab] = useState('settings');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ userId: '', actionType: '', entity: '', startDate: '', endDate: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [change, setChange] = useState(null);
  const users = useApiData('/api/v1/users/admin/users?page=0&size=100&sort=username,asc');
  const classes = useApiData('/api/v1/classes?page=0&size=100');
  const query = useMemo(() => {
    if (tab === 'settings') return '';
    const params = new URLSearchParams({ page: String(page), size: '20', sort: 'createdAt,desc' });
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (
        !value ||
        (tab === 'activity-logs' && key === 'entity') ||
        (tab === 'audit-logs' && ['actionType', 'startDate', 'endDate'].includes(key))
      )
        return;
      params.set(key, key.endsWith('Date') ? new Date(`${value}T00:00:00`).toISOString() : value);
    });
    return `?${params}`;
  }, [tab, page, appliedFilters]);
  const resource = useApiData(`/api/v1/admin/${tab}${query}`);
  const rows = listItems(resource.data);
  const usersById = useMemo(() => new Map(listItems(users.data).map((user) => [user.userId, user])), [users.data]);

  async function mutate(path, options, successMessage) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiRequest(path, options);
      setMessage(successMessage);
      resource.reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveAllSettings(settings) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.admin.bulkUpdateSettings({ settings });
      setMessage('Đã lưu toàn bộ cấu hình.');
      resource.reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function regenerateDashboard(classId) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.dashboard.regenerate(classId);
      setMessage('Đã gửi yêu cầu tái tạo dashboard lớp.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  function applyFilters(event) {
    event.preventDefault();
    setAppliedFilters(filters);
    setPage(0);
  }
  function changeTab(id) {
    setTab(id);
    setPage(0);
    setFilters({ userId: '', actionType: '', entity: '', startDate: '', endDate: '' });
    setAppliedFilters({ userId: '', actionType: '', entity: '', startDate: '', endDate: '' });
  }
  const navigation = [
    { id: 'settings', icon: 'settings', label: 'Cấu hình hệ thống', description: 'Quy tắc và giá trị vận hành' },
    { id: 'activity-logs', icon: 'history', label: 'Nhật ký hoạt động', description: 'Các thao tác diễn ra trong hệ thống' },
    { id: 'audit-logs', icon: 'fact_check', label: 'Nhật ký kiểm toán', description: 'Lịch sử thay đổi dữ liệu' },
  ];

  return (
    <AdminPageShell
      currentPage="admin_operations.html"
      title="Cấu hình & nhật ký"
      description="Thiết lập hệ thống và tra cứu hoạt động thực tế."
    >
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      {change && <ChangeDialog item={change} onClose={() => setChange(null)} />}
      <div className="mt-6 flex flex-col gap-5 lg:flex-row">
        <aside className="lg:w-72 lg:shrink-0">
          <Card className="p-3">
            <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Quản trị hệ thống</p>
            <div className="space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeTab(item.id)}
                  className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${tab === item.id ? 'bg-primary text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  <span className="material-symbols-outlined mt-0.5 text-xl">{item.icon}</span>
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className={`mt-0.5 block text-xs ${tab === item.id ? 'text-white/80' : 'text-slate-500'}`}>{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3">
              <p className="px-3 text-sm font-semibold text-slate-800">Dữ liệu dashboard</p>
              <p className="px-3 pt-1 text-xs text-slate-500">Cập nhật số liệu phân tích mới nhất.</p>
              <Button
                className="mx-3 mb-3 mt-3 w-[calc(100%_-_1.5rem)]"
                disabled={busy}
                onClick={() => mutate('/api/v1/analytics/trigger', { method: 'POST' }, 'Đã gửi yêu cầu tổng hợp dữ liệu.')}
              >
                Tổng hợp analytics
              </Button>
            </div>
          </Card>
        </aside>
        <section className="min-w-0 flex-1">
              {tab !== 'settings' && (
                <Card className="mt-4 p-4">
                  <Form className="grid gap-3 md:grid-cols-3" onSubmit={applyFilters}>
                    <label>
                      Người dùng
                      <select
                        value={filters.userId}
                        onChange={(event) => setFilters((current) => ({ ...current, userId: event.target.value }))}
                        className="mt-1 block w-full rounded-xl border p-2"
                        disabled={users.loading}
                      >
                        <option value="">Tất cả người dùng</option>
                        {listItems(users.data).map((user) => (
                          <option key={user.userId} value={user.userId}>
                            {user.fullName || user.username || user.email}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {tab === 'activity-logs' ? 'Loại hành động' : 'Thực thể'}
                      <input
                        value={tab === 'activity-logs' ? filters.actionType : filters.entity}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            [tab === 'activity-logs' ? 'actionType' : 'entity']: event.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-xl border p-2"
                      />
                    </label>
                    {tab === 'activity-logs' && (
                      <>
                        <label>
                          Từ ngày
                          <input
                            type="date"
                            value={filters.startDate}
                            onChange={(event) =>
                              setFilters((current) => ({ ...current, startDate: event.target.value }))
                            }
                            className="mt-1 block w-full rounded-xl border p-2"
                          />
                        </label>
                        <label>
                          Đến ngày
                          <input
                            type="date"
                            value={filters.endDate}
                            onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
                            className="mt-1 block w-full rounded-xl border p-2"
                          />
                        </label>
                      </>
                    )}
                    <div className="flex items-end">
                      <SubmitButton type="submit">Lọc</SubmitButton>
                    </div>
                  </Form>
                </Card>
              )}
              {resource.loading ? (
                <p className="mt-5" role="status">
                  Đang tải…
                </p>
              ) : resource.error ? (
                <p className="mt-5 text-primary" role="alert">
                  {resource.error} <Button onClick={resource.reload}>Thử lại</Button>
                </p>
              ) : rows.length === 0 ? (
                <Card className="mt-5 p-6">Chưa có dữ liệu.</Card>
              ) : tab === 'settings' ? (
                <>
                  <BulkSettingsEditor rows={rows} busy={busy} onSave={saveAllSettings} />
                  <DashboardRegenerator classes={classes} busy={busy} onRegenerate={regenerateDashboard} />
                </>
              ) : (
                <Card className="mt-5 overflow-x-auto p-5">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        {(tab === 'activity-logs'
                          ? ['Người dùng', 'Hành động', 'Đối tượng', 'Thời gian', 'Chi tiết']
                          : ['Người thao tác', 'Thực thể', 'Hành động', 'Giá trị thay đổi', 'Thời gian']
                        ).map((label) => (
                          <th className="p-3" key={label}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((item, index) => (
                        <tr key={item.logId || item.auditId || index} className="border-t">
                          <td className="p-3">{displayUser(item, usersById)}</td>
                          {tab === 'activity-logs' ? (
                            <>
                              <td className="p-3">{item.actionType || item.action || '—'}</td>
                              <td className="p-3">{item.objectType || item.entity || '—'}</td>
                              <td className="p-3">{formatDate(item.createdAt)}</td>
                              <td className="p-3">{item.details || item.description || '—'}</td>
                            </>
                          ) : (
                            <>
                              <td className="p-3">{item.entity || item.objectType || '—'}</td>
                              <td className="p-3">{item.action || item.actionType || '—'}</td>
                              <td className="p-3">
                                <Button variant="secondary" onClick={() => setChange(item)}>
                                  Xem thay đổi
                                </Button>
                              </td>
                              <td className="p-3">{formatDate(item.createdAt)}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    currentPage={page + 1}
                    pageSize={resource.data?.size || 20}
                    totalItems={resource.data?.totalElements ?? rows.length}
                    onPageChange={(nextPage) => setPage(nextPage - 1)}
                  />
                </Card>
              )}
        </section>
      </div>
    </AdminPageShell>
  );
}
