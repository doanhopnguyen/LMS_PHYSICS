import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-exam-distribution');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9386',
    `--user-data-dir=${path.join(directory, 'chrome')}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] }
);
browser.stderr.resume();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
let socket;
try {
  let target;
  for (let i = 0; i < 80 && !target; i++) {
    try {
      target = (await (await fetch('http://127.0.0.1:9386/json')).json()).find((t) => t.type === 'page');
    } catch {}
    if (!target) await pause(100);
  }
  assert.ok(target, 'Chrome launched');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  let seq = 0;
  const pending = new Map(),
    errors = [];
  socket.addEventListener('message', ({ data }) => {
    const r = JSON.parse(data);
    if (r.method === 'Runtime.exceptionThrown')
      errors.push(r.params.exceptionDetails.exception?.description || r.params.exceptionDetails.text);
    if (pending.has(r.id)) {
      pending.get(r.id)(r);
      pending.delete(r.id);
    }
  });
  const send = async (method, params = {}) => {
    const id = ++seq;
    const r = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(method + ' timeout')), 15000);
      pending.set(id, (reply) => {
        clearTimeout(timer);
        resolve(reply);
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
    if (r.error) throw new Error(JSON.stringify(r.error));
    return r.result;
  };
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const wait = async (expression) => {
    for (let i = 0; i < 200; i++) {
      if (await evaluate('Boolean(' + expression + ')')) return;
      await pause(100);
    }
    throw new Error(`Timed out: ${expression} ${await evaluate('document.body.innerText')} ${errors.join(' | ')}`);
  };
  const go = async (route) => {
    await send('Page.navigate', { url: `${origin}/${route}` });
    await wait(`document.querySelector('#root')?.textContent.length > 100`);
    await pause(200);
  };
  const screenshot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(path.join(directory, `${name}.png`), Buffer.from(r.data, 'base64'));
  };
  await send('Page.enable');
  await send('Page.navigate', { url: 'about:blank' });
  await wait(`location.href === 'about:blank'`);
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTimezoneOverride', { timezoneId: 'Asia/Saigon' });
  const set = async (selector, value) => {
    await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`
    );
    await pause(60);
  };
  const click = async (text) => {
    await evaluate(
      `(()=>{const e=[...document.querySelectorAll('button')].filter(b=>b.textContent.includes(${JSON.stringify(text)})).at(-1);if(!e)throw Error('Missing button '+${JSON.stringify(text)});e.click()})()`
    );
    await pause(100);
  };
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: await readFile('scripts/fixtures/exam-distribution-api.js', 'utf8'),
  });
  await go('lecturer_exam_create.html?classId=c1');
  await wait(`document.querySelector('fieldset')?.textContent.includes('PHY-02')`);
  assert.equal(await evaluate(`document.querySelector('fieldset').textContent.includes('MATH-01')`), false);
  await evaluate(`document.querySelector('fieldset input[type=checkbox]').click()`);
  await set('input[name=title]', 'Đề giao nhiều lớp');
  await set('input[name=durationMinutes]', '45');
  await set('input[name=maxAttempts]', '3');
  await set('input[name=startTime]', '2027-01-01T08:00');
  await set('input[name=endTime]', '2027-01-01T10:00');
  await set('select[name=matrixId]', 'matrix1');
  await evaluate(`document.querySelector('input[name=isPublished]').click()`);
  await screenshot('create-multiple-classes');
  await evaluate(
    `(()=>{const form=document.querySelector('form.authoring-grouped-form');form.requestSubmit();form.requestSubmit()})()`
  );
  await wait(
    `testExams.filter(e=>e.examId.startsWith('new-')).length===2&&document.body.textContent.includes('Đã hoàn tất 2/2')`
  );
  assert.equal(await evaluate(`testCalls.filter(c=>c.path==='/api/v1/exams'&&c.method==='POST').length`), 2);
  assert.deepEqual(
    await evaluate(
      `testExams.filter(e=>e.examId.startsWith('new-')).map(e=>({classId:e.classId,published:e.isPublished,maxAttempts:e.maxAttempts,duration:e.durationMinutes}))`
    ),
    [
      { classId: 'c1', published: true, maxAttempts: 3, duration: 45 },
      { classId: 'c2', published: true, maxAttempts: 3, duration: 45 },
    ]
  );
  assert.deepEqual(
    await evaluate(`testQuestions['new-1'].map(q=>[q.questionId,q.scoreWeight,q.orderIndex])`),
    await evaluate(`testQuestions['new-2'].map(q=>[q.questionId,q.scoreWeight,q.orderIndex])`)
  );
  assert.equal(await evaluate(`JSON.stringify(testExams[0])===testOriginal`), true);
  console.log('PASS multi-class creation, same-subject restriction, exact matrix questions and double-submit guard');

  await go('lecturer_assessments.html?classId=c1');
  await wait(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Đề nguồn')`);
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Đề nguồn').click()`);
  await wait(
    `[...document.querySelectorAll('[role=dialog] button')].some(b=>b.textContent.includes('Sao chép / giao lớp khác'))`
  );
  await click('Sao chép / giao lớp khác');
  await wait(`document.querySelector('input[name=title]')?.value.includes('(bản sao)')`);
  assert.equal(await evaluate(`document.querySelector('input[name=isPublished]').checked`), false);
  assert.deepEqual(
    await evaluate(
      `[...document.querySelectorAll('form.authoring-grouped-form select[name=classId] option')].map(o=>o.value).filter(v=>v&&v!=='ALL')`
    ),
    ['c1', 'c2']
  );
  await set('form.authoring-grouped-form select[name=classId]', 'c2');
  await evaluate(`document.querySelector('fieldset input[type=checkbox]').click();window.failQuestionClass='c1'`);
  await set('input[name=title]', 'Đề sao chép');
  await screenshot('copy-select-classes');
  await evaluate(`document.querySelector('form.authoring-grouped-form').requestSubmit()`);
  await wait(`document.body.textContent.includes('Có lớp chưa giao xong đề')`);
  assert.equal(await evaluate(`testExams.filter(e=>e.examId.startsWith('new-')).length`), 2);
  assert.equal(await evaluate(`testExams.find(e=>e.classId==='c1'&&e.examId.startsWith('new-')).isPublished`), false);
  await screenshot('copy-partial-error');
  await click('Tiếp tục giao các lớp còn lại');
  await wait(`document.body.textContent.includes('Đã hoàn tất 2/2')`);
  assert.equal(await evaluate(`testCalls.filter(c=>c.path==='/api/v1/exams'&&c.method==='POST').length`), 2);
  assert.equal(await evaluate(`JSON.stringify(testExams[0])===testOriginal`), true);
  assert.deepEqual(
    await evaluate(`testQuestions['new-1'].map(q=>[q.questionId,q.scoreWeight,q.orderIndex])`),
    await evaluate(`testQuestions.source.map(q=>[q.questionId,q.scoreWeight,q.orderIndex])`)
  );
  assert.deepEqual(
    await evaluate(`testQuestions['new-2'].map(q=>[q.questionId,q.scoreWeight,q.orderIndex])`),
    await evaluate(`testQuestions.source.map(q=>[q.questionId,q.scoreWeight,q.orderIndex])`)
  );
  console.log('PASS copying complete question definitions, default draft, resumable failures and unchanged source');

  await go('lecturer_assessments.html');
  await wait(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Đề nguồn')`);
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Đề nguồn').click()`);
  await wait(
    `[...document.querySelectorAll('[role=dialog] button')].some(b=>b.textContent.includes('Sửa thông tin đề')&&!b.disabled)`
  );
  await click('Sửa thông tin đề');
  await wait(`document.querySelector('input[name=title]')?.value==='Đề nguồn'`);
  await set('input[name=title]', 'Đề đã chỉnh sửa');
  await evaluate(`document.querySelector('input[name=isPublished]').click()`);
  await click('Lưu thay đổi');
  await wait(`testExams[0].title==='Đề đã chỉnh sửa'`);
  assert.equal(await evaluate(`testExams[0].isPublished`), false);
  assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST').length`), 0);
  assert.deepEqual(await evaluate(`testQuestions.source.map(q=>[q.questionId,q.scoreWeight,q.orderIndex])`), [
    ['q1', 2, 2],
    ['q2', 3, 1],
  ]);
  console.log('PASS editing an existing exam from all-class view without creating another exam or changing questions');

  await go('lecturer_assessments.html?classId=c1');
  await wait(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Đề nguồn')`);
  await evaluate(
    `window.testSourceHasAttempts=true;[...document.querySelectorAll('button')].find(b=>b.textContent==='Đề nguồn').click()`
  );
  await wait(
    `[...document.querySelectorAll('[role=dialog] button')].some(b=>b.textContent.includes('Sửa thông tin đề')&&b.disabled)`
  );
  assert.equal(
    await evaluate(
      `[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.includes('Sao chép / giao lớp khác')).disabled`
    ),
    false
  );
  await evaluate(`window.failSourceRead=true`);
  await click('Sao chép / giao lớp khác');
  await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Không thể tải câu hỏi nguồn')`);
  assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST').length`), 0);
  console.log(
    'PASS attempted exam stays locked for editing, remains copyable and reports source-read errors inside the dialog'
  );

  await go('lecturer_exam_create.html?classId=c1');
  await wait(`document.querySelector('fieldset')?.textContent.includes('PHY-02')`);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await screenshot('create-mobile');
  assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`), false);
  assert.deepEqual(errors, []);
  console.log('PASS mobile layout and no runtime exceptions');
} finally {
  if (socket) {
    try {
      socket.send(JSON.stringify({ id: 99999, method: 'Browser.close' }));
    } catch {}
    socket.close();
  }
  browser.kill();
}
