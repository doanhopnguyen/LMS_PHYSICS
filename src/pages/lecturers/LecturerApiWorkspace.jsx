import { Form, SubmitButton } from '../../components/Form.jsx';
import { FormDialog as Modal } from '../../components/FormDialog.jsx';
import React, { useRef, useState } from 'react';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { DashboardOverview } from '../../components/DashboardOverview.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Table } from './LecturerShared.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { listItems, useApiData } from '../../hooks/useApiData.js';
import { apiRequest } from '../../lib/apiClient.js';

const nameOf = (row) =>
  row?.className ||
  row?.classCode ||
  row?.title ||
  row?.name ||
  row?.subjectName ||
  row?.username ||
  row?.userId ||
  '—';
const state = (value) => (
  <StatusBadge
    tone={['ACTIVE', 'APPROVED', 'OPEN'].includes(value) ? 'success' : value === 'DRAFT' ? 'warning' : 'neutral'}
  >
    {value || '—'}
  </StatusBadge>
);
function Resource({ resource, children }) {
  if (resource.loading)
    return (
      <Card className="mt-5 p-6" role="status">
        Đang tải dữ liệu…
      </Card>
    );
  if (resource.error)
    return (
      <Card className="mt-5 p-6" role="alert">
        {resource.error}{' '}
        <Button variant="secondary" onClick={resource.reload}>
          Thử lại
        </Button>
      </Card>
    );
  return children(listItems(resource.data));
}
function ClassSelect({ classes, value, onChange, label = 'Lớp học' }) {
  return (
    <SelectField
      label={label}
      name="classId"
      className="min-w-64"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Chọn lớp</option>
      {classes.map((item) => (
        <option key={item.classId} value={item.classId}>
          {nameOf(item)}
        </option>
      ))}
    </SelectField>
  );
}
function useAction() {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const run = async (path, options, success) => {
    if (pending.current) return null;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const data = await apiRequest(path, options);
      setNotice(success);
      return data ?? true;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return {
    notice,
    error,
    busy,
    run,
    setError,
    clear: () => {
      setNotice('');
      setError('');
    },
  };
}

export function LecturerDashboardApiPage() {
  const classes = useApiData('/api/v1/classes?page=0&size=100');
  const rows = listItems(classes.data);
  const active = rows.filter((item) => item.status === 'ACTIVE');
  return (
    <LecturerPageShell
      currentPage="lecturer_dashboard.html"
      title="Tổng quan giảng viên"
      eyebrow="KHU VỰC GIẢNG VIÊN"
      description="Theo dõi lớp học, kỳ thi và hoạt động được cấp quyền."
    >
      <DashboardOverview role="INSTRUCTOR">
        <MetricGrid
          items={[
            {
              label: 'Lớp phụ trách',
              value: classes.data?.totalElements ?? rows.length,
              detail: 'dữ liệu thực',
              icon: 'groups',
            },
            {
              label: 'Lớp đang hoạt động',
              value: active.length,
              detail: 'trong danh sách hiện tại',
              icon: 'school',
              tone: 'success',
            },
            {
              label: 'Sức chứa lớp',
              value: rows.reduce((sum, item) => sum + (item.maxStudents || 0), 0),
              detail: 'tổng chỉ tiêu',
              icon: 'group_add',
            },
            {
              label: 'Lớp nháp',
              value: rows.filter((item) => item.status === 'DRAFT').length,
              detail: 'cần thiết lập',
              icon: 'edit_note',
              tone: 'warning',
            },
          ]}
        />
        <Card className="col-span-full p-6">
          <h2 className="font-bold">Lớp được cấp quyền</h2>
          <Resource resource={classes}>
            {(items) => (
              <div className="mt-4 flex flex-wrap gap-2">
                {items.slice(0, 8).map((item) => (
                  <a
                    key={item.classId}
                    href={`lecturer_courses.html?classId=${item.classId}`}
                    className="rounded-xl border border-[#E2E8F0] px-3 py-2 font-semibold hover:border-primary"
                  >
                    {nameOf(item)}
                  </a>
                ))}
              </div>
            )}
          </Resource>
        </Card>
      </DashboardOverview>
    </LecturerPageShell>
  );
}

export function LecturerAssessmentApiPage({ grading = false }) {
  const classes = useApiData('/api/v1/classes?page=0&size=100');
  const rows = listItems(classes.data);
  const [classId, setClassId] = useState('');
  const [creating, setCreating] = useState(false);
  const selected = classId || rows[0]?.classId || '';
  const exams = useApiData(selected ? `/api/v1/exams/class/${encodeURIComponent(selected)}` : null);
  const action = useAction();
  const createExam = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result = await action.run(
      '/api/v1/exams',
      {
        method: 'POST',
        body: {
          classId: selected,
          matrixId: values.matrixId.trim(),
          title: values.title.trim(),
          examType: values.examType,
          durationMinutes: Number(values.durationMinutes),
          startTime: new Date(values.startTime).toISOString(),
          endTime: new Date(values.endTime).toISOString(),
        },
      },
      'Đã tạo đề thi.'
    );
    if (result) {
      setCreating(false);
      exams.reload();
    }
  };
  return (
    <LecturerPageShell
      currentPage={grading ? 'lecturer_grading.html' : 'lecturer_assessments.html'}
      title={grading ? 'Chấm bài kiểm tra' : 'Bài tập & kiểm tra'}
      eyebrow="ĐÁNH GIÁ"
      description={grading ? 'Theo dõi kỳ thi và thông tin đánh giá của lớp.' : 'Theo dõi các kỳ thi theo lớp.'}
    >
      <AuthAlert>{action.notice}</AuthAlert>
      <AuthAlert error>{action.error}</AuthAlert>
      <div className="mt-6">
        <Tabs
          items={[{ id: 'exams', label: 'Kỳ thi của lớp' }]}
          actions={
            <>
              <ClassSelect classes={rows} value={selected} onChange={setClassId} />
              {!grading && (
                <Button icon="add" disabled={!selected} onClick={() => setCreating(true)}>
                  Tạo đề thi
                </Button>
              )}
            </>
          }
        >
          {() => (
            <Resource resource={exams}>
              {(items) => (
                <Table
                  rows={items}
                  columns={['Kỳ thi', 'Loại', 'Thời gian', 'Số câu']}
                  cells={(item) => [
                    nameOf(item),
                    item.examType || '—',
                    item.startTime ? new Date(item.startTime).toLocaleString('vi-VN') : '—',
                    item.totalQuestions ?? '—',
                  ]}
                />
              )}
            </Resource>
          )}
        </Tabs>
      </div>
      {creating && (
        <Modal title="Tạo đề thi" busy={action.busy} onClose={() => setCreating(false)}>
          <Form className="grid gap-4" busy={action.busy} onSubmit={createExam}>
            <label className="text-body-sm font-semibold">Tên đề thi<input name="title" required className="mt-2 w-full rounded-xl border p-3" /></label>
            <label className="text-body-sm font-semibold">Ma trận đề (ID)<input name="matrixId" required className="mt-2 w-full rounded-xl border p-3" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-body-sm font-semibold">Loại đề<select name="examType" defaultValue="PRACTICE" className="mt-2 w-full rounded-xl border bg-white p-3"><option value="PRACTICE">Luyện tập</option><option value="MIDTERM">Giữa kỳ</option><option value="FINAL">Cuối kỳ</option></select></label>
              <label className="text-body-sm font-semibold">Thời lượng (phút)<input name="durationMinutes" type="number" min="1" required className="mt-2 w-full rounded-xl border p-3" /></label>
              <label className="text-body-sm font-semibold">Bắt đầu<input name="startTime" type="datetime-local" required className="mt-2 w-full rounded-xl border p-3" /></label>
              <label className="text-body-sm font-semibold">Kết thúc<input name="endTime" type="datetime-local" required className="mt-2 w-full rounded-xl border p-3" /></label>
            </div>
            <div className="flex justify-end gap-3"><Button type="button" variant="secondary" disabled={action.busy} onClick={() => setCreating(false)}>Hủy</Button><SubmitButton busy={action.busy}>Tạo đề thi</SubmitButton></div>
          </Form>
        </Modal>
      )}
    </LecturerPageShell>
  );
}

