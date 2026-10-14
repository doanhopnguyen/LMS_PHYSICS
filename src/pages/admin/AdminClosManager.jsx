import React, { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { FormField } from '../../components/FormField.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormDialog } from '../../components/FormDialog.jsx';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { useCloCatalog } from '../../components/CloPicker.jsx';
import { api } from '../../lib/apiClient.js';
import { matches, PagedCards, ResourceState, SearchToolbar } from './AdminManagementShared.jsx';

export function AdminClosManager({ subjectId, subjectActive }) {
  const resource = useCloCatalog([subjectId]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const rows = resource.data
    .filter(
      (clo) => matches(search, clo.cloCode, clo.description) && (status === '' || String(clo.isActive) === status)
    )
    .sort((a, b) => a.orderIndex - b.orderIndex);
  async function run(action) {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      resource.reload();
      setModal(null);
      setRemoveTarget(null);
      setMessage('Đã lưu thay đổi CLO.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!values.cloCode.trim() || !values.description.trim()) {
      setError('Nhập mã CLO và mô tả chuẩn đầu ra.');
      return;
    }
    const body = {
      cloCode: values.cloCode.trim(),
      description: values.description.trim(),
      orderIndex: Number(values.orderIndex),
      isActive: values.isActive === 'true',
    };
    run(() => (modal.cloId ? api.clos.update(modal.cloId, body) : api.clos.create(subjectId, body)));
  }
  return (
    <>
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{!modal && !removeTarget && error}</AuthAlert>
      <div className="mb-4 flex justify-end">
        <Button
          icon="add"
          disabled={busy || !subjectActive}
          onClick={() => {
            setError('');
            setModal({});
          }}
        >
          Tạo mới CLO
        </Button>
      </div>
      {subjectActive === false && (
        <p className="mb-4 text-body-sm text-slate-500">Kích hoạt học phần để tạo mới CLO.</p>
      )}
      <SearchToolbar search={search} onSearch={setSearch}>
        <SelectField label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tất cả</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Ngừng hoạt động</option>
        </SelectField>
      </SearchToolbar>
      <ResourceState resource={resource}>
        <PagedCards
          rows={rows}
          resetKey={search + status}
          render={(clo) => (
            <Card key={clo.cloId} className="min-w-0 p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="break-words text-headline-sm font-semibold">{clo.cloCode}</h2>
                <ActionMenu
                  label={`Thao tác với ${clo.cloCode}`}
                  disabled={busy}
                  items={[
                    {
                      label: 'Chỉnh sửa',
                      onSelect: () => {
                        setError('');
                        setModal(clo);
                      },
                    },
                    {
                      label: clo.isActive ? 'Ngừng hoạt động' : 'Kích hoạt',
                      onSelect: () => run(() => api.clos.toggleStatus(clo.cloId, !clo.isActive)),
                    },
                    {
                      label: 'Xóa',
                      danger: true,
                      onSelect: () => {
                        setError('');
                        setRemoveTarget(clo);
                      },
                    },
                  ]}
                />
              </div>
              <p className="mb-4 break-words text-body-sm text-slate-600">{clo.description}</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge tone={clo.isActive ? 'success' : 'neutral'}>
                  {clo.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </StatusBadge>
                <span className="text-body-sm text-slate-500">{clo.questionCount ?? 0} câu hỏi</span>
              </div>
            </Card>
          )}
        />
      </ResourceState>
      {modal && (
        <FormDialog
          title={modal.cloId ? 'Chỉnh sửa CLO' : 'Tạo mới CLO'}
          busy={busy}
          onClose={() => !busy && setModal(null)}
        >
          {error && (
            <p role="alert" className="mb-4 text-body-sm text-red-700">
              {error}
            </p>
          )}
          <Form className="space-y-4" onSubmit={save}>
            <FormField
              label="Mã CLO"
              name="cloCode"
              required
              maxLength={50}
              disabled={busy}
              defaultValue={modal.cloCode || ''}
            />
            <FormField
              label="Mô tả chuẩn đầu ra"
              name="description"
              required
              multiline
              disabled={busy}
              defaultValue={modal.description || ''}
            />
            <FormField
              label="Thứ tự"
              name="orderIndex"
              type="number"
              required
              min="0"
              step="1"
              disabled={busy}
              defaultValue={modal.orderIndex ?? Math.max(0, ...resource.data.map((row) => row.orderIndex || 0)) + 1}
            />
            <SelectField
              label="Trạng thái"
              name="isActive"
              disabled={busy}
              defaultValue={String(modal.isActive ?? true)}
            >
              <option value="true">Đang hoạt động</option>
              <option value="false">Ngừng hoạt động</option>
            </SelectField>
            <SubmitButton busy={busy}>Lưu CLO</SubmitButton>
          </Form>
        </FormDialog>
      )}
      {removeTarget && (
        <FormDialog title="Xóa CLO" busy={busy} onClose={() => !busy && setRemoveTarget(null)} dialogRole="alertdialog">
          {error && (
            <p role="alert" className="mb-4 text-body-sm text-red-700">
              {error}
            </p>
          )}
          <p className="mb-4">Xóa {removeTarget.cloCode}? CLO đang gắn với câu hỏi sẽ không thể xóa.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" disabled={busy} onClick={() => setRemoveTarget(null)}>
              Hủy
            </Button>
            <Button disabled={busy} onClick={() => run(() => api.clos.remove(removeTarget.cloId))}>
              Xóa CLO
            </Button>
          </div>
        </FormDialog>
      )}
    </>
  );
}
