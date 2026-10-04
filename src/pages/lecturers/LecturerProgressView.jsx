import React, { useState } from 'react';
import { groupStudentProgress } from '../../lib/lecturerProgress.js';
import { ProgressBar } from '../../components/ProgressBar.jsx';
import { Button, Table, dateText, displayName } from './LecturerShared.jsx';

export function LecturerProgressView({ students, topics, progress, studentId }) {
  const [selected, setSelected] = useState('');
  const rows = groupStudentProgress(students, topics, progress);
  const activeId = String(studentId || selected);
  const active = rows.find((row) => row.studentId === activeId);
  const percent = (value) => (
    <div className="min-w-[120px] space-y-1">
      <span className="text-body-sm font-semibold">{value}%</span>
      <ProgressBar value={value} compact />
    </div>
  );
  if (activeId) {
    return (
      <div className="mt-4">
        {!studentId && (
          <Button variant="secondary" onClick={() => setSelected('')} icon="arrow_back">
            Danh sách sinh viên
          </Button>
        )}
        <h3 className="mt-4 font-semibold">Tiến độ từng chương · {active ? displayName(active) : 'Sinh viên'}</h3>
        <Table
          rows={active?.chapters || []}
          columns={['Chương / Chủ đề', 'Tiến độ', 'Trạng thái', 'Truy cập gần nhất']}
          cells={(row) => [
            row.topicName || row.title || `Chủ đề ${row.topicId}`,
            percent(row.progressPercent),
            row.progressPercent === 100 ? 'Đã hoàn thành' : row.progressPercent > 0 ? 'Đang học' : 'Chưa học',
            dateText(row.lastAccessedAt),
          ]}
        />
      </div>
    );
  }
  return (
    <Table
      rows={rows}
      columns={['Sinh viên', 'Mã sinh viên', 'Tiến độ tổng', 'Chương hoàn thành', 'Truy cập gần nhất', '']}
      cells={(row) => [
        <button
          type="button"
          className="font-semibold text-primary hover:underline"
          onClick={() => setSelected(row.studentId)}
        >
          {displayName(row)}
        </button>,
        row.studentCode || '—',
        percent(row.progressPercent),
        `${row.completedChapters}/${row.chapters.length}`,
        dateText(row.lastAccessedAt),
        <Button variant="secondary" onClick={() => setSelected(row.studentId)}>
          Xem tiến độ
        </Button>,
      ]}
    />
  );
}
