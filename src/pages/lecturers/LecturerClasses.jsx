import { Form, SubmitButton } from '../../components/Form.jsx';
import React, { useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { queryPath } from '../../lib/lecturerUtils.js';
import { navigate } from '../../lib/navigation.js';
import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { ActionMenu } from '../../components/ActionMenu.jsx';
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
  const classId = selected || rows[0]?.classId || '';
  const snapshot = useResource(classId ? `/api/v1/dashboard/class/${idPath(classId)}` : null);
  const students = useResource(classId ? `/api/v1/classes/${idPath(classId)}/students?page=0&size=1` : null);
  return (
    <LecturerPageShell
      currentPage="lecturer_dashboard.html"
      title="Tổng quan giảng viên"
      eyebrow="KHU VỰC GIẢNG VIÊN"
      description="Theo dõi dữ liệu lớp học và lịch kỳ thi thực tế."
    >
      <Tabs
        items={[{ id: 'overview', label: 'Tổng quan' }]}
        actions={<Lookup label="Lớp học" resource={classes} idKey="classId" value={classId} onChange={select} />}
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
    </LecturerPageShell>
  );
}
export function LecturerClassesApiPage({ mode = 'classes' }) {
  const subjects = useResource('/api/v1/subjects', true);
  const activeSubjects = useResource('/api/v1/subjects?isActive=true', true);
  const semesters = useResource('/api/v1/semesters');
  const [filters, setFilters] = useState({ subjectId: '', semesterId: '', status: '' });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useQueryState('classId');
  const [modal, setModal] = useState(null);
  const action = useMutation();
  const classes = useResource(queryPath('/api/v1/classes', { ...filters, page, size: 20 }));
  const lookup = useResource(mode === 'students' ? '/api/v1/classes' : null, true);
  const detail = routeParam('classId');
  const change = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
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
      title={mode === 'students' ? 'Sinh viên lớp học' : 'Học phần & lớp học'}
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
          items={[{ id: 'classes', label: 'Lớp học' }]}
          actions={
            <>
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
              <Button
                onClick={() => {
                  action.clear();
                  setModal({});
                }}
              >
                Tạo lớp
              </Button>
            </>
          }
        >
          {() => (
            <Resource value={classes}>
              {(data) => (
                <>
                  <Table
                    server
                    rows={itemsOf(data)}
                    columns={['Lớp', 'Học phần', 'Học kỳ', 'Sĩ số tối đa', 'Trạng thái', 'Thao tác']}
                    cells={(row) => [
                      <a
                        className="font-semibold text-primary"
                        href={`lecturer_course_detail.html?classId=${idPath(row.classId)}`}
                      >
                        {displayName(row)}
                      </a>,
                      displayName(itemsOf(subjects.data).find((s) => s.subjectId === row.subjectId)),
                      displayName(itemsOf(semesters.data).find((s) => s.semesterId === row.semesterId)),
                      row.maxStudents,
                      labelOf(row.status),
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
                      />,
                    ]}
                  />
                  <Pager data={data} page={page} onChange={setPage} />
                </>
              )}
            </Resource>
          )}
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
function ClassPeople({ classId, staff = false }) {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
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
                  displayName(row),
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
                      (staff ? row.userId : studentId) && {
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
    </>
  );
}
const observationLabels = { progress: 'Tiến độ', evidence: 'Minh chứng', activity: 'Hoạt động' };
export function ClassObservation({ classId, subjectId, studentId, tabs = ['progress', 'evidence', 'activity'] }) {
  const [tab, setTab] = useState(tabs[0]);
  const path = tab === 'activity' ? 'activity-logs' : tab;
  const resource = useResource(`/api/v1/classes/${idPath(classId)}/${path}`);
  const students = useResource(`/api/v1/classes/${idPath(classId)}/students`, true);
  const topics = useResource(subjectId ? `/api/v1/subjects/${idPath(subjectId)}/topics` : null);
  const person = (id) => displayName(itemsOf(students.data).find((s) => (s.studentId || s.userId) === id));
  return (
    <Tabs
      items={tabs.map((id) => ({ id, label: observationLabels[id] }))}
      activeId={tab}
      onChange={setTab}
      actions={
        <Button variant="secondary" onClick={resource.reload}>
          Làm mới
        </Button>
      }
    >
      {() => (
        <Resource value={resource}>
          {(data) => (
            <Table
              rows={itemsOf(data).filter((row) => !studentId || (row.studentId || row.userId) === studentId)}
              columns={
                tab === 'progress'
                  ? ['Sinh viên', 'Chủ đề', 'Tiến độ', 'Truy cập gần nhất']
                  : tab === 'evidence'
                    ? ['Sinh viên', 'Nguồn', 'Tệp', 'Thời gian']
                    : ['Người thực hiện', 'Hành động', 'Đối tượng', 'Thời gian']
              }
              cells={(row) =>
                tab === 'progress'
                  ? [
                      person(row.studentId),
                      displayName(itemsOf(topics.data).find((t) => t.topicId === row.topicId)),
                      row.progressPercent == null ? '—' : `${row.progressPercent}%`,
                      dateText(row.lastAccessedAt),
                    ]
                  : tab === 'evidence'
                    ? [
                        person(row.studentId),
                        labelOf(row.sourceType),
                        <FileLink url={row.fileUrl}>Xem minh chứng</FileLink>,
                        dateText(row.createdAt),
                      ]
                    : [person(row.userId), labelOf(row.actionType), labelOf(row.objectType), dateText(row.createdAt)]
              }
            />
          )}
        </Resource>
      )}
    </Tabs>
  );
}
export function LecturerClassDetail({ classId = routeParam('classId') }) {
  const resource = useResource(classId ? `/api/v1/classes/${idPath(classId)}` : null);
  const [tab, setTab] = useState('overview');
  const snapshot = useResource(classId && tab === 'overview' ? `/api/v1/dashboard/class/${idPath(classId)}` : null);
  return (
    <LecturerPageShell
      currentPage="lecturer_courses.html"
      title={resource.data ? `${displayName(resource.data)} · ${labelOf(resource.data.status)}` : 'Chi tiết lớp học'}
      eyebrow="QUẢN LÝ LỚP"
    >
      <Resource value={resource} empty="Mở chi tiết từ danh sách lớp học.">
        {(row) => (
          <>
            <Tabs
              activeId={tab}
              onChange={setTab}
              items={[
                ['overview', 'Tổng quan'],
                ['students', 'Sinh viên'],
                ['staff', 'Nhân sự'],
                ['progress', 'Tiến độ'],
                ['evidence', 'Minh chứng'],
                ['activity', 'Hoạt động'],
                ['exams', 'Bài thi'],
                ['experiments', 'Thí nghiệm'],
              ].map(([id, label]) => ({ id, label }))}
            >
              {() =>
                tab === 'overview' ? (
                  <>
                    <p className="my-4">Sĩ số tối đa: {row?.maxStudents ?? '—'}</p>
                    <Snapshot resource={snapshot} />
                  </>
                ) : ['students', 'staff'].includes(tab) ? (
                  <ClassPeople key={`${classId}:${tab}`} classId={classId} staff={tab === 'staff'} />
                ) : ['progress', 'evidence', 'activity'].includes(tab) ? (
                  <ClassObservation key={tab} classId={classId} subjectId={row?.subjectId} tabs={[tab]} />
                ) : (
                  <Card className="mt-4 p-5">
                    <a
                      className="font-semibold text-primary"
                      href={
                        tab === 'exams'
                          ? `lecturer_assessments.html?classId=${idPath(classId)}`
                          : `lecturer_labs.html?classId=${idPath(classId)}&subjectId=${idPath(row?.subjectId || '')}`
                      }
                    >
                      Mở {tab === 'exams' ? 'bài thi' : 'thí nghiệm'} của lớp →
                    </a>
                  </Card>
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
