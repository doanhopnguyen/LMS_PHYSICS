import React, { useState } from 'react';
import { Button } from './Button.jsx';

export function ExamTargetClasses({ classes, primaryClassId, selectedIds, onChange, disabled }) {
  const [search, setSearch] = useState('');
  const primary = classes.find((item) => item.classId === primaryClassId);
  const eligible = primary?.subjectId
    ? classes.filter((item) => item.classId !== primaryClassId && item.subjectId === primary.subjectId)
    : [];
  const visible = eligible.filter((item) =>
    `${item.classCode || ''} ${item.className || ''}`
      .toLocaleLowerCase('vi')
      .includes(search.trim().toLocaleLowerCase('vi'))
  );
  return (
    <fieldset disabled={disabled} className="mt-5 rounded-xl border border-[#E2E8F0] p-4">
      <legend className="px-2 text-body-md font-semibold">Giao thêm cho lớp cùng môn</legend>
      <p className="text-body-sm text-[#64748B]">
        Mỗi lớp nhận một bản đề riêng để chỉnh sửa độc lập. Đã chọn {primary ? 1 + selectedIds.length : 0} lớp.
      </p>
      {!primary ? (
        <p className="mt-3 text-body-sm text-[#64748B]">Chọn lớp nhận đề chính trước.</p>
      ) : !eligible.length ? (
        <p className="mt-3 text-body-sm text-[#64748B]">Không có lớp cùng môn khác trong danh sách lớp bạn quản lý.</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              aria-label="Tìm lớp nhận đề"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã hoặc tên lớp"
              className="h-9 w-full min-w-0 rounded-lg border border-[#CBD5E1] px-3 text-body-sm sm:w-auto sm:flex-1"
            />
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() => onChange(eligible.map((item) => item.classId))}
            >
              Chọn tất cả
            </Button>
            <Button variant="secondary" disabled={disabled || !selectedIds.length} onClick={() => onChange([])}>
              Bỏ chọn
            </Button>
          </div>
          <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
            {visible.map((item) => (
              <label
                key={item.classId}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#E2E8F0] p-3 text-body-sm"
              >
                <input
                  type="checkbox"
                  className="exam-checkbox mt-0.5"
                  checked={selectedIds.includes(item.classId)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...selectedIds, item.classId]
                        : selectedIds.filter((id) => id !== item.classId)
                    )
                  }
                />
                <span>
                  <strong>{item.classCode || item.className}</strong>
                  {item.classCode && item.className && (
                    <span className="mt-1 block text-[#64748B]">{item.className}</span>
                  )}
                </span>
              </label>
            ))}
            {!visible.length && <p className="text-body-sm text-[#64748B]">Không có lớp phù hợp.</p>}
          </div>
        </>
      )}
    </fieldset>
  );
}
