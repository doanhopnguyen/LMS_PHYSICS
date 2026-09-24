import { build } from 'esbuild';
import { createRequire } from 'node:module';

const result = await build({
  stdin: {
    contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import assert from 'node:assert/strict';
      import { DataTable } from './src/components/DataTable.jsx';
      import { PaginatedCollection, PaginatedList, Pagination } from './src/components/Pagination.jsx';
      const rows = Array.from({length: 35}, (_, id) => ({id}));
      const table = (items, props = {}) => <DataTable {...props} columns={['ID']} rows={items} renderRow={row => <tr><td>{row.id}</td></tr>} />;
      const html = renderToStaticMarkup(table(rows));
      assert.equal((html.match(/<td>/g) || []).length, 10);
      assert.equal((html.match(/<nav/g) || []).length, 1);
      const external = renderToStaticMarkup(<PaginatedCollection items={rows} pageSize={20}>{items => table(items)}</PaginatedCollection>);
      assert.equal((external.match(/<td>/g) || []).length, 20);
      assert.equal((external.match(/<nav/g) || []).length, 1);
      const explicit = renderToStaticMarkup(table(rows.slice(0,20), {paginate:false}));
      assert.equal((explicit.match(/<td>/g) || []).length, 20);
      assert.equal((explicit.match(/<nav/g) || []).length, 0);
      const list = renderToStaticMarkup(<PaginatedList as="ol">{rows.map(row => <li key={row.id}>{row.id}</li>)}</PaginatedList>);
      assert.equal((list.match(/<li>/g) || []).length, 10);
      assert.ok(list.includes('<ol'));
      const controls = renderToStaticMarkup(<Pagination currentPage={1} pageSize={8} totalItems={35} onPageChange={()=>{}} onPageSizeChange={()=>{}} />);
      assert.match(controls, /value="8" selected/);
      assert.equal((renderToStaticMarkup(table([])).match(/<td>/g) || []).length, 0);
      console.log('Pagination checks passed: tables, cards, external pagination, page sizes, empty lists.');
    `,
    loader: 'jsx', resolveDir: process.cwd(),
  },
  bundle: true, platform: 'node', format: 'cjs', write: false, packages: 'external',
});
new Function('require', result.outputFiles[0].text)(createRequire(import.meta.url));