export function LecturerGradingApiPage() {
  return <LecturerAssessmentApiPage grading />;
}

export function LecturerAnalyticsApiPage() {
  const [tab, setTab] = useState('difficulty');
  const paths = {
    difficulty: '/api/v1/analytics/topic-difficulty',
    questions: '/api/v1/analytics/question-quality',
    materials: '/api/v1/analytics/material-effectiveness',
    ai: '/api/v1/analytics/ai-gaps',
  };
  const resource = useApiData(paths[tab]);
  return (
    <LecturerPageShell
      currentPage="lecturer_analytics.html"
      title="Phân tích học tập"
      eyebrow="DỮ LIỆU LỚP HỌC"
      description="Báo cáo chất lượng nội dung và hoạt động học tập."
    >
      <div className="mt-6">
        <Tabs
          items={[
            { id: 'difficulty', label: 'Độ khó chủ đề' },
            { id: 'questions', label: 'Chất lượng câu hỏi' },
            { id: 'materials', label: 'Hiệu quả học liệu' },
            { id: 'ai', label: 'Khoảng trống AI' },
          ]}
          activeId={tab}
          onChange={setTab}
          actions={
            <Button variant="secondary" onClick={resource.reload}>
              Làm mới
            </Button>
          }
        >
          {() => (
            <Resource resource={resource}>
              {(items) => (
                <Card className="mt-5 overflow-auto p-5">
                  {items.length ? (
                    <pre className="whitespace-pre-wrap text-body-sm">{JSON.stringify(items, null, 2)}</pre>
                  ) : (
                    'Chưa có dữ liệu phân tích.'
                  )}
                </Card>
              )}
            </Resource>
          )}
        </Tabs>
      </div>
    </LecturerPageShell>
  );
}

