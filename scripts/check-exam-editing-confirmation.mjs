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
    '--remote-debugging-port=9387',
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
      target = (await (await fetch('http://127.0.0.1:9387/json')).json()).find((t) => t.type === 'page');
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
  const openSource = async (query = 'classId=c1') => {
    await go('lecturer_assessments.html?' + query);
    await wait(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Đề nguồn')`);
    await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Đề nguồn').click()`);
    await wait(
      `[...document.querySelectorAll('[role=dialog] button')].some(b=>b.textContent.includes('Sửa thông tin đề')&&!b.disabled)`
    );
  };
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: await readFile('scripts/fixtures/exam-distribution-api.js', 'utf8'),
  });
  await openSource('classId=c1&classCatalogError=true&missingClass=true');
  await click('Sửa thông tin đề');
  await wait(`document.querySelector('input[name=startTime]')`);
  assert.equal(
    await evaluate(`document.querySelector('form.authoring-grouped-form button[type=submit]').disabled`),
    false
  );
  for (const [field, days, hour] of [
    ['startTime', 1, '08'],
    ['endTime', 2, '09'],
  ]) {
    await evaluate(
      `document.querySelector('input[name=${field}]').parentElement.querySelector('.picker-trigger').click()`
    );
    await wait(`document.querySelector('.date-picker-panel')`);
    const date = await evaluate(
      `(()=>{const d=new Date(document.querySelector('input[name=${field}]').value);d.setDate(d.getDate()+${days});return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})()`
    );
    if (!(await evaluate(`!!document.querySelector('.date-picker-panel [data-day="${date}"]')`))) {
      await evaluate(`document.querySelector('.date-picker-panel button[aria-label="Tháng sau"]').click()`);
      await wait(`document.querySelector('.date-picker-panel [data-day="${date}"]')`);
    }
    await evaluate(`document.querySelector('.date-picker-panel [data-day="${date}"]').click()`);
    await set('.date-picker-time-fields input', hour);
    await evaluate(
      `[...document.querySelectorAll('.date-picker-panel button')].find(b=>b.textContent.includes('Xác nhận')).click()`
    );
    await wait(`!document.querySelector('.date-picker-panel')`);
  }
  const expected = await evaluate(
    `Object.fromEntries(['startTime','endTime'].map(k=>[k,new Date(document.querySelector('input[name='+k+']').value).toISOString()]))`
  );
  await evaluate(`window.testFailSave=true`);
  await click('Lưu thay đổi');
  await wait(`document.querySelector('[role=dialog] [role=alert]')?.textContent.includes('Không thể lưu lịch thi')`);
  assert.equal(
    await evaluate(`document.querySelector('form.authoring-grouped-form button[type=submit]').disabled`),
    false
  );
  assert.deepEqual(await evaluate(`testCalls.filter(c=>c.method==='PUT').at(-1).body`), expected);
  await screenshot('edit-save-error-retry');
  await evaluate(`window.testFailSave=false`);
  await click('Lưu thay đổi');
  await wait(`!document.querySelector('input[name=startTime]')`);
  assert.deepEqual(await evaluate(`testCalls.filter(c=>c.method==='PUT').at(-1).body`), expected);
  assert.equal(await evaluate(`testExams[0].endTime`), expected.endTime);
  console.log(
    'PASS save enabled with failed class catalog, missing detail class, real date-picker changes, precise UTC update and retry'
  );

  await openSource();
  await wait(`[...document.querySelectorAll('[role=dialog] button')].some(b=>b.textContent.includes('Thêm vào đề'))`);
  await click('Thêm vào đề');
  await wait(`document.querySelector('[role=alertdialog]')`);
  assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST').length`), 0);
  assert.ok(
    await evaluate(
      `document.querySelector('[role=alertdialog]').textContent.includes('Câu hỏi cần xác nhận trước khi thêm')`
    )
  );
  await screenshot('confirm-question');
  await evaluate(
    `[...document.querySelectorAll('[role=alertdialog] button')].find(b=>b.textContent.includes('Quay lại')).click()`
  );
  await wait(`!document.querySelector('[role=alertdialog]')`);
  assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST').length`), 0);
  await click('Thêm vào đề');
  await wait(`document.querySelector('[role=alertdialog]')`);
  await evaluate(`window.testFailAdd=true`);
  await click('OK, thêm vào đề');
  await wait(`document.querySelector('[role=alertdialog] [role=alert]')`);
  assert.equal(await evaluate(`testQuestions.source.length`), 2);
  await evaluate(
    `window.testFailAdd=false;(()=>{const b=[...document.querySelectorAll('[role=alertdialog] button')].find(b=>b.textContent.includes('OK, thêm vào đề'));b.click();b.click()})()`
  );
  await wait(`!document.querySelector('[role=alertdialog]')&&testQuestions.source.length===3`);
  assert.deepEqual(
    await evaluate(
      `testQuestions.source.find(q=>q.questionId==='q3')&&({questionId:testQuestions.source.at(-1).questionId,orderIndex:testQuestions.source.at(-1).orderIndex,scoreWeight:testQuestions.source.at(-1).scoreWeight})`
    ),
    { questionId: 'q3', orderIndex: 3, scoreWeight: 1 }
  );
  assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST').length`), 2);
  console.log('PASS no mutation before OK, cancel, inline failure, retry and double-click guard');
  const before = await evaluate(`testCalls.filter(c=>c.method==='POST').length`);
  await click('Sinh theo ma trận');
  await wait(`document.querySelector('[role=alertdialog]')`);
  assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST').length`), before);
  await click('OK, sinh câu hỏi');
  await wait(`!document.querySelector('[role=alertdialog]')`);
  assert.equal(
    await evaluate(`testCalls.filter(c=>c.path.endsWith('/generate-questions')&&c.method==='POST').length`),
    1
  );
  console.log('PASS matrix generation requires explicit confirmation');
  assert.deepEqual(errors, []);
} finally {
  if (socket) {
    try {
      socket.send(JSON.stringify({ id: 99999, method: 'Browser.close' }));
    } catch {}
    socket.close();
  }
  browser.kill();
}
