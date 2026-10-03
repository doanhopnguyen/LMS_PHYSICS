import assert from 'node:assert/strict';
import { buildExperimentSubmission } from '../src/lib/experimentSubmission.js';

// Uses an isolated Chrome CDP session; all file/API requests are mocked.
const targets = await (await fetch('http://127.0.0.1:9339/json')).json();
const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', ({ data }) => {
  const reply = JSON.parse(data);
  if (reply.method === 'Runtime.exceptionThrown')
    errors.push(reply.params.exceptionDetails.exception?.description || reply.params.exceptionDetails.text);
  const job = pending.get(reply.id);
  if (job) {
    pending.delete(reply.id);
    reply.error ? job.reject(reply.error) : job.resolve(reply.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const waitFor = async (expression) => {
  for (let index = 0; index < 100; index += 1) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${expression}`);
};
const openPopup = async (label) => {
  await waitFor('!!document.querySelector("#evidence-test button")');
  await evaluate(
    `[...document.querySelectorAll('#evidence-test button')].find(button => button.textContent.includes(${JSON.stringify(label)})).click()`
  );
  await waitFor('!!document.querySelector("[role=dialog]")');
};
const closePopup = async () => {
  await evaluate('document.querySelector("[role=dialog] button[aria-label=Đóng]").click()');
  await waitFor('!document.querySelector("[role=dialog]")');
};
try {
  await send('Runtime.enable');
  await send('Page.navigate', { url: (process.env.UI_ORIGIN || 'http://127.0.0.1:5188') + '/' });
  await waitFor('document.querySelector("#root")?.childElementCount > 0');
  errors.length = 0;
  const form = await buildExperimentSubmission({
    report: { measurements: [{ heightM: 0.5 }], notes: 'Nhận xét tiếng Việt' },
    file: new File(['trial,time\n1,0.32'], 'Minh chứng.csv'),
  });
  const base64 = Buffer.from(await form.get('file').arrayBuffer()).toString('base64');
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { SubmissionEvidence } = await import('/src/components/SubmissionEvidence.jsx');
    document.querySelector('#root').style.display = 'none';
    const host = document.createElement('div'); host.id = 'evidence-test'; document.body.append(host);
    window.previewRoot = createRoot(host);
    window.mockName = 'bao-cao.zip'; window.mockMime = 'application/zip';
    window.mockBytes = Uint8Array.from(atob(${JSON.stringify(base64)}), c => c.charCodeAt(0));
    window.failFile = false;
    window.fileReads = 0;
    const originalFetch = window.fetch;
    window.fetch = async (input, options) => {
      const url = new URL(input, location.origin);
      if (url.pathname === '/api/v1/files/mock/download-url') return Response.json({data:{downloadUrl:location.origin+'/mock-file',fileName:window.mockName}});
      if (url.pathname === '/mock-file') { window.fileReads += 1; return window.failFile ? new Response('',{status:503}) : new Response(window.mockBytes,{headers:{'Content-Type':window.mockMime}}); }
      return originalFetch(input, options);
    };
    window.renderPreview = (key) => previewRoot.render(React.createElement(SubmissionEvidence,{key,submission:{fileId:'mock'}}));
    renderPreview('zip');
  })()`);
  await waitFor('!!document.querySelector("#evidence-test button")');
  assert.equal(await evaluate('window.fileReads'), 0, 'files are fetched only after clicking');
  assert.equal(await evaluate('!!document.querySelector("[role=dialog]")'), false);
  await openPopup('Xem số liệu');
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("Nhận xét tiếng Việt")');
  assert.equal(await evaluate('document.querySelectorAll("[role=dialog] table").length'), 1);
  assert.equal(await evaluate('document.querySelectorAll("[role=dialog] pre").length'), 0);
  assert.ok(await evaluate('document.querySelector("[role=dialog] th").textContent.includes("Độ cao")'));
  await closePopup();
  assert.equal(await evaluate('document.activeElement.textContent.includes("Xem số liệu")'), true);
  await openPopup('Xem minh chứng');
  await waitFor('document.querySelector("[role=dialog] pre")?.textContent.includes("trial,time")');
  assert.ok(await evaluate('[...document.querySelectorAll("a[download]")].every(a=>a.href.startsWith("blob:"))'));
  assert.ok(await evaluate('document.body.textContent.includes("minh-chung/Minh chứng.csv")'));
  await closePopup();
  await evaluate(
    'window.mockName="so-lieu.json";window.mockMime="application/json";window.mockBytes=JSON.stringify({timeS:0.32});renderPreview("json")'
  );
  await openPopup('Xem số liệu');
  await waitFor('document.querySelector("[role=dialog] dd")?.textContent.includes("0.32")');
  await closePopup();
  await evaluate(
    'window.mockName="report.pdf";window.mockMime="application/pdf";window.mockBytes="%PDF-1.4";renderPreview("pdf")'
  );
  await openPopup('Xem minh chứng');
  await waitFor('document.querySelector("iframe")?.src.startsWith("blob:")');
  await closePopup();
  await evaluate(
    'window.mockName="image.png";window.mockMime="image/png";window.mockBytes=Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/J8AAAAASUVORK5CYII="),c=>c.charCodeAt(0));renderPreview("image")'
  );
  await openPopup('Xem minh chứng');
  await waitFor('document.querySelector("[role=dialog] img")?.naturalWidth===1');
  await closePopup();
  await evaluate('window.failFile=true;renderPreview("failure")');
  await openPopup('Xem minh chứng');
  await waitFor('!!document.querySelector("[role=dialog] [role=alert]")');
  assert.ok(await evaluate('document.querySelector("[role=dialog] [role=alert]").textContent.includes("503")'));
  assert.ok(await evaluate('[...document.querySelectorAll("a")].some(a=>a.textContent==="Mở tệp gốc")'));
  await evaluate(
    'window.failFile=false;[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent.includes("Thử lại")).click()'
  );
  await waitFor('document.querySelector("[role=dialog] img")?.naturalWidth===1');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.ok(await evaluate('document.querySelector("[role=dialog]").getBoundingClientRect().width <= 390'));
  await evaluate(
    'document.querySelector("[role=dialog] button[aria-label=Đóng]").focus(); document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))'
  );
  await waitFor('!document.querySelector("[role=dialog]")');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: click-only loading, formatted JSON boxes/table, separate evidence popup, PDF/image, downloads, retry, close/focus/Escape and mobile width; no JavaScript errors.'
  );
} finally {
  socket.close();
}
