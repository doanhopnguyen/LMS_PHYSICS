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
  const activeIds = new Set(participants.filter((item) => !['CANCELLED', 'TRANSFERRED'].includes(item.status)).map((item) => item.studentId));
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi');
    return students.filter((student) => (!keyword || `${student.id} ${student.name}`.toLocaleLowerCase('vi').includes(keyword)) && (classFilter === 'ALL' || student.className === classFilter));
  }, [classFilter, query, students]);
  const pagination = usePagination(filtered, [query, classFilter]);
  const selectableOnPage = pagination.pageItems.filter((student) => !activeIds.has(student.id));
  const pageSelected = selectableOnPage.length > 0 && selectableOnPage.every((student) => selectedStudentIds.includes(student.id));
  const togglePage = () => setSelectedStudentIds((current) => pageSelected ? current.filter((id) => !selectableOnPage.some((student) => student.id === id)) : [...new Set([...current, ...selectableOnPage.map((student) => student.id)])]);
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#0F172A]/45 p-2 md:p-6" role="presentation">
      <section className="max-h-[calc(100dvh-16px)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="add-participants-title">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#E2E8F0] bg-white p-5"><div><p className="text-label-md font-bold text-primary">{context}</p><h2 id="add-participants-title" className="text-headline-md font-bold">{title}</h2><p className="mt-1 text-body-sm text-[#64748B]">{sessions[0]?.name} · {sessions[0]?.startAt?.replace('T', ' ')}</p></div><button type="button" aria-label="Đóng" onClick={onCancel} className="p-2"><span className="material-symbols-outlined">close</span></button></div>
        <div className="p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><label className="text-body-sm font-semibold">Tìm sinh viên<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên hoặc mã sinh viên..." className="mt-2 w-full border border-[#CBD5E1] px-4" /></label><label className="text-body-sm font-semibold">Lớp<select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"><option value="ALL">Tất cả lớp</option>{[...new Set(students.map((student) => student.className))].map((value) => <option key={value}>{value}</option>)}</select></label></div>
          {filtered.length ? <><div className="mt-4 overflow-x-auto rounded-xl border border-[#E2E8F0]"><table className="w-full text-left text-body-sm"><thead className="bg-[#F8FAFC]"><tr><th className="px-3 py-3"><input type="checkbox" checked={pageSelected} onChange={togglePage} aria-label="Chọn tất cả sinh viên có thể thêm trên trang hiện tại" /></th><th className="px-3 py-3">Mã SV</th><th className="px-3 py-3">Họ tên</th><th className="px-3 py-3">Lớp</th><th className="px-3 py-3">Trạng thái</th></tr></thead><tbody>{pagination.pageItems.map((student) => { const exists = activeIds.has(student.id); return <tr key={student.id} className="border-t border-[#E2E8F0]"><td className="px-3 py-3"><input type="checkbox" disabled={exists} checked={selectedStudentIds.includes(student.id)} onChange={() => setSelectedStudentIds((current) => current.includes(student.id) ? current.filter((id) => id !== student.id) : [...current, student.id])} aria-label={`Chọn ${student.name}`} /></td><td className="px-3 py-3 font-mono">{student.id}</td><td className="px-3 py-3 font-semibold">{student.name}</td><td className="px-3 py-3">{student.className}</td><td className="px-3 py-3"><StatusBadge tone={exists ? 'neutral' : 'success'}>{exists ? 'Đã tham gia' : 'Có thể thêm'}</StatusBadge></td></tr>;})}</tbody></table></div><Pagination currentPage={pagination.currentPage} pageSize={pagination.pageSize} totalItems={filtered.length} onPageChange={pagination.setCurrentPage} onPageSizeChange={pagination.setPageSize} /></> : <div className="py-10 text-center"><h3 className="font-bold">Không tìm thấy sinh viên phù hợp.</h3></div>}
          <div className="sticky bottom-0 mt-5 flex flex-col-reverse gap-2 border-t border-[#E2E8F0] bg-white pt-4 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onCancel}>Hủy</Button><Button disabled={!selectedStudentIds.length} onClick={() => onConfirm(selectedStudentIds)}>Thêm {selectedStudentIds.length} sinh viên</Button></div>
        </div>
      </section>
    </div>
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
  return <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#0F172A]/45 p-3"><section className="w-full max-w-xl rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="reassign-title"><p className="text-label-md font-bold text-primary">{makeup ? 'BỐ TRÍ CA BÙ' : 'CHUYỂN CA'}</p><h2 id="reassign-title" className="mt-1 text-headline-md font-bold">{makeup ? (participant.activityType === 'LAB' ? 'Bố trí thực hành bù' : 'Bố trí thi bù') : 'Chuyển ca'}</h2><dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#F8FAFC] p-4"><div><dt className="text-[#64748B]">Sinh viên</dt><dd className="font-semibold">{student.name}</dd></div><div><dt className="text-[#64748B]">MSSV</dt><dd className="font-semibold">{student.id}</dd></div><div><dt className="text-[#64748B]">Ca hiện tại</dt><dd className="font-semibold">{current?.name ?? participant.sessionId}</dd></div><div><dt className="text-[#64748B]">Trạng thái</dt><dd><StatusBadge tone={participantStatusMeta[participant.status]?.tone}>{participantStatusMeta[participant.status]?.label}</StatusBadge></dd></div></dl><label className="mt-5 block text-body-sm font-semibold">{makeup ? 'Ca bù' : 'Chuyển sang'}<select value={targetSessionId} onChange={(event) => setTargetSessionId(event.target.value)} className="mt-2 w-full border border-[#CBD5E1] bg-white px-4"><option value="">Chọn ca</option>{available.map((session) => <option key={session.id} value={session.id}>{session.name} · {session.startAt?.replace('T', ' ')}</option>)}</select></label><label className="mt-4 block text-body-sm font-semibold">Lý do<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows="3" className="mt-2 w-full border border-[#CBD5E1] p-3" /></label>{error && <p className="mt-2 text-body-sm text-primary" role="alert">{error}</p>}<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onCancel}>Hủy</Button><Button onClick={submit}>{makeup ? 'Xác nhận bố trí bù' : 'Xác nhận chuyển ca'}</Button></div></section></div>;
}
