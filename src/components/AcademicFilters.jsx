import React from 'react';
import { SelectField } from './SelectField.jsx';
import { academicPages, academicSemesters, readAcademicScope } from '../lib/academicScope.js';
import { navigate } from '../lib/navigation.js';

export function AcademicFilters({ page, actions }) {
  const mode = academicPages[page];
  if (!mode) return null;
  const scope = readAcademicScope();
  const change = (key, value) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    if (key === 'semester') params.set('class', 'ALL');
    params.delete('page');
    navigate(`${page}?${params}`);
  };
  return (
    <section
      aria-label="Phạm vi học tập"
      className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-3 px-3 pt-3 md:px-5 lg:px-6"
    >
      {mode !== 'subject' && (
        <SelectField
          label="Học kỳ"
          name="academic-semester"
          className="min-w-56"
          value={scope.semester}
          onChange={(event) => change('semester', event.target.value)}
        >
          {academicSemesters.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </SelectField>
      )}
      {mode === 'class' && (
        <SelectField
          label="Lớp"
          name="academic-class"
          className="min-w-40"
          value={scope.classId}
          disabled={!scope.classes.length}
          onChange={(event) => change('class', event.target.value)}
        >
          <option value="ALL">Tất cả lớp</option>
          {scope.classes.map((id) => (
            <option key={id}>{id}</option>
          ))}
        </SelectField>
      )}
      {mode === 'subject' && (
        <SelectField
          label="Môn học"
          name="academic-subject"
          className="min-w-56"
          value={scope.subjectId}
          onChange={(event) => change('subject', event.target.value)}
        >
          <option value="BAS1201">Vật lý đại cương 1</option>
          <option value="BAS1202">Vật lý đại cương 2</option>
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
