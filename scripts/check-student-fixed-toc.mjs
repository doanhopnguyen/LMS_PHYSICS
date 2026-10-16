import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-student-fixed-toc');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9402',
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
      target = (await (await fetch('http://127.0.0.1:9402/json')).json()).find((t) => t.type === 'page');
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
      const fixedTocFetch = window.fetch;
      window.fetch = async(input,options={})=>{
        if(new URL(input,location.origin).pathname==='/fixtures/outline.md') return new Response('# File heading'+String.fromCharCode(10,10)+'## File section',{headers:{'Content-Type':'text/markdown'}});
        const response = await fixedTocFetch(input,options);
        if(new URL(input,location.origin).pathname!=='/api/v1/students/me/materials')return response;
        const payload=await response.json();
        payload.data=payload.data.map(item=>item.materialId==='shared0'?{...item,type:'MARKDOWN',fileUrl:null,contentText:'# Introduction\\n\\n'+'Lesson content.\\n\\n'.repeat(70)+'## Final section\\n\\nEnd of lesson.'}:item);
        if(location.search.includes('tocFile=1')) payload.data=payload.data.map(item=>item.materialId==='shared0'?{...item,contentText:'',fileUrl:location.origin+'/fixtures/outline.md'}:item);
        return Response.json(payload);
      };
    `,
  });
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    await go('course_detail.html?classId=course1&materialId=shared0&topicId=topic1');
    await wait(`document.querySelector('.markdown-toc--fixed .markdown-toc__toggle')`);
    const geometry = () =>
      evaluate(
        `(()=>{const r=document.querySelector('.markdown-toc__toggle').getBoundingClientRect();return {top:r.top,left:r.left,width:r.width,height:r.height}})()`
      );
    const before = await geometry();
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.markdown-toc--fixed')).position`), 'fixed');
    await evaluate(`window.scrollTo(0,document.body.scrollHeight);true`);
    await pause(150);
    const after = await geometry();
    assert.ok(
      Math.abs(before.top - after.top) < 1 && Math.abs(before.left - after.left) < 1,
      'TOC stays at the same viewport position after scrolling'
    );
    assert.equal(
      await evaluate(
        `(()=>{const toc=document.querySelector('.markdown-toc__toggle').getBoundingClientRect();const chat=document.querySelector('.chat-launcher').getBoundingClientRect();return toc.bottom+8<=chat.top})()`
      ),
      true,
      'TOC does not overlap the chat launcher'
    );
    await evaluate(`document.querySelector('.markdown-toc__toggle').click()`);
    await wait(`document.querySelector('.markdown-toc__panel a')`);
    assert.equal(
      await evaluate(
        `(()=>{const r=document.querySelector('.markdown-toc__panel').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()`
      ),
      true
    );
    await screenshot('fixed-toc-' + width);
    await evaluate(`document.querySelectorAll('.markdown-toc__panel a')[1].click()`);
    await wait(
      `document.activeElement?.textContent==='Final section'&&!document.querySelector('.markdown-toc__panel')`
    );
    await evaluate(`document.querySelector('.markdown-toc__toggle').click()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(`!document.querySelector('.markdown-toc__panel')`);
    await evaluate(`document.querySelector('.chapter-close').click()`);
    await wait(`!document.querySelector('.markdown-toc--fixed')`);
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
    console.log('PASS ' + width + 'px: fixed outline, chat spacing, heading navigation and cleanup');
  }
  await go('course_detail.html?classId=course1&materialId=shared0&topicId=topic1&tocFile=1');
  await wait(`document.querySelector('.media-viewer__reading .markdown-toc--fixed')`);
  assert.equal(await evaluate(`document.querySelectorAll('.markdown-toc--fixed').length`), 1);
  assert.equal(
    await evaluate(
      `(()=>{const e=document.querySelector('.markdown-toc--fixed');const r=e.getBoundingClientRect();return getComputedStyle(e).position==='fixed'&&r.height<=50&&Math.abs(innerHeight-r.bottom-parseFloat(getComputedStyle(e).bottom))<1})()`
    ),
    true
  );
  await evaluate(`document.querySelector('.media-viewer [aria-label="Mở rộng khung xem"]').click()`);
  await wait(`document.querySelector('.media-viewer--expanded')`);
  await evaluate(`document.querySelector('.markdown-toc__toggle').click()`);
  await wait(`document.querySelectorAll('.markdown-toc__panel a').length===2`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(`!document.querySelector('.markdown-toc__panel')&&document.querySelector('.media-viewer--expanded')`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(`!document.querySelector('.media-viewer--expanded')`);
  console.log('PASS Markdown file outline stays fixed in the reader and Escape closes outline before expanded viewer');
  assert.deepEqual(errors, []);
} finally {
  socket?.close();
  browser.kill();
}
