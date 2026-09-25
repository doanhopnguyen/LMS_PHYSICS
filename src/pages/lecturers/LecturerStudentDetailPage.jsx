import React from 'react';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { HorizontalBarChart, ProgressFillList } from '../../components/DataCharts.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { LecturerNotFoundState } from '../../components/LecturerNotFoundState.jsx';
import { MetricGrid } from '../../components/MetricGrid.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { getAssignmentHistory, loadParticipantRecords } from '../../lib/participantState.js';
import {
  studentChapterProgress,
  studentDifficultTopics,
  studentLabs,
  studentLearningLog,
  studentRecentExams,
  lecturerStudents,
} from '../../data/lecturerData.js';

export function LecturerStudentDetailPage() {
  const studentId = new URLSearchParams(window.location.search).get('student') ?? 'B23DCCN001';
  const student = lecturerStudents.find((item) => item.id === studentId);

  if (!student) {
    return (
      <LecturerPageShell
        currentPage="lecturer_students.html"
        title="Không tìm thấy sinh viên"
        eyebrow="QUẢN LÝ SINH VIÊN"
        description="Mã sinh viên trong liên kết không tồn tại trong dữ liệu hiện tại."
      >
        <LecturerNotFoundState
          message={`Không có sinh viên mang mã ${studentId}. Liên kết có thể đã cũ hoặc dữ liệu đã thay đổi.`}
          backHref="lecturer_students.html"
          backLabel="Quay lại danh sách sinh viên"
        />
      </LecturerPageShell>
    );
  }
  const statusTone = student.status === 'Đang học' ? 'success' : student.status === 'Có bài quá hạn' ? 'primary' : 'warning';
  const assignmentHistory = getAssignmentHistory(loadParticipantRecords(), student.id);

  return (
    <LecturerPageShell
      currentPage="lecturer_students.html"
      title={student.name}
      eyebrow={`${student.id} · ${student.className}`}
      description="Dữ liệu học tập quan sát được trong học phần Vật lý đại cương 1."
      actions={<StatusBadge tone={statusTone}>{student.status}</StatusBadge>}
    >
      <MetricGrid items={[
        { label: 'Tiến độ', value: `${student.progress}%`, detail: 'học phần', icon: 'trending_up', progress: student.progress },
        { label: 'Điểm trung bình', value: String(student.score), detail: '/10', icon: 'leaderboard' },
        { label: 'Bài kiểm tra', value: student.exams.split('/')[0], detail: `/${student.exams.split('/')[1]} bài`, icon: 'quiz', progress: (Number(student.exams.split('/')[0]) / Number(student.exams.split('/')[1])) * 100 },
        { label: 'Thí nghiệm', value: student.labs.split('/')[0], detail: `/${student.labs.split('/')[1]} bài`, icon: 'science', progress: (Number(student.labs.split('/')[0]) / Number(student.labs.split('/')[1])) * 100 },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <Card className="lg:col-span-7 p-6">
          <SectionHeader icon="menu_book" title="Tiến độ theo chương" />
          <div className="pt-5"><ProgressFillList items={studentChapterProgress} label={`Tiến độ học tập theo chương của ${student.name}`} /></div>
        </Card>
        <Card className="lg:col-span-5 p-6">
          <SectionHeader icon="priority_high" title="Nội dung có tỷ lệ trả lời sai cao" />
          <p className="pt-5 text-body-sm text-[#64748B]">Tỷ lệ được tính từ các lượt trả lời đã ghi nhận.</p>
          <div className="mt-4"><HorizontalBarChart items={studentDifficultTopics} label="Tỷ lệ trả lời sai theo nội dung" /></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-6">
          <SectionHeader icon="quiz" title="Bài kiểm tra gần đây" />
          <div className="pt-5"><DataTable columns={['Bài kiểm tra', 'Ngày làm', 'Điểm', 'Trạng thái']} rows={studentRecentExams} renderRow={(row) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-4 font-semibold min-w-[190px]">{row.title}</td><td className="px-3 py-4 whitespace-nowrap">{row.date}</td><td className="px-3 py-4 font-bold whitespace-nowrap">{row.score}</td><td className="px-3 py-4"><StatusBadge tone="success">{row.status}</StatusBadge></td></tr>} /></div>
        </Card>
        <Card className="p-6">
          <SectionHeader icon="science" title="Danh sách thí nghiệm" />
          <div className="pt-5"><DataTable columns={['Thí nghiệm', 'Ngày nộp', 'Điểm', 'Trạng thái']} rows={studentLabs} renderRow={(row) => <tr className="border-t border-[#E2E8F0]"><td className="px-3 py-4 font-semibold min-w-[210px]">{row.title}</td><td className="px-3 py-4 whitespace-nowrap">{row.submitted}</td><td className="px-3 py-4 font-bold whitespace-nowrap">{row.score}</td><td className="px-3 py-4"><StatusBadge tone={row.status === 'Đã chấm' ? 'success' : 'neutral'}>{row.status}</StatusBadge></td></tr>} /></div>
        </Card>
      </div>

      <Card className="p-6">
        <SectionHeader icon="history" title="Nhật ký học tập gần đây" />
        <ol className="pt-2">
          {studentLearningLog.map((item, index) => (
            <li key={item.id} className="relative flex gap-3 py-4">
              {index < studentLearningLog.length - 1 && <span className="absolute left-2 top-8 h-[calc(100%-8px)] w-px bg-[#E2E8F0]" aria-hidden="true" />}
              <span className="z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-[#FEE2E2] bg-primary" aria-hidden="true" />
              <div><time className="text-label-md font-bold text-primary">{item.time}</time><p className="mt-1 text-body-md">{item.text}</p></div>
            </li>
          ))}
        </ol>
      </Card>
      <Card className="p-6">
        <SectionHeader icon="manage_history" title="Lịch sử phân công" />
        {assignmentHistory.length ? <ol className="divide-y divide-[#E2E8F0] pt-3">{assignmentHistory.map((item, index) => <li key={`${item.at}-${index}`} className="py-3 text-body-sm"><time className="font-semibold text-primary">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.at))}</time><p className="mt-1 font-semibold">{item.action}: {item.fromSessionId ? `${item.fromSessionId} → ` : ''}{item.toSessionId}</p><p className="mt-1 text-[#64748B]">{item.reason} · {item.by}</p></li>)}</ol> : <p className="pt-4 text-body-sm text-[#64748B]">Chưa có thay đổi phân công trong phiên frontend hiện tại.</p>}
      </Card>
    </LecturerPageShell>
  );
}
