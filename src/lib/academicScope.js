import { useState } from 'react';

export const academicPages = {
  'my_courses.html': 'class',
  'student_evidence.html': 'class',
  'virtual_lab.html': 'class',
  'exam_practice_center.html': 'class',
  'library.html': 'class',
};

// Options are loaded from the semester API by AcademicFilters.
export const academicSemesters = [];

export function readAcademicScope() {
  const params = new URLSearchParams(window.location.search);
  return {
    semester: params.get('semester') || '',
    classId: params.get('class') || 'ALL',
    subjectId: params.get('subject') || '',
    classes: [],
    available: true,
  };
}

export function academicHref(file) {
  const url = new URL(file, window.location.origin);
  const page = url.pathname.split('/').pop();
  const scopedPage = page.endsWith('.html') ? page : `${page}.html`;
  if (!academicPages[scopedPage] && !page.includes('detail') && !page.includes('results') && !page.includes('grading')) return file;
  const current = new URLSearchParams(window.location.search);
  for (const key of ['semester', 'class', 'subject']) if (!url.searchParams.has(key) && current.has(key)) url.searchParams.set(key, current.get(key));
  return `${url.pathname.slice(1)}${url.search}${url.hash}`;
}

export function rememberAcademicClass(classId) {
  const url = new URL(window.location.href);
  url.searchParams.set('class', classId);
  window.history.replaceState({}, '', url);
}

export function useAcademicClass() {
  const [value, setValue] = useState(() => readAcademicScope().classId);
  return [value, (next) => { rememberAcademicClass(next); setValue(next); }];
}
