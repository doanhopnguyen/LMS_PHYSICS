import { getDemoSession } from './demoSession.js';
import { useState } from 'react';

export const academicPages = {
  'my_courses.html': 'class',
  'student_evidence.html': 'class',
  'virtual_lab.html': 'class',
  'exam_practice_center.html': 'class',
  'library.html': 'class',
};
export const academicSemesters = [
  ['2026-2027-1', 'Học kỳ 1 · 2026–2027'],
  ['2025-2026-2', 'Học kỳ 2 · 2025–2026'],
];
export function readAcademicScope() {
  const params = new URLSearchParams(window.location.search);
  const semester = academicSemesters.some(([id]) => id === params.get('semester'))
    ? params.get('semester')
    : academicSemesters[0][0];
  const role = getDemoSession()?.role;
  const classes =
    semester === academicSemesters[0][0]
      ? role === 'STUDENT' || role === 'TA'
        ? ['D23CQCN01-B']
        : ['D23CQCN01-B', 'D23CQCN02-B', 'D23CQCN03-B']
      : [];
  const classId = classes.includes(params.get('class')) ? params.get('class') : 'ALL';
  const subjectId = ['BAS1201', 'BAS1202'].includes(params.get('subject')) ? params.get('subject') : 'BAS1201';
  const route = window.location.pathname.split('/').pop() || 'login';
  const page = route.endsWith('.html') ? route : `${route}.html`;
  // Shared subject resources are not tied to a semester. Detail pages retain
  // their own context and must not be hidden by a parent list's filters.
  const mode = academicPages[page];
  const available = !mode || (mode === 'subject' ? subjectId === 'BAS1201' : semester === academicSemesters[0][0]);
  return { semester, classId, subjectId, classes, available };
}

export function academicHref(file) {
  const url = new URL(file, window.location.origin);
  const page = url.pathname.split('/').pop();
  const scopedPage = page.endsWith('.html') ? page : `${page}.html`;
  if (!academicPages[scopedPage] && !page.includes('detail') && !page.includes('results') && !page.includes('grading'))
    return file;
  const current = new URLSearchParams(window.location.search);
  for (const key of ['semester', 'class', 'subject']) {
    if (!url.searchParams.has(key) && current.has(key)) url.searchParams.set(key, current.get(key));
  }
  return `${url.pathname.slice(1)}${url.search}${url.hash}`;
}

export function rememberAcademicClass(classId) {
  const url = new URL(window.location.href);
  url.searchParams.set('class', classId);
  window.history.replaceState({}, '', url);
}

export function useAcademicClass() {
  const [value, setValue] = useState(() => readAcademicScope().classId);
  return [
    value,
    (next) => {
      rememberAcademicClass(next);
      setValue(next);
    },
  ];
}
