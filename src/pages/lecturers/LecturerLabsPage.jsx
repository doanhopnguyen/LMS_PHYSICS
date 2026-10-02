import { FormDialog as SharedFormDialog } from '../../components/FormDialog.jsx';
import { FormField as SharedFormField } from '../../components/FormField.jsx';
import { SelectField as SharedSelectField } from '../../components/SelectField.jsx';
import { PaginatedList } from '../../components/Pagination.jsx';
import React, { useMemo, useState } from 'react';
import { useAcademicClass } from '../../lib/academicScope.js';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { labs } from '../../data/lmsData.js';
import {
  labAssignments as initialAssignments,
  labAssignmentStatusMeta,
  labEvidenceLabels,
  labGradingStatusMeta,
  labSubmissions,
  lecturerCourses,
  lecturerLabMetadata,
  lecturerStudents,
} from '../../data/lecturerData.js';
import { loadLabGradings } from '../../lib/labGradingState.js';

const labCatalog = labs.map((lab, index) => ({
  ...lab,
  id: `LAB${String(index + 1).padStart(3, '0')}`,
  ...lecturerLabMetadata[`LAB${String(index + 1).padStart(3, '0')}`],
}));
const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const defaultForm = {
  classIds: [],
  startAt: '',
  dueAt: '',
  instructions: '',
  requiredEvidence: ['REPORT', 'MEASUREMENT_DATA', 'CONCLUSION'],
  attemptsAllowed: 3,
};

