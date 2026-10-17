import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// --baseline restores a blocking font link to compare network behavior only.
const phase = process.argv.includes('--baseline') ? 'before' : 'after';
const directory = path.resolve('.tmp-startup', phase);
await mkdir(directory, { recursive: true });
const configPath = path.join(directory, 'vite.config.mjs');
await writeFile(
  configPath,
  `import config from ${JSON.stringify(pathToFileURL(path.resolve('vite.config.js')).href)};
export default {...config, cacheDir: ${JSON.stringify(path.join(directory, 'vite-cache'))},
  plugins: [...config.plugins, ${phase === 'before' ? `{name:'simulate-blocking-font',transformIndexHtml(html){return html.replace(/rel="preload" as="style" onload="[^"]+"/,'rel="stylesheet"')}}` : `{name:'startup-check'}`}]
};`
);
const start = performance.now();
const server = spawn(
  process.execPath,
  [
    path.resolve('node_modules/vite/bin/vite.js'),
    '--config',
    configPath,
    '--host',
    '127.0.0.1',
    '--port',
    '5206',
    '--strictPort',
  ],
  {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);
let startupOutput = '';
server.stderr.on('data', (chunk) => {
  startupOutput += chunk;
});
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    server.kill();
    reject(new Error('Vite startup timeout: ' + startupOutput));
  }, 20000);
  server.stdout.on('data', (chunk) => {
    startupOutput += chunk;
    if (startupOutput.includes('Local:')) {
      clearTimeout(timer);
      resolve();
    }
  });
  server.on('error', (error) => {
    clearTimeout(timer);
    reject(error);
  });
  server.on('exit', (code) => {
    if (code) {
      clearTimeout(timer);
      reject(new Error(startupOutput));
    }
  });
});
const serverReadyMs = Math.round(performance.now() - start);
console.log(`Vite ready: ${serverReadyMs} ms`);
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--remote-debugging-port=9476',
    `--user-data-dir=${path.join(directory, 'chrome-cli')}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' }
);
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
const fontTimers = new Set();
const fontDelayMs = phase === 'before' ? 5000 : 60000;
try {
  let target;
  for (let i = 0; i < 80 && !target; i++) {
    try {
      target = (await (await fetch('http://127.0.0.1:9476/json', { signal: AbortSignal.timeout(2000) })).json()).find(
        (p) => p.type === 'page'
      );
    } catch {}
    if (!target) await pause(100);
  }
  assert.ok(target, 'Chrome launched');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  let seq = 0;
  const pending = new Map();
  const errors = [];
  let heldFonts = 0;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      const timer = setTimeout(() => reject(new Error(method + ' timeout')), 30000);
      pending.set(id, (r) => {
        clearTimeout(timer);
        r.error ? reject(r.error) : resolve(r.result);
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
  socket.addEventListener('message', ({ data }) => {
    const r = JSON.parse(data);
    if (pending.has(r.id)) {
      pending.get(r.id)(r);
      pending.delete(r.id);
    }
    if (r.method === 'Runtime.exceptionThrown')
      errors.push(r.params.exceptionDetails.exception?.description || r.params.exceptionDetails.text);
    if (r.method === 'Fetch.requestPaused') {
      heldFonts++;
      const timer = setTimeout(() => {
        fontTimers.delete(timer);
        send('Fetch.fulfillRequest', {
          requestId: r.params.requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/css' }],
          body: '',
        }).catch(() => {});
      }, fontDelayMs);
      fontTimers.add(timer);
    }
  });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  console.log('Browser connected');
  await send('Fetch.enable', { patterns: [{ urlPattern: 'https://fonts.googleapis.com/*', requestStage: 'Request' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    localStorage.clear();
    new MutationObserver((_, observer) => {
      if (document.querySelector('#student-id')) { window.loginReadyMs = Math.round(performance.now()); observer.disconnect(); }
    }).observe(document, {childList:true,subtree:true});
  `,
  });
  await send('Page.navigate', { url: 'http://127.0.0.1:5206/login' });
  let loginReadyMs;
  for (let i = 0; i < 200 && !loginReadyMs; i++) {
    loginReadyMs = await evaluate('window.loginReadyMs');
    if (!loginReadyMs) await pause(100);
  }
  assert.ok(
    loginReadyMs,
    'Login form renders: ' +
      JSON.stringify({ errors, body: await evaluate('document.body?.innerText'), server: startupOutput.slice(-2000) })
  );
  assert.ok(heldFonts > 0, 'Simulated slow font stylesheet');
  assert.deepEqual(errors, []);
  const slowResources = await evaluate(
    `performance.getEntriesByType('resource').sort((a,b)=>b.duration-a.duration).slice(0,10).map(r=>({url:r.name.replace(location.origin,''),startMs:Math.round(r.startTime),durationMs:Math.round(r.duration)}))`
  );
  const result = {
    phase,
    serverReadyMs,
    loginReadyMs,
    fontDelayMs,
    fontsStillPending: fontTimers.size > 0,
    slowResources,
  };
  await writeFile(path.join(directory, 'metrics.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  if (phase === 'after')
    assert.ok(fontTimers.size > 0, 'Login must render while the external font stylesheet is still pending');
  if (phase === 'after') {
    assert.equal(
      await evaluate(`performance.getEntriesByType('resource').some(r=>new URL(r.name).pathname==='/src/styles.css')`),
      false,
      'Login must not request workspace CSS'
    );
    const buttonColor = await evaluate(`getComputedStyle(document.querySelector('.login-submit')).backgroundColor`);
    const screenshot = async (name) => {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(path.join(directory, `${name}.png`), Buffer.from(shot.data, 'base64'));
    };
    await screenshot('login-desktop');
    await evaluate(
      `localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'STUDENT'}));history.pushState(null,'','/dashboard');dispatchEvent(new PopStateEvent('popstate'))`
    );
    let workspaceReady = false;
    for (let i = 0; i < 200 && !workspaceReady; i++) {
      workspaceReady = await evaluate(`!!document.querySelector('.app-header')`);
      if (!workspaceReady) await pause(100);
    }
    assert.ok(workspaceReady, 'Workspace renders after lazy CSS load');
    assert.equal(
      await evaluate(`performance.getEntriesByType('resource').some(r=>new URL(r.name).pathname==='/src/styles.css')`),
      true
    );
    await evaluate(`history.pushState(null,'','/login');dispatchEvent(new PopStateEvent('popstate'))`);
    for (let i = 0; i < 100; i++) {
      if (await evaluate(`!!document.querySelector('#student-id')`)) break;
      await pause(100);
    }
    assert.equal(
      await evaluate(`getComputedStyle(document.querySelector('.login-submit')).backgroundColor`),
      buttonColor,
      'Auth styling survives workspace navigation'
    );
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
    await screenshot('login-mobile');
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    assert.deepEqual(errors, []);
    console.log('PASS: workspace CSS loads on demand; login remains styled after navigation at mobile width');
  }
} finally {
  for (const timer of fontTimers) clearTimeout(timer);
  socket?.close();
  browser.kill();
  server.kill();
}
