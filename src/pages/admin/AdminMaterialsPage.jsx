import React, { useEffect, useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { FormDialog } from '../../components/FormDialog.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { FormField } from '../../components/FormField.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { MaterialFilePreview } from '../../components/MaterialFilePreview.jsx';
import { api } from '../../lib/apiClient.js';
import { loadAdminMaterials } from '../../lib/adminMaterials.js';
import { labelOf, safeUrl } from '../../lib/lecturerUtils.js';
import { materialVideoSource } from '../../lib/materialSources.js';

export function AdminMaterialsPage() {
  const [version, setVersion] = useState(0);
  const [resource, setResource] = useState({ loading: true, error: '', data: null });
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [approving, setApproving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const reload = () => setVersion((value) => value + 1);
  useEffect(() => {
    let active = true;
    setResource({ loading: true, error: '', data: null });
    loadAdminMaterials().then(
      (data) => active && setResource({ loading: false, error: '', data }),
      (requestError) => active && setResource({ loading: false, error: requestError.message, data: null })
    );
    return () => {
      active = false;
    };
  }, [version]);
  const { subjects = [], topics = [], materials = [] } = resource.data || {};
  const rows = materials.filter(
    (row) =>
      (!subjectId || row.subjectId === subjectId) &&
      (!topicId || row.topicId === topicId) &&
      (!status || row.approvalStatus === status) &&
      `${row.title || ''} ${row.subjectName || ''} ${row.topicName || ''}`
        .toLocaleLowerCase('vi')
        .includes(search.trim().toLocaleLowerCase('vi'))
  );

  async function openDetail(row) {
    setBusy(true);
    setError('');
    try {
      const result = await api.materials.get(row.topicId, row.materialId);
      setPreviewOpen(false);
      setDetail({ ...row, ...result, topicId: row.topicId });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function approve() {
    if (!approving || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.materials.approve(approving.topicId, approving.materialId);
      setMessage(`Đã duyệt học liệu “${approving.title}”.`);
      setDetail((current) =>
        current?.materialId === approving.materialId ? { ...current, approvalStatus: 'APPROVED' } : current
      );
      setApproving(null);
      reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminPageShell
      currentPage="admin_materials.html"
      title="Duyệt học liệu"
      description="Xem nội dung và duyệt học liệu theo học phần, chủ đề."
    >
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      <Card className="mt-6 p-5">
        <div className="filter-grid">
          <FormField
            label="Tìm học liệu"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tiêu đề, học phần, chủ đề"
          />
          <SelectField
            label="Học phần"
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setTopicId('');
            }}
          >
            <option value="">Tất cả học phần</option>
            {subjects.map((subject) => (
              <option key={subject.subjectId} value={subject.subjectId}>
                {subject.subjectName}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Chủ đề"
            value={topicId}
            disabled={!subjectId}
            onChange={(event) => setTopicId(event.target.value)}
          >
            <option value="">Tất cả chủ đề</option>
            {topics
              .filter((topic) => topic.subjectId === subjectId)
              .map((topic) => (
                <option key={topic.topicId} value={topic.topicId}>
                  {topic.topicName}
                </option>
              ))}
          </SelectField>
          <SelectField label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'].map((value) => (
              <option key={value} value={value}>
                {labelOf(value)}
              </option>
            ))}
          </SelectField>
        </div>
      </Card>
      <Card className="mt-5 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-lg font-medium">
            Danh sách học liệu{!resource.loading && !resource.error ? ` (${rows.length})` : ''}
          </h2>
          <Button variant="secondary" disabled={busy || resource.loading} onClick={reload} icon="refresh">
            Làm mới
          </Button>
        </div>
        {resource.loading ? (
          <p role="status">Đang tải học liệu…</p>
        ) : resource.error ? (
          <p role="alert">
            {resource.error}{' '}
            <Button variant="secondary" onClick={reload}>
              Thử lại
            </Button>
          </p>
        ) : !rows.length ? (
          <p className="text-slate-500">Không có học liệu phù hợp với bộ lọc hiện tại.</p>
        ) : (
          <DataTable
            columns={['Học liệu', 'Học phần / Chủ đề', 'Loại', 'Trạng thái', 'Thao tác']}
            rows={rows}
            renderRow={(row) => (
              <tr key={`${row.topicId}:${row.materialId}`} className="border-t">
                <td className="p-3 font-medium">{row.title}</td>
                <td className="p-3">
                  {row.subjectName}
                  <p className="mt-1 text-slate-500">{row.topicName}</p>
                </td>
                <td className="p-3">{labelOf(row.type)}</td>
                <td className="p-3">
                  <StatusBadge status={row.approvalStatus} />
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" disabled={busy} onClick={() => openDetail(row)}>
                      Xem chi tiết
                    </Button>
                    {row.approvalStatus !== 'APPROVED' && (
                      <Button disabled={busy} onClick={() => setApproving(row)}>
                        Duyệt học liệu
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </Card>
      {detail && (
        <FormDialog
          title={detail.title || 'Chi tiết học liệu'}
          busy={busy}
          wide={previewOpen}
          reader={previewOpen}
          onClose={() => setDetail(null)}
        >
          {previewOpen ? (
            <MaterialFilePreview material={detail} fill />
          ) : (
            <div className="space-y-4">
              <StatusBadge status={detail.approvalStatus} />
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ['Học phần', detail.subjectName],
                  ['Chủ đề', detail.topicName],
                  ['Loại', labelOf(detail.type)],
                  ['Phiên bản', detail.version],
                  [detail.type === 'VIDEO' ? 'Nguồn video' : 'Nguồn', detail.sourceCitation || detail.source],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-body-sm text-slate-500">{label}</dt>
                    <dd className="mt-1 break-words font-medium">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <h3 className="font-semibold">Mô tả</h3>
                <p className="mt-2 whitespace-pre-wrap break-words">{detail.description || 'Chưa có mô tả.'}</p>
              </div>
              <div>
                <h3 className="font-semibold">Nội dung</h3>
                <p className="mt-2 whitespace-pre-wrap break-words">
                  {detail.contentText || 'Học liệu không có nội dung văn bản.'}
                </p>
              </div>
              {(safeUrl(detail.fileUrl) || (detail.type === 'VIDEO' && materialVideoSource(detail))) && (
                <Button
                  variant="secondary"
                  aria-expanded={previewOpen}
                  onClick={() => setPreviewOpen((value) => !value)}
                >
                  Mở tài liệu
                </Button>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" disabled={busy} onClick={() => setDetail(null)}>
                  Đóng
                </Button>
                {detail.approvalStatus !== 'APPROVED' && (
                  <Button disabled={busy} onClick={() => setApproving(detail)}>
                    Duyệt học liệu
                  </Button>
                )}
              </div>
            </div>
          )}
        </FormDialog>
      )}
      {approving && (
        <ConfirmDialog
          title="Duyệt học liệu"
          description={`Xác nhận duyệt học liệu “${approving.title}”?`}
          confirmLabel="Duyệt học liệu"
          busy={busy}
          onCancel={() => setApproving(null)}
          onConfirm={approve}
        />
      )}
    </AdminPageShell>
  );
}
