import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traversePackage from '@babel/traverse';
import { buildSync } from 'esbuild';
const traverse = traversePackage.default;
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : entry.name.endsWith('.jsx')
          ? [path.join(dir, entry.name)]
          : []
    );

test('pages reuse shared controls, tables and dialogs', () => {
  const violations = [];
  for (const file of walk('src/pages')) {
    const source = fs.readFileSync(file, 'utf8');
    const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
    traverse(ast, {
      JSXOpeningElement({ node }) {
        const tag = node.name.name;
        if (['form', 'table', 'select', 'textarea'].includes(tag))
          violations.push(`${file}:${node.loc.start.line} ${tag}`);
        if (tag === 'input') {
          const type = node.attributes.find((attr) => attr.name?.name === 'type');
          const typeSource = type && source.slice(type.start, type.end);
          if (!typeSource || !/checkbox|radio|range|hidden|color/.test(typeSource))
            violations.push(`${file}:${node.loc.start.line} input`);
        }
        const style = node.attributes.find((attr) => attr.name?.name === 'className');
        if (style?.value?.value?.includes('fixed inset-0'))
          violations.push(`${file}:${node.loc.start.line} custom dialog`);
      },
    });
  }
  assert.deepEqual(violations, []);
});

const bundle = buildSync({
  stdin: {
    contents: `import React from 'react'; import { renderToStaticMarkup } from 'react-dom/server';
    import { FormField } from './src/components/FormField.jsx';
    import { SelectField } from './src/components/SelectField.jsx';
    import { DataTable } from './src/components/DataTable.jsx';
    import { ConfirmDialog } from './src/components/ConfirmDialog.jsx';
    export const render = (kind, props) => renderToStaticMarkup(React.createElement({field:FormField,select:SelectField,table:DataTable,confirm:ConfirmDialog}[kind], props));`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(process.cwd() + '/package.json');",
  },
});
const { render } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

test('shared fields preserve label association, validation and controlled values', () => {
  const html = render('field', {
    label: 'Email',
    id: 'email',
    name: 'email',
    type: 'email',
    required: true,
    value: 'a@example.test',
    onChange() {},
  });
  assert.match(html, /for="email"/);
  assert.match(html, /id="email"/);
  assert.match(html, /required=""/);
  assert.match(html, /value="a@example.test"/);
  assert.match(html, /form-field__control/);
  const bare = render('field', { bare: true, multiline: true, name: 'feedback', rows: 4, defaultValue: 'Nhận xét' });
  assert.match(bare, /<textarea/);
  assert.doesNotMatch(bare, /<label/);
  assert.match(bare, /Nhận xét/);
});

test('standalone selects do not nest labels and retain disabled state', () => {
  const html = render('select', { bare: true, name: 'subjectId', disabled: true, 'aria-label': 'Học phần' });
  assert.match(html, /select-field__control--standalone/);
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /<label/);
});

test('date and time fields use compact shared sizing without changing native validation', () => {
  for (const type of ['date', 'datetime-local', 'time']) {
    const html = render('field', { type, label: 'Thời gian', name: 'when', required: true });
    assert.match(html, /form-field--temporal/);
    assert.ok(html.includes(`form-field__control--${type}`));
    assert.ok(html.includes(`type="${type}"`));
    assert.match(html, /required=""/);
  }
});

test('server-managed tables do not introduce a second pagination', () => {
  const html = render('table', { columns: ['Tên'], rows: [], renderRow: () => null, paginate: false });
  assert.match(html, /data-table__table/);
  assert.match(html, /scope="col"/);
  assert.doesNotMatch(html, /pagination/);
});

test('student and lecturer material cards share the same two-column surface', () => {
  const html = render('table', {
    asCards: true, paginate: false,
    columns: ['Nội dung', 'Loại', 'Phiên bản', 'Trạng thái'],
    rows: [{ materialId: 'material-one' }],
    cells: () => ['Cơ học', 'PDF', 2, 'Đã duyệt'],
  });
  assert.match(html, /lms-card--accent/);
  assert.match(html, /grid-cols-2/);
  assert.match(html, /col-span-2/);
  assert.match(html, /Phiên bản/);
  assert.doesNotMatch(html, /<table/);
});

test('confirmation dialogs reuse the neutral shared dialog surface', () => {
  const html = render('confirm', { title: 'Xác nhận', description: 'Kiểm tra dữ liệu', busy: true, onCancel() {}, onConfirm() {} });
  assert.match(html, /role="alertdialog"/);
  assert.match(html, /form-dialog/);
  assert.match(html, /aria-describedby=/);
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html.match(/class="form-dialog[^"]*"/)?.[0] || '', /border-primary/);
});