export function LecturerExperimentsApiPage() {
  const subjects = useApiData('/api/v1/subjects?isActive=true&page=0&size=100');
  const classes = useApiData('/api/v1/classes?page=0&size=100');
  const subjectRows = listItems(subjects.data);
  const classRows = listItems(classes.data);
  const [subjectId, setSubjectId] = useState('');
  const selectedSubject = subjectId || subjectRows[0]?.subjectId || '';
  const experiments = useApiData(
    selectedSubject ? `/api/v1/experiments?subjectId=${encodeURIComponent(selectedSubject)}` : null
  );
  const [modal, setModal] = useState(null);
  const action = useAction();
  const submit = async (event) => {
    event.preventDefault();
    if (action.busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (modal === 'create' && values.sceneAssetsJson?.trim()) {
      try {
        JSON.parse(values.sceneAssetsJson);
      } catch {
        action.setError('Cấu hình tài nguyên phải là JSON hợp lệ.');
        return;
      }
    }
    if (modal !== 'create' && !Number.isFinite(new Date(values.dueDate).getTime())) {
      action.setError('Vui lòng chọn hạn nộp hợp lệ.');
      return;
    }
    let result;
    if (modal === 'create')
      result = await action.run(
        '/api/v1/experiments',
        {
          method: 'POST',
          body: {
            subjectId: selectedSubject,
            title: values.title,
            description: values.description,
            sceneAssetUrl: values.sceneAssetUrl,
            sceneAssetsJson: values.sceneAssetsJson || '',
            instructions: values.instructions || '',
            orderIndex: Number(values.orderIndex),
          },
        },
        'Đã tạo thí nghiệm.'
      );
    else
      result = await action.run(
        `/api/v1/experiments/${encodeURIComponent(modal.experimentId)}/assign`,
        {
          method: 'POST',
          body: {
            classId: values.classId,
            dueDate: new Date(values.dueDate).toISOString(),
            instructionsOverride: values.instructionsOverride || '',
          },
        },
        'Đã giao thí nghiệm cho lớp.'
      );
    if (result) {
      setModal(null);
      experiments.reload();
    }
  };
  const subjectSelect = (
    <SelectField
      label="Học phần"
      name="experiment-subject"
      className="min-w-64"
      value={selectedSubject}
      onChange={(event) => setSubjectId(event.target.value)}
    >
      <option value="">Chọn học phần</option>
      {subjectRows.map((item) => (
        <option key={item.subjectId} value={item.subjectId}>
          {item.subjectCode ? `${item.subjectCode} · ` : ''}
          {item.subjectName || item.subjectId}
        </option>
      ))}
    </SelectField>
  );
  return (
    <LecturerPageShell
      currentPage="lecturer_labs.html"
      title="Thí nghiệm 3D"
      eyebrow="THỰC HÀNH"
      description="Tạo và giao thí nghiệm theo học phần, lớp học."
    >
      <AuthAlert>{action.notice}</AuthAlert>
      <AuthAlert error>{action.error}</AuthAlert>
      {modal && (
        <Modal
          busy={action.busy}
          title={modal === 'create' ? 'Tạo thí nghiệm' : `Giao: ${modal.title}`}
          onClose={() => !action.busy && setModal(null)}
        >
          <AuthAlert error>{action.error}</AuthAlert>
          <Form className="grid gap-4" onSubmit={submit}>
            {modal === 'create' ? (
              <>
                <input name="title" required placeholder="Tên thí nghiệm" className="rounded-xl border p-3" />
                <textarea name="description" required placeholder="Mô tả" className="rounded-xl border p-3" />
                <input
                  name="sceneAssetUrl"
                  required
                  placeholder="URL tài nguyên 3D"
                  className="rounded-xl border p-3"
                />
                <textarea
                  name="sceneAssetsJson"
                  placeholder="Cấu hình tài nguyên (nếu có)"
                  className="rounded-xl border p-3"
                />
                <textarea name="instructions" placeholder="Hướng dẫn" className="rounded-xl border p-3" />
                <input
                  name="orderIndex"
                  type="number"
                  min="0"
                  required
                  placeholder="Thứ tự"
                  className="rounded-xl border p-3"
                />
              </>
            ) : (
              <>
                <SelectField label="Lớp học" name="classId" required>
                  <option value="">Chọn lớp</option>
                  {classRows
                    .filter((item) => !item.subjectId || item.subjectId === selectedSubject)
                    .map((item) => (
                      <option key={item.classId} value={item.classId}>
                        {item.classCode || item.className || item.classId}
                      </option>
                    ))}
                </SelectField>
                <input name="dueDate" required type="datetime-local" className="rounded-xl border p-3" />
                <textarea
                  name="instructionsOverride"
                  placeholder="Hướng dẫn bổ sung"
                  className="rounded-xl border p-3"
                />
              </>
            )}
            <SubmitButton type="submit" disabled={action.busy}>
              {action.busy ? 'Đang lưu…' : modal === 'create' ? 'Tạo thí nghiệm' : 'Giao bài'}
            </SubmitButton>
          </Form>
        </Modal>
      )}
      <div className="mt-6">
        <Tabs
          items={[{ id: 'experiments', label: 'Danh sách thí nghiệm' }]}
          actions={
            <>
              {subjectSelect}
              <Button disabled={!selectedSubject} onClick={() => setModal('create')}>
                Tạo thí nghiệm
              </Button>
            </>
          }
        >
          {() => (
            <Resource resource={experiments}>
              {(items) => (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {items.length ? (
                    items.map((item) => (
                      <Card key={item.experimentId} className="p-5">
                        <h2 className="font-bold">{item.title}</h2>
                        <p className="mt-2 text-body-sm text-[#64748B]">{item.description || 'Chưa có mô tả.'}</p>
                        <Button className="mt-4" variant="secondary" onClick={() => setModal(item)}>
                          Giao cho lớp
                        </Button>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-5 text-[#64748B]">Chưa có thí nghiệm cho học phần đã chọn.</Card>
                  )}
                </div>
              )}
            </Resource>
          )}
        </Tabs>
      </div>
    </LecturerPageShell>
  );
}
