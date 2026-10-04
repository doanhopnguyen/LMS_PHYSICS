import test from 'node:test';
import assert from 'node:assert/strict';
import { createVideoWatchGuard } from '../src/lib/videoWatchGuard.js';
import { reconcileMaterialProgress, progressPercent, progressKey } from '../src/lib/materialProgress.js';

function fixture(options = {}) {
  let clock = 0;
  const guard = createVideoWatchGuard({ ...options, now: () => clock });
  return {
    guard,
    step(time, seconds = 1, extra = {}) {
      clock += seconds * 1000;
      return guard.sample({ time, length: 10, playing: true, ...extra });
    },
  };
}
test('normal playback accumulates a contiguous frontier and only finishes at the end', () => {
  const { guard, step } = fixture();
  for (let time = 1; time <= 9; time++) assert.equal(step(time).violation, false);
  assert.equal(guard.finish(), false);
  assert.equal(step(10).violation, false);
  assert.equal(guard.finish(), true);
});
test('unseen seeking resets all watch credit while replaying a watched portion is allowed', () => {
  const { guard, step } = fixture();
  step(1);
  step(2);
  step(3);
  assert.equal(guard.seek(1).violation, false);
  assert.equal(guard.watched, 3);
  assert.equal(guard.seek(9).violation, true);
  assert.equal(guard.watched, 0);
  assert.equal(guard.finish(), false);
});
test('fast playback of new content resets; fast replay stops at the watched frontier', () => {
  const { guard, step } = fixture();
  step(1);
  step(2);
  step(3);
  guard.seek(0);
  assert.equal(guard.rate(2, 0).violation, false);
  assert.equal(step(2, 1, { rate: 2 }).violation, false);
  assert.equal(step(4, 1, { rate: 2 }).violation, true);
  assert.equal(guard.watched, 0);
  assert.equal(guard.rate(2, 0).violation, true);
});
test('embedded time jumps and jumping to the end never grant completion', () => {
  const { guard, step } = fixture();
  step(1);
  assert.equal(step(10, 0.25).violation, true);
  assert.equal(guard.finish(), false);
  assert.equal(guard.watched, 0);
});
test('pause does not grant watch credit and normal playback can restart after a violation', () => {
  const { guard, step } = fixture();
  step(1);
  assert.equal(step(9, 8, { playing: false }).violation, true);
  for (let time = 1; time <= 10; time++) assert.equal(step(time).violation, false);
  assert.equal(guard.finish(), true);
});
test('completed videos allow free seeking and speed changes; unfinished videos resume their saved frontier', () => {
  const completed = fixture({ completed: true });
  assert.equal(completed.guard.seek(9).violation, false);
  assert.equal(completed.guard.rate(2, 9).violation, false);
  assert.equal(completed.step(10, 0.1, { rate: 2 }).violation, false);
  const resumed = fixture({ watched: 5 });
  assert.equal(resumed.guard.seek(4).violation, false);
  assert.equal(resumed.guard.seek(8).violation, true);
});
test('the final timeupdate on a normal pause does not impose a penalty or add watch credit', () => {
  const { guard, step } = fixture();
  step(1);
  assert.equal(step(1.25, 0.25, { playing: false }).violation, false);
  assert.equal(step(1.25, 3, { playing: false }).violation, false);
  assert.equal(guard.watched, 1);
});
const old = { materialId: 'old', type: 'TEXT', createdAt: '2026-10-01T00:00:00Z' };
const added = { materialId: 'new', type: 'VIDEO', fileUrl: '/new.mp4', createdAt: '2026-10-04T00:00:00Z' };
test('adding a material to a previously complete topic reduces progress and keeps the new ID incomplete', () => {
  const state = reconcileMaterialProgress(
    [old, added],
    { completed: ['old'], watched: {}, sources: { old: '' } },
    { progressPercent: 100 }
  );
  assert.deepEqual(state.completed, ['old']);
  assert.equal(progressPercent(state.completed, 2), 50);
});
test('legacy 100% only migrates materials older than the last access; unknown dates are never guessed complete', () => {
  const state = reconcileMaterialProgress([old, added, { materialId: 'no-date' }], null, {
    progressPercent: 100,
    lastAccessedAt: '2026-10-02T00:00:00Z',
  });
  assert.deepEqual(state.completed, ['old']);
  assert.deepEqual(reconcileMaterialProgress([old], null, { progressPercent: 100 }).completed, []);
});
test('reordering/deletion preserve IDs and replacing a video invalidates its prior watch credit', () => {
  const previous = {
    completed: ['old', 'new', 'deleted'],
    watched: { new: { seconds: 10, finished: true } },
    sources: { old: '', new: '/old-video.mp4' },
  };
  const state = reconcileMaterialProgress([added, old], previous);
  assert.deepEqual(state.completed, ['old']);
  assert.equal(state.watched.new, undefined);
});
test('rounding never shows 100% while any material is incomplete', () => {
  assert.equal(progressPercent(Array(999).fill('id'), 1000), 99);
  assert.equal(progressPercent([], 0), 0);
});
test('saved material progress is isolated by account, class and topic', () => {
  let user = 'student-a';
  globalThis.window = { localStorage: { getItem: () => JSON.stringify({ role: 'STUDENT', userId: user }) } };
  const first = progressKey('class', 'topic');
  user = 'student-b';
  assert.notEqual(progressKey('class', 'topic'), first);
  assert.notEqual(progressKey('other-class', 'topic'), progressKey('class', 'topic'));
});
