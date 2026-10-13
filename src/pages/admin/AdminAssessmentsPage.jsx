import React, { useState } from 'react';
import { AdminPageShell } from '../../components/AdminPageShell.jsx';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { SelectField } from '../../components/SelectField.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import { StudentSearchField } from '../../components/StudentSearchField.jsx';
import { listItems, useApiData } from '../../hooks/useApiData.js';
import { api } from '../../lib/apiClient.js';
import { MatrixManager } from '../lecturers/LecturerApiWorkspace.jsx';

function EnrollmentManager() {
  const [classId, setClassId] = useState('');
  const [student, setStudent] = useState(null);
  const [bulkStudents, setBulkStudents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const classes = useApiData('/api/v1/classes?page=0&size=100');
  const rows = listItems(classes.data);
  const begin = () => {
    setBusy(true);
    setMessage('');
    setError('');
  };
  async function enroll() {
    if (!classId || !student?.userId) return;
    begin();
    try {
      await api.classes.enrollSingle(classId, { studentId: student.userId });
      setMessage(`Đã ghi danh ${student.fullName || student.username} vào lớp.`);
      setStudent(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  const addToBulk = () => {
    if (!student?.userId) return;
    setBulkStudents((rows) => (rows.some((item) => item.userId === student.userId) ? rows : [...rows, student]));
    setStudent(null);
    setMessage('Đã thêm sinh viên vào danh sách ghi danh hàng loạt.');
  };
  async function enrollBulk() {
    if (!classId || !bulkStudents.length) return;
    begin();
    try {
      await api.classes.enrollBulk(classId, { studentIds: bulkStudents.map((item) => item.userId) });
      setMessage(`Đã gửi ghi danh hàng loạt cho ${bulkStudents.length} sinh viên.`);
      setBulkStudents([]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="mt-5 p-5">
      <AuthAlert>{message}</AuthAlert>
      <AuthAlert error>{error}</AuthAlert>
      <h2 className="text-lg font-bold">Ghi danh sinh viên vào lớp</h2>
      <p className="mt-1 text-body-sm text-[#64748B]">
        Tìm sinh viên theo tên đăng nhập, mã sinh viên hoặc email để ghi danh vào lớp.
      </p>
      <div className="mt-5 grid gap-4">
        <SelectField
          label="Lớp học *"
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
          disabled={classes.loading || busy}
        >
          <option value="">Chọn lớp học</option>
          {rows.map((item) => (
            <option key={item.classId} value={item.classId}>
              {item.classCode ? `${item.classCode} — ${item.className || 'Lớp học'}` : item.className || 'Lớp học'}
            </option>
          ))}
        </SelectField>
        <StudentSearchField onSelect={setStudent} disabled={busy} />
      </div>
      {student && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" disabled={busy} onClick={addToBulk} icon="playlist_add">
            Thêm vào danh sách
          </Button>
          <Button disabled={!classId || busy} onClick={enroll} icon="person_add">
            Ghi danh một người
          </Button>
        </div>
      )}
      {bulkStudents.length > 0 && (
        <Card className="mt-5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Danh sách ghi danh hàng loạt ({bulkStudents.length})</h3>
              <p className="mt-1 text-body-sm text-[#64748B]">Các sinh viên trong danh sách sẽ được ghi danh vào lớp đã chọn.</p>
            </div>
            <Button disabled={!classId || busy} onClick={enrollBulk} icon="group_add">
              Ghi danh hàng loạt
            </Button>
          </div>
          <ul className="mt-3 divide-y divide-[#E2E8F0]">
            {bulkStudents.map((item) => (
              <li key={item.userId} className="flex items-center justify-between gap-3 py-2 text-body-sm">
                <span>
                  {item.fullName || item.username} · {item.username}
                </span>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setBulkStudents((rows) => rows.filter((row) => row.userId !== item.userId))}
                >
                  Bỏ
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Card>
  );
}

export function AdminAssessmentsPage() {
  const [tab, setTab] = useState('matrices');
  return (
    <AdminPageShell
      currentPage="admin_assessments.html"
      title="Ma trận đề & ghi danh"
      description="Thiết lập ma trận đề thi và quản lý ghi danh sinh viên vào lớp."
    >
      <Tabs
        items={[
          { id: 'matrices', label: 'Ma trận đề' },
          { id: 'enrollments', label: 'Ghi danh sinh viên' },
        ]}
        activeId={tab}
        onChange={setTab}
      >
        {() => (tab === 'matrices' ? <MatrixManager /> : <EnrollmentManager />)}
      </Tabs>
    </AdminPageShell>
  );
}
