import React, { useState } from 'react';
import { AuthAlert } from '../../components/AuthLayout.jsx';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { LecturerPageShell } from '../../components/LecturerPageShell.jsx';
import { SectionHeader } from '../../components/SectionHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Tabs } from '../../components/Tabs.jsx';
import '../../styles/class-operations.css';

const initialStaff = [
  { id: 'GV001', name: 'TS. Nguyễn Văn B', role: 'INSTRUCTOR' },
  { id: 'B23DCCN014', name: 'Trần Minh Anh', role: 'TA' },
];
const initialStudents = [
  { id: 'B23DCCN001', name: 'Nguyễn Văn A', email: 'vana@ptit.edu.vn', status: 'ACTIVE' },
  { id: 'B23DCCN027', name: 'Lê Hoàng Nam', email: 'hoangnam@ptit.edu.vn', status: 'ACTIVE' },
  { id: 'B23DCCN038', name: 'Đỗ Đức Long', email: 'duclong@ptit.edu.vn', status: 'INACTIVE' },
];
const activities = [
  {
    id: 'status',
    time: '10:30 · Hôm nay',
    actor: 'TS. Nguyễn Văn B',
    action: 'Cập nhật trạng thái lớp',
    target: 'Đang hoạt động',
  },
  {
    id: 'support',
    time: '09:15 · Hôm nay',
    actor: 'Trần Minh Anh',
    action: 'Ghi nhận hỗ trợ',
    target: 'Chấm 6 báo cáo Lab 01',
  },
  { id: 'enrollment', time: '20/09/2026', actor: 'Hệ thống', action: 'Ghi danh hàng loạt', target: '42 sinh viên' },
];
const tabs = [
  { id: 'STAFF', label: 'Nhân sự lớp', title: 'Giảng viên và trợ giảng', icon: 'groups' },
  { id: 'STUDENTS', label: 'Ghi danh sinh viên', title: 'Danh sách ghi danh', icon: 'how_to_reg' },
  { id: 'ACTIVITY', label: 'Nhật ký hoạt động', title: 'Nhật ký lớp học', icon: 'history' },
];

