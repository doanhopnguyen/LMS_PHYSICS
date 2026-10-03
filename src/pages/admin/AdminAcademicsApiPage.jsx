import { FormField as SharedFormField } from '../../components/FormField.jsx';
import { SelectField as SharedSelectField } from '../../components/SelectField.jsx';
import React, { useEffect, useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { FormDialog } from '../../components/FormDialog.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormField } from '../../components/FormField.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { api } from '../../lib/apiClient.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';

const entityName = (type) => (type.includes('semester') ? 'học kỳ' : type.includes('subject') ? 'học phần' : 'chủ đề');
const semesterBadge = (semester) => (
  <StatusBadge tone={semester.isCurrent ? 'success' : 'neutral'}>
    {semester.isCurrent ? 'Hiện hành' : 'Không hiện hành'}
  </StatusBadge>
);
const subjectBadge = (subject) => (
  <StatusBadge tone={subject.isActive ? 'success' : 'warning'}>
    {subject.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
  </StatusBadge>
);

function AcademicForm({ modal, busy, onClose, onSubmit }) {
  const topic = modal.type.includes('topic');
  const semester = modal.type.includes('semester');
  const item = modal.item || {};
  return (
    <FormDialog
      busy={busy}
      title={`${modal.type.startsWith('create') ? 'Tạo' : 'Cập nhật'} ${entityName(modal.type)}`}
      onClose={onClose}
    >
      <Form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        {semester && modal.type === 'create-semester' && (
          <FormField label="Mã học kỳ" name="semesterCode" required disabled={busy} />
        )}
        {semester && (
          <>
            <FormField
              label="Tên học kỳ"
              name="semesterName"
              defaultValue={item.semesterName || ''}
              required
              disabled={busy}
            />
            <FormField
              label="Năm học"
              name="academicYear"
              defaultValue={item.academicYear || ''}
              required
              disabled={busy}
            />
            <FormField
              label="Ngày bắt đầu"
              name="startDate"
              type="date"
              defaultValue={item.startDate || ''}
              required
              disabled={busy}
            />
            <FormField
              label="Ngày kết thúc"
              name="endDate"
              type="date"
              defaultValue={item.endDate || ''}
              required
              disabled={busy}
            />
          </>
        )}
        {!semester && !topic && modal.type === 'create-subject' && (
          <FormField label="Mã học phần" name="subjectCode" required disabled={busy} />
        )}
        {!semester && !topic && (
          <FormField
            label="Tên học phần"
            name="subjectName"
            defaultValue={item.subjectName || ''}
            required
            disabled={busy}
          />
        )}
        {topic && (
          <>
            <FormField
              label="Tên chủ đề"
              name="topicName"
              defaultValue={item.topicName || ''}
              required
              disabled={busy}
            />
            <FormField
              label="Thứ tự"
              name="orderIndex"
              type="number"
              min="0"
              defaultValue={item.orderIndex ?? 0}
              required
              disabled={busy}
            />
          </>
        )}
        {!semester && (
          <SharedFormField
            name="description"
            defaultValue={item.description || ''}
            rows={4}
            disabled={busy}
            className="mt-2 block w-full"
            multiline
            label={<>Mô tả</>}
            wrapperClassName="block md:col-span-2"
          />
        )}
        <div className="flex justify-end gap-3 md:col-span-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Hủy
          </Button>
          <SubmitButton type="submit" disabled={busy}>
            Lưu
          </SubmitButton>
        </div>
      </Form>
    </FormDialog>
  );
}

export function AdminAcademicsApiPage() {
  const [tab, setTab] = useState('semesters');
  const [subjectPage, setSubjectPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState('');
  const [topicSubjectId, setTopicSubjectId] = useState('');
  const [modal, setModal] = useState(null);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const semesters = useApiData('/api/v1/semesters');
  const subjects = useApiData(
    `/api/v1/subjects?page=${subjectPage}&size=20${activeFilter === '' ? '' : `&isActive=${activeFilter}`}`
  );
  const subjectOptions = useApiData('/api/v1/subjects?page=0&size=100');
  const topics = useApiData(topicSubjectId ? `/api/v1/subjects/${encodeURIComponent(topicSubjectId)}/topics` : null);
  const semesterRows = listItems(semesters.data);
  const subjectRows = listItems(subjects.data);
  const topicRows = listItems(topics.data);

  function start() {
    setBusy(true);
    setMessage('');
    setError('');
  }
  async function save(event) {
    event.preventDefault();
    if (!modal) return;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    start();
    try {
      let result;
      if (modal.type === 'create-semester') result = await api.semesters.create(body);
      else if (modal.type === 'edit-semester') result = await api.semesters.update(modal.item.semesterId, body);
      else if (modal.type === 'create-subject') result = await api.subjects.create(body);
      else if (modal.type === 'edit-subject') result = await api.subjects.update(modal.item.subjectId, body);
      else if (modal.type === 'create-topic')
        result = await api.subjects.createTopic(topicSubjectId, { ...body, orderIndex: Number(body.orderIndex) });
      else
        result = await api.subjects.updateTopic(topicSubjectId, modal.item.topicId, {
          ...body,
          orderIndex: Number(body.orderIndex),
        });
      if (modal.type.includes('semester')) semesters.reload();
      else if (modal.type.includes('subject')) {
        subjects.reload();
        subjectOptions.reload();
      } else topics.reload();
      setModal(null);
      setMessage(
        `Đã ${modal.type.startsWith('create') ? 'tạo' : 'cập nhật'} ${entityName(modal.type)} ${result.semesterName || result.subjectName || result.topicName || ''}.`
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function setCurrent(semester) {
    start();
    try {
      await api.semesters.setCurrent(semester.semesterId);
      semesters.reload();
      setMessage(`Đã đặt ${semester.semesterName} là học kỳ hiện hành.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function toggleSubject(subject) {
    start();
    try {
      await api.subjects.toggleStatus(subject.subjectId);
      subjects.reload();
      subjectOptions.reload();
      setMessage(`Đã cập nhật trạng thái ${subject.subjectName}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function openEditor(type, item) {
    start();
    try {
      const detail =
        type === 'semester' ? await api.semesters.get(item.semesterId) : await api.subjects.get(item.subjectId);
      setModal({ type: `edit-${type}`, item: detail });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function deleteTopic() {
    if (!topicToDelete) return;
    start();
    try {
      await api.subjects.deleteTopic(topicSubjectId, topicToDelete.topicId);
      topics.reload();
      setMessage(`Đã xóa chủ đề ${topicToDelete.topicName}.`);
      setTopicToDelete(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!modal || !['edit-semester', 'edit-subject'].includes(modal.type) || modal.item?._detailLoaded) return;
    const loadDetail = async () => {
      try {
        const detail =
          modal.type === 'edit-semester'
            ? await api.semesters.get(modal.item.semesterId)
            : await api.subjects.get(modal.item.subjectId);
        setModal((current) =>
          current?.type === modal.type && current.item === modal.item
            ? { ...current, item: { ...detail, _detailLoaded: true } }
            : current
        );
      } catch (requestError) {
        setError(requestError.message);
      }
    };
    loadDetail();
  }, [modal]);
  const openCreate = () => {
    if (tab === 'topics' && !topicSubjectId) {
      setError('Vui lòng chọn học phần trước khi tạo chủ đề.');
      return;
    }
    setModal({ type: `create-${tab === 'semesters' ? 'semester' : tab === 'subjects' ? 'subject' : 'topic'}` });
  };

  return (
    <AdminPageShell
      currentPage="admin_academics.html"
      title="Học kỳ & học phần"
      description="Quản lý học kỳ, học phần và chủ đề học tập."
    >
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      {modal && <AcademicForm modal={modal} busy={busy} onClose={() => !busy && setModal(null)} onSubmit={save} />}
      {topicToDelete && (
        <ConfirmDialog
          title="Xóa chủ đề"
          description={`Bạn có chắc muốn xóa chủ đề ${topicToDelete.topicName}?`}
          confirmLabel="Xóa chủ đề"
          busy={busy}
          onCancel={() => !busy && setTopicToDelete(null)}
          onConfirm={deleteTopic}
        />
      )}
      <Tabs
        items={[
          { id: 'semesters', label: 'Học kỳ' },
          { id: 'subjects', label: 'Học phần' },
          { id: 'topics', label: 'Chủ đề' },
        ]}
        activeId={tab}
        onChange={(nextTab) => {
          setTab(nextTab);
          if (nextTab === 'subjects') setSubjectPage(0);
        }}
        actions={
          <Button disabled={busy} onClick={openCreate}>
            {tab === 'semesters' ? 'Tạo học kỳ' : tab === 'subjects' ? 'Tạo học phần' : 'Tạo chủ đề'}
          </Button>
        }
      >
        {() =>
          tab === 'semesters' ? (
            <Card className="mt-5 overflow-x-auto p-5">
              {semesters.loading ? (
                <p role="status">Đang tải học kỳ…</p>
              ) : semesters.error ? (
                <p role="alert">
                  {semesters.error} <Button onClick={semesters.reload}>Thử lại</Button>
                </p>
              ) : (
                <DataTable
                  columns={['Mã', 'Tên học kỳ', 'Năm học', 'Thời gian', 'Trạng thái', 'Thao tác']}
                  rows={semesterRows}
                  renderRow={(item) => (
                    <tr key={item.semesterId} className="border-t">
                      <td className="p-3">{item.semesterCode}</td>
                      <td className="p-3 font-medium">{item.semesterName}</td>
                      <td className="p-3">{item.academicYear}</td>
                      <td className="p-3">
                        {item.startDate} — {item.endDate}
                      </td>
                      <td className="p-3">{semesterBadge(item)}</td>
                      <td className="p-3">
                        <ActionMenu
                          label={`Thao tác với ${item.semesterName}`}
                          disabled={busy}
                          items={[
                            { label: 'Chỉnh sửa', onSelect: () => setModal({ type: 'edit-semester', item }) },
                            !item.isCurrent && { label: 'Đặt hiện hành', onSelect: () => setCurrent(item) },
                          ]}
                        />
                      </td>
                    </tr>
                  )}
                />
              )}
            </Card>
          ) : tab === 'subjects' ? (
            <Card className="mt-5 overflow-x-auto p-5">
              {subjects.loading ? (
                <p role="status">Đang tải học phần…</p>
              ) : subjects.error ? (
                <p role="alert">
                  {subjects.error} <Button onClick={subjects.reload}>Thử lại</Button>
                </p>
              ) : (
                <>
                  <SharedSelectField
                    value={activeFilter}
                    onChange={(event) => {
                      setActiveFilter(event.target.value);
                      setSubjectPage(0);
                    }}
                    label={<>Trạng thái</>}
                    className="mb-4 block text-body-sm"
                  >
                    <option value="">Tất cả</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã tắt</option>
                  </SharedSelectField>
                  <DataTable
                    paginate={false}
                    columns={['Mã', 'Tên học phần', 'Mô tả', 'Trạng thái', 'Thao tác']}
                    rows={subjectRows}
                    renderRow={(item) => (
                      <tr key={item.subjectId} className="border-t">
                        <td className="p-3">{item.subjectCode}</td>
                        <td className="p-3 font-medium">{item.subjectName}</td>
                        <td className="p-3">{item.description || '—'}</td>
                        <td className="p-3">{subjectBadge(item)}</td>
                        <td className="p-3">
                          <ActionMenu
                            label={`Thao tác với ${item.subjectName}`}
                            disabled={busy}
                            items={[
                              { label: 'Chỉnh sửa', onSelect: () => setModal({ type: 'edit-subject', item }) },
                              { label: item.isActive ? 'Tạm ngưng' : 'Kích hoạt', onSelect: () => toggleSubject(item) },
                            ]}
                          />
                        </td>
                      </tr>
                    )}
                  />
                  <Pagination
                    currentPage={(subjects.data?.number ?? subjectPage) + 1}
                    pageSize={subjects.data?.size || 20}
                    totalItems={subjects.data?.totalElements ?? subjectRows.length}
                    onPageChange={(nextPage) => setSubjectPage(nextPage - 1)}
                  />
                </>
              )}
            </Card>
          ) : (
            <Card className="mt-5 overflow-x-auto p-5">
              <SharedSelectField
                value={topicSubjectId}
                onChange={(event) => setTopicSubjectId(event.target.value)}
                disabled={subjectOptions.loading}
                label={<>Học phần</>}
                className="block max-w-xl"
              >
                <option value="">{subjectOptions.loading ? 'Đang tải…' : 'Chọn học phần'}</option>
                {listItems(subjectOptions.data).map((item) => (
                  <option key={item.subjectId} value={item.subjectId}>
                    {item.subjectCode} · {item.subjectName}
                  </option>
                ))}
              </SharedSelectField>
              {!topicSubjectId ? (
                <p className="mt-5 text-[#64748B]">Chọn học phần để quản lý chủ đề.</p>
              ) : topics.loading ? (
                <p className="mt-5" role="status">
                  Đang tải chủ đề…
                </p>
              ) : topics.error ? (
                <p className="mt-5" role="alert">
                  {topics.error} <Button onClick={topics.reload}>Thử lại</Button>
                </p>
              ) : (
                <DataTable
                  columns={['Chủ đề', 'Thứ tự', 'Mô tả', 'Thao tác']}
                  rows={topicRows}
                  renderRow={(item) => (
                    <tr key={item.topicId} className="border-t">
                      <td className="p-3 font-medium">{item.topicName}</td>
                      <td className="p-3">{item.orderIndex ?? '—'}</td>
                      <td className="p-3">{item.description || '—'}</td>
                      <td className="p-3">
                        <ActionMenu
                          label={`Thao tác với ${item.topicName}`}
                          disabled={busy}
                          items={[
                            { label: 'Chỉnh sửa', onSelect: () => setModal({ type: 'edit-topic', item }) },
                            { label: 'Xóa chủ đề', danger: true, onSelect: () => setTopicToDelete(item) },
                          ]}
                        />
                      </td>
                    </tr>
                  )}
                />
              )}
            </Card>
          )
        }
      </Tabs>
    </AdminPageShell>
  );
}
