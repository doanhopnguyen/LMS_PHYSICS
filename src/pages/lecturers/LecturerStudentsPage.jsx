import { formatPercent } from '../../lib/formatPercent.js';
import React, { useMemo, useState } from 'react';
import { readAcademicScope } from '../../lib/academicScope.js';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { PasswordResetDialog } from '../../components/PasswordResetDialog.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { lecturerStudents } from '../../data/lecturerData.js';

const toneFor = (status) => (status === 'Đang học' ? 'success' : status === 'Có bài quá hạn' ? 'primary' : 'warning');

export function LecturerStudentsPage() {
  const { classId } = readAcademicScope();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Tất cả');
  const [sort, setSort] = useState('progress-desc');
  const [resetStudent, setResetStudent] = useState(null);
  const [resetRequest, setResetRequest] = useState(null);

  const rows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi');
    const [field, direction] = sort.split('-');
    return lecturerStudents
      .filter((student) => classId === 'ALL' || student.className === classId)
      .filter((student) => !normalized || `${student.id} ${student.name}`.toLocaleLowerCase('vi').includes(normalized))
      .filter((student) => status === 'Tất cả' || student.status === status)
      .sort((a, b) => (a[field] - b[field]) * (direction === 'asc' ? 1 : -1));
  }, [query, sort, status, classId]);
  const pagination = usePagination(rows, [query, status, sort, classId]);

  return (
    <LecturerPageShell
      currentPage="lecturer_students.html"
      title="Sinh viên"
      eyebrow="D23CQCN01-B · BAS1201"
      description="Theo dõi dữ liệu học tập quan sát được của sinh viên trong các lớp đang phụ trách."
      actions={
        <Button
          variant="secondary"
          icon="download"
          disabled
          title="Chức năng xuất file chưa có trong phạm vi frontend demo"
        >
          Xuất danh sách
        </Button>
      }
    >
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          <label className="text-body-sm font-semibold xl:col-span-2">
            Tìm sinh viên
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Họ tên hoặc mã sinh viên"
              className="mt-2 w-full border border-[#CBD5E1] px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-[#FEE2E2]"
            />
          </label>
          <label className="text-body-sm font-semibold">
            Trạng thái
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
            >
              <option>Tất cả</option>
              <option>Đang học</option>
              <option>Cần chú ý</option>
              <option>Có bài quá hạn</option>
            </select>
          </label>
          <label className="text-body-sm font-semibold">
            Sắp xếp
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"
            >
              <option value="progress-desc">Tiến độ: cao đến thấp</option>
              <option value="progress-asc">Tiến độ: thấp đến cao</option>
              <option value="score-desc">Điểm: cao đến thấp</option>
              <option value="score-asc">Điểm: thấp đến cao</option>
            </select>
          </label>
        </div>
        <div className="mb-3 flex items-center justify-between gap-3 text-body-sm text-[#64748B]">
          <span>{rows.length} sinh viên</span>
          <span>Dữ liệu cập nhật: 21/09/2026</span>
        </div>
        <DataTable
          paginate={false}
          columns={[
            'Mã sinh viên',
            'Họ và tên',
            'Tiến độ',
            'Điểm trung bình',
            'Bài kiểm tra',
            'Thí nghiệm',
            'Trạng thái',
            'Hành động',
          ]}
          rows={pagination.pageItems}
          renderRow={(row) => (
            <tr className="border-t border-[#E2E8F0]">
              <td className="px-3 py-4 font-semibold whitespace-nowrap">{row.id}</td>
              <td className="px-3 py-4 min-w-[150px]">{row.name}</td>
              <td className="px-3 py-4 min-w-[150px]">
                <ProgressBar value={row.progress} compact />
                <span className="mt-1 block text-label-sm text-[#64748B]">{formatPercent(row.progress)}</span>
              </td>
              <td className="px-3 py-4 font-bold">{row.score}/10</td>
              <td className="px-3 py-4 text-center">{row.exams}</td>
              <td className="px-3 py-4 text-center">{row.labs}</td>
              <td className="px-3 py-4">
                <StatusBadge tone={toneFor(row.status)}>{row.status}</StatusBadge>
              </td>
              <td className="px-3 py-4">
                <div className="flex flex-col items-start gap-1">
                  <a
                    href={`lecturer_student_detail.html?student=${row.id}`}
                    className="whitespace-nowrap text-body-sm font-semibold text-primary hover:underline"
                  >
                    Xem chi tiết
                  </a>
                  <button
                    type="button"
                    onClick={() => setResetStudent(row)}
                    className="whitespace-nowrap text-left text-body-sm font-semibold text-primary hover:underline"
                  >
                    Reset mật khẩu
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
        {rows.length === 0 && (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span>
            <p className="mt-2 text-body-md text-[#64748B]">Không tìm thấy sinh viên phù hợp với bộ lọc.</p>
          </div>
        )}
        {rows.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            pageSize={pagination.pageSize}
            totalItems={rows.length}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
          />
        )}
        {resetRequest && (
          <p
            className="mt-4 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] p-4 text-body-sm text-[#15803D]"
            role="status"
          >
            Đã gửi yêu cầu reset mật khẩu cho {resetRequest.studentName}. Đây là dữ liệu mô phỏng frontend.
          </p>
        )}
      </Card>
      {resetStudent && (
        <PasswordResetDialog
          student={resetStudent}
          onCancel={() => setResetStudent(null)}
          onConfirm={() => {
            setResetRequest({
              studentId: resetStudent.id,
              studentName: resetStudent.name,
              requestedAt: new Date().toISOString(),
              requestedBy: 'LECTURER001',
              status: 'REQUESTED',
            });
            setResetStudent(null);
          }}
        />
      )}
    </LecturerPageShell>
  );
}
