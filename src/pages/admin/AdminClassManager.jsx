import React, { useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { Form, SubmitButton } from '../../components/Form.jsx';
import { CurriculumView } from '../../components/CurriculumView.jsx';
import {
  Button,
  Card,
  Field,
  Lookup,
  Modal,
  Resource,
  SelectField,
  Table,
  itemsOf,
  useMutation,
  useResource,
} from '../lecturers/LecturerShared.jsx';

export function AdminClassManager() {
  const classes = useResource('/api/v1/classes', true);
  const subjects = useResource('/api/v1/subjects', true);
  const semesters = useResource('/api/v1/semesters');
  const users = useResource('/api/v1/users/admin/users', true);
  const [editor, setEditor] = useState(null);
  const [classId, setClassId] = useState('');
  const action = useMutation();
  const namedClasses = itemsOf(classes.data).map((item) => ({
    ...item,
    subjectName:
      itemsOf(subjects.data).find((subject) => subject.subjectId === item.subjectId)?.subjectName || item.subjectId,
    semesterName:
      itemsOf(semesters.data).find((semester) => semester.semesterId === item.semesterId)?.semesterName ||
      item.semesterId,
  }));
  const row = namedClasses.find((item) => item.classId === classId);
  return (
    <div>
      {action.feedback}
      <Button className="mt-5" disabled={action.busy} onClick={() => setEditor({})}>
        Tạo lớp
      </Button>
      <Resource value={classes}>
        {(data) => (
          <Table
            asCards
            rows={namedClasses}
            columns={['Lớp', 'Môn', 'Học kỳ', 'Trạng thái', '']}
            cells={(item) => [
              item.classCode,
              item.subjectName,
              item.semesterName,
              item.status,
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setClassId(item.classId)}>
                  Chi tiết
                </Button>
                <Button variant="secondary" onClick={() => setEditor(item)}>
                  Sửa
                </Button>
                <SelectField
                  label="Trạng thái lớp"
                  value={item.status}
                  disabled={action.busy}
                  onChange={(e) =>
                    action.confirm(
                      'Đổi trạng thái lớp?',
                      () => api.classes.updateStatus(item.classId, { status: e.target.value }),
                      classes.reload
                    )
                  }
                >
                  {['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </SelectField>
              </div>,
            ]}
          />
        )}
      </Resource>
      {editor && (
        <Modal title={editor.classId ? 'Sửa lớp' : 'Tạo lớp'} busy={action.busy} onClose={() => setEditor(null)}>
          <Resource value={subjects}>
            {() => (
              <Resource value={semesters}>
                {() => (
                  <Resource value={users}>
                    {() => (
                      <AdminClassForm
                        initial={editor}
                        subjects={itemsOf(subjects.data)}
                        semesters={itemsOf(semesters.data)}
                        users={itemsOf(users.data)}
                        busy={action.busy}
                        onSave={async (body) => {
                          const result = await action.run(() =>
                            editor.classId ? api.classes.update(editor.classId, body) : api.classes.create(body)
                          );
                          if (result.ok) {
                            setEditor(null);
                            classes.reload();
                          }
                        }}
                      />
                    )}
                  </Resource>
                )}
              </Resource>
            )}
          </Resource>
        </Modal>
      )}
      {row && (
        <Modal wide title={row.classCode} onClose={() => setClassId('')}>
          <h3 className="font-semibold">Chương trình môn · {row.subjectName}</h3>
          <CurriculumView subjectId={row.subjectId} />
          <AdminClassPeople key={classId} classId={classId} users={itemsOf(users.data)} />
          <Button
            className="mt-4"
            onClick={() => {
              setEditor(row);
              setClassId('');
            }}
          >
            Sửa lớp
          </Button>
        </Modal>
      )}
    </div>
  );
}
function AdminClassForm({ initial, subjects, semesters, users, busy, onSave }) {
  const [subjectId, setSubjectId] = useState(initial.subjectId || '');
  return (
    <Form
      className="grid gap-4"
      busy={busy}
      onSubmit={(e) => {
        e.preventDefault();
        const raw = Object.fromEntries(new FormData(e.currentTarget));
        const body = { classCode: raw.classCode.trim(), maxStudents: Number(raw.maxStudents) };
        if (!initial.classId) {
          body.subjectId = subjectId;
          body.semesterId = raw.semesterId;
          if (raw.instructorId) body.instructorId = raw.instructorId;
        }
        onSave(body);
      }}
    >
      <Field label="Mã lớp" name="classCode" required defaultValue={initial.classCode || ''} />
      {!initial.classId && (
        <>
          <SelectField label="Môn học" value={subjectId} required onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Chọn môn</option>
            {subjects.map((row) => (
              <option key={row.subjectId} value={row.subjectId}>
                {row.subjectName}
              </option>
            ))}
          </SelectField>
          <SelectField label="Học kỳ" name="semesterId" required>
            <option value="">Chọn học kỳ</option>
            {semesters.map((row) => (
              <option key={row.semesterId} value={row.semesterId}>
                {row.semesterName}
              </option>
            ))}
          </SelectField>
          <SelectField label="Giảng viên" name="instructorId">
            <option value="">Chưa phân công</option>
            {users
              .filter((row) => row.role === 'INSTRUCTOR')
              .map((row) => (
                <option key={row.userId} value={row.userId}>
                  {row.fullName || row.username}
                </option>
              ))}
          </SelectField>
        </>
      )}
      <Field
        label="Sĩ số tối đa"
        name="maxStudents"
        type="number"
        min={1}
        step={1}
        required
        defaultValue={initial.maxStudents || 60}
      />
      {subjectId && <CurriculumView subjectId={subjectId} />}
      <SubmitButton disabled={busy}>Lưu lớp</SubmitButton>
    </Form>
  );
}
function AdminClassPeople({ classId, users }) {
  const staff = useResource(`/api/v1/classes/${classId}/staff`);
  const students = useResource(`/api/v1/classes/${classId}/students`, true);
  const action = useMutation();
  return (
    <div className="mt-5">
      {action.feedback}
      <h3 className="font-semibold">Phân công</h3>
      <Form
        className="mt-3 flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const raw = Object.fromEntries(new FormData(e.currentTarget));
          const result = await action.run(() => api.classes.assignStaff(classId, raw));
          if (result.ok) staff.reload();
        }}
      >
        <SelectField label="Nhân sự" name="userId" required>
          <option value="">Chọn nhân sự</option>
          {users
            .filter((row) => ['INSTRUCTOR', 'TA'].includes(row.role))
            .map((row) => (
              <option key={row.userId} value={row.userId}>
                {row.fullName || row.username}
              </option>
            ))}
        </SelectField>
        <SelectField label="Vai trò" name="roleInClass">
          <option value="INSTRUCTOR">Giảng viên</option>
          <option value="TA">Trợ giảng</option>
        </SelectField>
        <SubmitButton disabled={action.busy}>Phân công</SubmitButton>
      </Form>
      <Resource value={staff}>
        {(data) => (
          <Table
            rows={itemsOf(data)}
            columns={['Nhân sự', 'Vai trò', '']}
            cells={(row) => [
              row.fullName || row.username,
              row.roleInClass,
              <Button
                variant="ghost"
                disabled={action.busy}
                onClick={() =>
                  action.confirm('Gỡ phân công?', () => api.classes.removeStaff(classId, row.userId), staff.reload)
                }
              >
                Gỡ
              </Button>,
            ]}
          />
        )}
      </Resource>
      <h3 className="mt-5 font-semibold">Sinh viên</h3>
      <Resource value={students}>
        {(data) => (
          <Table
            rows={itemsOf(data)}
            columns={['Sinh viên', 'Trạng thái', '']}
            cells={(row) => [
              row.fullName || row.studentName || row.username,
              row.status,
              <div className="flex gap-2">
                <SelectField
                  label="Trạng thái ghi danh"
                  value={row.status}
                  disabled={action.busy}
                  onChange={(e) =>
                    action.confirm(
                      'Đổi trạng thái ghi danh?',
                      () =>
                        api.classes.updateStudentStatus(classId, row.studentId || row.userId, {
                          status: e.target.value,
                        }),
                      students.reload
                    )
                  }
                >
                  {['ACTIVE', 'DROPPED', 'COMPLETED'].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </SelectField>
                <Button
                  variant="ghost"
                  disabled={action.busy}
                  onClick={() =>
                    action.confirm(
                      'Gỡ sinh viên?',
                      () => api.classes.removeStudent(classId, row.studentId || row.userId),
                      students.reload
                    )
                  }
                >
                  Gỡ
                </Button>
              </div>,
            ]}
          />
        )}
      </Resource>
    </div>
  );
}
