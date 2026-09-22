import React from 'react';
import { Breadcrumbs } from '../../components/Breadcrumbs.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { ColumnChart } from '../../components/DataCharts.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { LecturerNotFoundState } from '../../components/LecturerNotFoundState.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { labs } from '../../data/lmsData.js';
import {
  labActivities,
  labAssignments,
  labGradingStatusMeta,
  labSubmissions,
  labSubmissionStatusMeta,
  lecturerLabMetadata,
  lecturerStudents,
} from '../../data/lecturerData.js';
import { gradingForSubmission } from '../../lib/labGradingState.js';

const formatDateTime = (value) =>
  value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';

export function LecturerLabSubmissionDetailPage() {
  const id = new URLSearchParams(window.location.search).get('submission') ?? 'LABSUB-LABASM001-001';
  const requestedSubmission = labSubmissions.find((item) => item.id === id);
  const submission = requestedSubmission ?? labSubmissions[0];
  const assignment = labAssignments.find((item) => item.id === submission.assignmentId);
  const student = lecturerStudents.find((item) => item.id === submission.studentId);
  const labIndex = assignment ? Number(assignment.labId.replace('LAB', '')) - 1 : -1;
  const lab = assignment ? { ...labs[labIndex], ...lecturerLabMetadata[assignment.labId] } : {};
  const activities = labActivities.filter((item) => item.submissionId === submission.id);
  const grading = gradingForSubmission(submission.id);
  const measurements = submission.evidence.measurements;
  const numericValues = measurements.map((row) => Number.parseFloat(row.acceleration ?? row.time) || 0);
  const statusMeta = labSubmissionStatusMeta[submission.status];

  if (!requestedSubmission || !assignment || !student || !lab.title) {
    return (
      <LecturerPageShell
        currentPage="lecturer_labs.html"
        title="Không tìm thấy báo cáo"
        eyebrow="BÁO CÁO THÍ NGHIỆM"
        description="Báo cáo hoặc dữ liệu liên kết không tồn tại trong dữ liệu hiện tại."
      >
        <LecturerNotFoundState
          message={`Không thể mở báo cáo ${id}. Hãy chọn lại báo cáo từ danh sách thí nghiệm.`}
          backHref="lecturer_labs.html"
          backLabel="Quay lại báo cáo sinh viên"
        />
      </LecturerPageShell>
    );
  }
  return (
    <LecturerPageShell
      currentPage="lecturer_labs.html"
      title={student.name}
      eyebrow="BÁO CÁO THÍ NGHIỆM"
      description={`${student.id} · ${student.className} · ${lab.title}`}
      actions={
        <a href={`lecturer_lab_grading.html?submission=${submission.id}`}>
          <Button icon="grading">{grading ? 'Xem kết quả chấm' : 'Chấm báo cáo'}</Button>
        </a>
      }
    >
      <Breadcrumbs items={['Thí nghiệm ảo 3D', assignment.title]} current={student.name} />
      {grading && (
        <Card className="mt-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong>Kết quả chấm</strong>
              <p className="mt-1 text-body-sm text-[#64748B]">Điểm: {grading.totalScore ?? 'Đang chấm'} / 10</p>
            </div>
            <StatusBadge tone={labGradingStatusMeta[grading.status].tone}>
              {labGradingStatusMeta[grading.status].label}
            </StatusBadge>
          </div>
        </Card>
      )}
      <Card className="mt-5 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-label-md font-bold text-primary">{submission.id}</p>
            <h2 className="mt-1 text-headline-md font-bold">{assignment.title}</h2>
            <p className="mt-2 text-body-sm text-[#64748B]">
              Nộp lúc {formatDateTime(submission.submittedAt)} · {submission.attemptCount} lần thực hiện
            </p>
          </div>
          <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
        </div>
      </Card>
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-5 md:p-6">
          <SectionHeader title="Báo cáo thí nghiệm" description="Metadata tệp do sinh viên nộp." />
          {submission.evidence.report ? (
            <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                <div className="min-w-0">
                  <strong className="block truncate">{submission.evidence.report.fileName}</strong>
                  <p className="mt-1 text-body-sm text-[#64748B]">
                    {submission.evidence.report.fileType} · {submission.evidence.report.fileSize} ·{' '}
                    {formatDateTime(submission.evidence.report.uploadedAt)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-body-sm text-[#64748B]">
                Đây là metadata minh họa frontend; chưa có tệp hoặc URL thật để mở.
              </p>
              <Button variant="secondary" className="mt-3" disabled>
                Xem file
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-body-sm text-[#64748B]">Chưa có tệp báo cáo.</p>
          )}
        </Card>
        <Card className="p-5 md:p-6">
          <SectionHeader title="Ảnh minh chứng" description="Ảnh chụp kết quả mô phỏng." />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {submission.evidence.screenshots.length ? (
              submission.evidence.screenshots.map((image) => (
                <div
                  key={image.id}
                  className="flex aspect-video flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#1E293B] to-[#475569] text-white"
                >
                  <span className="material-symbols-outlined text-4xl">image</span>
                  <span className="mt-2 text-body-sm">{image.label}</span>
                  <small className="mt-1 text-slate-300">Ảnh minh họa chưa có URL thật</small>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] p-8 text-center text-body-sm text-[#64748B]">
                Chưa có ảnh minh chứng.
              </div>
            )}
          </div>
        </Card>
      </div>
      <Card className="mt-5 p-5 md:p-6">
        <SectionHeader title="Bảng số liệu" description="Các giá trị được lưu trong minh chứng của bài nộp." />
        <div className="mt-5">
          <DataTable
            columns={Object.keys(measurements[0] ?? {}).map(
              (key) =>
                ({
                  trial: 'Lần đo',
                  distance: 'Quãng đường',
                  time: 'Thời gian',
                  velocity: 'Vận tốc',
                  acceleration: 'Gia tốc',
                })[key] ?? key
            )}
            rows={measurements}
            renderRow={(row) => (
              <tr className="border-t border-[#E2E8F0]">
                {Object.values(row).map((value, index) => (
                  <td key={index} className="px-3 py-3 font-mono">
                    {value}
                  </td>
                ))}
              </tr>
            )}
          />
        </div>
      </Card>
      <Card className="mt-5 p-5 md:p-6">
        <SectionHeader
          title="Biểu đồ kết quả"
          description={measurements[0]?.acceleration ? 'Gia tốc theo từng lần đo.' : 'Thời gian theo từng lần đo.'}
        />
        <div className="mt-5">
          <ColumnChart
            values={numericValues}
            labels={measurements.map((row) => `Lần ${row.trial}`)}
            label="Biểu đồ dữ liệu đo"
            color="#E52220"
          />
        </div>
      </Card>
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-5 md:p-6">
          <SectionHeader title="Nhận xét và kết luận" />
          <p className="mt-4 text-body-md leading-relaxed text-[#475569]">
            {submission.evidence.conclusion || 'Sinh viên chưa gửi nhận xét và kết luận.'}
          </p>
        </Card>
        <Card className="p-5 md:p-6">
          <SectionHeader title="Nhật ký thực hiện" />
          <ol className="mt-4 space-y-3 text-body-sm">
            {activities.length ? (
              activities.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="material-symbols-outlined text-primary">history</span>
                  <div>
                    <strong>{item.label}</strong>
                    <p className="text-[#64748B]">{formatDateTime(item.occurredAt)}</p>
                  </div>
                </li>
              ))
            ) : (
              <>
                <li>
                  Bắt đầu: <strong>{formatDateTime(submission.startedAt)}</strong>
                </li>
                <li>
                  Số lần thực hiện: <strong>{submission.attemptCount}</strong>
                </li>
                <li>
                  Nộp báo cáo: <strong>{formatDateTime(submission.submittedAt)}</strong>
                </li>
              </>
            )}
          </ol>
        </Card>
      </div>
    </LecturerPageShell>
  );
}
