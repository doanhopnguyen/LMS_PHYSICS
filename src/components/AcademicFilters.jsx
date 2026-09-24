import React from 'react';
import { academicPages, academicSemesters, readAcademicScope } from '../lib/academicScope.js';
import { navigate } from '../lib/navigation.js';

export function AcademicFilters({ page }) {
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
  const inputClass = 'h-9 rounded-lg border border-[#CBD5E1] bg-white px-3 text-body-sm text-[#1F2937]';
  return <section aria-label="Phạm vi học tập" className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-3 px-3 pt-3 md:px-5 lg:px-6">
    <label className="flex items-center gap-2 text-body-sm font-semibold">Học kỳ
      <select className={inputClass} value={scope.semester} onChange={(event) => change('semester', event.target.value)}>{academicSemesters.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
    </label>
    {mode === 'class' && <label className="flex items-center gap-2 text-body-sm font-semibold">Lớp
      <select className={inputClass} value={scope.classId} disabled={!scope.classes.length} onChange={(event) => change('class', event.target.value)}><option value="ALL">Tất cả lớp</option>{scope.classes.map((id) => <option key={id}>{id}</option>)}</select>
    </label>}
    {mode === 'subject' && <label className="flex items-center gap-2 text-body-sm font-semibold">Môn học
      <select className={inputClass} value={scope.subjectId} onChange={(event) => change('subject', event.target.value)}><option value="BAS1201">Vật lý đại cương 1</option><option value="BAS1202">Vật lý đại cương 2</option></select>
    </label>}
  </section>;
}
