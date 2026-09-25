import { Form, SubmitButton } from '../../components/Form.jsx';
import React, { useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { apiRequest } from '../../lib/apiClient.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';

function Setting({ item, onSave, busy }) {
  return <Card className="p-5"><Form onSubmit={(event) => { event.preventDefault(); onSave(item.settingKey, Object.fromEntries(new FormData(event.currentTarget))); }}>
    <label className="block font-semibold">{item.settingKey}<input name="settingValue" defaultValue={item.settingValue ?? ''} className="mt-2 block w-full rounded-xl border p-3 font-normal" required /></label>
    <label className="mt-3 block">Mô tả<input name="description" defaultValue={item.description ?? ''} className="mt-2 block w-full rounded-xl border p-3" /></label>
    <SubmitButton className="mt-4" type="submit" disabled={busy}>Lưu cấu hình</SubmitButton>
  </Form></Card>;
}

export function OperationsPage() {
  const [tab, setTab] = useState('settings');
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const query = new URLSearchParams({ page, size: 20 });
  if (filter) query.set(tab === 'activity-logs' ? 'actionType' : 'entity', filter);
  const resource = useApiData(`/api/v1/admin/${tab}${tab === 'settings' ? '' : `?${query}`}`);
  async function mutate(path, options, message) {
    setBusy(true); setError(''); setMessage('');
    try { await apiRequest(path, options); setMessage(message); resource.reload(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const rows = listItems(resource.data);
  return <AdminPageShell currentPage="admin_operations.html" title="Cấu hình & nhật ký" description="Thiết lập hệ thống và tra cứu hoạt động thực tế.">
    <AuthAlert>{message}</AuthAlert><AuthAlert error>{error}</AuthAlert>
    <div className="mt-6"><Tabs items={[['settings', 'Cấu hình'], ['activity-logs', 'Nhật ký hoạt động'], ['audit-logs', 'Nhật ký kiểm toán']].map(([id, label]) => ({ id, label }))} activeId={tab} onChange={(id) => { setTab(id); setPage(0); setFilter(''); }} actions={<Button disabled={busy} onClick={() => mutate('/api/v1/analytics/trigger', { method: 'POST' }, 'Đã gửi yêu cầu tổng hợp dữ liệu.')}>Chạy tổng hợp analytics</Button>}>
      {() => <>
    {tab !== 'settings' && <Form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); setPage(0); setFilter(new FormData(event.currentTarget).get('filter').trim()); }} key={tab}><input name="filter" placeholder={tab === 'activity-logs' ? 'Loại hành động' : 'Tên thực thể'} className="rounded-xl border p-3" /><SubmitButton type="submit">Lọc</SubmitButton></Form>}
    {resource.loading ? <p className="mt-5" role="status">Đang tải…</p> : resource.error ? <p className="mt-5 text-primary" role="alert">{resource.error} <Button onClick={resource.reload}>Thử lại</Button></p> : rows.length === 0 ? <Card className="mt-5 p-6">Chưa có dữ liệu.</Card> : tab === 'settings' ? <div className="mt-5 grid gap-5 lg:grid-cols-2">{rows.map((item) => <Setting key={`${item.settingKey}-${item.updatedAt}`} item={item} busy={busy} onSave={(key, body) => mutate(`/api/v1/admin/settings/${encodeURIComponent(key)}`, { method: 'PUT', body }, 'Đã lưu cấu hình.')} />)}</div> : <Card className="mt-5 overflow-x-auto p-5"><table className="w-full text-left text-sm"><thead><tr>{['Thời gian', 'Người thực hiện', 'Hành động', 'Đối tượng'].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((item, i) => <tr key={item.logId || item.auditId || i} className="border-t"><td className="p-3">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}</td><td className="p-3">{item.userId || '—'}</td><td className="p-3">{item.actionType || item.action || '—'}</td><td className="p-3">{item.objectType || item.entity || '—'} · {item.objectId || item.entityId || '—'}</td></tr>)}</tbody></table><div className="mt-4 flex items-center gap-3"><Button disabled={!page} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page + 1} / {resource.data?.totalPages || 1}</span><Button disabled={page + 1 >= (resource.data?.totalPages || 1)} onClick={() => setPage(page + 1)}>Sau</Button></div></Card>}
      </>}</Tabs></div>
  </AdminPageShell>;
}
