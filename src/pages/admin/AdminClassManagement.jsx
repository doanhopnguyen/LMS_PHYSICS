import React, { useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { Card } from '../../components/Card.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { Button } from '../../components/Button.jsx';
import { FormField } from '../../components/FormField.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormDialog } from '../../components/FormDialog.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { StudentSearchField } from '../../components/StudentSearchField.jsx';
import { useApiData } from '../../hooks/useApiData.js';
import { api, apiRequest } from '../../lib/apiClient.js';
import { navigate } from '../../lib/navigation.js';
import { matches, param, PagedCards, ResourceState, SearchToolbar, useCollection } from './AdminManagementShared.jsx';

const statuses = { DRAFT: 'Bản nháp', ACTIVE: 'Đang mở', COMPLETED: 'Hoàn thành', ARCHIVED: 'Lưu trữ' };
const enrollmentStatuses = { ACTIVE: 'Đang học', DROPPED: 'Ngừng học', COMPLETED: 'Hoàn thành' };
function useInstructors() {
  // The users endpoint supports pagination only; role/status must be filtered locally.
  const resource = useCollection('/api/v1/users/admin/users');
  return { ...resource, data: resource.data.filter((user) => user.role === 'INSTRUCTOR' && user.status === 'ACTIVE') };
}
function Options({ rows, id, name }) {
  return rows.map((row) => (
    <option key={row[id]} value={row[id]}>
      {row[name] || row.username}
    </option>
  ));
}

export function ClassCards({ subjectId = '', semesterId = '' }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [semesterFilter, setSemesterFilter] = useState(semesterId);
  const [subjectFilter, setSubjectFilter] = useState(subjectId);
  const semesters = useCollection('/api/v1/semesters');
  const subjects = useCollection('/api/v1/subjects');
  const query = new URLSearchParams();
  if (subjectFilter) query.set('subjectId', subjectFilter);
  if (semesterFilter) query.set('semesterId', semesterFilter);
  if (status) query.set('status', status);
  const resource = useCollection(`/api/v1/classes?${query}`);
  const rows = resource.data.filter((row) =>
    matches(search, row.classCode, subjects.data.find((s) => s.subjectId === row.subjectId)?.subjectName)
  );
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          icon="add"
          onClick={() =>
            navigate(
              `admin_class_create.html?${new URLSearchParams({ subjectId: subjectFilter, semesterId: semesterFilter })}`
            )
          }
        >
          Tạo mới lớp
        </Button>
      </div>
      <AuthAlert error>{subjects.error || semesters.error}</AuthAlert>
      <SearchToolbar search={search} onSearch={setSearch}>
        {!semesterId && (
          <SelectField label="Học kỳ" value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
            <option value="">Tất cả học kỳ</option>
            <Options rows={semesters.data} id="semesterId" name="semesterName" />
          </SelectField>
        )}
        {!subjectId && (
          <SelectField label="Học phần" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="">Tất cả học phần</option>
            <Options rows={subjects.data} id="subjectId" name="subjectName" />
          </SelectField>
        )}
        <SelectField label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả</option>
          {Object.entries(statuses).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </SelectField>
      </SearchToolbar>
      <ResourceState resource={resource}>
        <PagedCards
          rows={rows}
          resetKey={[search, status, semesterFilter, subjectFilter].join('|')}
          render={(row) => (
            <StatCard
              key={row.classId}
              label={row.classCode}
              value={row.maxStudents ?? '—'}
              detail="sĩ số tối đa"
              icon="school"
              ribbonLabel={subjects.data.find((s) => s.subjectId === row.subjectId)?.subjectCode || 'LỚP HỌC PHẦN'}
              accentColor={row.status === 'ACTIVE' ? '#E52220' : row.status === 'COMPLETED' ? '#15803D' : '#B45309'}
              onOpen={() => navigate(`admin_class_detail.html?classId=${row.classId}`)}
              footer={
                <>
                  <div className="mb-3">
                    <StatusBadge tone={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {statuses[row.status] || row.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {subjects.data.find((s) => s.subjectId === row.subjectId)?.subjectName || 'Học phần'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {semesters.data.find((s) => s.semesterId === row.semesterId)?.semesterName || 'Học kỳ'}
                  </p>
                </>
              }
            />
          )}
        />
      </ResourceState>
    </>
  );
}
export function AdminClassesPage() {
  const semesterId = param('semesterId');
  const semester = useApiData(semesterId ? `/api/v1/semesters/${semesterId}` : null);
  return (
    <AdminPageShell
      currentPage={semesterId ? 'admin_academics.html' : 'admin_classes.html'}
      title={semester.data?.semesterName ? `Lớp học · ${semester.data.semesterName}` : 'Quản trị lớp học'}
    >
      <AuthAlert error>{semester.error}</AuthAlert>
      <ClassCards semesterId={semesterId} />
    </AdminPageShell>
  );
}

function StudentPicker({ students, onChange, busy }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="space-y-4">
      <StudentSearchField disabled={busy} onSelect={setSelected} />
      <Button
        variant="secondary"
        icon="person_add"
        disabled={busy || !selected || students.length >= 500}
        onClick={() => {
          if (!students.some((s) => s.userId === selected.userId)) onChange([...students, selected]);
          setSelected(null);
        }}
      >
        Thêm vào danh sách
      </Button>
      <PagedCards
        rows={students}
        grid={false}
        render={(s) => (
          <div key={s.userId} className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div>
              <strong>{s.fullName || s.username}</strong>
              <p className="text-sm text-slate-500">{s.studentCode || s.username}</p>
            </div>
            <Button
              variant="ghost"
              disabled={busy}
              aria-label={`Bỏ ${s.fullName || s.username}`}
              onClick={() => onChange(students.filter((row) => row.userId !== s.userId))}
            >
              Bỏ
            </Button>
          </div>
        )}
      />
    </div>
  );
}

export function AdminClassCreatePage() {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({
    semesterId: param('semesterId'),
    subjectId: param('subjectId'),
    classCode: '',
    maxStudents: 50,
    instructorId: '',
  });
  const [createdId, setCreatedId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const semesters = useCollection('/api/v1/semesters');
  const subjects = useCollection('/api/v1/subjects?isActive=true');
  const teachers = useInstructors();
  const update = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));
  const teacher = teachers.data.find((t) => t.userId === values.instructorId);
  async function submit(e) {
    e.preventDefault();
    if (busy || createdId) return;
    setError('');
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    if (
      !semesters.data.some((s) => s.semesterId === values.semesterId) ||
      !subjects.data.some((s) => s.subjectId === values.subjectId) ||
      !teacher
    ) {
      setError('Kiểm tra lại học kỳ, học phần và giảng viên.');
      return;
    }
    setBusy(true);
    try {
      const result = await api.classes.create({
        ...values,
        maxStudents: Number(values.maxStudents),
        classCode: values.classCode.trim(),
      });
      if (!result.classId) throw new Error('Không nhận được mã lớp từ hệ thống.');
      setCreatedId(result.classId);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const steps = ['Học kỳ & học phần', 'Giảng viên phụ trách', 'Xác nhận'];
  if (createdId)
    return (
      <AdminPageShell currentPage="admin_classes.html" title="Tạo mới lớp học">
        <Card className="mx-auto max-w-3xl p-6 sm:p-8" role="status">
          <span
            className="material-symbols-outlined mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-primary"
            aria-hidden="true"
          >
            check_circle
          </span>
          <h2 className="text-xl font-semibold">Tạo lớp {values.classCode.trim()} thành công</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Để bổ sung danh sách sinh viên, vào <strong>Danh sách lớp</strong>, mở lớp vừa tạo, chọn tab{' '}
            <strong>Sinh viên</strong> rồi nhấn <strong>Thêm sinh viên</strong>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button icon="school" onClick={() => navigate('admin_classes.html')}>
              Về danh sách lớp
            </Button>
            <Button
              variant="secondary"
              icon="arrow_forward"
              onClick={() => navigate(`admin_class_detail.html?classId=${createdId}`)}
            >
              Mở lớp vừa tạo
            </Button>
          </div>
        </Card>
      </AdminPageShell>
    );
  return (
    <AdminPageShell currentPage="admin_classes.html" title="Tạo mới lớp học">
      <ol aria-label="Các bước tạo lớp" className="mb-6 flex items-start">
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={step === index + 1 ? 'step' : undefined}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-2 px-1 text-center text-xs sm:text-sm"
          >
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-5 h-1 w-full ${step > index + 1 ? 'bg-primary' : 'bg-slate-200'}`}
              />
            )}
            <span className="creation-step-badge relative z-[1]">
              {step > index + 1 ? <span className="material-symbols-outlined">check</span> : index + 1}
            </span>
            <span className={step === index + 1 ? 'font-semibold text-slate-900' : 'text-slate-500'}>{label}</span>
          </li>
        ))}
      </ol>
      <Card className="mx-auto max-w-4xl p-5 sm:p-6">
        <AuthAlert error>{error || semesters.error || subjects.error || teachers.error}</AuthAlert>
        <Form onSubmit={submit} className="space-y-5" busy={busy}>
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Học kỳ" required value={values.semesterId} onChange={update('semesterId')}>
                <option value="">Chọn học kỳ</option>
                <Options rows={semesters.data} id="semesterId" name="semesterName" />
              </SelectField>
              <SelectField label="Học phần" required value={values.subjectId} onChange={update('subjectId')}>
                <option value="">Chọn học phần</option>
                <Options rows={subjects.data} id="subjectId" name="subjectName" />
              </SelectField>
              <FormField
                label="Mã lớp"
                required
                value={values.classCode}
                onChange={update('classCode')}
                pattern=".*\S.*"
              />
              <FormField
                label="Sĩ số tối đa"
                type="number"
                min="1"
                required
                value={values.maxStudents}
                onChange={update('maxStudents')}
              />
            </div>
          )}
          {step === 2 && (
            <SelectField
              label="Giảng viên phụ trách"
              required
              value={values.instructorId}
              onChange={update('instructorId')}
            >
              <option value="">Chọn giảng viên</option>
              <Options rows={teachers.data} id="userId" name="fullName" />
            </SelectField>
          )}
          {step === 3 && (
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ['Mã lớp', values.classCode],
                ['Học kỳ', semesters.data.find((s) => s.semesterId === values.semesterId)?.semesterName],
                ['Học phần', subjects.data.find((s) => s.subjectId === values.subjectId)?.subjectName],
                ['Giảng viên', teacher?.fullName || teacher?.username],
                ['Sĩ số tối đa', values.maxStudents],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="mt-1 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="flex justify-between gap-3 border-t pt-5">
            <Button variant="secondary" disabled={step === 1 || busy} onClick={() => setStep((s) => s - 1)}>
              Bước trước
            </Button>
            <SubmitButton busy={busy}>{step === 3 ? 'Xác nhận tạo lớp' : 'Tiếp tục'}</SubmitButton>
          </div>
        </Form>
      </Card>
    </AdminPageShell>
  );
}

export function AdminClassDetailPage() {
  const classId = param('classId');
  const resource = useApiData(classId ? `/api/v1/classes/${classId}` : null);
  const [tab, setTab] = useState('info');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const students = useCollection(
    classId ? `/api/v1/classes/${classId}/students${status ? `?status=${status}` : ''}` : null
  );
  const staff = useCollection(classId ? `/api/v1/classes/${classId}/staff` : null);
  const teachers = useInstructors();
  const row = resource.data;
  const semester = useApiData(row?.semesterId ? `/api/v1/semesters/${row.semesterId}` : null);
  const subject = useApiData(row?.subjectId ? `/api/v1/subjects/${row.subjectId}` : null);
  async function run(action, success = 'Đã lưu thay đổi.') {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      resource.reload();
      students.reload();
      staff.reload();
      setModal(null);
      setRemoveTarget(null);
      setPendingStudents([]);
      setMessage(success);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function save(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    run(() =>
      modal === 'instructor'
        ? apiRequest(`/api/v1/classes/${classId}/instructor`, { method: 'PUT', body })
        : api.classes.update(classId, { ...body, maxStudents: Number(body.maxStudents) })
    );
  }
  return (
    <AdminPageShell currentPage="admin_classes.html" title={row?.classCode || 'Chi tiết lớp học'}>
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{!modal && !removeTarget && error}</AuthAlert>
      <ResourceState resource={resource}>
        {!row ? (
          <p>Chưa chọn lớp học.</p>
        ) : (
          <Tabs
            activeId={tab}
            onChange={setTab}
            items={[
              { id: 'info', label: 'Thông tin lớp' },
              { id: 'students', label: 'Sinh viên' },
            ]}
          >
            {(active) =>
              active === 'info' ? (
                <Card className="mt-5 p-5">
                  <AuthAlert error>{semester.error || subject.error || staff.error}</AuthAlert>
                  <div className="mb-5 flex flex-wrap gap-2">
                    <Button variant="secondary" disabled={busy} onClick={() => setModal('edit')}>
                      Sửa thông tin
                    </Button>
                    <Button variant="secondary" disabled={busy} onClick={() => setModal('instructor')}>
                      Phân công giảng viên
                    </Button>
                    <ActionMenu
                      label="Trạng thái lớp"
                      disabled={busy}
                      items={Object.entries(statuses)
                        .filter(([value]) => value !== row.status)
                        .map(([value, name]) => ({
                          label: name,
                          onSelect: () =>
                            run(() =>
                              apiRequest(`/api/v1/classes/${classId}/status`, {
                                method: 'PUT',
                                body: { status: value },
                              })
                            ),
                        }))}
                    />
                  </div>
                  <dl className="grid gap-5 sm:grid-cols-2">
                    {[
                      ['Mã lớp', row.classCode],
                      ['Học phần', subject.data?.subjectName],
                      ['Học kỳ', semester.data?.semesterName],
                      ['Trạng thái', statuses[row.status]],
                      ['Sĩ số tối đa', row.maxStudents],
                      [
                        'Giảng viên phụ trách',
                        staff.data
                          .filter((s) => s.roleInClass === 'INSTRUCTOR')
                          .map((s) => s.fullName || s.username)
                          .join(', ') ||
                          teachers.data.find((t) => t.userId === row.instructorId)?.fullName ||
                          teachers.data.find((t) => t.userId === row.instructorId)?.username ||
                          (row.instructorId ? 'Đang tải giảng viên…' : 'Chưa phân công'),
                      ],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-sm text-slate-500">{label}</dt>
                        <dd className="mt-1 font-semibold">{value ?? '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              ) : (
                <div className="mt-5">
                  <div className="mb-4 flex justify-end">
                    <Button
                      icon="person_add"
                      onClick={() => {
                        setError('');
                        setModal('students');
                      }}
                    >
                      Thêm sinh viên
                    </Button>
                  </div>
                  <SearchToolbar search={search} onSearch={setSearch}>
                    <SelectField label="Trạng thái ghi danh" value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="">Tất cả</option>
                      {Object.entries(enrollmentStatuses).map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </SelectField>
                  </SearchToolbar>
                  <ResourceState resource={students}>
                    <PagedCards
                      rows={students.data.filter((s) => matches(search, s.fullName, s.username, s.studentCode))}
                      resetKey={search + status}
                      grid={false}
                      render={(s) => (
                        <Card
                          key={s.enrollmentId || s.studentId}
                          className="flex items-center justify-between gap-3 p-4"
                        >
                          <div>
                            <strong>{s.fullName || s.username}</strong>
                            <p className="text-sm text-slate-500">
                              {s.studentCode || s.username} · {enrollmentStatuses[s.status]}
                            </p>
                          </div>
                          <ActionMenu
                            label={`Thao tác với ${s.fullName || s.username}`}
                            disabled={busy}
                            items={[
                              ...Object.entries(enrollmentStatuses)
                                .filter(([value]) => value !== s.status)
                                .map(([value, label]) => ({
                                  label,
                                  onSelect: () =>
                                    run(() => api.classes.updateStudentStatus(classId, s.studentId, { status: value })),
                                })),
                              {
                                label: 'Xóa khỏi lớp',
                                danger: true,
                                onSelect: () => {
                                  setError('');
                                  setRemoveTarget(s);
                                },
                              },
                            ]}
                          />
                        </Card>
                      )}
                    />
                  </ResourceState>
                </div>
              )
            }
          </Tabs>
        )}
      </ResourceState>
      {removeTarget && (
        <ConfirmDialog
          title="Xóa sinh viên khỏi lớp"
          description={`Xóa ${removeTarget.fullName || removeTarget.username} khỏi lớp ${row.classCode}?`}
          busy={busy}
          confirmLabel="Xóa khỏi lớp"
          onCancel={() => !busy && setRemoveTarget(null)}
          onConfirm={() =>
            run(
              () => apiRequest(`/api/v1/classes/${classId}/students/${removeTarget.studentId}`, { method: 'DELETE' }),
              'Đã xóa sinh viên khỏi lớp.'
            )
          }
        />
      )}
      {removeTarget && error && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-[1300] -translate-x-1/2 rounded-xl bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}
      {modal && (
        <FormDialog
          title={
            modal === 'students'
              ? 'Thêm sinh viên'
              : modal === 'instructor'
                ? 'Phân công giảng viên'
                : 'Sửa thông tin lớp'
          }
          busy={busy}
          onClose={() => !busy && setModal(null)}
        >
          <AuthAlert error>{error || teachers.error}</AuthAlert>
          {modal === 'students' ? (
            <>
              <StudentPicker students={pendingStudents} onChange={setPendingStudents} busy={busy} />
              <Button
                className="mt-4"
                disabled={busy || !pendingStudents.length}
                onClick={() =>
                  run(
                    () => api.classes.enrollBulk(classId, { studentIds: pendingStudents.map((s) => s.userId) }),
                    'Đã ghi danh sinh viên.'
                  )
                }
              >
                Ghi danh sinh viên
              </Button>
            </>
          ) : (
            <Form onSubmit={save} className="space-y-4">
              {modal === 'instructor' ? (
                <SelectField
                  name="instructorId"
                  label="Giảng viên phụ trách"
                  required
                  defaultValue={row.instructorId || ''}
                >
                  <option value="">Chọn giảng viên</option>
                  <Options rows={teachers.data} id="userId" name="fullName" />
                </SelectField>
              ) : (
                <>
                  <FormField label="Mã lớp" name="classCode" defaultValue={row.classCode} required />
                  <FormField
                    label="Sĩ số tối đa"
                    name="maxStudents"
                    type="number"
                    min="1"
                    defaultValue={row.maxStudents || 50}
                    required
                  />
                </>
              )}
              <SubmitButton busy={busy}>Lưu</SubmitButton>
            </Form>
          )}
        </FormDialog>
      )}
    </AdminPageShell>
  );
}
