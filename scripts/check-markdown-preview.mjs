import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-markdown-preview');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9397',
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
      target = (await (await fetch('http://127.0.0.1:9397/json')).json()).find((t) => t.type === 'page');
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
    source: await readFile('scripts/fixtures/lecturer-workspace-api.js', 'utf8'),
  });
  await go('lecturer_material_create.html');
  await wait(`document.querySelector('textarea[name=contentText]')`);
  const markdown = '# Bài học **Cơ học**\n\n## Gia tốc\n\n' + 'Nội dung bài học.\n\n'.repeat(40) +
    '### Ví dụ\n\n## Gia tốc\n\n```md\n# Không phải tiêu đề\n```';
  await set('textarea[name=contentText]', markdown);
  await wait(`document.querySelector('.markdown-toc__toggle')`);
  await evaluate(`document.querySelector('.markdown-toc__toggle').click()`);
  await wait(`document.querySelectorAll('.markdown-toc a').length===4`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.markdown-toc a')].map(a=>a.textContent)`),
    ['Bài học Cơ học', 'Gia tốc', 'Ví dụ', 'Gia tốc']);
  assert.equal(await evaluate(`new Set([...document.querySelectorAll('.markdown-content__body [id]')].map(e=>e.id)).size`), 4);
  const route = await evaluate('location.href');
  await evaluate(`document.querySelectorAll('.markdown-toc a')[2].click()`);
  await wait(`document.activeElement?.textContent==='Ví dụ'`);
  assert.equal(await evaluate('location.href'), route);
  await click('Mở rộng');
  await wait(`document.querySelector('[role=dialog] .markdown-toc')`);
  await evaluate(`document.querySelector('[role=dialog] .markdown-toc__toggle').click()`);
  assert.equal(await evaluate(`document.querySelector('[role=dialog]').getBoundingClientRect().width>1000`), true);
  assert.equal(await evaluate(`new Set([...document.querySelectorAll('.markdown-content__body [id]')].map(e=>e.id)).size`), 8);
  await screenshot('markdown-preview-desktop');
  const before = await evaluate(`document.querySelector('[role=dialog] .markdown-toc__toggle').getBoundingClientRect().top`);
  await evaluate(`document.querySelector('[role=dialog] .markdown-toc').parentElement.parentElement.parentElement.scrollTop=400`);
  await pause(100);
  const after = await evaluate(`document.querySelector('[role=dialog] .markdown-toc__toggle').getBoundingClientRect().top`);
  assert.ok(Math.abs(before-after)<20, 'floating outline remains visible while scrolling');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(`document.querySelector('[role=dialog]')&&!document.querySelector('[role=dialog] .markdown-toc__panel')`);
  await evaluate(`document.querySelector('[aria-label="Mở rộng toàn màn hình"]').click()`);
  assert.equal(await evaluate(`document.querySelector('[role=dialog]').getBoundingClientRect().height===innerHeight`), true);
  await evaluate(`document.querySelector('[role=dialog] [aria-label="Đóng"]').click()`);
  await wait(`!document.querySelector('[role=dialog]')`);
  assert.equal(await evaluate(`document.querySelector('textarea[name=contentText]').value`), markdown);
  await set('textarea[name=contentText]', 'Nội dung không có tiêu đề');
  await wait(`!document.querySelector('.markdown-toc')`);
  await set('textarea[name=contentText]', 'Tiêu đề kiểu Setext\n===\n\n## Đã cập nhật');
  await wait(`document.querySelector('.markdown-toc__toggle')`);
  await evaluate(`document.querySelector('.markdown-toc__toggle').click()`);
  await wait(`document.querySelectorAll('.markdown-toc a').length===2`);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await click('Mở rộng');
  await wait(`document.querySelector('[role=dialog] .markdown-toc')`);
  await evaluate(`document.querySelector('[role=dialog] .markdown-toc__toggle').click()`);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'), true);
  await screenshot('markdown-preview-mobile');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(`!document.querySelector('[role=dialog] .markdown-toc__panel')`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(`!document.querySelector('[role=dialog]')`);
  assert.deepEqual(errors, []);
  console.log('PASS Markdown outline, duplicate headings, code fences, navigation, live update, expanded preview and mobile layout');
} finally {
  socket?.close();
  browser.kill();
}
