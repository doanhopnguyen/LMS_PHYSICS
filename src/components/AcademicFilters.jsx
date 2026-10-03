import React, { useEffect, useState } from 'react';
import { SelectField } from './SelectField.jsx';
import { academicPages, readAcademicScope } from '../lib/academicScope.js';
import { api } from '../lib/apiClient.js';
import { navigate } from '../lib/navigation.js';

const rowsOf = (value) => (Array.isArray(value) ? value : value?.content || value?.data || []);
const semesterLabel = (item) =>
  [item.semesterName || item.semesterCode, item.academicYear].filter(Boolean).join(' · ') || 'Học kỳ';

export function AcademicFilters({ page, actions }) {
  const mode = academicPages[page];
  const scope = readAcademicScope();
  const [semesters, setSemesters] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(Boolean(mode && mode !== 'subject'));
  const [semesterError, setSemesterError] = useState('');
  const change = (key, value) => {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === 'semester') params.set('class', 'ALL');
    params.delete('page');
    navigate(`${page}?${params}`);
  };

  useEffect(() => {
    if (!mode || mode === 'subject') return;
    let alive = true;
    api.semesters
      .list()
      .then((data) => {
        if (!alive) return;
        const rows = rowsOf(data);
        setSemesters(rows);
      })
      .catch((error) => {
        if (alive) setSemesterError(error.message || 'Không thể tải danh sách học kỳ.');
      })
      .finally(() => {
        if (alive) setLoadingSemesters(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (!mode) return null;
  return (
    <section
      aria-label="Phạm vi học tập"
      className="page-academic-filters mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-3 px-3 md:px-5 lg:px-6"
    >
      {mode !== 'subject' && (
        <SelectField
          label="Học kỳ"
          name="academic-semester"
          value={scope.semester}
          disabled={loadingSemesters || !semesters.length}
          onChange={(event) => change('semester', event.target.value)}
        >
          <option value="">{loadingSemesters ? 'Đang tải học kỳ…' : 'Tất cả học kỳ'}</option>
          {semesters.map((item) => (
            <option key={item.semesterId} value={item.semesterId}>
              {semesterLabel(item)}
              {item.isCurrent ? ' (Hiện tại)' : ''}
            </option>
          ))}
        </SelectField>
      )}
      {semesterError && (
        <span role="alert" className="text-body-sm text-primary">
          {semesterError}
        </span>
      )}
      {mode === 'class' && (
        <SelectField
          label="Lớp"
          name="academic-class"
          value={scope.classId}
          onChange={(event) => change('class', event.target.value)}
        >
          <option value="ALL">Tất cả lớp</option>
        </SelectField>
      )}
      {actions && (
        <div className="academic-filter-actions" aria-label="Thao tác trang">
          {actions}
        </div>
      )}
    </section>
  );
}
