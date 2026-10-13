import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';
import { getCleanRoute } from '../src/lib/routes.js';
import { navigate, routeFromLink } from '../src/lib/navigation.js';
import { validateOptions, loadAllPages } from '../src/lib/lecturerUtils.js';

test('authoring entry buttons open without requiring an outside topic filter', () => {
  const source = readFileSync('src/pages/lecturers/LecturerContent.jsx', 'utf8');
  assert.doesNotMatch(source, /disabled=\{!validTopic \|\| action\.busy\}/);
  assert.doesNotMatch(source, /disabled=\{action\.busy \|\| !\(tab === 'topics'/);
  assert.match(source, /label="Học phần \*"/);
  assert.match(source, /label="Chủ đề \*"/);
  assert.match(source, /onClick=\{createInlineTopic\}/);
});

test('create-class form aligns related lookup fields in the shared two-column layout', () => {
  const source = readFileSync('src/pages/lecturers/LecturerClasses.jsx', 'utf8');
  assert.match(source, /<Form className="app-form--two-columns grid gap-4" onSubmit=\{save\}>/);
});

globalThis.window = {
  location: new URL('https://lms.example/lecturer_courses'),
  localStorage: { getItem: () => null },
  history: {
    pushState(state, _, href) {
      this.state = state;
      window.location = new URL(href, window.location);
    },
  },
  dispatchEvent() {},
};
globalThis.PopStateEvent = class {
  constructor(type) {
    this.type = type;
  }
};
const link = (href, extra = {}) => ({
  getAttribute: () => href,
  hasAttribute: (name) => name === 'download' && Boolean(extra.download),
  target: '',
  ...extra,
});

test('internal links preserve all query parameters and anchors', () => {
  const href = '/lecturer_course_detail.html?classId=class-1&locale=vi_VN#students';
  assert.equal(routeFromLink(link(href)), href);
  navigate(href);
  assert.equal(window.location.pathname, '/lecturer_course_detail');
  assert.equal(window.location.search, '?classId=class-1&locale=vi_VN');
  assert.equal(window.location.hash, '#students');
  assert.equal(window.history.state.ptitPrevious, '/lecturer_courses');
});
test('clean / absolute internal URLs work; external and download links stay native', () => {
  assert.equal(
    routeFromLink(link('https://lms.example/lecturer_materials?subjectId=one&topicId=two')),
    '/lecturer_materials?subjectId=one&topicId=two'
  );
  assert.equal(routeFromLink(link('https://www.facebook.com/profile.php?id=123&locale=vi_VN')), null);
  assert.equal(routeFromLink(link('/account', { target: '_blank' })), null);
  assert.equal(routeFromLink(link('/account', { download: true })), null);
  const before = window.location.href;
  navigate('https://other.example/account');
  assert.equal(window.location.href, before);
  assert.equal(getCleanRoute('/account.html'), '/account');
});
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}
for (const file of [
  'src/pages/lecturers/LecturerApiWorkspace.jsx',
  'src/pages/lecturers/LecturerContent.jsx',
  'src/pages/lecturers/LecturerClasses.jsx',
  'src/pages/admin/AdminAcademicsApiPage.jsx',
  'src/pages/admin/UsersPage.jsx',
]) {
  test(`forms have explicit submit controls: ${file}`, () => {
    const ast = parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
    let count = 0;
    walk(ast, (node) => {
      if (node.type !== 'JSXElement' || !['form', 'Form'].includes(node.openingElement.name.name)) return;
      count += 1;
      let submit = false;
      walk(node, (child) => {
        if (
          child.type === 'JSXOpeningElement' &&
          ['Button', 'SubmitButton', 'button', 'input'].includes(child.name.name)
        )
          submit ||= child.name.name === 'SubmitButton' || child.attributes.some((a) => a.name?.name === 'type' && a.value?.value === 'submit');
      });
      assert.ok(submit, `Form at line ${node.loc.start.line} has no submit button`);
    });
    assert.ok(count > 0);
  });
}
test('question validation supports multiple correct answers', () => {
  const options = [
    { content: 'A', isCorrect: true },
    { content: 'B', isCorrect: true },
  ];
  assert.ok(validateOptions('MCQ_SINGLE', options));
  assert.equal(validateOptions('MCQ_MULTIPLE', options), '');
  assert.ok(validateOptions('MCQ_SINGLE', [{ content: ' ', isCorrect: true }]));
});
test('lookup loads all server pages', async () => {
  const calls = [];
  const rows = await loadAllPages(async (path) => {
    calls.push(path);
    const page = Number(new URL(path, 'https://local').searchParams.get('page'));
    return { content: [{ classId: page }], totalPages: 3 };
  }, '/api/v1/classes?subjectId=one');
  assert.equal(rows.length, 3);
  assert.equal(calls.length, 3);
  assert.ok(calls.every((path) => path.includes('subjectId=one')));
});
