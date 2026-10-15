import { Form, SubmitButton } from '../../components/Form.jsx';
import React, { useEffect, useState } from 'react';
import { UnifiedDashboardBanner } from '../../components/UnifiedDashboardBanner.jsx';
import { api } from '../../lib/apiClient.js';
import { queryPath } from '../../lib/lecturerUtils.js';
import { navigate } from '../../lib/navigation.js';
import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { StudentSearchField } from '../../components/StudentSearchField.jsx';
import { LecturerProgressView } from './LecturerProgressView.jsx';
import { useTeachingScope, TeachingSubjectCards } from './LecturerTeachingScope.jsx';
import { AdminCurriculumTree } from '../admin/AdminCurriculumTree.jsx';
import { LecturerClassMaterials } from './LecturerClassMaterials.jsx';
import { LecturerAssessmentApiPage, LecturerExperimentsApiPage } from './LecturerApiWorkspace.jsx';
import {
  Button,
  Card,
  Field,
  FileLink,
  Lookup,
  Modal,
  Pager,
  Resource,
  SelectField,
  Table,
  Tabs,
  LecturerPageShell,
  dateText,
  displayName,
  idPath,
  itemsOf,
  labelOf,
  routeParam,
  useMutation,
  useResource,
  useQueryState,
} from './LecturerShared.jsx';
const CLASS_STATES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];
function Snapshot({ resource, overview = false }) {
  return (
    <Resource value={resource}>
      {(snapshot) => {
        const data = snapshot?.data || snapshot || {};
        const metrics = [
          { label: 'Điểm trung bình', value: data.avgScore ?? '—', icon: 'analytics' },
          {
            label: 'Chủ đề hoàn thành',
            value: data.completedTopics == null ? '—' : `${data.completedTopics}/${data.totalTopics ?? '—'}`,
            icon: 'menu_book',
          },
          { label: 'Thí nghiệm đã xác nhận', value: data.labsConfirmed ?? '—', icon: 'science' },
          { label: 'Lượt làm bài thi', value: data.totalExamsTaken ?? '—', icon: 'quiz' },
        ];
        return (
          <>
            {overview ? (
              <MetricGrid items={metrics} />
            ) : (
              <div>
                <MetricGrid
                  items={[
                    ...metrics,
                    { label: 'Phiên học với AI', value: data.aiSessionsCount ?? '—', icon: 'smart_toy' },
                  ]}
                />
                <p className="text-body-sm">Cập nhật: {dateText(snapshot?.generatedAt || data.lastUpdated)}</p>
              </div>
            )}
          </>
        );
      }}
    </Resource>
  );
}
export function LecturerDashboardApiPage() {
  const classes = useResource('/api/v1/classes', true);
  const [selected, select] = useState(routeParam('classId'));
  const rows = itemsOf(classes.data);
  const classId = selected;
  const snapshot = useResource(classId ? `/api/v1/dashboard/class/${idPath(classId)}` : '/api/v1/dashboard/me');
  const students = useResource(classId ? `/api/v1/classes/${idPath(classId)}/students?page=0&size=1` : null);
  return (
    <LecturerPageShell
      currentPage="lecturer_dashboard.html"
      title="Tổng quan giảng viên"
      eyebrow="KHU VỰC GIẢNG VIÊN"
      description="Theo dõi dữ liệu lớp học và lịch kỳ thi thực tế."
      hideTitle
    >
      <div className="space-y-6">
        <UnifiedDashboardBanner role="LECTURER" />
        <Tabs
        items={[{ id: 'overview', label: 'Tổng quan' }]}
        actions={
          <SelectField
            label="Lớp học"
            value={classId || 'ALL'}
            onChange={(event) => select(event.target.value === 'ALL' ? '' : event.target.value)}
          >
            <option value="ALL">Tất cả lớp</option>
            {rows.map((item) => (
              <option key={item.classId} value={item.classId}>
                {displayName(item)}
              </option>
            ))}
          </SelectField>
        }
      >
        {() => (
          <>
            <DashboardOverview role="INSTRUCTOR">
              <Snapshot resource={snapshot} overview />
            </DashboardOverview>
            <div className="my-4 flex flex-wrap items-center gap-4">
              <Resource value={students}>
                {(data) => (
                  <p>
                    Sinh viên của lớp: <strong>{data?.totalElements ?? itemsOf(data).length}</strong>
                  </p>
                )}
              </Resource>
              {classId && (
                <a
                  className="font-semibold text-primary"
                  href={`lecturer_course_detail.html?classId=${idPath(classId)}`}
                >
                  Quản lý lớp →
                </a>
              )}
            </div>
            {classId && (
              <ClassObservation
                classId={classId}
                subjectId={rows.find((c) => c.classId === classId)?.subjectId}
                tabs={['progress', 'activity', 'evidence']}
              />
            )}
          </>
        )}
      </Tabs>
      </div>
    </LecturerPageShell>
  );
}
export function LecturerClassesApiPage({ mode = 'classes' }) {
  const teachingScope = useTeachingScope();
  const subjects = teachingScope.subjects;
  const activeSubjects = { ...subjects, data: itemsOf(subjects.data).filter((row) => row.isActive) };
  const semesters = useResource('/api/v1/semesters');
  const [filters, setFilters] = useState({
    subjectId: routeParam('subjectId'),
    semesterId: routeParam('semesterId'),
    status: routeParam('status'),
  });
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useQueryState('classId');
  const [modal, setModal] = useState(null);
  const action = useMutation();
  const classes = teachingScope.classes;
  const filteredClasses = itemsOf(classes.data).filter(
    (row) =>
      (!filters.subjectId || row.subjectId === filters.subjectId) &&
      (!filters.semesterId || row.semesterId === filters.semesterId) &&
      (!filters.status || row.status === filters.status) &&
      (!search.trim() ||
        `${row.classCode || ''} ${itemsOf(subjects.data).find((item) => item.subjectId === row.subjectId)?.subjectName || ''}`
          .toLocaleLowerCase('vi')
          .includes(search.trim().toLocaleLowerCase('vi')))
  );
  const classRows = filteredClasses.slice(page * 20, (page + 1) * 20);
  const classPage = { size: 20, totalElements: filteredClasses.length };
  useEffect(() => {
    if (!classes.loading)
      setPage((current) => Math.min(current, Math.max(0, Math.ceil(filteredClasses.length / 20) - 1)));
  }, [classes.loading, filteredClasses.length]);
  const lookup = useResource(mode === 'students' ? '/api/v1/classes' : null, true);
  const detail = routeParam('classId');
  const change = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
    if (key === 'subjectId') {
      setSearch('');
    }
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
  };
  if (detail && mode !== 'students') return <LecturerClassDetail classId={detail} />;
  const save = async (e) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const body = { classCode: raw.classCode.trim(), maxStudents: Number(raw.maxStudents) };
    if (!modal.classId) {
      body.subjectId = raw.subjectId;
      body.semesterId = raw.semesterId;
      if (
        !itemsOf(activeSubjects.data).some((s) => s.subjectId === body.subjectId) ||
        !itemsOf(semesters.data).some((s) => s.semesterId === body.semesterId)
      ) {
        action.setError('Chọn học phần và học kỳ hợp lệ.');
        return;
      }
    }
    const result = await action.run(() =>
      modal.classId ? api.classes.update(modal.classId, body) : api.classes.create(body)
    );
    if (result.ok) {
      setModal(null);
      classes.reload();
    }
  };
  const edit = async (row) => {
    const result = await action.run(() => api.classes.get(row.classId), '');
    if (result.ok) setModal(result.data);
  };
  return (
    <LecturerPageShell
      currentPage={mode === 'students' ? 'lecturer_students.html' : 'lecturer_courses.html'}
      title={
        mode === 'students'
          ? 'Sinh viên lớp học'
          : filters.subjectId
            ? `Lớp học · ${itemsOf(subjects.data).find((row) => row.subjectId === filters.subjectId)?.subjectName || 'Môn học'}`
            : 'Lớp học'
      }
      eyebrow="QUẢN LÝ LỚP"
      description="Quản lý lớp được phân công và theo dõi hoạt động học tập."
    >
      {action.feedback}
      {mode === 'students' ? (
        <>
          <Lookup label="Lớp học" resource={lookup} idKey="classId" value={selected} onChange={setSelected} />
          {selected ? (
            <ClassPeople key={selected} classId={selected} />
          ) : (
            <Card className="mt-4 p-5">Chọn lớp để xem sinh viên.</Card>
          )}
        </>
      ) : (
        <Tabs
          hideSingleTab
          items={[{ id: 'classes', label: 'Lớp học' }]}
          filters={
            <>
              <Field
                label="Tìm lớp học"
                type="search"
                name="classSearch"
                value={search}
                placeholder="Mã lớp hoặc học phần…"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />
              <Lookup
                label="Học phần"
                resource={subjects}
                idKey="subjectId"
                value={filters.subjectId}
                placeholder="Tất cả"
                onChange={(v) => change('subjectId', v)}
              />
              <Lookup
                label="Học kỳ"
                resource={semesters}
                idKey="semesterId"
                value={filters.semesterId}
                placeholder="Tất cả"
                onChange={(v) => change('semesterId', v)}
              />
              <SelectField label="Trạng thái" value={filters.status} onChange={(e) => change('status', e.target.value)}>
                <option value="">Tất cả</option>
                {CLASS_STATES.map((v) => (
                  <option key={v} value={v}>
                    {labelOf(v)}
                  </option>
                ))}
              </SelectField>
            </>
          }
        >
          {() =>
            !filters.subjectId ? (
              <TeachingSubjectCards
                resource={subjects}
                classes={filteredClasses}
                search={search}
                onSelect={(value) => change('subjectId', value)}
              />
            ) : (
              <Resource value={classes}>
                {(data) => (
                  <>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {classRows.map((row) => (
                        <StatCard
                          key={row.classId}
                          label={displayName(row)}
                          value={row.maxStudents ?? '—'}
                          detail="sĩ số tối đa"
                          icon="school"
                          ribbonLabel={
                            itemsOf(subjects.data).find((item) => item.subjectId === row.subjectId)?.subjectCode ||
                            'LỚP HỌC PHẦN'
                          }
                          accentColor={
                            row.status === 'ACTIVE' ? '#E52220' : row.status === 'COMPLETED' ? '#15803D' : '#B45309'
                          }
                          onOpen={() =>
                            navigate(
                              queryPath('lecturer_course_detail.html', {
                                classId: row.classId,
                                semesterId: filters.semesterId,
                              })
                            )
                          }
                          footer={
                            <div className="space-y-2 text-body-sm text-slate-500">
                              <StatusBadge tone={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
                                {labelOf(row.status)}
                              </StatusBadge>
                              <p>
                                {displayName(itemsOf(subjects.data).find((item) => item.subjectId === row.subjectId))}
                              </p>
                              <p>
                                {displayName(
                                  itemsOf(semesters.data).find((item) => item.semesterId === row.semesterId)
                                )}
                              </p>
                            </div>
                          }
                          headerActions={
                            <ActionMenu
                              label={`Thao tác với ${displayName(row)}`}
                              disabled={action.busy}
                              items={[
                                { label: 'Chỉnh sửa', onSelect: () => edit(row) },
                                ...CLASS_STATES.filter((status) => status !== row.status).map((status) => ({
                                  label: `Chuyển sang ${labelOf(status)}`,
                                  onSelect: () =>
                                    action.confirm(
                                      `Chuyển ${displayName(row)} sang ${labelOf(status)}?`,
                                      () => api.classes.updateStatus(row.classId, { status }),
                                      classes.reload
                                    ),
                                })),
                              ]}
                            />
                          }
                        />
                      ))}
                    </div>
                    {!classRows.length && <Card className="p-5 text-slate-500">Không có lớp học phù hợp.</Card>}
                    <Pager data={classPage} page={page} onChange={setPage} />
                  </>
                )}
              </Resource>
            )
          }
        </Tabs>
      )}
      {modal && (
        <Modal title={modal.classId ? 'Chỉnh sửa lớp' : 'Tạo lớp'} busy={action.busy} onClose={() => setModal(null)}>
          {action.error && <p role="alert">{action.error}</p>}
          <Form className="app-form--two-columns grid gap-4" onSubmit={save}>
            {!modal.classId && (
              <>
                <Lookup label="Học phần *" resource={activeSubjects} idKey="subjectId" name="subjectId" required />
                <Lookup label="Học kỳ *" resource={semesters} idKey="semesterId" name="semesterId" required />
              </>
            )}
            <Field label="Mã lớp *" name="classCode" required defaultValue={modal.classCode || ''} />
            <Field
              label="Sĩ số tối đa *"
              name="maxStudents"
              type="number"
              min="1"
              step="1"
              required
              defaultValue={modal.maxStudents || 60}
            />
            <SubmitButton
              type="submit"
              disabled={
                action.busy ||
                (!modal.classId && (!itemsOf(activeSubjects.data).length || !itemsOf(semesters.data).length))
              }
            >
              Lưu lớp
            </SubmitButton>
          </Form>
        </Modal>
      )}
    </LecturerPageShell>
  );
}
function ClassPeople({ classId, subjectId = '', staff = false }) {
  const [progressStudent, setProgressStudent] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [addingStudent, setAddingStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const action = useMutation();
  const resource = useResource(
    staff
      ? `/api/v1/classes/${idPath(classId)}/staff`
      : queryPath(`/api/v1/classes/${idPath(classId)}/students`, { status, page, size: 20 })
  );
  return (
    <>
      {action.feedback}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!staff && (
          <SelectField
            label="Trạng thái"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            {['ACTIVE', 'DROPPED', 'COMPLETED'].map((v) => (
              <option key={v} value={v}>
                {labelOf(v)}
              </option>
            ))}
          </SelectField>
        )}
        {!staff && (
          <Button
            disabled={action.busy}
            icon="person_add"
            onClick={() => {
              setSelectedStudent(null);
              action.clear();
              setAddingStudent(true);
            }}
          >
            Thêm sinh viên
          </Button>
        )}
      </div>
      <Resource value={resource}>
        {(data) => (
          <>
            <Table
              server={!staff}
              rows={itemsOf(data)}
              columns={['Họ tên', 'Tài khoản', 'Email', staff ? 'Vai trò' : 'Trạng thái', 'Thao tác']}
              cells={(row) => {
                const studentId = row.studentId || row.userId;
                return [
                  staff ? (
                    displayName(row)
                  ) : (
                    <button
                      className="text-left font-semibold text-primary hover:underline"
                      onClick={() => setProgressStudent(row)}
                    >
                      {displayName(row)}
                    </button>
                  ),
                  row.username,
                  row.email,
                  labelOf(staff ? row.roleInClass : row.status),
                  <ActionMenu
                    label={`Thao tác với ${displayName(row)}`}
                    disabled={action.busy}
                    items={[
                      !staff &&
                        studentId &&
                        ['ACTIVE', 'DROPPED', 'COMPLETED']
                          .filter((status) => status !== row.status)
                          .map((status) => ({
                            label: `Chuyển sang ${labelOf(status)}`,
                            onSelect: () =>
                              action.confirm(
                                `Cập nhật trạng thái ${displayName(row)}?`,
                                () => api.classes.updateStudentStatus(classId, studentId, { status }),
                                resource.reload
                              ),
                          })),
                      !staff &&
                        studentId && {
                          label: 'Gỡ khỏi lớp',
                          danger: true,
                          onSelect: () =>
                            action.confirm(
                              `Gỡ ${displayName(row)} khỏi lớp?`,
                              () =>
                                staff
                                  ? api.classes.removeStaff(classId, row.userId)
                                  : api.classes.removeStudent(classId, studentId),
                              () => {
                                setPage(0);
                                resource.reload();
                              }
                            ),
                        },
                    ].flat()}
                  />,
                ];
              }}
            />
            {!staff && <Pager data={data} page={page} onChange={setPage} />}
          </>
        )}
      </Resource>
      {progressStudent && (
        <Modal
          title={`Tiến độ · ${displayName(progressStudent)}`}
          wide
          expandable
          onClose={() => setProgressStudent(null)}
        >
          <ClassObservation
            classId={classId}
            subjectId={subjectId}
            studentId={progressStudent.studentId || progressStudent.userId}
            tabs={['progress']}
          />
        </Modal>
      )}
      {addingStudent && (
        <Modal
          wide
          title="Thêm sinh viên vào lớp"
          busy={action.busy}
          onClose={() => !action.busy && setAddingStudent(false)}
        >
          <Form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!selectedStudent?.userId) return;
              const result = await action.run(
                () => api.classes.enrollSingle(classId, { studentId: selectedStudent.userId }),
                'Đã thêm sinh viên vào lớp.'
              );
              if (result.ok) {
                setAddingStudent(false);
                setSelectedStudent(null);
                setPage(0);
                resource.reload();
              }
            }}
          >
            <StudentSearchField disabled={action.busy} onSelect={setSelectedStudent} />
            <SubmitButton type="submit" busy={action.busy} disabled={!selectedStudent}>
              Thêm vào lớp
            </SubmitButton>
          </Form>
        </Modal>
      )}
    </>
  );
}

