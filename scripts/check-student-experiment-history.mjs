import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// Intercepted student API responses; never writes to the backend.
const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5188';
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
  const entry = pending.get(reply.id);
  if (entry) {
    pending.delete(reply.id);
    reply.error ? entry.reject(reply.error) : entry.resolve(reply.result);
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
  for (let i = 0; i < 100; i++) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out: ' + expression);
};
const section = `document.querySelector('section[aria-label="Lịch sử báo cáo và điểm"]')`;
const popup = `document.querySelector('[role=dialog]')`;
const click = (text) =>
  evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes(${JSON.stringify(text)})).click()`);
try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'STUDENT'}));
    localStorage.setItem('ptit-physics-access-token','isolated-test-token');
    window.testCalls=[];window.failHistory=false;window.emptyHistory=false;window.failScore=true;window.justSubmitted=false;
    const realFetch=window.fetch.bind(window);
    window.fetch=async(input,options={})=>{
      const path=new URL(input,location.origin).pathname;
      if(!path.startsWith('/api/'))return realFetch(input,options);
      testCalls.push({path,method:options.method||'GET'});
      let data=[];
      const assignments=[{assignmentId:'a1',experimentId:'e1',experimentTitle:'Đo gia tốc',classId:'c1',classCode:'PHY-01',submissionId:justSubmitted?'new':'pending'},
        {assignmentId:'a2',experimentId:'e2',experimentTitle:'Con lắc',classId:'c2',classCode:'PHY-02',submissionId:'zero'}];
      if(path==='/api/v1/users/me')data={userId:'student-one',role:'STUDENT'};
      if(path==='/api/v1/notifications/summary')data={unreadCount:0};
      if(path==='/api/v1/students/me/experiment-assignments'){
        data=emptyHistory?[]:assignments;
      }
      if(path==='/api/v1/experiments/submissions'){
        if(failHistory)return Response.json({message:'Không tải được bài nộp'},{status:500});
        const assignmentId=new URL(input,location.origin).searchParams.get('assignmentId');
        data=emptyHistory?[]:[{submissionId:justSubmitted?'new':'pending',assignmentId:'a1'}, {submissionId:'old',assignmentId:'a1'}, {submissionId:'zero',assignmentId:'a2'}];
        if(assignmentId)data=data.filter(row=>row.assignmentId===assignmentId);
      }
      if(path==='/api/v1/students/me/evidence')data=emptyHistory?[]:[{evidenceId:'ev1',sourceType:'EXPERIMENT',sourceId:'old',createdAt:'2026-10-01T03:00:00Z'}];
      if(path==='/api/v1/experiments/e1')data={experimentId:'e1',title:'Đo gia tốc',instructions:'Hướng dẫn lớp',description:'Bài tùy chỉnh'};
      if(path==='/api/v1/experiments/assignments/a1/submit'){
        justSubmitted=true;data={submissionId:'new',assignmentId:'a1',submittedAt:'2026-10-03T05:00:00Z'};
      }
      const match=path.match(/^\\/api\\/v1\\/experiments\\/submissions\\/([^/]+)(\\/rubric-summary)?$/);
      if(match){
        const id=match[1],confirmed=id==='zero',pending=id==='pending'||id==='new';
        data={submissionId:id,assignmentId:confirmed?'a2':'a1',experimentTitle:confirmed?'Con lắc':'Đo gia tốc',classCode:confirmed?'PHY-02':'PHY-01',status:confirmed?'CONFIRMED':pending?'PENDING':'GRADED',submittedAt:id==='new'?'2026-10-03T05:00:00Z':pending?'2026-10-03T03:00:00Z':'2026-10-01T03:00:00Z',rawDataJson:{notes:'Dữ liệu bài đã nộp'},totalScore:confirmed||pending?0:3,totalMaxScore:10,rubrics:[{rubricId:'r1',criteriaName:'Số liệu đo',maxScore:10,isGraded:!pending,score:pending?null:confirmed?0:3,comment:pending?'':'Kiểm tra lại sai số'}]};
        if(match[2]&&id==='old'&&failScore)return Response.json({message:'Không tải được điểm thử nghiệm'},{status:500});
      }
      return Response.json({status:200,data});
    };
  `,
  });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin + '/student_evidence.html' });
  await waitFor(`${section}?.querySelectorAll('tbody tr').length===3`);
  assert.ok(await evaluate(`${section}.querySelector('tbody tr').textContent.includes('Chờ chấm')`));
  assert.ok(
    await evaluate(
      `[...${section}.querySelectorAll('tbody tr')].some(e=>e.textContent.includes('0 / 10')&&e.textContent.includes('Đã chốt điểm'))`
    )
  );
  await click('Xem báo cáo & điểm');
  await waitFor(`${popup}?.textContent.includes('Chưa có điểm')`);
  assert.equal(
    await evaluate(`${section}.textContent.includes('Chưa có điểm')`),
    false,
    'detail is a popup, not inline content'
  );
  assert.equal(await evaluate(`!!document.querySelector('input[name=score]')`), false);
  await click('Xem số liệu');
  await waitFor(
    `document.querySelectorAll('[role=dialog]').length===2&&[...document.querySelectorAll('[role=dialog]')].at(-1).textContent.includes('Dữ liệu bài đã nộp')`
  );
  await evaluate(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
  await waitFor(`document.querySelectorAll('[role=dialog]').length===1`);
  assert.ok(await evaluate(`${popup}.textContent.includes('Chưa có điểm')`), 'Escape closes only the child popup');
  assert.ok(await evaluate(`document.activeElement.textContent.includes('Xem số liệu')`), 'child close returns focus');
  await click('Đóng chi tiết');
  await waitFor(`!${popup}`);
  await evaluate(
    `[...${section}.querySelectorAll('tbody tr')].find(e=>e.textContent.includes('Chưa tải được điểm')).querySelector('button').click()`
  );
  await waitFor(`${popup}?.textContent.includes('Không tải được điểm thử nghiệm')`);
  assert.ok(
    await evaluate(`${popup}.textContent.includes('Xem số liệu')`),
    'a score failure must preserve the report preview'
  );
  await evaluate('window.failScore=false');
  await click('Thử lại');
  await waitFor(`${popup}?.textContent.includes('3 / 10 điểm')`);
  assert.ok(await evaluate(`${popup}.textContent.includes('Kiểm tra lại sai số')`));
  await click('Đóng chi tiết');
  // The shared picker filters reports; use its native select for a realistic change event.
  await evaluate(
    `(()=>{const e=${section}.querySelector('select');e.value='a2';e.dispatchEvent(new Event('change',{bubbles:true}));})()`
  );
  await waitFor(`${section}.querySelectorAll('tbody tr').length===1`);
  assert.ok(await evaluate(`${section}.querySelector('tbody').textContent.includes('Con lắc')`));
  for (const width of [390, 768, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width < 500,
    });
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'), 'page overflow at ' + width);
    await evaluate(`${section}.querySelector('tbody button').focus()`);
    await click('Xem báo cáo & điểm');
    await waitFor(`!!${popup}`);
    assert.ok(await evaluate(`${popup}.getBoundingClientRect().width <= innerWidth`), 'popup width at ' + width);
    await evaluate(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
    await waitFor(`!${popup}`);
    assert.ok(
      await evaluate(`document.activeElement.textContent.includes('Xem báo cáo & điểm')`),
      'detail close returns focus to row'
    );
  }
  await evaluate('window.failHistory=true');
  await click('Tải lại lịch sử');
  await waitFor(`${section}.textContent.includes('Không tải được bài nộp')`);
  await evaluate('window.failHistory=false;window.emptyHistory=true');
  await click('Tải lại lịch sử');
  await waitFor(`${section}.textContent.includes('Chưa có báo cáo nào')`);
  await send('Page.navigate', { url: origin + '/lab_report_rubric.html?experimentId=e1&assignmentId=a1&classId=c1' });
  await waitFor(`document.querySelector('textarea')&&${section}?.querySelectorAll('tbody tr').length===2`);
  assert.ok(
    await evaluate(`${section}.textContent.includes('Đo gia tốc')&&!${section}.textContent.includes('Con lắc')`)
  );
  await evaluate(
    `(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Số liệu thực hành');e.dispatchEvent(new Event('input',{bubbles:true}));})()`
  );
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await waitFor(`${section}?.querySelector('tbody tr')?.textContent.includes('12:00:00')`);
  assert.ok(await evaluate(`testCalls.some(c=>c.path==='/api/v1/experiments/submissions/new')`));
  assert.equal(
    await evaluate(
      `testCalls.some(c=>c.method!=='GET'&&(c.path.endsWith('/scores')||c.path.endsWith('/confirmation')))`
    ),
    false
  );
  await mkdir('.tmp-student-history-results', { recursive: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: true });
  await evaluate(`${section}.scrollIntoView()`);
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile('.tmp-student-history-results/mobile.png', Buffer.from(screenshot.data, 'base64'));
  assert.deepEqual(errors, []);
  console.log(
    'Student history: pending, confirmed zero, rubric comments, preview popup, retry, filter, empty, assignment scope, submission refresh and 3 widths passed.'
  );
} finally {
  socket.close();
}
