import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormField } from '../../components/FormField.jsx';
import { FormDialog as AcademicModal } from '../../components/FormDialog.jsx';
import React, { useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { api } from '../../lib/apiClient.js';
import { listItems, useApiData } from '../../hooks/useApiData.js';

const semesterStatus = (semester) =>
  semester.isCurrent ? (
    <StatusBadge tone="success">Hiện hành</StatusBadge>
  ) : (
    <StatusBadge tone="neutral">Không hiện hành</StatusBadge>
  );
const subjectStatus = (subject) => (
  <StatusBadge tone={subject.isActive ? 'success' : 'warning'}>
    {subject.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
  </StatusBadge>
);

export function AdminAcademicsApiPage() {
  const [activeTab, setActiveTab] = useState('semesters');
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const semesters = useApiData('/api/v1/semesters');
  const subjects = useApiData('/api/v1/subjects?page=0&size=20');
  const semesterRows = listItems(semesters.data);
  const subjectRows = listItems(subjects.data);
  const startRequest = () => {
    setBusy(true);
    setMessage('');
    setError('');
  };
  const replaceSemester = (updated) =>
    semesters.updateData((data) =>
      listItems(data).map((item) => (item.semesterId === updated.semesterId ? { ...item, ...updated } : item))
    );
  const replaceSubject = (updated) =>
    subjects.updateData((data) => ({
      ...data,
      content: listItems(data).map((item) => (item.subjectId === updated.subjectId ? { ...item, ...updated } : item)),
    }));
  const addSemester = (created) => semesters.updateData((data) => [created, ...listItems(data)]);
  const addSubject = (created) =>
    subjects.updateData((data) => ({
      ...data,
      content: [created, ...listItems(data)].slice(0, data?.size || 20),
      totalElements: (data?.totalElements || 0) + 1,
    }));

  async function save(event) {
    event.preventDefault();
    if (!modal) return;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    startRequest();
    try {
      let updated;
      if (modal.type === 'create-semester') {
        updated = await api.semesters.create(body);
        addSemester(updated);
      } else if (modal.type === 'edit-semester') {
        updated = await api.semesters.update(modal.item.semesterId, body);
        replaceSemester(updated);
      } else if (modal.type === 'create-subject') {
        updated = await api.subjects.create(body);
        addSubject(updated);
      } else {
        updated = await api.subjects.update(modal.item.subjectId, body);
        replaceSubject(updated);
      }
      setModal(null);
      setMessage(
        `Đã ${modal.type.startsWith('create') ? 'tạo' : 'cập nhật'} ${modal.type.includes('semester') ? 'học kỳ' : 'học phần'} ${updated.semesterName || updated.subjectName}.`
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function setCurrent(semester) {
    startRequest();
    try {
      const updated = await api.semesters.setCurrent(semester.semesterId);
      semesters.updateData((data) =>
        listItems(data).map((item) => ({
          ...item,
          ...(item.semesterId === semester.semesterId ? { ...updated, isCurrent: true } : { isCurrent: false }),
        }))
      );
      setMessage(`Đã đặt ${updated?.semesterName || semester.semesterName} là học kỳ hiện hành.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function toggleSubject(subject) {
    startRequest();
    try {
      const updated = await api.subjects.toggleStatus(subject.subjectId);
      replaceSubject(updated);
      setMessage(`Đã ${updated.isActive ? 'bật' : 'tạm ngưng'} học phần ${updated.subjectName}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  const field = (label, name, value = '', type = 'text', required = true) => (
    <FormField
      key={name}
      label={label}
      name={name}
      type={type}
      defaultValue={value ?? ''}
      required={required}
      disabled={busy}
    />
  );
  const form = modal?.type.includes('semester') ? (
    <Form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
      {modal.type === 'create-semester' && field('Mã học kỳ', 'semesterCode')}{' '}
      {field('Tên học kỳ', 'semesterName', modal.item?.semesterName)}{' '}
      {field('Năm học', 'academicYear', modal.item?.academicYear)}{' '}
      {field('Ngày bắt đầu', 'startDate', modal.item?.startDate, 'date')}{' '}
      {field('Ngày kết thúc', 'endDate', modal.item?.endDate, 'date')}
      <div className="flex justify-end gap-3 md:col-span-2">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => setModal(null)}>
          Hủy
        </Button>
        <SubmitButton type="submit" disabled={busy}>
          {busy ? 'Đang lưu…' : 'Lưu học kỳ'}
        </SubmitButton>
      </div>
    </Form>
  ) : (
    <Form className="space-y-4" onSubmit={save}>
      {modal?.type === 'create-subject' && field('Mã học phần', 'subjectCode')}{' '}
      {field('Tên học phần', 'subjectName', modal?.item?.subjectName)}
      <label className="block">
        Mô tả
        <textarea
          name="description"
          defaultValue={modal?.item?.description ?? ''}
          disabled={busy}
          rows={4}
          className="mt-2 block w-full rounded-xl border p-3"
        />
      </label>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => setModal(null)}>
          Hủy
        </Button>
        <SubmitButton type="submit" disabled={busy}>
          {busy ? 'Đang lưu…' : 'Lưu học phần'}
        </SubmitButton>
      </div>
    </Form>
  );

  return (
    <AdminPageShell
      currentPage="admin_academics.html"
      title="Học kỳ & học phần"
      description="Tạo, cập nhật và vận hành phạm vi học tập bằng dữ liệu hệ thống thực tế."
    >
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      {modal && (
        <AcademicModal
          busy={busy}
          title={
            modal.type.startsWith('create')
              ? `Tạo ${modal.type.includes('semester') ? 'học kỳ' : 'học phần'}`
              : `Cập nhật ${modal.type.includes('semester') ? 'học kỳ' : 'học phần'}`
          }
          onClose={() => !busy && setModal(null)}
        >
          {form}
        </AcademicModal>
      )}
      <div className="mt-6">
        <Tabs
          items={[
            { id: 'semesters', label: 'Học kỳ' },
            { id: 'subjects', label: 'Học phần' },
          ]}
          activeId={activeTab}
          onChange={setActiveTab}
          actions={
            <Button
              icon={activeTab === 'semesters' ? 'calendar_month' : 'menu_book'}
              disabled={busy}
              onClick={() => setModal({ type: activeTab === 'semesters' ? 'create-semester' : 'create-subject' })}
            >
              {activeTab === 'semesters' ? 'Tạo học kỳ' : 'Tạo học phần'}
            </Button>
          }
        >
          {() =>
            activeTab === 'semesters' ? (
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
                    renderRow={(semester) => (
                      <tr key={semester.semesterId} className="border-t">
                        <td className="p-3">{semester.semesterCode}</td>
                        <td className="p-3 font-medium">{semester.semesterName}</td>
                        <td className="p-3">{semester.academicYear}</td>
                        <td className="p-3">
                          {semester.startDate} — {semester.endDate}
                        </td>
                        <td className="p-3">{semesterStatus(semester)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              icon="edit"
                              disabled={busy}
                              onClick={() => setModal({ type: 'edit-semester', item: semester })}
                            >
                              Sửa
                            </Button>
                            {!semester.isCurrent && (
                              <Button variant="secondary" disabled={busy} onClick={() => setCurrent(semester)}>
                                Đặt hiện hành
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  />
                )}
              </Card>
            ) : (
              <Card className="mt-5 overflow-x-auto p-5">
                {subjects.loading ? (
                  <p role="status">Đang tải học phần…</p>
                ) : subjects.error ? (
                  <p role="alert">
                    {subjects.error} <Button onClick={subjects.reload}>Thử lại</Button>
                  </p>
                ) : (
                  <>
                    <DataTable
                      columns={['Mã', 'Tên học phần', 'Mô tả', 'Trạng thái', 'Thao tác']}
                      rows={subjectRows}
                      renderRow={(subject) => (
                        <tr key={subject.subjectId} className="border-t">
                          <td className="p-3">{subject.subjectCode}</td>
                          <td className="p-3 font-medium">{subject.subjectName}</td>
                          <td className="p-3">{subject.description || '—'}</td>
                          <td className="p-3">{subjectStatus(subject)}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="secondary"
                                icon="edit"
                                disabled={busy}
                                onClick={() => setModal({ type: 'edit-subject', item: subject })}
                              >
                                Sửa
                              </Button>
                              <Button variant="secondary" disabled={busy} onClick={() => toggleSubject(subject)}>
                                {subject.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    />
                    {subjectRows.length === 0 && <p className="p-3">Chưa có học phần.</p>}
                    <div className="mt-4 flex items-center gap-3">
                      <span>
                        Trang {(subjects.data?.number ?? 0) + 1} / {subjects.data?.totalPages || 1}
                      </span>
                    </div>
                  </>
                )}
              </Card>
            )
          }
        </Tabs>
      </div>
    </AdminPageShell>
  );
}
