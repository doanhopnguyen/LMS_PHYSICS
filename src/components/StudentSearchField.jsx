import { FormField as SharedFormField } from './FormField.jsx';
import { DataTable as SharedDataTable } from './DataTable.jsx';
import React, { useId, useRef, useState } from 'react';
import { api } from '../lib/apiClient.js';
import { Button } from './Button.jsx';

export function StudentSearchField({ onSelect, mapResults = (student) => [student], disabled = false }) {
  const inputId = useId();
  const request = useRef(0);
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  async function search() {
    if (!keyword.trim() || disabled || loading) return;
    const version = ++request.current;
    setLoading(true);
    setError('');
    setRows([]);
    setSelected(null);
    onSelect(null);
    try {
      const student = await api.students.search(keyword.trim());
      if (version !== request.current) return;
      if (!student?.userId || student.role !== 'STUDENT')
        throw new Error('Không tìm thấy tài khoản sinh viên phù hợp.');
      setRows(mapResults(student));
      setSearched(true);
    } catch (searchError) {
      if (version === request.current) {
        setError(searchError.message);
        setSearched(true);
      }
    } finally {
      if (version === request.current) setLoading(false);
    }
  }
  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-sm font-medium">
        Tên đăng nhập, mã sinh viên hoặc email
      </label>
      <div className="flex gap-2">
        <SharedFormField
          id={inputId}
          value={keyword}
          disabled={disabled}
          placeholder="Nhập thông tin sinh viên"
          className="min-w-0 flex-1"
          onChange={(event) => {
            ++request.current;
            setKeyword(event.target.value);
            setRows([]);
            setSelected(null);
            setSearched(false);
            setError('');
            setLoading(false);
            onSelect(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              search();
            }
          }}
          bare
        />
        <Button type="button" variant="secondary" disabled={disabled || loading || !keyword.trim()} onClick={search}>
          {loading ? 'Đang tìm…' : 'Tìm kiếm'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {loading && (
        <p role="status" className="text-sm text-[#64748B]">
          Đang tìm sinh viên…
        </p>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <SharedDataTable
            rows={rows}
            renderRow={(student, index) => (
              <tr
                key={`${student.userId}:${student.originalClassId || index}`}
                aria-selected={selected === index}
                className="border-t border-[#E2E8F0]"
              >
                <td className="p-3">{student.studentCode || '—'}</td>
                <td className="p-3 font-medium">{student.fullName || student.username}</td>
                <td className="p-3">{student.username}</td>
                <td className="p-3">{student.email || '—'}</td>
                <td className="p-3">{student.originalClassCode || '—'}</td>
                <td className="p-3">
                  <input
                    type="radio"
                    name={inputId}
                    aria-label={`Chọn ${student.fullName || student.username}${student.originalClassCode ? `, ${student.originalClassCode}` : ''}`}
                    checked={selected === index}
                    disabled={disabled}
                    onChange={() => {
                      setSelected(index);
                      onSelect(student);
                    }}
                    className="h-4 w-4 accent-[#E52220]"
                  />
                </td>
              </tr>
            )}
            paginate={false}
            headerRows={
              <>
                <tr>
                  {['MSSV', 'Họ tên', 'Username', 'Email', 'Lớp gốc', 'Chọn'].map((label) => (
                    <th scope="col" key={label} className="px-3 py-2 font-semibold">
                      {label}
                    </th>
                  ))}
                </tr>
              </>
            }
            tableClassName="w-full min-w-[600px] text-left text-sm"
            caption={<caption className="sr-only">Kết quả tìm kiếm sinh viên</caption>}
          />
        </div>
      )}
      {searched && !loading && !error && !rows.length && (
        <p className="text-sm text-[#64748B]">Không tìm thấy sinh viên phù hợp.</p>
      )}
    </div>
  );
}
