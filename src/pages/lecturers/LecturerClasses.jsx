import { Form, SubmitButton } from '../../components/Form.jsx';
import React, { useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { queryPath } from '../../lib/lecturerUtils.js';
import { navigate } from '../../lib/navigation.js';
import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { ActionMenu } from '../../components/ActionMenu.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { StudentSearchField } from '../../components/StudentSearchField.jsx';
import { LecturerProgressView } from './LecturerProgressView.jsx';
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
  const classes = useResource('/api/v1/instructor/classes', true);
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
    >
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
    </LecturerPageShell>
  );
}
export function LecturerClassesApiPage() {
  const classes = useResource('/api/v1/instructor/classes', true);
  const detail = routeParam('classId');
  if (detail) return <LecturerClassDetail classId={detail} />;
  return <LecturerPageShell currentPage="lecturer_courses.html" title="L?p ???c ph?n c?ng">
    <Resource value={classes}>{(data) => <Table asCards rows={itemsOf(data)} columns={['L?p', 'M?n', 'Tr?ng th?i', '']} cells={(row) => [row.classCode, row.subjectName, <StatusBadge status={row.status} />, <Button onClick={() => navigate(queryPath('lecturer_course_detail.html', {classId: row.classId}))}>M? l?p</Button>]} />}</Resource>
  </LecturerPageShell>;
}
function ClassPeople({ classId, staff = false }) {
  const resource = useResource(`/api/v1/classes/${idPath(classId)}/${staff ? 'staff' : 'students'}`, !staff);
  return <Resource value={resource}>{(data) => <Table rows={itemsOf(data)} columns={['H? t?n', 'Email', staff ? 'Vai tr?' : 'Tr?ng th?i']} cells={(row) => [displayName(row), row.email, labelOf(staff ? row.roleInClass : row.status)]} />}</Resource>;
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
  const submit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result = await action.run(
      () =>
        api.notifications.sendToClass(classId, {
          title: values.title.trim(),
          content: values.content.trim(),
          type: values.type,
          referenceType: 'CLASS',
        }),
      'Đã gửi thông báo đến sinh viên đang học trong lớp.'
    );
    if (result.ok) event.currentTarget.reset();
  };
  return (
    <Card className="mt-4 max-w-3xl p-5">
      {action.feedback}
      <Form className="grid gap-4" onSubmit={submit}>
        <Field label="Tiêu đề *" name="title" required />
        <Field label="Nội dung *" name="content" multiline rows={5} required />
        <SelectField label="Loại thông báo" name="type" defaultValue="ANNOUNCEMENT">
          <option value="ANNOUNCEMENT">Thông báo chung</option>
          <option value="SYSTEM">Hệ thống</option>
        </SelectField>
        <SubmitButton busy={action.busy}>Gửi thông báo</SubmitButton>
      </Form>
    </Card>
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
                        <FileLink url={row.fileUrl}>Xem minh chứng</FileLink>,
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
                ['schedules', 'Lịch học'],
                ['notifications', 'Thông báo'],
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
                ) : tab === 'schedules' ? (
                  <ClassSchedules classId={classId} />
                ) : tab === 'notifications' ? (
                  <ClassNotification classId={classId} />
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
  const classInfo = useResource(classId ? `/api/v1/instructor/classes/${idPath(classId)}` : null);
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
