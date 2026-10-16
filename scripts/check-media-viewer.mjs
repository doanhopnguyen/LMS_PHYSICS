import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-media-viewer');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9398',
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
      target = (await (await fetch('http://127.0.0.1:9398/json')).json()).find((t) => t.type === 'page');
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
      (await readFile('scripts/fixtures/student-course-materials-api.js', 'utf8')) +
      `
      const viewerFixtureFetch = window.fetch;
      window.fetch = async(input, options = {}) => {
        const response = await viewerFixtureFetch(input, options);
        if (new URL(input, location.origin).pathname !== '/api/v1/students/me/materials') return response;
        const payload = await response.json();
        payload.data = payload.data.map(item => ({...item, fileName:'Very-long-original-document-name-'.repeat(20)+'.pdf'}));
        return Response.json(payload);
      };
    `,
  });
  await go('course_detail.html?classId=course1&format=PDF&materialId=shared0&topicId=topic1');
  await wait(`document.querySelector('.pdf-file-viewer iframe')`);
  assert.equal(
    await evaluate(`!!document.querySelector('.media-viewer__title')`),
    false,
    'lesson title is not repeated in the inline toolbar'
  );
  assert.equal(
    await evaluate(`!!document.querySelector('.lesson-question .media-viewer')`),
    false,
    'no redundant card around the viewer'
  );
  assert.equal(
    await evaluate(`!!document.querySelector('.media-viewer__toolbar')`),
    false,
    'PDF uses only the browser toolbar'
  );
  for (const width of [1440, 1100, 768, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    assert.equal(
      await evaluate(
        `(()=>{const p=document.querySelector('#chapter-lesson-panel').getBoundingClientRect();const v=document.querySelector('.pdf-file-viewer').getBoundingClientRect();return v.left>=p.left&&v.right<=p.right+1&&document.documentElement.scrollWidth<=innerWidth+1})()`
      ),
      true,
      `viewer fits at ${width}px with a long original filename`
    );
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  assert.equal(
    await evaluate(`getComputedStyle(document.querySelector('.chapter-panel-heading')).borderBottomWidth`),
    '0px'
  );
  await evaluate(
    `window.originalPdf=document.querySelector('.pdf-file-viewer iframe');document.querySelector('.pdf-file-viewer button').click();true`
  );
  await wait(`document.querySelector('.pdf-file-viewer.media-viewer--expanded')`);
  assert.equal(await evaluate(`document.querySelector('.pdf-file-viewer iframe')===originalPdf`), true);
  assert.equal(await evaluate(`document.querySelector('.pdf-file-viewer').getBoundingClientRect().height>900`), true);
  assert.equal(await evaluate(`document.querySelectorAll('.pdf-file-viewer button').length`), 1);
  assert.equal(await evaluate(`!!document.querySelector('.media-viewer__toolbar')`), false);
  await screenshot('pdf-desktop-expanded');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(`!document.querySelector('.media-viewer--expanded')`);
  assert.equal(await evaluate(`document.querySelector('.pdf-file-viewer iframe')===originalPdf`), true);
  await evaluate(`document.querySelector('.pdf-file-viewer').scrollIntoView({block:'start'});true`);
  await screenshot('pdf-desktop-inline');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate(`document.querySelector('.pdf-file-viewer button').click()`);
  assert.equal(await evaluate(`document.querySelector('.pdf-file-viewer').getBoundingClientRect().width`), 390);
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
  await screenshot('pdf-mobile');
  await evaluate(`document.querySelector('.pdf-file-viewer button').click()`);
  await go('course_detail.html?classId=course1&format=YOUTUBE&materialId=shared0&topicId=topic1');
  await wait(`document.querySelector('.guarded-video-embed iframe')`);
  assert.equal(
    await evaluate(`!!document.querySelector('.media-viewer__title,.media-viewer__meta,.media-viewer__footer')`),
    false,
    'video has no repeated title, completion status or explanatory footer'
  );
  await evaluate(
    `window.savedVideo=document.querySelector('.guarded-video-embed iframe');window.savedPlayer=window.__youtube;true`
  );
  await evaluate(`document.querySelector('.media-viewer [aria-label="Mở rộng khung xem"]').click()`);
  assert.equal(
    await evaluate(
      `document.querySelector('.guarded-video-embed iframe')===savedVideo && window.__youtube===savedPlayer`
    ),
    true
  );
  assert.equal(await evaluate(`document.querySelectorAll('.guarded-video-embed iframe').length`), 1);
  await screenshot('video-mobile');
  await evaluate(`document.querySelector('.media-viewer [aria-label="Thu gọn khung xem"]').click()`);
  assert.equal(await evaluate(`window.__youtube===savedPlayer`), true);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.querySelector('.media-viewer').scrollIntoView({block:'start'});true`);
  await screenshot('video-desktop');
  assert.deepEqual(errors, []);
  console.log('PASS single native PDF viewer, responsive layout and stable expanded video player');
} finally {
  socket?.close();
  browser.kill();
}
