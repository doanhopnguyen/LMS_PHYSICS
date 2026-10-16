import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-loading');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9401',
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
      target = (await (await fetch('http://127.0.0.1:9401/json')).json()).find((t) => t.type === 'page');
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
  await send('Network.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Network.setBlockedURLs', { urls: ['*/src/main.jsx*'] });
  await send('Page.navigate', { url: origin + '/' });
  await wait(`document.querySelector('.ptit-loading--page img')?.naturalWidth>0`);
  await wait(
    `getComputedStyle(document.querySelector('.ptit-loading__mark'),'::after').animationName==='ptit-loading-orbit'`
  );
  assert.equal(
    await evaluate(`getComputedStyle(document.querySelector('.ptit-loading__mark'),'::after').animationName`),
    'ptit-loading-orbit'
  );
  await screenshot('initial-page-loading');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(
    await evaluate(`getComputedStyle(document.querySelector('.ptit-loading__mark'),'::after').animationName`),
    'none'
  );
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Network.setBlockedURLs', { urls: [] });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source:
      (await readFile('scripts/fixtures/student-course-materials-api.js', 'utf8')) +
      `
      const role = location.pathname.includes('admin_') ? 'ADMIN' : location.pathname.includes('lecturer_') ? 'INSTRUCTOR' : location.pathname.includes('ta_') ? 'TA' : 'STUDENT';
      localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role,userId:'loading-test'}));
      const loadingFixtureFetch = window.fetch;
      const gate = new Promise(resolve=>window.releaseLoading=resolve);
      window.pendingRequests = 0;
      window.fetch = async(input, options = {}) => {
        const path = new URL(input, location.origin).pathname;
        if(path.startsWith('/api/')) { window.pendingRequests++; await gate; }
        if(path==='/api/v1/users/me') return Response.json({data:{userId:'loading-test',role}});
        return loadingFixtureFetch(input,options);
      };
    `,
  });
  for (const [name, route] of [
    ['admin', 'admin_subjects.html'],
    ['lecturer', 'lecturer_courses.html'],
    ['ta', 'ta_class_support.html?classId=course1'],
    ['student', 'course_detail.html?classId=course1'],
  ]) {
    await send('Page.navigate', { url: origin + '/' + route });
    await wait(`window.pendingRequests>0&&document.querySelector('#root .ptit-loading img')?.naturalWidth>0`);
    assert.equal(await evaluate(`document.querySelector('#root .ptit-loading').getAttribute('role')`), 'status');
    assert.equal(await evaluate(`document.querySelector('#root .ptit-loading').getAttribute('aria-busy')`), 'true');
    assert.equal(
      await evaluate(`getComputedStyle(document.querySelector('#root .ptit-loading__mark'),'::after').animationName`),
      'ptit-loading-orbit'
    );
    await screenshot(name + '-loading');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
    await screenshot(name + '-loading-mobile');
    await evaluate(`window.releaseLoading();true`);
    await wait(`!document.querySelector('#root .ptit-loading')`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    console.log('PASS ' + name + ': branded loader appears during requests and clears after completion');
  }
  assert.deepEqual(errors, []);
  console.log('PASS startup fallback, responsive layout and reduced-motion support');
} finally {
  socket?.close();
  browser.kill();
}