export function LecturerClassOperationsPage() {
  const [staff, setStaff] = useState(initialStaff);
  const [students, setStudents] = useState(initialStudents);
  const [classStatus, setClassStatus] = useState('ACTIVE');
  const [notice, setNotice] = useState(null);
  const notify = (message) => setNotice((previous) => ({ id: (previous?.id ?? 0) + 1, message }));
  const active = classStatus === 'ACTIVE';
  const hasDemoStaff = staff.some((person) => person.id === 'B23DCCN105');
  const hasDemoStudent = students.some((student) => student.id === 'B23DCCN105');

  const addStaff = () => {
    if (hasDemoStaff) return;
    setStaff((items) => [...items, { id: 'B23DCCN105', name: 'Phạm Thu Hà', role: 'TA' }]);
    notify('Đã phân công trợ giảng trong dữ liệu demo.');
  };
  const addStudent = () => {
    if (hasDemoStudent) return;
    setStudents((items) => [
      ...items,
      { id: 'B23DCCN105', name: 'Sinh viên mới', email: 'newstudent@ptit.edu.vn', status: 'ACTIVE' },
    ]);
    notify('Đã thêm sinh viên vào lớp trong dữ liệu demo.');
  };

  return (
    <LecturerPageShell
      currentPage="lecturer_class_operations.html"
      title="Vận hành lớp học"
      eyebrow="LỚP D23CQCN01-B · BAS1201"
    >
      <div className="class-operations">
        <Card className="class-operations__summary">
          <div className="class-operations__class">
            <span className="text-body-sm text-[#64748B]">Lớp học</span>
            <h2 className="text-body-md font-semibold text-on-surface">D23CQCN01-B · BAS1201</h2>
            <span className="text-body-sm text-[#64748B]">Học kỳ 1 · 2026–2027</span>
          </div>
          <div className="class-operations__status">
            <span className="text-body-sm text-[#64748B]">Trạng thái lớp</span>
            <StatusBadge tone={active ? 'success' : 'neutral'}>{active ? 'Đang hoạt động' : 'Tạm ngưng'}</StatusBadge>
          </div>
          <Button
            className="class-operations__status-button"
            variant="secondary"
            icon={active ? 'pause_circle' : 'play_circle'}
            onClick={() => {
              setClassStatus(active ? 'INACTIVE' : 'ACTIVE');
              notify('Đã cập nhật trạng thái lớp trong dữ liệu demo.');
            }}
          >
            {active ? 'Tạm ngưng lớp' : 'Mở lại lớp'}
          </Button>
        </Card>

        <Card className="class-operations__workspace">
          <Tabs items={tabs}>
            {(tab) => {
              const section = tabs.find((item) => item.id === tab);
              const rows = tab === 'STAFF' ? staff : tab === 'STUDENTS' ? students : activities;
              return (
                <div className="class-operations__panel" role="region" aria-label={section.title}>
                  <SectionHeader
                    className="class-operations__toolbar"
                    icon={section.icon}
                    title={section.title}
                    action={
                      <div className="class-operations__actions">
                        {tab === 'STAFF' && (
                          <Button
                            icon="person_add"
                            onClick={addStaff}
                            disabled={hasDemoStaff}
                            title={hasDemoStaff ? 'Nhân sự mẫu đã được phân công' : undefined}
                          >
                            Phân công nhân sự
                          </Button>
                        )}
                        {tab === 'STUDENTS' && (
                          <>
                            <Button
                              variant="secondary"
                              icon="upload_file"
                              disabled
                              title="Nhập Excel chưa được kết nối trên trang này"
                            >
                              Nhập Excel
                            </Button>
                            <Button
                              icon="person_add"
                              onClick={addStudent}
                              disabled={hasDemoStudent}
                              title={hasDemoStudent ? 'Sinh viên mẫu đã được ghi danh' : undefined}
                            >
                              Ghi danh lẻ
                            </Button>
                          </>
                        )}
                      </div>
                    }
                  />
                  <div
                    className={`class-operations__table class-operations__table--${tab.toLowerCase()}`}
                    tabIndex={0}
                    role="region"
                    aria-label={`Bảng ${section.title.toLowerCase()}`}
                  >
                    {tab === 'STAFF' ? (
                      <DataTable
                        paginate={false}
                        columns={['Họ tên', 'Vai trò', 'Thao tác']}
                        rows={staff}
                        renderRow={(person) => (
                          <tr>
                            <td>
                              <span className="class-operations__name">{person.name}</span>
                              <span className="class-operations__identifier">{person.id}</span>
                            </td>
                            <td>
                              <StatusBadge tone={person.role === 'INSTRUCTOR' ? 'primary' : 'neutral'}>
                                {person.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Trợ giảng'}
                              </StatusBadge>
                            </td>
                            <td>
                              {person.role === 'TA' && (
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setStaff((items) => items.filter((item) => item.id !== person.id));
                                    notify('Đã gỡ phân công trong dữ liệu demo.');
                                  }}
                                >
                                  Gỡ phân công
                                </Button>
                              )}
                            </td>
                          </tr>
                        )}
                      />
                    ) : tab === 'STUDENTS' ? (
                      <DataTable
                        paginate={false}
                        columns={['Sinh viên', 'Email', 'Trạng thái', 'Thao tác']}
                        rows={students}
                        renderRow={(student) => (
                          <tr>
                            <td>
                              <span className="class-operations__name">{student.name}</span>
                              <span className="class-operations__identifier">{student.id}</span>
                            </td>
                            <td>{student.email}</td>
                            <td>
                              <StatusBadge tone={student.status === 'ACTIVE' ? 'success' : 'warning'}>
                                {student.status === 'ACTIVE' ? 'Đang học' : 'Tạm dừng'}
                              </StatusBadge>
                            </td>
                            <td>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setStudents((items) => items.filter((item) => item.id !== student.id));
                                  notify('Đã xóa ghi danh trong dữ liệu demo.');
                                }}
                              >
                                Xóa ghi danh
                              </Button>
                            </td>
                          </tr>
                        )}
                      />
                    ) : (
                      <DataTable
                        paginate={false}
                        columns={['Thời gian', 'Người thực hiện', 'Hoạt động', 'Đối tượng']}
                        rows={activities}
                        renderRow={(item) => (
                          <tr>
                            <td>{item.time}</td>
                            <td>{item.actor}</td>
                            <td>{item.action}</td>
                            <td>{item.target}</td>
                          </tr>
                        )}
                      />
                    )}
                    {rows.length === 0 && <p className="class-operations__empty">Chưa có dữ liệu.</p>}
                  </div>
                  <div className="class-operations__footer">
                    <span>
                      {rows.length} {tab === 'STAFF' ? 'nhân sự' : tab === 'STUDENTS' ? 'sinh viên' : 'hoạt động'}
                    </span>
                    <span>Dữ liệu demo</span>
                  </div>
                </div>
              );
            }}
          </Tabs>
        </Card>
      </div>
      {notice && <AuthAlert key={notice.id}>{notice.message}</AuthAlert>}
    </LecturerPageShell>
  );
}
