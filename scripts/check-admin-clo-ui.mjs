import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-admin-clo');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9395',
    `--user-data-dir=${path.join(directory, `chrome-admin-clo-${process.pid}`)}`,
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
      target = (await (await fetch('http://127.0.0.1:9395/json')).json()).find((t) => t.type === 'page');
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
    source: await readFile('scripts/fixtures/admin-clo-api.js', 'utf8'),
  });
  const fill = async (selector, value) => {
    await evaluate(
      `(()=>{const element=document.querySelector(${JSON.stringify(selector)});const prototype=element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,${JSON.stringify(value)});element.dispatchEvent(new Event('input',{bubbles:true}))})()`
    );
    await pause(60);
  };
  const menu = async (code) => {
    await evaluate(`document.querySelector('button[aria-label="Thao tác với ${code}"]').click()`);
    await wait(`!!document.querySelector('[role=menuitem]')`);
  };
  const submit = async () => {
    await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
    await pause(100);
  };
  await go('admin_assessments.html');
  await click('Ma trận đề');
  await wait(`!!document.querySelector('.tabs-actions label.select-field select')`);
  assert.equal(
    await evaluate(
      `(()=>{const tabs=document.querySelector('[role=tablist]').getBoundingClientRect();const filter=document.querySelector('.tabs-actions label.select-field').getBoundingClientRect();return Math.abs(tabs.top+tabs.height/2-filter.top-filter.height/2)<2})()`
    ),
    true
  );
  await evaluate(
    `(()=>{const select=document.querySelector('.tabs-actions label.select-field select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,'s1');select.dispatchEvent(new Event('change',{bubbles:true}))})()`
  );
  await wait(`testCalls.some(call=>call.path==='/api/v1/exam-matrices' && call.query.includes('subjectId=s1'))`);
  assert.equal(
    await evaluate(
      `Array.from(document.querySelectorAll('.tabs-actions button')).find(button=>button.textContent.includes('Tạo ma trận')).disabled`
    ),
    false
  );
  console.log('PASS matrix subject filter shares the tab row and filters API data');
  await go('admin_subject_detail.html?subjectId=s1&tab=clos');
  await wait(
    `document.querySelector('button[aria-label="Thao tác với CLO1"]') && Array.from(document.querySelectorAll('button')).some(button=>button.textContent.includes('Tạo mới CLO')&&!button.disabled)`
  );
  assert.equal(
    await evaluate(`document.querySelector('[role=tab][aria-selected=true]').textContent.trim()`),
    'Chuẩn đầu ra (CLO)'
  );
  await click('Tạo mới CLO');
  await fill('input[name=cloCode]', 'CLO1');
  await fill('textarea[name=description]', 'New learning outcome');
  await fill('input[name=orderIndex]', '2');
  await submit();
  await wait(`document.querySelector('[role=dialog] [role=alert]')?.textContent.includes('đã tồn tại')`);
  assert.equal(await evaluate(`testCalls.filter(call=>call.method==='POST').length`), 0);
  await fill('input[name=cloCode]', 'CLO2');
  await submit();
  await wait(
    `!document.querySelector('[role=dialog]') && !!document.querySelector('button[aria-label="Thao tác với CLO2"]')`
  );
  assert.deepEqual(await evaluate(`testCalls.find(call=>call.method==='POST').body`), {
    cloCode: 'CLO2',
    description: 'New learning outcome',
    orderIndex: 2,
    isActive: true,
  });
  await evaluate(`testClos.find(clo=>clo.cloCode==='CLO2').description='Latest backend description'`);
  await menu('CLO2');
  await click('Chỉnh sửa');
  await wait(`document.querySelector('textarea[name=description]')?.value==='Latest backend description'`);
  await fill('textarea[name=description]', 'Updated learning outcome');
  await submit();
  await wait(`!document.querySelector('[role=dialog]')`);
  assert.equal(
    await evaluate(`testCalls.find(call=>call.method==='PUT').body.description`),
    'Updated learning outcome'
  );
  for (const active of [false, true]) {
    await menu('CLO2');
    await click(active ? 'Kích hoạt' : 'Ngừng hoạt động');
    await wait(`testClos.find(clo=>clo.cloCode==='CLO2').isActive===${active}`);
    await wait(`!!document.querySelector('button[aria-label="Thao tác với CLO2"]:not(:disabled)')`);
    assert.equal(await evaluate(`testCalls.filter(call=>call.method==='PATCH').at(-1).query`), `?isActive=${active}`);
  }
  await menu('CLO1');
  await click('Xem chi tiết');
  await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Explain physical principles')`);
  await evaluate(`document.querySelector('[role=dialog] button[aria-label="Đóng"]').click()`);
  await menu('CLO1');
  await click('Xóa');
  await wait(`!!document.querySelector('[role=alertdialog]')`);
  assert.equal(
    await evaluate(
      `Array.from(document.querySelectorAll('[role=alertdialog] button')).find(button=>button.textContent==='Xóa CLO').disabled`
    ),
    true
  );
  await click('Ngừng hoạt động');
  await wait(`!document.querySelector('[role=alertdialog]')`);
  assert.equal(await evaluate(`testCalls.filter(call=>call.method==='DELETE').length`), 0);
  await menu('CLO2');
  await click('Xóa');
  await click('Xóa CLO');
  await wait(
    `!document.querySelector('[role=alertdialog]') && !document.querySelector('button[aria-label="Thao tác với CLO2"]')`
  );
  assert.equal(await evaluate(`testCalls.filter(call=>call.method==='DELETE').length`), 1);
  await evaluate(`testSubject.isActive=false`);
  await click('Lớp học');
  await click('Chuẩn đầu ra (CLO)');
  // Re-open through the URL to refresh the subject's status from the API fixture.
  await send('Page.addScriptToEvaluateOnNewDocument', { source: 'testSubject.isActive=false;' });
  await go('admin_subject_detail.html?subjectId=s1&tab=clos');
  await wait(`document.body.textContent.includes('Kích hoạt học phần để tạo mới CLO')`);
  assert.equal(
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find(button=>button.textContent.includes('Tạo mới CLO')).disabled`
    ),
    true
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS admin CLO deep link, create, duplicate validation, current detail/edit, status toggles, linked delete protection, delete and inactive-subject guard'
  );
} finally {
  if (socket) {
    try {
      socket.send(JSON.stringify({ id: 99999, method: 'Browser.close' }));
    } catch {}
    socket.close();
  }
  browser.kill();
}
