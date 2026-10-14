import React, { useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { Button } from '../../components/Button.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { api } from '../../lib/apiClient.js';
import { navigate } from '../../lib/navigation.js';
import { useApiData } from '../../hooks/useApiData.js';
import { AdminCurriculumTree } from './AdminCurriculumTree.jsx';
import { AdminClosManager } from './AdminClosManager.jsx';
import { AcademicForm } from './AdminAcademicsApiPage.jsx';
import { ClassCards } from './AdminClassManagement.jsx';
import { AdminQuestionsApiPage } from './AdminQuestionsApiPage.jsx';
import { MatrixManager } from '../lecturers/LecturerApiWorkspace.jsx';
import { matches, param, PagedCards, ResourceState, SearchToolbar, useCollection } from './AdminManagementShared.jsx';

function AcademicList({ subject = false }) {
  const resource = useCollection(subject ? '/api/v1/subjects' : '/api/v1/semesters');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const type = subject ? 'subject' : 'semester';
  const name = subject ? 'học phần' : 'học kỳ';
  async function run(action) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      resource.reload();
      setModal(null);
      setMessage('Đã lưu thay đổi.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function edit(item) {
    setBusy(true);
    setError('');
    try {
      setModal({ type: `edit-${type}`, item: await api[subject ? 'subjects' : 'semesters'].get(item[`${type}Id`]) });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function save(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    if (!subject && body.startDate && body.endDate && body.startDate > body.endDate) {
      setError('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }
    const service = api[subject ? 'subjects' : 'semesters'];
    run(() => (modal.type.startsWith('create') ? service.create(body) : service.update(modal.item[`${type}Id`], body)));
  }
  const rows = resource.data.filter(
    (item) =>
      matches(search, item[`${type}Name`], item[`${type}Code`], item.academicYear) &&
      (status === '' || String(subject ? item.isActive : item.isCurrent) === status)
  );
  return (
    <AdminPageShell
      currentPage={subject ? 'admin_subjects.html' : 'admin_academics.html'}
      title={`Quản trị ${name}`}
      actions={
        <Button icon="add" onClick={() => setModal({ type: `create-${type}` })}>
          Tạo mới {name}
        </Button>
      }
    >
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      {modal && (
        <AcademicForm modal={modal} busy={busy} error={error} onClose={() => !busy && setModal(null)} onSubmit={save} />
      )}
      <SearchToolbar search={search} onSearch={setSearch}>
        <SelectField label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="true">{subject ? 'Đang hoạt động' : 'Hiện hành'}</option>
          <option value="false">{subject ? 'Tạm ngưng' : 'Không hiện hành'}</option>
        </SelectField>
      </SearchToolbar>
      <ResourceState resource={resource}>
        <PagedCards
          rows={rows}
          resetKey={search + status}
          render={(item) => (
            <StatCard
              key={item[`${type}Id`]}
              label={item[`${type}Name`]}
              value={subject ? item.subjectCode : item.academicYear}
              detail={subject ? undefined : 'năm học'}
              icon={subject ? 'menu_book' : 'calendar_month'}
              ribbonLabel={subject ? 'HỌC PHẦN' : item.semesterCode || 'HỌC KỲ'}
              accentColor={(subject ? item.isActive : item.isCurrent) ? '#E52220' : '#B45309'}
              headerActions={
                <ActionMenu
                  label={`Thao tác với ${item[`${type}Name`]}`}
                  disabled={busy}
                  items={[
                    { label: 'Chỉnh sửa thông tin', onSelect: () => edit(item) },
                    {
                      label: subject ? (item.isActive ? 'Tạm ngưng' : 'Kích hoạt') : 'Đặt hiện hành',
                      onSelect: () =>
                        run(() =>
                          subject
                            ? api.subjects.toggleStatus(item.subjectId)
                            : api.semesters.setCurrent(item.semesterId)
                        ),
                    },
                  ]}
                />
              }
              onOpen={() =>
                navigate(
                  subject
                    ? `admin_subject_detail.html?subjectId=${item.subjectId}`
                    : `admin_classes.html?semesterId=${item.semesterId}`
                )
              }
              footer={
                <>
                  {!subject && (item.startDate || item.endDate) && (
                    <p className="mt-3 text-sm text-slate-500">
                      {item.startDate || '—'} — {item.endDate || '—'}
                    </p>
                  )}
                  <div className="mt-4">
                    <StatusBadge tone={(subject ? item.isActive : item.isCurrent) ? 'success' : 'neutral'}>
                      {subject
                        ? item.isActive
                          ? 'Đang hoạt động'
                          : 'Tạm ngưng'
                        : item.isCurrent
                          ? 'Hiện hành'
                          : 'Không hiện hành'}
                    </StatusBadge>
                  </div>
                </>
              }
            />
          )}
        />
      </ResourceState>
    </AdminPageShell>
  );
}
export function AdminSemestersPage() {
  return <AcademicList />;
}
export function AdminSubjectsPage() {
  return <AcademicList subject />;
}

export function AdminSubjectDetailPage() {
  const subjectId = param('subjectId');
  const subject = useApiData(subjectId ? `/api/v1/subjects/${subjectId}` : null);
  const [tab, setTab] = useState('classes');
  return (
    <AdminPageShell
      currentPage="admin_subjects.html"
      title={subject.data?.subjectName || 'Chi tiết học phần'}
      showBackButton={false}
      contentClass="admin-subject-detail-content"
    >
      <AuthAlert error>{subject.error || (!subjectId ? 'Chưa chọn học phần.' : '')}</AuthAlert>
      {subjectId && (
        <Tabs
          items={[
            { id: 'classes', label: 'Lớp học' },
            { id: 'curriculum', label: 'Chương trình đào tạo' },
            { id: 'clos', label: 'Chuẩn đầu ra (CLO)' },
            { id: 'bank', label: 'Ngân hàng' },
            { id: 'matrix', label: 'Ma trận' },
          ]}
          activeId={tab}
          onChange={setTab}
        >
          {(active) => (
            <div className="mt-5">
              {active === 'classes' ? (
                <ClassCards subjectId={subjectId} />
              ) : active === 'curriculum' ? (
                <AdminCurriculumTree subjectId={subjectId} />
              ) : active === 'clos' ? (
                <AdminClosManager subjectId={subjectId} subjectActive={subject.data?.isActive === true} />
              ) : active === 'bank' ? (
                <AdminQuestionsApiPage embedded scopedSubjectId={subjectId} />
              ) : (
                <MatrixManager classes={[]} scopedSubjectId={subjectId} />
              )}
            </div>
          )}
        </Tabs>
      )}
    </AdminPageShell>
  );
}
