// Browser integration with deterministic media events and a mocked YouTube SDK.
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import path from 'node:path';
const directory = path.resolve('.tmp-video-watch-ui');
await mkdir(directory, { recursive: true });
await build({
  entryPoints: ['scripts/fixtures/video-watch-ui.jsx'],
  bundle: true,
  outfile: path.join(directory, 'app.js'),
  format: 'iife',
  define: { 'import.meta.env': '{}' },
});
await writeFile(
  path.join(directory, 'index.html'),
  '<!doctype html><meta charset="utf-8"><div id="root"></div><script src="app.js"></script>'
);
const server = spawn('python', ['-m', 'http.server', '5191', '--bind', '127.0.0.1', '--directory', directory], {
  windowsHide: true,
  stdio: 'ignore',
});
const chrome = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9351',
    '--user-data-dir=' + path.join(directory, 'chrome-profile-retry'),
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' }
);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let target;
  for (let attempt = 0; attempt < 50 && !target; attempt++) {
    try {
      await fetch('http://127.0.0.1:5191/', { signal: AbortSignal.timeout(1000) });
      target = (await (await fetch('http://127.0.0.1:9351/json', { signal: AbortSignal.timeout(1000) })).json()).find(
        (item) => item.type === 'page'
      );
    } catch {
      await delay(100);
    }
  }
  assert.ok(target, 'Browser and test server started');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  const pending = new Map();
  let id = 0;
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const seq = ++id;
      pending.set(seq, resolve);
      socket.send(JSON.stringify({ id: seq, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.result.exceptionDetails) throw new Error(result.result.exceptionDetails.text);
    return result.result.result.value;
  };
  await send('Page.navigate', { url: 'http://127.0.0.1:5191/' });
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await evaluate('Boolean(window.__learning && window.__yt && document.querySelector("video"))')) break;
    await delay(50);
  }
  await evaluate('document.querySelector("video").play()');
  for (let time = 1; time <= 5; time++) {
    await evaluate('window.__tick(' + time + ')');
    await delay(10);
  }
  await evaluate('document.querySelector("video").currentTime=9');
  await delay(30);
  assert.equal(await evaluate('window.__learning.watched.video.seconds'), 0);
  assert.equal(await evaluate('document.querySelector("video").currentTime'), 0);
  assert.equal(await evaluate('window.__learning.completed.length'), 0);
  console.log('PASS unseen seek resets playback and credit');
  await evaluate('document.querySelector("video").play()');
  for (let time = 1; time <= 5; time++) {
    await evaluate('window.__tick(' + time + ')');
    await delay(10);
  }
  await evaluate(
    'document.querySelector("video").currentTime=2;document.querySelector("video").playbackRate=2;window.__tick(4)'
  );
  await delay(30);
  assert.equal(await evaluate('window.__learning.watched.video.seconds'), 5);
  await evaluate('window.__tick(6)');
  await delay(30);
  assert.equal(await evaluate('window.__learning.watched.video.seconds'), 0);
  console.log('PASS fast replay is allowed; crossing unseen content resets');
  await evaluate('document.querySelector("video").play()');
  for (let time = 1; time <= 10; time++) {
    await evaluate('window.__tick(' + time + ')');
    await delay(10);
  }
  await evaluate('document.querySelector("video").dispatchEvent(new Event("ended"))');
  await delay(50);
  assert.deepEqual(await evaluate('window.__learning.completed'), ['video']);
  assert.equal(await evaluate('document.querySelector("output").textContent'), '50');
  assert.equal(await evaluate('window.__writes.at(-1).progressPercent'), 50);
  console.log('PASS video ended automatically completes one material and sends 50%');
  await evaluate('document.querySelector("video").currentTime=9;document.querySelector("video").playbackRate=2');
  await delay(20);
  assert.deepEqual(await evaluate('window.__learning.completed'), ['video']);
  assert.equal(await evaluate('document.querySelector("video").currentTime'), 9);
  console.log('PASS completed video permits seeking and faster playback');
  await evaluate(
    'window.__learning.initialize([...window.__materials,{materialId:"added",type:"TEXT",createdAt:"2026-10-04T00:00:00Z"}],{progressPercent:100},"class","topic")'
  );
  await delay(50);
  assert.equal(await evaluate('window.__learning.percent'), 33);
  console.log('PASS added content recalculates progress from saved IDs');
  await evaluate('window.__clock+=250;window.__yt.time=9;window.__yt.state=1');
  await delay(350);
  assert.equal(await evaluate('window.__yt.time'), 0);
  assert.equal(await evaluate('window.__ytRecord.watched'), 0);
  console.log('PASS embedded time jump triggers the same reset');
  await delay(300);
  for (let time = 1; time <= 10; time++) {
    await evaluate('window.__clock+=1000;window.__yt.time=' + time + ';window.__yt.state=1');
    await delay(280);
  }
  assert.equal(await evaluate('window.__ytEvents.filter(record=>record.finished).length'), 1);
  console.log('PASS embedded video reports completion once after full playback');
  await evaluate('window.__vm.time=9;window.__vm.handlers.seeking({seconds:9})');
  await delay(30);
  assert.equal(await evaluate('window.__vm.time'), 0);
  assert.equal(await evaluate('window.__vmRecord.watched'), 0);
  console.log('PASS Vimeo seeking uses the same penalty reset');
  await send('Browser.close');
} finally {
  socket?.close();
  chrome.kill();
  server.kill();
}
