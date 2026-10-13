import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnswerQueue } from '../src/lib/answerQueue.js';

test('submit flush waits for slow saves in selection order', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const sent = [];
  const queue = createAnswerQueue(async (body) => {if (body.answerText === 'old') await gate; sent.push(body.answerText);});
  const first = queue.enqueue({ questionId: 'q1', answerText: 'old' });
  const second = queue.enqueue({ questionId: 'q1', answerText: 'latest' });
  const flush = queue.flush().then(() => sent.push('submit'));
  await Promise.resolve();
  assert.deepEqual(sent, []);
  release(); await Promise.all([first, second, flush]);
  assert.deepEqual(sent, ['old', 'latest', 'submit']);
});
test('flush retries the latest failed answer and retains raw text', async () => {
  let failing = true;
  const sent = [];
  const queue = createAnswerQueue(async (body) => { sent.push(body.answerText); if (failing) throw Error('Lỗi BE'); });
  await assert.rejects(queue.enqueue({questionId:'q1', answerText:'  9,8  '}), /Lỗi BE/);
  failing = false; await queue.flush();
  assert.deepEqual(sent, ['  9,8  ', '  9,8  ']);
});
test('failed persistence prevents submission until recovery', async () => {
  const queue = createAnswerQueue(async () => { throw Error('Không thể lưu'); });
  await assert.rejects(queue.enqueue({questionId:'q1', selectedOptionIds:['o1']}));
  await assert.rejects(queue.flush(), /Không thể lưu/);
});
