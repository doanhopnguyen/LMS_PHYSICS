import { FormDialog as SharedFormDialog } from '../../components/FormDialog.jsx';
import { DataTable as SharedDataTable } from '../../components/DataTable.jsx';
import { SelectField as SharedSelectField } from '../../components/SelectField.jsx';
import { FormField as SharedFormField } from '../../components/FormField.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import React, { useMemo, useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { api } from '../../lib/apiClient.js';
import { Tabs } from '../../components/Tabs.jsx';
import { SystemSettingsForm } from '../../components/SystemSettingsForm.jsx';
import { listItems, useApiData } from '../../hooks/useApiData.js';
import { formatLogValue } from '../../lib/logValues.js';
import { labelOf } from '../../lib/lecturerUtils.js';

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
    <SharedFormDialog title={<>Chi tiết thay đổi</>} onClose={onClose}>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-2 text-sm font-semibold">Giá trị cũ</h3>
          <pre className="overflow-auto rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap break-words">
            {formatLogValue(item.oldValue, 'Không có giá trị cũ.')}
          </pre>
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-sm font-semibold">Giá trị mới</h3>
          <pre className="overflow-auto rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap break-words">
            {formatLogValue(item.newValue, 'Không có giá trị mới.')}
          </pre>
        </div>
      </div>
    </SharedFormDialog>
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
  const users = useApiData(tab !== 'settings' ? '/api/v1/users/admin/users?page=0&size=100&sort=username,asc' : null);
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

  async function saveAllSettings(settings) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.admin.bulkUpdateSettings({ settings });
      setMessage('Đã lưu cấu hình.');
      resource.reload();
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
    if (busy) return;
    setTab(id);
    setPage(0);
    setFilters({ userId: '', actionType: '', entity: '', startDate: '', endDate: '' });
    setAppliedFilters({ userId: '', actionType: '', entity: '', startDate: '', endDate: '' });
  }
  const navigation = [
    { id: 'settings', icon: 'settings', label: 'Cấu hình hệ thống', description: 'Quy tắc và giá trị vận hành' },
    {
      id: 'activity-logs',
      icon: 'history',
      label: 'Nhật ký hoạt động',
      description: 'Các thao tác diễn ra trong hệ thống',
    },
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
      <Tabs items={navigation} activeId={tab} onChange={changeTab}>
        {() => (
          <section className="min-w-0">
            {tab !== 'settings' && (
              <Card className="mt-4 p-4">
                <Form className="filter-grid" onSubmit={applyFilters}>
                  <SharedSelectField
                    value={filters.userId}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        userId: event.target.value,
                      }))
                    }
                    className="mt-1 block w-full"
                    disabled={users.loading}
                    label={<>Người dùng</>}
                  >
                    <option value="">Tất cả người dùng</option>
                    {listItems(users.data).map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.fullName || user.username || user.email}
                      </option>
                    ))}
                  </SharedSelectField>
                  <SharedFormField
                    value={tab === 'activity-logs' ? filters.actionType : filters.entity}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        [tab === 'activity-logs' ? 'actionType' : 'entity']: event.target.value,
                      }))
                    }
                    className="mt-1 block w-full"
                    label={<>{tab === 'activity-logs' ? 'Loại hành động' : 'Thực thể'}</>}
                  />
                  <div className="flex items-end">
                    <SubmitButton type="submit" variant="secondary">Lọc</SubmitButton>
                  </div>
                  {tab === 'activity-logs' && (
                    <details className="filter-advanced">
                      <summary>Khoảng thời gian{filters.startDate || filters.endDate ? ' · Đang lọc' : ''}</summary>
                      <div className="filter-advanced__fields">
                      <SharedFormField
                        type="date"
                        value={filters.startDate}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            startDate: event.target.value,
                          }))
                        }
                        className="mt-1 block w-full"
                        label={<>Từ ngày</>}
                      />
                      <SharedFormField
                        type="date"
                        value={filters.endDate}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            endDate: event.target.value,
                          }))
                        }
                        className="mt-1 block w-full"
                        label={<>Đến ngày</>}
                      />
                      </div>
                    </details>
                  )}
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
              <SystemSettingsForm rows={rows} busy={busy} onSave={saveAllSettings} />
            ) : (
              <Card className="mt-5 overflow-x-auto p-5">
                <SharedDataTable
                  rows={rows}
                  renderRow={(item, index) => (
                    <tr key={item.logId || item.auditId || index} className="border-t">
                      <td className="p-3">{displayUser(item, usersById)}</td>
                      {tab === 'activity-logs' ? (
                        <>
                          <td className="p-3">{labelOf(item.actionType || item.action)}</td>
                          <td className="p-3">{labelOf(item.objectType || item.entity)}</td>
                          <td className="p-3">{formatDate(item.createdAt)}</td>
                          <td className="whitespace-pre-wrap break-words p-3">
                            {formatLogValue(item.details ?? item.metadataJson ?? item.description)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3">{labelOf(item.entity || item.objectType)}</td>
                          <td className="p-3">{labelOf(item.action || item.actionType)}</td>
                          <td className="p-3">
                            <Button variant="secondary" onClick={() => setChange(item)}>
                              Xem thay đổi
                            </Button>
                          </td>
                          <td className="p-3">{formatDate(item.createdAt)}</td>
                        </>
                      )}
                    </tr>
                  )}
                  paginate={false}
                  headerRows={
                    <>
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
                    </>
                  }
                  tableClassName="w-full text-left text-sm"
                />
                <Pagination
                  currentPage={page + 1}
                  pageSize={resource.data?.size || 20}
                  totalItems={resource.data?.totalElements ?? rows.length}
                  onPageChange={(nextPage) => setPage(nextPage - 1)}
                />
              </Card>
            )}
          </section>
        )}
      </Tabs>
    </AdminPageShell>
  );
}