function ClassSchedules({ classId }) {
  const [modal, setModal] = useState(null);
  const action = useMutation();
  const resource = useResource(`/api/v1/classes/${idPath(classId)}/schedules`);
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      dayOfWeek: Number(values.dayOfWeek),
      startPeriod: values.startPeriod ? Number(values.startPeriod) : null,
      endPeriod: values.endPeriod ? Number(values.endPeriod) : null,
      startTime: values.startTime || null,
      endTime: values.endTime || null,
      room: values.room.trim() || null,
      building: values.building.trim() || null,
      lessonType: values.lessonType,
      notes: values.notes.trim() || null,
    };
    const result = await action.run(
      () =>
        modal.row ? api.classes.updateSchedule(modal.row.scheduleId, body) : api.classes.createSchedule(classId, body),
      modal.row ? 'Đã cập nhật lịch học.' : 'Đã thêm lịch học.'
    );
    if (result.ok) {
      setModal(null);
      resource.reload();
    }
  };
  return (
    <>
      {action.feedback}
      <div className="mt-4 flex justify-end">
        <Button onClick={() => setModal({ row: null })}>Thêm lịch học</Button>
      </div>
      <Resource value={resource}>
        {(data) => (
          <Table
            asCards
            rows={itemsOf(data)}
            columns={['Buổi học', 'Thời gian', 'Địa điểm', 'Ghi chú', 'Thao tác']}
            cells={(row) => [
              row.dayOfWeekText || `Thứ ${row.dayOfWeek ?? '—'}`,
              [
                row.startPeriod && `Tiết ${row.startPeriod}${row.endPeriod ? `–${row.endPeriod}` : ''}`,
                row.startTime && `${row.startTime}${row.endTime ? ` – ${row.endTime}` : ''}`,
              ]
                .filter(Boolean)
                .join(' · ') || '—',
              [row.building, row.room].filter(Boolean).join(' · ') || '—',
              row.notes || labelOf(row.lessonType) || '—',
              <ActionMenu
                label={`Thao tác với lịch ${row.dayOfWeekText || row.dayOfWeek || ''}`}
                disabled={action.busy}
                items={[
                  { label: 'Chỉnh sửa', onSelect: () => setModal({ row }) },
                  {
                    label: 'Xóa',
                    danger: true,
                    onSelect: () =>
                      action.confirm(
                        'Xóa lịch học này?',
                        () => api.classes.removeSchedule(row.scheduleId),
                        resource.reload
                      ),
                  },
                ]}
              />,
            ]}
          />
        )}
      </Resource>
      {modal && (
        <Modal
          title={modal.row ? 'Chỉnh sửa lịch học' : 'Thêm lịch học'}
          busy={action.busy}
          onClose={() => !action.busy && setModal(null)}
        >
          <Form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Thứ trong tuần" name="dayOfWeek" defaultValue={modal.row?.dayOfWeek ?? 2}>
                {[
                  [2, 'Thứ Hai'],
                  [3, 'Thứ Ba'],
                  [4, 'Thứ Tư'],
                  [5, 'Thứ Năm'],
                  [6, 'Thứ Sáu'],
                  [7, 'Thứ Bảy'],
                  [8, 'Chủ Nhật'],
                ].map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Loại buổi học" name="lessonType" defaultValue={modal.row?.lessonType || 'THEORY'}>
                {['THEORY', 'LAB', 'EXERCISE', 'EXAM'].map((value) => (
                  <option key={value} value={value}>
                    {labelOf(value)}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Tiết bắt đầu"
                name="startPeriod"
                type="number"
                min="1"
                defaultValue={modal.row?.startPeriod || ''}
              />
              <Field
                label="Tiết kết thúc"
                name="endPeriod"
                type="number"
                min="1"
                defaultValue={modal.row?.endPeriod || ''}
              />
              <Field label="Giờ bắt đầu" name="startTime" type="time" defaultValue={modal.row?.startTime || ''} />
              <Field label="Giờ kết thúc" name="endTime" type="time" defaultValue={modal.row?.endTime || ''} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tòa nhà" name="building" defaultValue={modal.row?.building || ''} />
              <Field label="Phòng học" name="room" defaultValue={modal.row?.room || ''} />
            </div>
            <Field label="Ghi chú" name="notes" multiline rows={3} defaultValue={modal.row?.notes || ''} />
            <SubmitButton busy={action.busy}>Lưu lịch học</SubmitButton>
          </Form>
        </Modal>
      )}
    </>
  );
}

function ClassNotification({ classId }) {
  const action = useMutation();
  const [creating, setCreating] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const result = await action.run(
      () =>
        api.notifications.sendToClass(classId, {
          title: values.title.trim(),
          content: values.content.trim(),
          type: values.type,
          referenceType: 'CLASS',
          referenceId: classId,
        }),
      'Đã tạo thông báo cho lớp.'
    );
    if (result.ok) {
      form.reset();
      setCreating(false);
    }
  };
  return (
    <>
      {action.feedback}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <Button
          icon="add"
          onClick={() => {
            action.clear();
            setCreating(true);
          }}
        >
          Tạo thông báo cho lớp
        </Button>
      </div>
      {creating && (
        <Modal title="Tạo thông báo cho lớp" busy={action.busy} onClose={() => !action.busy && setCreating(false)}>
          {action.error && (
            <p role="alert" className="mb-3 text-red-700">
              {action.error}
            </p>
          )}
          <Form className="grid gap-4" onSubmit={submit}>
            <Field label="Tiêu đề *" name="title" required />
            <Field label="Nội dung *" name="content" multiline rows={5} required />
            <SelectField label="Loại thông báo" name="type" defaultValue="ANNOUNCEMENT">
              <option value="ANNOUNCEMENT">Thông báo chung</option>
              <option value="SYSTEM">Hệ thống</option>
            </SelectField>
            <SubmitButton busy={action.busy}>Gửi thông báo</SubmitButton>
          </Form>
        </Modal>
      )}
    </>
  );
}
const observationLabels = { progress: 'Tiến độ', evidence: 'Minh chứng', activity: 'Hoạt động' };
export function ClassObservation({ classId, subjectId, studentId, tabs = ['progress', 'evidence', 'activity'] }) {
  const [tab, setTab] = useState(tabs[0]);
  const path = tab === 'activity' ? 'activity-logs' : tab;
  const resource = useResource(`/api/v1/classes/${idPath(classId)}/${path}`, tab === 'progress');
  const students = useResource(`/api/v1/classes/${idPath(classId)}/students`, true);
  const topics = useResource(subjectId ? `/api/v1/subjects/${idPath(subjectId)}/topics` : null, true);
  const person = (id) => displayName(itemsOf(students.data).find((s) => (s.studentId || s.userId) === id));
  return (
    <Tabs
      items={tabs.map((id) => ({ id, label: observationLabels[id] }))}
      activeId={tab}
      onChange={setTab}
      actions={
        <Button
          variant="secondary"
          onClick={() => {
            resource.reload();
            students.reload();
            topics.reload();
          }}
        >
          Làm mới
        </Button>
      }
    >
      {() => (
        <Resource value={resource}>
          {(data) =>
            tab === 'progress' ? (
              <Resource value={students}>
                {(people) => {
                  const renderProgress = (chapters) => (
                    <LecturerProgressView
                      key={`${classId}:${studentId || ''}`}
                      students={itemsOf(people)}
                      topics={itemsOf(chapters)}
                      progress={itemsOf(data)}
                      studentId={studentId}
                    />
                  );
                  return topics.enabled ? <Resource value={topics}>{renderProgress}</Resource> : renderProgress([]);
                }}
              </Resource>
            ) : (
              <Table
                rows={itemsOf(data).filter((row) => !studentId || (row.studentId || row.userId) === studentId)}
                columns={
                  tab === 'evidence'
                    ? ['Sinh viên', 'Nguồn', 'Tệp', 'Thời gian']
                    : ['Người thực hiện', 'Hành động', 'Đối tượng', 'Thời gian']
                }
                cells={(row) =>
                  tab === 'evidence'
                    ? [
                        person(row.studentId),
                        labelOf(row.sourceType),
                        <FileLink url={row.fileUrl} fileId={row.fileId}>Xem minh chứng</FileLink>,
                        dateText(row.createdAt),
                      ]
                    : [person(row.userId), labelOf(row.actionType), labelOf(row.objectType), dateText(row.createdAt)]
                }
              />
            )
          }
        </Resource>
      )}
    </Tabs>
  );
}
export function LecturerClassDetail({ classId = routeParam('classId') }) {
  const resource = useResource(classId ? `/api/v1/instructor/classes/${idPath(classId)}` : null);
  const [tab, setTab] = useState('overview');
  const snapshot = useResource(classId && tab === 'overview' ? `/api/v1/dashboard/class/${idPath(classId)}` : null);
  return (
    <LecturerPageShell
      currentPage="lecturer_courses.html"
      title={resource.data ? `${displayName(resource.data)} · ${labelOf(resource.data.status)}` : 'Chi tiết lớp học'}
      eyebrow="QUẢN LÝ LỚP"
      backHref={queryPath('lecturer_courses.html', {
        subjectId: resource.data?.subjectId,
        semesterId: routeParam('semesterId'),
      })}
    >
      <Resource value={resource} empty="Mở chi tiết từ danh sách lớp học.">
        {(row) => (
          <>
            <Tabs
              activeId={tab}
              onChange={setTab}
              items={[
                ['overview', 'Tổng quan'],
                ['students', 'Danh sách sinh viên'],
                ['curriculum', 'Khung chương trình'],
                ['private-materials', 'Học liệu riêng của lớp'],
                ['notifications', 'Thông báo'],
                ['progress', 'Tiến độ'],
                ['exams', 'Bài thi'],
                ['grading', 'Chấm bài'],
                ['experiments', 'Thí nghiệm'],
              ].map(([id, label]) => ({ id, label }))}
            >
              {() =>
                tab === 'overview' ? (
                  <>
                    <p className="my-4">Sĩ số tối đa: {row?.maxStudents ?? '—'}</p>
                    <Snapshot resource={snapshot} />
                  </>
                ) : tab === 'students' ? (
                  <ClassPeople key={`${classId}:${tab}`} classId={classId} subjectId={row.subjectId} />
                ) : tab === 'curriculum' ? (
                  <AdminCurriculumTree subjectId={row.subjectId} classId={classId} readOnly />
                ) : tab === 'private-materials' ? (
                  <LecturerClassMaterials classId={classId} subjectId={row.subjectId} />
                ) : tab === 'notifications' ? (
                  <ClassNotification classId={classId} />
                ) : ['progress', 'evidence', 'activity'].includes(tab) ? (
                  <ClassObservation key={tab} classId={classId} subjectId={row?.subjectId} tabs={[tab]} />
                ) : tab === 'exams' || tab === 'grading' ? (
                  <LecturerAssessmentApiPage embedded scopedClassId={classId} grading={tab === 'grading'} />
                ) : (
                  <LecturerExperimentsApiPage embedded scopedClassId={classId} scopedSubjectId={row.subjectId} />
                )
              }
            </Tabs>
          </>
        )}
      </Resource>
    </LecturerPageShell>
  );
}
export function LecturerStudentDetailApiPage() {
  const classId = routeParam('classId'),
    studentId = routeParam('studentId');
  const resource = useResource(
    classId && studentId ? `/api/v1/dashboard/class/${idPath(classId)}/student/${idPath(studentId)}` : null
  );
  const classInfo = useResource(classId ? `/api/v1/classes/${idPath(classId)}` : null);
  const students = useResource(classId ? `/api/v1/classes/${idPath(classId)}/students` : null, true);
  const student = itemsOf(students.data).find((s) => (s.studentId || s.userId) === studentId);
  const detailTitle = [student && displayName(student), classInfo.data && displayName(classInfo.data)]
    .filter(Boolean)
    .join(' · ');
  return (
    <LecturerPageShell
      currentPage="lecturer_students.html"
      title={detailTitle || 'Chi tiết sinh viên'}
      eyebrow="THEO DÕI HỌC TẬP"
    >
      <Snapshot resource={resource} />
      {classId && studentId && (
        <ClassObservation classId={classId} studentId={studentId} subjectId={classInfo.data?.subjectId} />
      )}
    </LecturerPageShell>
  );
}
