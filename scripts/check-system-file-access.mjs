import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-system-file-access');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9391',
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
      target = (await (await fetch('http://127.0.0.1:9391/json')).json()).find((t) => t.type === 'page');
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
  const downloadEvents = [];
  socket.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    if (event.method === 'Browser.downloadWillBegin') downloadEvents.push(event.params);
  });
  await mkdir(path.join(directory, 'downloads'), { recursive: true });
  await send('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: path.join(directory, 'downloads'),
    eventsEnabled: true,
  });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source:
      (await readFile('scripts/fixtures/student-course-materials-api.js', 'utf8')) +
      '\n' +
      (await readFile('scripts/fixtures/system-file-access-api.js', 'utf8')),
  });
  await go('course_detail.html?classId=course1&format=PDF&materialId=shared0&topicId=topic1');
  await wait(`document.querySelector('.lesson-content iframe')?.src.startsWith('blob:')`);
  assert.deepEqual(
    await evaluate(
      `Array.from(new Map(fileCalls.map(c=>[c.method+c.url,{method:c.method,path:new URL(c.url).pathname,auth:c.authorization}])).values())`
    ),
    [
      { method: 'POST', path: '/api/v1/files/protected/download-url', auth: 'Bearer isolated-test' },
      { method: 'GET', path: '/api/v1/files/protected/download', auth: 'Bearer isolated-test' },
    ]
  );
  assert.equal(await evaluate(`!!document.querySelector('.lesson-content .media-viewer__toolbar')`), false);
  await evaluate(
    `import('/src/lib/apiClient.js').then(async ({api})=>{await api.files.download({fileId:'protected'});return true;})`
  );
  for (let i = 0; i < 50 && !downloadEvents.length; i++) await pause(100);
  assert.equal(downloadEvents[0]?.suggestedFilename, 'Bài học Vật lý.pdf');
  console.log('PASS protected material preview and original-name download use signed BE URLs and JWT');

  await go('course_detail.html?classId=course1&format=PDF&materialId=shared0&topicId=topic1&access=legacy');
  await wait(`document.querySelector('.lesson-content iframe')?.src.startsWith('blob:')`);
  assert.equal(await evaluate(`new Set(fileCalls.map(c=>c.url)).size`), 1);
  assert.equal(await evaluate(`fileCalls[0].url`), origin + '/api/v1/files/legacy.pdf');
  assert.equal(await evaluate(`fileCalls[0].authorization`), 'Bearer isolated-test');
  console.log('PASS legacy FE-host file URLs are routed to the authenticated BE transport');

  await go('course_detail.html?classId=course1&format=PDF&materialId=shared0&topicId=topic1&access=denied');
  await wait(`document.querySelector('.lesson-content [role=alert]')`);
  assert.equal(await evaluate(`fileCalls.every(c=>c.url.endsWith('/download-url'))`), true);
  assert.equal(await evaluate(`document.querySelectorAll('.lesson-content iframe').length`), 0);
  await evaluate(`window.allowProtectedFile=true`);
  await click('Thử lại');
  await wait(`document.querySelector('.lesson-content iframe')?.src.startsWith('blob:')`);
  console.log('PASS denied access stays blocked without raw URL fallback; retry obtains a new signed URL');

  await go('course_detail.html?classId=course1&materialId=shared0&topicId=topic1&access=markdown');
  await wait(`document.querySelector('.markdown-content img')?.src.startsWith('blob:')`);
  assert.equal(await evaluate(`fileCalls.find(c=>c.url.endsWith('image.png'))?.authorization`), 'Bearer isolated-test');
  await click('Tải PDF');
  await wait(`fileCalls.some(c=>c.url.endsWith('legacy.pdf'))`);
  assert.equal(await evaluate(`fileCalls.find(c=>c.url.endsWith('legacy.pdf')).authorization`), 'Bearer isolated-test');
  await screenshot('authenticated-material-files');
  console.log('PASS Markdown images and attachment links use the same authenticated file reader');
  await go('course_detail.html?classId=course1&format=VIDEO&materialId=shared0&topicId=topic1');
  await wait(
    `document.querySelector('#chapter-lesson-panel video')?.src.includes('/api/v1/files/protected/download?token=')`
  );
  assert.equal(
    await evaluate(`fileCalls.every(c=>c.authorization==='Bearer isolated-test'&&c.url.endsWith('/download-url'))`),
    true
  );
  console.log('PASS stored videos obtain authorized BE playback URLs instead of using the frontend file path');
  assert.deepEqual(errors, []);
} finally {
  socket?.close();
  browser.kill();
}
