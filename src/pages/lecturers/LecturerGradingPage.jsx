import React, { useMemo, useState } from 'react';
import { useAcademicClass } from '../../lib/academicScope.js';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import {
  assessmentAttempts,
  assessments,
  attemptStatusMeta,
  lecturerStudents,
} from '../../data/lecturerData.js';

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
    : '—';

export function LecturerGradingPage() {
  const [classFilter, setClassFilter] = useAcademicClass();
  const rows = useMemo(
    () =>
      assessmentAttempts
        .filter((attempt) => ['SUBMITTED', 'LATE'].includes(attempt.status))
        .map((attempt) => {
          const assessment = assessments.find((item) => item.id === attempt.assessmentId);
          const student = lecturerStudents.find((item) => item.id === attempt.studentId);
          return { ...attempt, assessment, student };
        })
        .filter(
          (row) =>
            row.assessment &&
            row.student &&
            (classFilter === 'ALL' || row.student.className === classFilter)
        ),
    [classFilter]
  );
  const adjustedCount = rows.filter((row) => row.adjustedScore !== null && row.adjustedScore !== undefined).length;
  const pagination = usePagination(rows, [classFilter]);

  return (
    <LecturerPageShell
      currentPage="lecturer_grading.html"
      title="Chấm bài"
      eyebrow="BÀI LÀM KIỂM TRA"
      description="Xem lại bài làm, điều chỉnh điểm và lưu nhận xét cho các lượt làm đã nộp."
      actions={
        <Button variant="secondary" icon="tune" disabled title="Chưa có cấu hình rubric cho bài kiểm tra trắc nghiệm">
          Cài đặt rubric
        </Button>
      }
    >
      <MetricGrid
        items={[
          { label: 'Bài đã nộp', value: String(rows.length), detail: 'lượt làm', icon: 'task_alt' },
          { label: 'Đã điều chỉnh', value: String(adjustedCount), detail: 'lượt làm', icon: 'rate_review' },
          { label: 'Lớp đang lọc', value: classFilter === 'ALL' ? '3' : '1', detail: 'lớp', icon: 'groups' },
        ]}
      />
      <Card className="p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-headline-md font-bold">Bài nộp gần đây</h2>
            <p className="mt-1 text-body-sm text-[#64748B]">Dữ liệu lấy từ các lượt làm bài kiểm tra đã nộp.</p>
          </div>
          <label className="text-body-sm font-semibold">
            Lọc theo lớp
            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="mt-2 block w-full border border-[#CBD5E1] bg-white px-3 sm:mt-0 sm:ml-2 sm:inline-block sm:w-auto"
            >
              <option value="ALL">Tất cả lớp</option>
              {[...new Set(lecturerStudents.map((student) => student.className))].map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </label>
        </div>
        {rows.length ? (
          <>
          <DataTable paginate={false}
            columns={['Sinh viên', 'Bài đánh giá', 'Lớp', 'Thời gian nộp', 'Trạng thái', 'Điểm', 'Hành động']}
            rows={pagination.pageItems}
            renderRow={(row) => (
              <tr className="border-t border-[#E2E8F0]">
                <td className="min-w-[170px] px-3 py-4"><strong>{row.student.name}</strong><span className="mt-1 block text-body-sm text-[#64748B]">{row.student.id}</span></td>
                <td className="min-w-[220px] px-3 py-4">{row.assessment.title}</td>
                <td className="whitespace-nowrap px-3 py-4">{row.student.className}</td>
                <td className="whitespace-nowrap px-3 py-4">{formatDateTime(row.submittedAt)}</td>
                <td className="px-3 py-4"><StatusBadge tone={attemptStatusMeta[row.status].tone}>{attemptStatusMeta[row.status].label}</StatusBadge></td>
                <td className="whitespace-nowrap px-3 py-4 font-semibold">{row.adjustedScore ?? row.autoScore} / {row.assessment.totalScore}</td>
                <td className="px-3 py-4">
                  <a href={`lecturer_attempt_detail.html?assessment=${row.assessment.id}&attempt=${row.id}`}>
                    <Button variant="secondary">Xem bài</Button>
                  </a>
                </td>
              </tr>
            )}
          />
          <Pagination currentPage={pagination.currentPage} pageSize={pagination.pageSize} totalItems={rows.length} onPageChange={pagination.setCurrentPage} onPageSizeChange={pagination.setPageSize} />
          </>
        ) : (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-[#94A3B8]" aria-hidden="true">inbox</span>
            <h3 className="mt-3 text-headline-sm font-bold">Chưa có bài nộp phù hợp</h3>
            <p className="mt-1 text-body-md text-[#64748B]">Hãy chọn lớp khác để xem các lượt làm đã nộp.</p>
          </div>
        )}
      </Card>
    </LecturerPageShell>
  );
}
