import { DataTable as SharedDataTable } from './DataTable.jsx';
import { FormField as SharedFormField } from './FormField.jsx';
import { SelectField as SharedSelectField } from './SelectField.jsx';
import { FormDialog as SharedFormDialog } from './FormDialog.jsx';
import React, { useMemo, useState } from 'react';
import { Button } from './Button.jsx';
import { Pagination } from './Pagination.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { usePagination } from '../hooks/usePagination.js';
import { participantStatusMeta } from '../lib/participantState.js';

export function AddParticipantsDialog({ title, context, students, participants, sessions, onCancel, onConfirm }) {
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const activeIds = new Set(
    participants.filter((item) => !['CANCELLED', 'TRANSFERRED'].includes(item.status)).map((item) => item.studentId)
  );
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi');
    return students.filter(
      (student) =>
        (!keyword || `${student.id} ${student.name}`.toLocaleLowerCase('vi').includes(keyword)) &&
        (classFilter === 'ALL' || student.className === classFilter)
    );
  }, [classFilter, query, students]);
  const pagination = usePagination(filtered, [query, classFilter]);
  const selectableOnPage = pagination.pageItems.filter((student) => !activeIds.has(student.id));
  const pageSelected =
    selectableOnPage.length > 0 && selectableOnPage.every((student) => selectedStudentIds.includes(student.id));
  const togglePage = () =>
    setSelectedStudentIds((current) =>
      pageSelected
        ? current.filter((id) => !selectableOnPage.some((student) => student.id === id))
        : [...new Set([...current, ...selectableOnPage.map((student) => student.id)])]
    );
  return (
    <SharedFormDialog title={<>{title}</>} onClose={onCancel} wide>
      <div>
        <div>
          <p className="text-label-md font-bold text-primary">{context}</p>
          <p className="mt-1 text-body-sm text-[#64748B]">
            {sessions[0]?.name} · {sessions[0]?.startAt?.replace('T', ' ')}
          </p>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SharedFormField
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên hoặc mã sinh viên..."
            className="mt-2 w-full"
            label={<>Tìm sinh viên</>}
            wrapperClassName="text-body-sm font-semibold"
          />
          <SharedSelectField
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            label={<>Lớp</>}
            className="text-body-sm font-semibold"
          >
            <option value="ALL">Tất cả lớp</option>
            {[...new Set(students.map((student) => student.className))].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </SharedSelectField>
        </div>
        {filtered.length ? (
          <>
            <div className="mt-4 overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <SharedDataTable
                rows={pagination.pageItems}
                renderRow={(student) => {
                  const exists = activeIds.has(student.id);
                  return (
                    <tr key={student.id} className="border-t border-[#E2E8F0]">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          disabled={exists}
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() =>
                            setSelectedStudentIds((current) =>
                              current.includes(student.id)
                                ? current.filter((id) => id !== student.id)
                                : [...current, student.id]
                            )
                          }
                          aria-label={`Chọn ${student.name}`}
                        />
                      </td>
                      <td className="px-3 py-3 font-mono">{student.id}</td>
                      <td className="px-3 py-3 font-semibold">{student.name}</td>
                      <td className="px-3 py-3">{student.className}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={exists ? 'neutral' : 'success'}>
                          {exists ? 'Đã tham gia' : 'Có thể thêm'}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                }}
                paginate={false}
                headerRows={
                  <>
                    <tr>
                      <th className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={pageSelected}
                          onChange={togglePage}
                          aria-label="Chọn tất cả sinh viên có thể thêm trên trang hiện tại"
                        />
                      </th>
                      <th className="px-3 py-3">Mã SV</th>
                      <th className="px-3 py-3">Họ tên</th>
                      <th className="px-3 py-3">Lớp</th>
                      <th className="px-3 py-3">Trạng thái</th>
                    </tr>
                  </>
                }
                tableClassName="w-full text-left text-body-sm"
              />
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              pageSize={pagination.pageSize}
              totalItems={filtered.length}
              onPageChange={pagination.setCurrentPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        ) : (
          <div className="py-10 text-center">
            <h3 className="font-bold">Không tìm thấy sinh viên phù hợp.</h3>
          </div>
        )}
        <div className="sticky bottom-0 mt-5 flex flex-col-reverse gap-2 border-t border-[#E2E8F0] bg-white pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Hủy
          </Button>
          <Button disabled={!selectedStudentIds.length} onClick={() => onConfirm(selectedStudentIds)}>
            Thêm {selectedStudentIds.length} sinh viên
          </Button>
        </div>
      </div>
    </SharedFormDialog>
  );
}

export function ReassignParticipantDialog({ mode, participant, student, sessions, onCancel, onConfirm }) {
  const [targetSessionId, setTargetSessionId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const current = sessions.find((session) => session.id === participant.sessionId);
  const available = sessions.filter((session) => session.id !== participant.sessionId);
  const makeup = mode === 'MAKEUP';
  const submit = () => {
    if (!targetSessionId) return setError('Vui lòng chọn ca đích.');
    if (!reason.trim()) return setError('Vui lòng nhập lý do.');
    onConfirm(targetSessionId, reason.trim());
  };
  return (
    <SharedFormDialog
      title={
        <>{makeup ? (participant.activityType === 'LAB' ? 'Bố trí thực hành bù' : 'Bố trí thi bù') : 'Chuyển ca'}</>
      }
      onClose={onCancel}
    >
      <p className="text-label-md font-bold text-primary">{makeup ? 'BỐ TRÍ CA BÙ' : 'CHUYỂN CA'}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#F8FAFC] p-4">
        <div>
          <dt className="text-[#64748B]">Sinh viên</dt>
          <dd className="font-semibold">{student.name}</dd>
        </div>
        <div>
          <dt className="text-[#64748B]">MSSV</dt>
          <dd className="font-semibold">{student.id}</dd>
        </div>
        <div>
          <dt className="text-[#64748B]">Ca hiện tại</dt>
          <dd className="font-semibold">{current?.name ?? participant.sessionId}</dd>
        </div>
        <div>
          <dt className="text-[#64748B]">Trạng thái</dt>
          <dd>
            <StatusBadge tone={participantStatusMeta[participant.status]?.tone}>
              {participantStatusMeta[participant.status]?.label}
            </StatusBadge>
          </dd>
        </div>
      </dl>
      <SharedSelectField
        value={targetSessionId}
        onChange={(event) => setTargetSessionId(event.target.value)}
        label={<>{makeup ? 'Ca bù' : 'Chuyển sang'}</>}
        className="mt-5 block text-body-sm font-semibold"
      >
        <option value="">Chọn ca</option>
        {available.map((session) => (
          <option key={session.id} value={session.id}>
            {session.name} · {session.startAt?.replace('T', ' ')}
          </option>
        ))}
      </SharedSelectField>
      <SharedFormField
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows="3"
        className="mt-2 w-full"
        multiline
        label={<>Lý do</>}
        wrapperClassName="mt-4 block text-body-sm font-semibold"
      />
      {error && (
        <p className="mt-2 text-body-sm text-primary" role="alert">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button onClick={submit}>{makeup ? 'Xác nhận bố trí bù' : 'Xác nhận chuyển ca'}</Button>
      </div>
    </SharedFormDialog>
  );
}
