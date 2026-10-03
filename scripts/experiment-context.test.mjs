import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  entryPoints: ['src/lib/experimentContext.js'], bundle: true, write: false, format: 'esm', platform: 'node',
  define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example"' },
});
const { experimentHref, loadStudentExperiment } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);
globalThis.window = { location: { origin: 'https://lms.example' }, localStorage: { getItem: () => null } };

test('simulation/report links retain the assignment and class, including encoded IDs', () => {
  const context = { experimentId: 'exp /&', classId: 'class #1', assignmentId: 'assignment +2' };
  for (const page of ['3d_workspace.html', 'lab_report_rubric.html']) {
    const url = new URL(experimentHref(page, context), 'https://lms.example');
    for (const [key, value] of Object.entries(context)) assert.equal(url.searchParams.get(key), value);
    assert.equal(url.searchParams.getAll('assignmentId').length, 1);
  }
  assert.equal(experimentHref('3d_workspace.html', {}), '3d_workspace.html');
});

test('student pages use the exact assigned instructions rather than another assignment of the same experiment', async () => {
  globalThis.fetch = async (url) => Response.json({ data: new URL(url).pathname.endsWith('/experiment-assignments') ? [
    { assignmentId: 'other', experimentId: 'exp', instructionsOverride: 'Another class' },
    { assignmentId: 'selected', experimentId: 'exp', instructionsOverride: 'Selected class instructions' },
  ] : { experimentId: 'exp', instructions: 'Original instructions' } });
  assert.equal((await loadStudentExperiment('exp', 'selected')).instructions, 'Selected class instructions');
});

test('blank overrides preserve original instructions and unassigned experiments do not fetch assignments', async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname; calls.push(path);
    return Response.json({ data: path.endsWith('/experiment-assignments') ? {
      content: [{ assignmentId: 'selected', experimentId: 'exp', instructionsOverride: '  ' }],
    } : { experimentId: 'exp', instructions: 'Original instructions' } });
  };
  assert.equal((await loadStudentExperiment('exp', 'selected')).instructions, 'Original instructions');
  calls.length = 0;
  assert.equal((await loadStudentExperiment('exp')).instructions, 'Original instructions');
  assert.deepEqual(calls, ['/api/v1/experiments/exp']);
});

test('missing or mismatched assignment IDs are rejected instead of showing unrelated instructions', async () => {
  globalThis.fetch = async (url) => Response.json({ data: new URL(url).pathname.endsWith('/experiment-assignments') ? [
    { assignmentId: 'selected', experimentId: 'other-exp', instructionsOverride: 'Unrelated' },
  ] : { experimentId: 'exp', instructions: 'Original' } });
  await assert.rejects(loadStudentExperiment('exp', 'selected'), /Không tìm thấy bài giao/);
  await assert.rejects(loadStudentExperiment('exp', 'missing'), /Không tìm thấy bài giao/);
});

test('assignment API failure is surfaced instead of silently replacing class-specific guidance', async () => {
  globalThis.fetch = async (url) => new URL(url).pathname.endsWith('/experiment-assignments')
    ? Response.json({ message: 'Unable to load assignments' }, { status: 503 })
    : Response.json({ data: { experimentId: 'exp', instructions: 'Original' } });
  await assert.rejects(loadStudentExperiment('exp', 'selected'), /Unable to load assignments/);
});
