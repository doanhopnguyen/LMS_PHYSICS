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
  const practiceCenter = page === 'exam_practice_center.html';
  const loadClassOptions = practiceCenter || page === 'my_courses.html' || page === 'exam_session.html';
  const params = new URLSearchParams(window.location.search);
  const suggestions =
    practiceCenter && (params.get('tab') === 'suggestions' || (!params.has('tab') && params.has('recommendClassId')));
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(loadClassOptions);
  const [classError, setClassError] = useState('');
  const scopedClasses = classes.filter((item) => !scope.semester || String(item.semesterId) === scope.semester);
  const selectedClass = suggestions && !params.has('class') ? params.get('recommendClassId') || 'ALL' : scope.classId;
  const change = (key, value) => {
    const params = new URLSearchParams(window.location.search);
    // Keep an explicit empty value so navigation does not restore the previous scope.
    params.set(key, value);
    if (key === 'semester') {
      params.set('class', 'ALL');
      if (practiceCenter) params.delete('recommendClassId');
    }
    if (practiceCenter && key === 'class') {
      if (value && value !== 'ALL') params.set('recommendClassId', value);
      else params.delete('recommendClassId');
    }
    params.delete('page');
    navigate(`${page}?${params}`);
  };

  useEffect(() => {
    if (!loadClassOptions) return;
    let alive = true;
    api.students
      .myClasses()
      .then((data) => {
        if (alive) setClasses(rowsOf(data));
      })
      .catch((error) => {
        if (alive) setClassError(error.message || 'Không thể tải lớp học.');
      })
      .finally(() => {
        if (alive) setLoadingClasses(false);
      });
    return () => {
      alive = false;
    };
  }, [loadClassOptions]);

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
          value={practiceCenter ? selectedClass : scope.classId}
          disabled={loadClassOptions && (loadingClasses || !scopedClasses.length)}
          onChange={(event) => change('class', event.target.value)}
        >
          <option value="ALL">Tất cả lớp</option>
          {loadClassOptions && loadingClasses && <option value="">Đang tải lớp học…</option>}
          {loadClassOptions &&
            scopedClasses.map((item) => (
              <option key={item.classId} value={item.classId}>
                {[item.subjectName || item.subjectCode, item.classCode || item.className].filter(Boolean).join(' · ') ||
                  'Lớp học'}
              </option>
            ))}
        </SelectField>
      )}
      {loadClassOptions && classError && (
        <span role="alert" className="text-body-sm text-primary">
          {classError}
        </span>
      )}
      {actions && (
        <div className="academic-filter-actions" aria-label="Thao tác trang">
          {actions}
        </div>
      )}
    </section>
  );
}
