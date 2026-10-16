import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-admin-final-exam');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9388',
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
      target = (await (await fetch('http://127.0.0.1:9388/json')).json()).find((t) => t.type === 'page');
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
    source:
      (await readFile('scripts/fixtures/exam-distribution-api.js', 'utf8')) +
      `
      localStorage.setItem('ptit-physics-demo-session', JSON.stringify({role:'ADMIN',userId:'admin'}));
      const fixtureFetch = window.fetch;
      window.fetch = async (input, options = {}) => {
        const pathname = new URL(typeof input === 'string' ? input : input.url, location.origin).pathname;
        if (pathname === '/api/v1/users/me') return Response.json({data:{userId:'admin',role:'ADMIN',fullName:'Admin'}});
        if (pathname.startsWith('/api/v1/instructor/')) throw Error('Admin must use the admin class catalogue');
        return fixtureFetch(input, options);
      };
    `,
  });
  await go('admin_assessments.html');
  await wait(`document.body.textContent.includes('Tạo đề thi cuối kỳ')`);
  assert.equal(await evaluate(`[...document.querySelectorAll('[role=tab]')].some(t=>t.textContent.includes('Kỳ thi của lớp'))`), false);
  assert.equal(await evaluate(`document.querySelector('a[href*="admin_assessments"]') !== null`), true);
  await click('Tạo đề thi cuối kỳ');
  await wait(`document.querySelector('select[name=classId] option[value=c1]')`);
  assert.deepEqual(
    await evaluate(`Array.from(document.querySelector('select[name=examType]').options).map(o=>o.value)`),
    ['FINAL']
  );
  await set('select[name=classId]', 'c1');
  assert.equal(await evaluate(`!!document.querySelector('fieldset')`), false);
  assert.equal(await evaluate(`document.body.textContent.includes('Giao thêm cho lớp cùng môn')`), false);
  await set('input[name=title]', 'Đề thi cuối kỳ Vật lý');
  await set('input[name=durationMinutes]', '90');
  await set('input[name=startTime]', '2027-01-01T08:00');
  await set('input[name=endTime]', '2027-01-01T10:00');
  await set('select[name=matrixId]', 'matrix1');
  await evaluate(`document.querySelector('form.authoring-grouped-form').requestSubmit()`);
  await wait(
    `testExams.filter(e=>e.examId.startsWith('new-')).length===1&&document.body.textContent.includes('Đã hoàn tất 1/1')`
  );
  assert.deepEqual(
    await evaluate(
      `testExams.filter(e=>e.examId.startsWith('new-')).map(e=>({type:e.examType,classId:e.classId,duration:e.durationMinutes}))`
    ),
    [
      { type: 'FINAL', classId: 'c1', duration: 90 },
    ]
  );
  assert.deepEqual(
    await evaluate(`testQuestions['new-1'].map(q=>[q.questionId,q.scoreWeight])`),
    [[ 'q1', 2 ], [ 'q2', 3 ]]
  );
  assert.equal(await evaluate(`document.body.textContent.includes('Đề nguồn')`), false);
  await screenshot('admin-final-created');
  console.log(
    'PASS ADMIN creates a FINAL exam for the selected class without the extra class picker or redundant tab'
  );
  await click('Quản lý đề');
  await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Câu hỏi thứ nhất')`);
  await click('Sửa thông tin');
  await wait(`document.querySelector('input[name=durationMinutes]')`);
  await set('input[name=durationMinutes]', '120');
  await evaluate(`document.querySelector('form.authoring-grouped-form').requestSubmit()`);
  await wait(`testCalls.some(c=>c.method==='PUT'&&c.body?.durationMinutes===120)`);
  assert.deepEqual(errors, []);
  console.log('PASS ADMIN edits the FINAL exam duration after creation');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'INSTRUCTOR',userId:'teacher'})); window.fetch = fixtureFetch;`,
  });
  await go('lecturer_exam_create.html?classId=c1');
  await wait(`document.querySelector('select[name=examType]')`);
  assert.equal(await evaluate(`!!document.querySelector('fieldset')`), true);
  assert.equal(
    await evaluate(`Array.from(document.querySelector('select[name=examType]').options).some(o=>o.value==='FINAL')`),
    false
  );
  console.log('PASS lecturer creation does not expose the FINAL option');
} finally {
  socket?.close();
  browser.kill();
}
