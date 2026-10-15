import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5198';
const matrixMode = process.env.GRADING_MATRIX === '1';
const directory = path.resolve('.tmp-exam-grading');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9384',
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
      target = (await (await fetch('http://127.0.0.1:9384/json')).json()).find((t) => t.type === 'page');
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
    throw new Error(`Timed out: ${expression}`);
  };
  const go = async (route) => {
    await send('Page.navigate', { url: `${origin}/${route}` });
    await wait(`document.querySelector('header')`);
    await wait(`!document.querySelector('#root [role=status]')`);
    await pause(200);
  };
  const click = async (text) => {
    await evaluate(
      `(()=>{const e=[...document.querySelectorAll('button')].filter(e=>{const c=e.cloneNode(true);c.querySelectorAll('.material-symbols-outlined').forEach(i=>i.remove());return c.textContent.trim()===${JSON.stringify(text)}}).at(-1);if(!e)throw Error('Missing button: '+${JSON.stringify(text)});e.click()})()`
    );
    await pause(150);
  };
  const set = async (selector, value) => {
    await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)}); if(!e)throw Error('Missing field: '+${JSON.stringify(selector)});const p=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`
    );
    await pause(150);
  };
  const pointerClick = async (selector) => {
    const point = await evaluate(
      `(() => {const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`
    );
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
    await pause(150);
  };
  const check = async (label, task) => {
    await task();
    results.push({ label, passed: true });
    console.log('PASS', label);
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
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: (await readFile('scripts/fixtures/lecturer-workspace-api.js', 'utf8')) +
      (matrixMode ? "\nexams[0].matrixId = 'matrix-test';" : ''),
  });

  await go('lecturer_grading.html?classId=c0');
  await wait(
    `Array.from(document.querySelectorAll('button')).some(e=>e.textContent.includes(exams[0].title))`
  );
  await evaluate(
    `Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes(exams[0].title)).click()`
  );
  await wait(`document.querySelector('[role=dialog] tbody tr')`);
  await check('Weighted scores display on scale ten and pending attempts are not scored', async () => {
    const rows = await evaluate(
      `Array.from(document.querySelectorAll('[role=dialog] tbody tr')).map(e=>e.textContent)`
    );
    assert.ok(rows[0].includes('4/10'));
    assert.ok(rows[3].includes('0/10'));
    assert.equal(
      await evaluate(`document.querySelectorAll('[role=dialog] tbody tr')[2].querySelectorAll('button')[1].disabled`),
      true
    );
  });
  await evaluate(`document.querySelector('[role=dialog] tbody tr button').click()`);
  await wait(`document.querySelectorAll('[role=dialog] tbody tr').length>=6`);
  await check('Grader can review saved answers and weighted question results', async () =>
    assert.equal(
      await evaluate(
        `Array.from(document.querySelectorAll('[role=dialog] tbody tr')).some(e=>e.textContent.includes('4 / 4'))`
      ),
      true
    )
  );
  await go('lecturer_grading.html?classId=c0');
  await wait(
    `Array.from(document.querySelectorAll('button')).some(e=>e.textContent.includes(exams[0].title))`
  );
  await evaluate(
    `Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes(exams[0].title)).click()`
  );
  await wait(`document.querySelector('[role=dialog] tbody tr')`);
  await evaluate(`document.querySelector('[role=dialog] tbody tr').querySelectorAll('button')[1].click()`);
  await wait(`document.querySelector('input[name=totalScore]')`);
  await check('Grading explains the saved scoring weights for this exam type', async () => {
    assert.equal(await evaluate(`document.body.innerText.includes(${JSON.stringify(matrixMode ? 'từ ma trận' : 'Đề không có ma trận')})`), true);
  });
  const saveLabel = await evaluate(
    `document.querySelector('input[name=totalScore]').form.querySelector('button[type=submit]').textContent.trim()`
  );
  await check('Manual grading starts with the converted score and enforces 0?10', async () => {
    assert.equal(await evaluate(`document.querySelector('input[name=totalScore]').value`), '4');
    await set('input[name=totalScore]', '11');
    await click(saveLabel);
    assert.equal(await evaluate(`calls.filter(c=>c.path.endsWith('/grade')).length`), 0);
  });
  await set('input[name=totalScore]', '8');
  await click(saveLabel);
  await check('Changing an existing grade requires an explanation', async () =>
    assert.equal(await evaluate(`calls.filter(c=>c.path.endsWith('/grade')).length`), 0)
  );
  await set('textarea[name=feedback]', 'Rechecked the saved answers.');
  await click(saveLabel);
  await wait(`calls.some(c=>c.path.endsWith('/grade'))`);
  await check('Grade eight maps to weighted score four in the real API contract', async () => {
    const call = await evaluate(`calls.find(c=>c.path.endsWith('/grade'))`);
    assert.equal(call.body.totalScore, 4);
    assert.ok(call.body.feedback.includes('8/10'));
  });
  await wait(`!document.querySelector('input[name=totalScore]')`);
  await evaluate(`document.querySelector('[role=dialog] tbody tr').querySelectorAll('button')[1].click()`);
  await wait(`document.querySelector('input[name=totalScore]')`);
  await set('input[name=totalScore]', '0');
  await set('textarea[name=feedback]', 'Correction to zero.');
  await click(saveLabel);
  await wait(`calls.filter(c=>c.path.endsWith('/grade')).length===2`);
  await check('An explicit zero is saved and shown as a graded score', async () =>
    assert.equal(await evaluate(`calls.filter(c=>c.path.endsWith('/grade')).at(-1).body.totalScore`), 0)
  );
  await screenshot('teacher-grading-desktop');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'STUDENT',userId:'stu1',name:'Student'}));
    const oldFetch=window.fetch;
    const own=[{attemptId:'own1',examId:'exam1',status:'GRADED',totalScore:3,questions:gradingQuestions,submittedAt:'2026-10-14T01:00:00Z'},{attemptId:'own2',examId:'exam1',status:'GRADED',totalScore:0,questions:gradingQuestions,submittedAt:'2026-10-14T02:00:00Z'},{attemptId:'own3',examId:'exam1',status:'SUBMITTED',totalScore:null,questions:gradingQuestions,submittedAt:'2026-10-14T03:00:00Z'}];
    own.forEach(attempt => { delete attempt.questions; attempt.totalQuestions = gradingQuestions.length; });
    window.fetch=async(input,options={})=>{
      const u=new URL(typeof input==='string'?input:input.url,location.origin),p=u.pathname;
      let data;
      if(p==='/api/v1/users/me'||p==='/api/v1/users/profile')data={userId:'stu1',role:'STUDENT',fullName:'Student'};
      if(p==='/api/v1/students/me/classes')data=[{classId:'c0',subjectId:'s0',classCode:'VL-0'}];
      if(p==='/api/v1/exams/class/c0')data=[{examId:'exam1',examType:'PRACTICE',title:'Practice'}];
      if(p.includes('my-attempts'))data=own;
      if(p.includes('/own1/questions'))data=gradingQuestions;
      if(data!==undefined)return Response.json({data});
      return oldFetch(input,options);
    };
  `,
  });
  await go('exam_results.html?examId=exam1&attemptId=own1');
  await wait(`document.body.innerText.includes('6/10')`);
  await check('Student result uses the same weighted conversion', async () =>
    assert.equal(await evaluate(`document.body.innerText.includes('6/10')`), true)
  );
  await go('exam_practice_center.html');
  await wait(`document.body.innerText.includes('3.0')`);
  await check('Student average includes graded zero and excludes null pending scores', async () =>
    assert.equal(await evaluate(`document.body.innerText.includes('3.0')`), true)
  );
  assert.deepEqual(errors, []);

  await writeFile(path.join(directory, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`${results.length} exam grading browser scenarios passed.`);
} finally {
  socket?.close();
  browser.kill();
}