function LabDetailModal({ lab, assignments, onClose, onAssign }) {
  const assigned = assignments.filter((item) => item.labId === lab.id);
  return (
    <SharedFormDialog title={<>{lab.title}</>} onClose={onClose} wide>
      <div>
        <div>
          <p className="text-label-md font-bold text-primary">{lab.code}</p>

          <p className="mt-1 text-body-sm text-[#64748B]">
            {lab.chapter} · {lab.duration} phút
          </p>
        </div>
      </div>
      <div className="space-y-6 p-5 md:p-6">
        <div>
          <h3 className="font-bold">Mục tiêu</h3>
          <p className="mt-2 text-body-md text-[#64748B]">{lab.objective}</p>
        </div>
        <div>
          <h3 className="font-bold">Mô tả</h3>
          <p className="mt-2 text-body-md text-[#64748B]">{lab.description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <h3 className="font-bold">Hướng dẫn thực hiện</h3>
            <ol className="mt-3 space-y-2 text-body-sm text-[#64748B]">
              {lab.instructions.map((item, index) => (
                <li key={item}>
                  {index + 1}. {item}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="font-bold">Đại lượng cần đo</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {lab.measurements.map((item) => (
                <StatusBadge key={item} tone="neutral">
                  {item}
                </StatusBadge>
              ))}
            </div>
            <h3 className="mt-5 font-bold">Thông số mô phỏng</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {lab.parameters.map((item) => (
                <StatusBadge key={item} tone="neutral">
                  {item}
                </StatusBadge>
              ))}
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-bold">Minh chứng có thể yêu cầu</h3>
          <p className="mt-2 text-body-sm text-[#64748B]">
            Báo cáo, ảnh kết quả mô phỏng, bảng số liệu, biểu đồ và nhận xét kết luận.
          </p>
        </div>
        <div>
          <h3 className="font-bold">Lớp đã được giao</h3>
          <div className="mt-3 space-y-2">
            {assigned.length ? (
              assigned.map((item) => (
                <Card as="div" key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <span>{item.classIds.join(', ')}</span>
                  <StatusBadge tone={labAssignmentStatusMeta[item.status].tone}>
                    {labAssignmentStatusMeta[item.status].label}
                  </StatusBadge>
                </Card>
              ))
            ) : (
              <p className="text-body-sm text-[#64748B]">Chưa giao cho lớp nào.</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <a href={`3d_workspace.html?mode=lecturer-preview&lab=${lab.id}`}>
            <Button variant="secondary" icon="view_in_ar">
              Xem trước mô phỏng
            </Button>
          </a>
          <Button icon="assignment_add" onClick={() => onAssign(lab)}>
            Giao thí nghiệm
          </Button>
        </div>
      </div>
    </SharedFormDialog>
  );
}

function AssignmentWizard({ lab, onCancel, onConfirm }) {
  const [form, setForm] = useState({ ...defaultForm, instructions: lab.instructions.join('\n') });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const toggle = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  const validate = () => {
    const next = {};
    if (!form.classIds.length) next.classIds = 'Chọn ít nhất một lớp.';
    if (!form.startAt) next.startAt = 'Chọn thời gian bắt đầu.';
    if (!form.dueAt) next.dueAt = 'Chọn hạn nộp.';
    if (form.startAt && form.dueAt && new Date(form.dueAt) <= new Date(form.startAt))
      next.dueAt = 'Hạn nộp phải sau thời gian bắt đầu.';
    if (!form.requiredEvidence.length) next.requiredEvidence = 'Chọn ít nhất một loại minh chứng.';
    setErrors(next);
    return !Object.keys(next).length;
  };
  const studentCount = form.classIds.reduce(
    (sum, className) => sum + (lecturerCourses.find((course) => course.className === className)?.students ?? 0),
    0
  );
  return (
    <SharedFormDialog title={<>Giao thí nghiệm cho lớp</>} onClose={step ? () => setStep(0) : onCancel} wide>
      <div className="border-b border-[#E2E8F0] p-5 md:p-6">
        <p className="text-label-md font-bold text-primary">
          {step === 0 ? 'BƯỚC 1 · THIẾT LẬP' : 'BƯỚC 2 · XÁC NHẬN'}
        </p>

        <p className="mt-1 text-body-sm text-[#64748B]">
          {lab.code} · {lab.title}
        </p>
      </div>
      {step === 0 ? (
        <div className="space-y-5 p-5 md:p-6">
          <fieldset>
            <legend className="font-semibold">Lớp học *</legend>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {lecturerCourses.map((course) => (
                <label
                  key={course.className}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${form.classIds.includes(course.className) ? 'border-primary bg-[#FEF2F2]' : 'border-[#E2E8F0]'}`}
                >
                  <input
                    type="checkbox"
                    checked={form.classIds.includes(course.className)}
                    onChange={() => toggle('classIds', course.className)}
                    className="h-5 w-5 accent-[#E52220]"
                  />
                  <span>
                    <strong className="block">{course.className}</strong>
                    <small className="text-[#64748B]">{course.students} sinh viên</small>
                  </span>
                </label>
              ))}
            </div>
            {errors.classIds && <p className="mt-2 text-body-sm font-semibold text-primary">{errors.classIds}</p>}
          </fieldset>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SharedFormField
              type="datetime-local"
              value={form.startAt}
              onChange={(event) =>
                setForm({
                  ...form,
                  startAt: event.target.value,
                })
              }
              className="mt-2 w-full"
              label={
                <>
                  Thời gian bắt đầu *
                  {errors.startAt && <span className="mt-1 block text-primary">{errors.startAt}</span>}
                </>
              }
              wrapperClassName="text-body-sm font-semibold"
            />
            <SharedFormField
              type="datetime-local"
              value={form.dueAt}
              onChange={(event) =>
                setForm({
                  ...form,
                  dueAt: event.target.value,
                })
              }
              className="mt-2 w-full"
              label={<>Hạn nộp *{errors.dueAt && <span className="mt-1 block text-primary">{errors.dueAt}</span>}</>}
              wrapperClassName="text-body-sm font-semibold"
            />
          </div>
          <SharedFormField
            rows="4"
            value={form.instructions}
            onChange={(event) =>
              setForm({
                ...form,
                instructions: event.target.value,
              })
            }
            placeholder="Nhập hướng dẫn thực hiện thí nghiệm..."
            className="mt-2 w-full"
            multiline
            label={<>Hướng dẫn</>}
            wrapperClassName="block text-body-sm font-semibold"
          />
          <fieldset>
            <legend className="font-semibold">Yêu cầu minh chứng *</legend>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(labEvidenceLabels).map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3">
                  <input
                    type="checkbox"
                    checked={form.requiredEvidence.includes(value)}
                    onChange={() => toggle('requiredEvidence', value)}
                    className="h-5 w-5 accent-[#E52220]"
                  />
                  {label}
                </label>
              ))}
            </div>
            {errors.requiredEvidence && (
              <p className="mt-2 text-body-sm font-semibold text-primary">{errors.requiredEvidence}</p>
            )}
          </fieldset>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SharedSelectField
              value={form.attemptsAllowed}
              onChange={(event) =>
                setForm({
                  ...form,
                  attemptsAllowed: event.target.value === 'UNLIMITED' ? 'UNLIMITED' : Number(event.target.value),
                })
              }
              label={<>Số lần thực hiện</>}
              className="text-body-sm font-semibold"
            >
              <option value="UNLIMITED">Không giới hạn</option>
              <option value="1">1 lần</option>
              <option value="2">2 lần</option>
              <option value="3">3 lần</option>
            </SharedSelectField>
            <Card as="div" className="bg-[#F8FAFC] p-4">
              <strong className="text-body-sm">Hình thức đánh giá</strong>
              <p className="mt-1 text-body-sm text-[#64748B]">Đánh giá theo rubric mặc định của học phần.</p>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-5 p-5 md:p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
            {[
              ['Thí nghiệm', `${lab.code} · ${lab.title}`],
              ['Lớp', form.classIds.join(', ')],
              ['Bắt đầu', formatDateTime(form.startAt)],
              ['Hạn nộp', formatDateTime(form.dueAt)],
              ['Số sinh viên được giao', `${studentCount} sinh viên`],
              [
                'Số lần thực hiện',
                form.attemptsAllowed === 'UNLIMITED' ? 'Không giới hạn' : `${form.attemptsAllowed} lần`,
              ],
            ].map(([label, value]) => (
              <Card as="div" key={label} className="bg-[#F8FAFC] p-4">
                <dt className="text-[#64748B]">{label}</dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </Card>
            ))}
          </dl>
          <div>
            <h3 className="font-semibold">Hướng dẫn</h3>
            <p className="mt-2 whitespace-pre-line text-body-sm text-[#64748B]">
              {form.instructions || 'Không có hướng dẫn bổ sung.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Yêu cầu minh chứng</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.requiredEvidence.map((item) => (
                <StatusBadge key={item} tone="neutral">
                  {labEvidenceLabels[item]}
                </StatusBadge>
              ))}
            </div>
          </div>
        </div>
      )}
      <div>
        <Button onClick={() => (step ? onConfirm(form) : validate() && setStep(1))}>
          {step ? 'Xác nhận giao bài' : 'Tiếp tục'}
        </Button>
      </div>
    </SharedFormDialog>
  );
}

export function LecturerLabsPage() {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [detailLab, setDetailLab] = useState(null);
  const [assignLab, setAssignLab] = useState(null);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [reportQuery, setReportQuery] = useState('');
  const [reportClass, setReportClass] = useAcademicClass();
  const [reportLab, setReportLab] = useState('ALL');
  const [gradingFilter, setGradingFilter] = useState('ALL');
  const gradings = loadLabGradings();
  const submitted = labSubmissions.filter((item) => ['SUBMITTED', 'LATE'].includes(item.status));
  const gradingStatusFor = (submissionId) =>
    gradings.find((item) => item.submissionId === submissionId)?.status ?? 'UNGRADED';
  const pending = submitted.filter((item) => !['CONFIRMED', 'PUBLISHED'].includes(gradingStatusFor(item.id)));
  const reportRows = useMemo(
    () =>
      submitted.filter((item) => {
        const student = lecturerStudents.find((entry) => entry.id === item.studentId);
        const assignment =
          assignments.find((entry) => entry.id === item.assignmentId) ??
          initialAssignments.find((entry) => entry.id === item.assignmentId);
        const keyword = reportQuery.trim().toLocaleLowerCase('vi');
        return (
          (!keyword || `${student?.id} ${student?.name}`.toLocaleLowerCase('vi').includes(keyword)) &&
          (reportClass === 'ALL' || student?.className === reportClass) &&
          (reportLab === 'ALL' || assignment?.labId === reportLab) &&
          (gradingFilter === 'ALL' || gradingStatusFor(item.id) === gradingFilter)
        );
      }),
    [assignments, gradingFilter, reportClass, reportLab, reportQuery, submitted]
  );
  const stats = [
    { label: 'Tổng thí nghiệm', value: labCatalog.length, icon: 'science' },
    { label: 'Thí nghiệm đã giao', value: assignments.length, icon: 'assignment' },
    { label: 'Báo cáo đã nộp', value: submitted.length, icon: 'description', tone: 'success' },
    { label: 'Chờ chấm', value: pending.length, icon: 'grading', tone: 'warning' },
  ];
  const getCounts = (assignment) => {
    const list = labSubmissions.filter((item) => item.assignmentId === assignment.id);
    const total = assignment.classIds.reduce(
      (sum, className) => sum + (lecturerCourses.find((course) => course.className === className)?.students ?? 0),
      0
    );
    const submittedCount = list.filter((item) => ['SUBMITTED', 'LATE'].includes(item.status)).length;
    return {
      total,
      submitted: submittedCount,
      performed: list.length,
      pending: list.filter(
        (item) =>
          ['SUBMITTED', 'LATE'].includes(item.status) && !['CONFIRMED', 'PUBLISHED'].includes(gradingStatusFor(item.id))
      ).length,
    };
  };
  const confirmAssignment = (form) => {
    const id = `LABASM${String(Math.max(...assignments.map((item) => Number(item.id.replace('LABASM', ''))), 0) + 1).padStart(3, '0')}`;
    const next = {
      ...form,
      id,
      labId: assignLab.id,
      title: `${assignLab.code} · ${assignLab.title}`,
      rubricId: 'DEFAULT_LAB_RUBRIC',
      status: new Date(form.startAt) > new Date('2026-09-22T12:00') ? 'SCHEDULED' : 'OPEN',
    };
    setAssignments((current) => [next, ...current]);
    setAssignLab(null);
    setViewAssignment(next);
    setFeedback(`Đã thêm phân công ${id} vào dữ liệu giao diện.`);
  };
  const copyAssignment = (item) => {
    const id = `LABASM${String(Math.max(...assignments.map((entry) => Number(entry.id.replace('LABASM', ''))), 0) + 1).padStart(3, '0')}`;
    setAssignments((current) => [{ ...item, id, title: `${item.title} — Bản sao`, status: 'DRAFT' }, ...current]);
    setFeedback(`Đã sao chép thành ${id}.`);
  };
  return (
    <LecturerPageShell
      currentPage="lecturer_labs.html"
      title="Thí nghiệm ảo 3D"
      eyebrow="PHÒNG THÍ NGHIỆM ẢO"
      description="Quản lý, giao bài và theo dõi thí nghiệm Vật lý đại cương 1"
    >
      {feedback && (
        <div
          className="mb-5 rounded-xl border border-[#86EFAC] bg-[#DCFCE7] px-4 py-3 text-body-sm font-semibold text-[#15803D]"
          role="status"
        >
          {feedback}
        </div>
      )}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Thống kê thí nghiệm">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} value={String(item.value)} />
        ))}
      </section>
      <Card className="mt-5 p-5 md:p-6">
        <Tabs
          items={[
            { id: 'CATALOG', label: 'Danh sách thí nghiệm' },
            { id: 'ASSIGNED', label: 'Thí nghiệm đã giao' },
            { id: 'REPORTS', label: 'Báo cáo sinh viên' },
          ]}
        >
          {(tab) => {
            if (tab === 'CATALOG')
              return (
                <PaginatedList className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5">
                  {labCatalog.map((lab) => {
                    const related = assignments.filter((item) => item.labId === lab.id);
                    const ids = related.map((item) => item.id);
                    const reports = labSubmissions.filter(
                      (item) => ids.includes(item.assignmentId) && ['SUBMITTED', 'LATE', 'GRADED'].includes(item.status)
                    );
                    const students = labSubmissions.filter((item) => ids.includes(item.assignmentId)).length;
                    return (
                      <Card key={lab.id} variant="accent" className="overflow-hidden">
                        <div
                          className={`h-32 bg-gradient-to-br ${lab.image === 'incline' ? 'from-[#E52220] to-[#F59E0B]' : lab.image === 'collision' ? 'from-[#1E3A8A] to-[#0F766E]' : lab.image === 'pendulum' ? 'from-[#334155] to-[#7C3AED]' : 'from-[#14532D] to-[#0F766E]'} flex items-center justify-center text-white`}
                        >
                          <span className="material-symbols-outlined text-6xl opacity-70">science</span>
                        </div>
                        <div className="p-5">
                          <p className="text-label-md font-bold text-primary">{lab.code}</p>
                          <h2 className="mt-1 text-headline-sm font-bold">{lab.title}</h2>
                          <p className="mt-2 text-body-sm text-[#64748B]">{lab.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <StatusBadge tone="neutral">{lab.chapter}</StatusBadge>
                            <StatusBadge tone="neutral">{lab.duration} phút</StatusBadge>
                          </div>
                          <p className="mt-3 text-body-sm">
                            <strong>Mục tiêu:</strong> {lab.objective}
                          </p>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-body-sm">
                            <div className="rounded-lg bg-[#F8FAFC] p-2">
                              <strong className="block">
                                {new Set(related.flatMap((item) => item.classIds)).size}
                              </strong>
                              <span className="text-[#64748B]">Lớp</span>
                            </div>
                            <div className="rounded-lg bg-[#F8FAFC] p-2">
                              <strong className="block">{students}</strong>
                              <span className="text-[#64748B]">Thực hiện</span>
                            </div>
                            <div className="rounded-lg bg-[#F8FAFC] p-2">
                              <strong className="block">{reports.length}</strong>
                              <span className="text-[#64748B]">Báo cáo</span>
                            </div>
                          </div>
                          <div className="mt-5 flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={() => setDetailLab(lab)}>
                              Xem chi tiết
                            </Button>
                            <Button onClick={() => setAssignLab(lab)}>Giao thí nghiệm</Button>
                            <a href={`3d_workspace.html?mode=lecturer-preview&lab=${lab.id}`} className="flex-1">
                              <Button variant="ghost" className="w-full" icon="view_in_ar">
                                Xem trước mô phỏng
                              </Button>
                            </a>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </PaginatedList>
              );
            if (tab === 'ASSIGNED')
              return (
                <div className="pt-5">
                  <DataTable
                    columns={[
                      'Thí nghiệm',
                      'Lớp',
                      'Bắt đầu',
                      'Hạn nộp',
                      'Sinh viên',
                      'Đã nộp',
                      'Chờ chấm',
                      'Trạng thái',
                      'Hành động',
                    ]}
                    rows={assignments}
                    renderRow={(item) => {
                      const counts = getCounts(item);
                      const meta = labAssignmentStatusMeta[item.status];
                      return (
                        <tr className="border-t border-[#E2E8F0]">
                          <td className="min-w-[240px] px-3 py-3">
                            <strong>{item.title}</strong>
                            <span className="mt-1 block font-mono text-label-sm text-[#64748B]">{item.id}</span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">{item.classIds.join(', ')}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(item.startAt)}</td>
                          <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(item.dueAt)}</td>
                          <td className="px-3 py-3">{counts.total}</td>
                          <td className="px-3 py-3">{counts.submitted}</td>
                          <td className="px-3 py-3">{counts.pending}</td>
                          <td className="px-3 py-3">
                            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <a
                                href={`lecturer_lab_assignment_detail.html?assignment=${item.id}`}
                                className="font-semibold text-primary"
                              >
                                Theo dõi
                              </a>
                              <button
                                type="button"
                                onClick={() => setViewAssignment(item)}
                                className="font-semibold text-[#475569]"
                              >
                                Chi tiết
                              </button>
                              <details className="relative">
                                <summary className="cursor-pointer list-none" aria-label={`Tùy chọn ${item.title}`}>
                                  <span className="material-symbols-outlined">more_vert</span>
                                </summary>
                                <div className="absolute right-0 z-20 w-44 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => setViewAssignment(item)}
                                    className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]"
                                  >
                                    Sửa hướng dẫn
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyAssignment(item)}
                                    className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]"
                                  >
                                    Sao chép
                                  </button>
                                  {item.status === 'OPEN' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAssignments((current) =>
                                          current.map((entry) =>
                                            entry.id === item.id ? { ...entry, status: 'CLOSED' } : entry
                                          )
                                        )
                                      }
                                      className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-[#F1F5F9]"
                                    >
                                      Đóng assignment
                                    </button>
                                  )}
                                  {item.status === 'DRAFT' && !counts.submitted && (
                                    <button
                                      type="button"
                                      onClick={() => setDeleting(item)}
                                      className="w-full rounded-lg px-3 py-2 text-left text-body-sm text-primary hover:bg-[#FEF2F2]"
                                    >
                                      Xóa
                                    </button>
                                  )}
                                </div>
                              </details>
                            </div>
                          </td>
                        </tr>
                      );
                    }}
                  />
                </div>
              );
            return (
              <div className="space-y-5 pt-5">
                <div>
                  <p className="text-label-md font-bold text-primary">CHẤM BÁO CÁO THÍ NGHIỆM</p>
                  <h2 className="mt-1 text-headline-md font-bold">Đánh giá kết quả thực hành theo Rubric</h2>
                </div>
                <section
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4"
                  aria-label="Thống kê chấm báo cáo"
                >
                  {[
                    ['Tổng báo cáo đã nộp', submitted.length, 'description'],
                    [
                      'Chưa chấm',
                      submitted.filter((item) => gradingStatusFor(item.id) === 'UNGRADED').length,
                      'pending_actions',
                    ],
                    [
                      'Đang chấm',
                      submitted.filter((item) => gradingStatusFor(item.id) === 'GRADING').length,
                      'edit_note',
                    ],
                    [
                      'Đã xác nhận',
                      submitted.filter((item) => gradingStatusFor(item.id) === 'CONFIRMED').length,
                      'verified',
                    ],
                    [
                      'Đã công bố',
                      submitted.filter((item) => gradingStatusFor(item.id) === 'PUBLISHED').length,
                      'campaign',
                    ],
                  ].map(([label, value, icon]) => (
                    <StatCard key={label} label={label} value={String(value)} icon={icon} />
                  ))}
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <SharedFormField
                    type="search"
                    value={reportQuery}
                    onChange={(event) => setReportQuery(event.target.value)}
                    placeholder="Tìm theo tên hoặc mã sinh viên..."
                    className="mt-2 w-full"
                    label={<>Tìm báo cáo</>}
                    wrapperClassName="text-body-sm font-semibold"
                  />
                  <SharedSelectField
                    value={reportClass}
                    onChange={(event) => setReportClass(event.target.value)}
                    label={<>Lớp</>}
                    className="text-body-sm font-semibold"
                  >
                    <option value="ALL">Tất cả</option>
                    {lecturerCourses.map((course) => (
                      <option key={course.className}>{course.className}</option>
                    ))}
                  </SharedSelectField>
                  <SharedSelectField
                    value={reportLab}
                    onChange={(event) => setReportLab(event.target.value)}
                    label={<>Thí nghiệm</>}
                    className="text-body-sm font-semibold"
                  >
                    <option value="ALL">Tất cả</option>
                    {labCatalog.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.code} · {lab.title}
                      </option>
                    ))}
                  </SharedSelectField>
                  <SharedSelectField
                    value={gradingFilter}
                    onChange={(event) => setGradingFilter(event.target.value)}
                    label={<>Trạng thái chấm</>}
                    className="text-body-sm font-semibold"
                  >
                    <option value="ALL">Tất cả</option>
                    {Object.entries(labGradingStatusMeta).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </SharedSelectField>
                </div>
                <DataTable
                  columns={[
                    'Mã sinh viên',
                    'Họ tên',
                    'Lớp',
                    'Thí nghiệm',
                    'Thời gian nộp',
                    'Trạng thái chấm',
                    'Điểm',
                    'Hành động',
                  ]}
                  rows={reportRows}
                  renderRow={(item) => {
                    const student = lecturerStudents.find((entry) => entry.id === item.studentId);
                    const assignment =
                      assignments.find((entry) => entry.id === item.assignmentId) ??
                      initialAssignments.find((entry) => entry.id === item.assignmentId);
                    const grading = gradings.find((entry) => entry.submissionId === item.id);
                    const gradingStatus = grading?.status ?? 'UNGRADED';
                    const meta = labGradingStatusMeta[gradingStatus];
                    return (
                      <tr className="border-t border-[#E2E8F0]">
                        <td className="px-3 py-3 font-mono">{student?.id}</td>
                        <td className="px-3 py-3 font-semibold whitespace-nowrap">{student?.name}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{student?.className}</td>
                        <td className="min-w-[220px] px-3 py-3">{assignment?.title}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(item.submittedAt)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        </td>
                        <td className="px-3 py-3 font-semibold">
                          {grading?.totalScore === null || grading?.totalScore === undefined
                            ? '—'
                            : `${grading.totalScore} / 10`}
                        </td>
                        <td className="px-3 py-3">
                          <a
                            href={`lecturer_lab_grading.html?submission=${item.id}`}
                            className="font-semibold text-primary whitespace-nowrap"
                          >
                            {gradingStatus === 'PUBLISHED'
                              ? 'Xem kết quả'
                              : gradingStatus === 'UNGRADED'
                                ? 'Chấm báo cáo'
                                : 'Tiếp tục chấm'}
                          </a>
                        </td>
                      </tr>
                    );
                  }}
                />
                {!reportRows.length && (
                  <div className="py-10 text-center">
                    <span className="material-symbols-outlined text-4xl text-[#94A3B8]">task_alt</span>
                    <h3 className="mt-3 text-headline-sm font-bold">Không có báo cáo cần chấm</h3>
                    <p className="mt-1 text-body-md text-[#64748B]">
                      Tất cả báo cáo hiện tại đã được xử lý hoặc chưa có sinh viên nộp bài.
                    </p>
                  </div>
                )}
              </div>
            );
          }}
        </Tabs>
      </Card>
      {detailLab && (
        <LabDetailModal
          lab={detailLab}
          assignments={assignments}
          onClose={() => setDetailLab(null)}
          onAssign={(lab) => {
            setDetailLab(null);
            setAssignLab(lab);
          }}
        />
      )}
      {assignLab && (
        <AssignmentWizard lab={assignLab} onCancel={() => setAssignLab(null)} onConfirm={confirmAssignment} />
      )}
      {viewAssignment && (
        <SharedFormDialog title={viewAssignment.title} onClose={() => setViewAssignment(null)}>
          <SharedFormField
            rows="5"
            value={viewAssignment.instructions}
            onChange={(event) =>
              setViewAssignment({
                ...viewAssignment,
                instructions: event.target.value,
              })
            }
            className="mt-2 w-full"
            multiline
            label={<>Hướng dẫn</>}
            wrapperClassName="mt-5 block text-body-sm font-semibold"
          />
          <SharedFormField
            type="datetime-local"
            value={viewAssignment.dueAt}
            onChange={(event) =>
              setViewAssignment({
                ...viewAssignment,
                dueAt: event.target.value,
              })
            }
            className="mt-2 w-full"
            label={<>Hạn nộp</>}
            wrapperClassName="mt-4 block text-body-sm font-semibold"
          />
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setViewAssignment(null)}>
              Đóng
            </Button>
            <Button
              onClick={() => {
                setAssignments((current) =>
                  current.map((item) => (item.id === viewAssignment.id ? viewAssignment : item))
                );
                setViewAssignment(null);
                setFeedback('Đã cập nhật assignment trên giao diện.');
              }}
            >
              Lưu thay đổi
            </Button>
          </div>
        </SharedFormDialog>
      )}
      {deleting && (
        <ConfirmDialog
          title="Xóa assignment?"
          description={`${deleting.id} sẽ bị xóa khỏi danh sách thí nghiệm đã giao.`}
          confirmLabel="Xóa assignment"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            setAssignments((current) => current.filter((item) => item.id !== deleting.id));
            setDeleting(null);
            setFeedback('Đã xóa assignment bản nháp.');
          }}
        />
      )}
    </LecturerPageShell>
  );
}
