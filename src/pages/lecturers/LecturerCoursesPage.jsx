import { formatPercent } from '../../lib/formatPercent.js';
import React from 'react';
import { readAcademicScope } from '../../lib/academicScope.js';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { PaginatedCollection } from '../../components/Pagination.jsx';
import { lecturerCourses } from '../../data/lecturerData.js';

export function LecturerCoursesPage() {
  const { classId } = readAcademicScope();
  const scopedCourses = lecturerCourses.filter((course) => classId === 'ALL' || course.className === classId);
  return (
    <LecturerPageShell
      currentPage="lecturer_courses.html"
      title="Vật lý đại cương 1"
      eyebrow="BAS1201 · HỌC KỲ 1 · 2026–2027"
      description="Quản lý các lớp thuộc học phần Vật lý đại cương 1 đang phụ trách."
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-headline-md font-bold">Các lớp đang giảng dạy</h2>
          <p className="mt-1 text-body-sm text-[#64748B]">
            {scopedCourses.length} lớp · {scopedCourses.reduce((sum, course) => sum + course.students, 0)} sinh viên
          </p>
        </div>
        <StatusBadge tone="success">Đang diễn ra</StatusBadge>
      </div>
      <PaginatedCollection items={scopedCourses} resetKeys={[classId]} pageSize={6}>
        {(pageItems) => (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {pageItems.map((course) => (
              <Card
                key={course.id}
                variant="accent"
                className="p-5 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEE2E2] text-primary">
                    <span className="material-symbols-outlined">school</span>
                  </span>
                  <StatusBadge tone="success">Đang giảng dạy</StatusBadge>
                </div>
                <p className="mt-5 text-label-md font-bold text-primary">{course.code}</p>
                <h2 className="mt-1 text-headline-sm font-bold">{course.className}</h2>
                <p className="mt-1 text-body-sm text-[#64748B]">{course.students} sinh viên</p>
                <ProgressBar className="mt-5 text-[#64748B]" value={course.progress} label="Tiến độ trung bình" />
                <div className="mt-4 grid grid-cols-2 gap-3 text-body-sm">
                  <Card as="div" className="bg-[#F8FAFC] p-3">
                    <span className="text-[#64748B]">Điểm trung bình</span>
                    <strong className="mt-1 block">{course.averageScore}/10</strong>
                  </Card>
                  <Card as="div" className="bg-[#F8FAFC] p-3">
                    <span className="text-[#64748B]">Hoàn thành Lab</span>
                    <strong className="mt-1 block">{formatPercent(course.labCompletion)}</strong>
                  </Card>
                </div>
                <a href={`lecturer_course_detail.html?class=${course.className}`} className="mt-5">
                  <Button className="w-full">Quản lý lớp</Button>
                </a>
              </Card>
            ))}
          </div>
        )}
      </PaginatedCollection>
    </LecturerPageShell>
  );
}
