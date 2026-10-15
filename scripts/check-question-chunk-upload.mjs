import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-question-chunk-upload');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9389',
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
      target = (await (await fetch('http://127.0.0.1:9389/json')).json()).find((t) => t.type === 'page');
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
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`
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
      (await readFile('scripts/fixtures/lecturer-workspace-api.js', 'utf8')) +
      '\n' +
      (await readFile('scripts/fixtures/question-chunk-upload-api.js', 'utf8')),
  });
  for (const admin of [true, false]) {
    await go(admin ? 'admin_questions.html' : 'lecturer_question_bank.html?subjectId=s0&topicId=t1&tab=contributions');
    await wait(`[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Tạo câu hỏi'))`);
    await click('Tạo câu hỏi');
    await wait(`document.querySelector('[role=dialog] input[name=mediaUrl]')`);
    if (admin) {
      await set('[role=dialog] select[name=subjectId]', 's0');
      await wait(`document.querySelector('select[name=topicId] option[value=t1]')`);
      await set('[role=dialog] select[name=topicId]', 't1');
      await set('[aria-label="Nội dung đáp án 1"]', 'Đáp án A');
      await set('[aria-label="Nội dung đáp án 2"]', 'Đáp án B');
      await evaluate(`document.querySelector('input[name=correct-answer]').click()`);
    } else {
      await set('[role=dialog] select:has(option[value=FILL_BLANK])', 'FILL_BLANK');
      await set('[name=acceptedAnswers]', '42');
    }
    await set('textarea[name=content]', 'Câu hỏi có ảnh tải theo chunk');
    await wait(`document.querySelector('[role=dialog] input[type=checkbox]')`);
    await evaluate(`document.querySelector('[role=dialog] input[type=checkbox]').click()`);
    await evaluate(
      `(()=>{const data=new DataTransfer();data.items.add(new File([new Uint8Array(230000)],'question.png',{type:'image/png'}));const input=document.querySelector('[role=dialog] input[type=file]');input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`
    );
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Thử lại tải ảnh')`);
    assert.equal(await evaluate(`questionWrites.length`), 0);
    assert.equal(
      await evaluate(`[...document.querySelectorAll('[role=dialog] button[type=submit]')].every(b=>b.disabled)`),
      true
    );
    const firstId = await evaluate(`chunkCalls[0].uploadId`);
    const savedFirstCount = await evaluate(`chunkCalls.filter(c=>c.index===0).length`);
    await evaluate(`window.failImageChunk=false`);
    await click('Thử lại tải ảnh');
    await wait(`chunkCalls.some(c=>c.path.endsWith('/merge'))`);
    assert.equal(await evaluate(`chunkCalls.some(c=>c.path.endsWith('/status'))`), true);
    assert.equal(await evaluate(`chunkCalls.every(c=>c.uploadId===${JSON.stringify(firstId)})`), true);
    assert.equal(await evaluate(`chunkCalls.filter(c=>c.index===0).length`), savedFirstCount);
    assert.equal(
      await evaluate(`[...document.querySelectorAll('[role=dialog] button[type=submit]')].every(b=>b.disabled)`),
      true
    );
    assert.equal(await evaluate(`questionWrites.length`), 0);
    await evaluate(`window.releaseImageMerge=true`);
    await wait(`document.querySelector('input[name=mediaUrl]')?.value.endsWith('/api/v1/files/chunked/question.png')`);
    await wait(`[...document.querySelectorAll('[role=dialog] button[type=submit]')].some(b=>!b.disabled)`);
    await screenshot(admin ? 'admin-image-upload' : 'lecturer-image-upload');
    await evaluate(
      `document.querySelector('[role=dialog] form').requestSubmit(document.querySelector('[role=dialog] button[type=submit]'))`
    );
    await wait(`questionWrites.length===1`);
    assert.equal(await evaluate(`questionWrites[0].mediaUrl`), '/api/v1/files/chunked/question.png');
    console.log(
      'PASS ' +
        (admin ? 'ADMIN' : 'INSTRUCTOR') +
        ': chunk upload, retry same session, save waits for merge, fileUrl saved as mediaUrl'
    );
  }
  assert.deepEqual(errors, []);
} finally {
  socket?.close();
  browser.kill();
}
