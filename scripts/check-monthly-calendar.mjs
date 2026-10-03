import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5188';
const targets = await (await fetch('http://127.0.0.1:9339/json')).json();
const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map(),
  errors = [];
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
const pause = () => new Promise((resolve) => setTimeout(resolve, 150));
const click = async (selector) => {
  assert.equal(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`), true, selector);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await pause();
};
const key = async (value) => {
  await evaluate(
    `document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(value)},bubbles:true}))`
  );
  await pause();
};
const change = async (selector, value) => {
  await evaluate(
    `(() => { const input=document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true})); })()`
  );
  await pause();
};
try {
  await send('Runtime.enable');
  await send('Page.navigate', { url: origin + '/login' });
  await pause();
  await evaluate(`(async () => {
    const React=(await import('/node_modules/.vite/deps/react.js')).default;
    const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const {MonthlyCalendar}=await import('/src/components/MonthlyCalendar.jsx');
    const {DashboardCalendar}=await import('/src/components/DashboardCalendar.jsx');
    const host=document.createElement('div'); host.id='monthly-test';document.body.append(host); document.querySelector('#root').style.display='none';
    const today=new Date();window.monthlyRequests=[];window.monthlyFailure=false;
    window.fetch=async(input)=>{
      const url=new URL(input,location.origin);window.monthlyRequests.push(url.pathname+url.search);
      if(url.pathname.includes('/exams/class/') && window.monthlyFailure) throw new Error('Test failure');
      return Response.json({status:200,data:url.pathname.includes('/exams/class/') ? [{examId:'exam-one',title:'API exam',startTime:new Date(today.getFullYear(),today.getMonth(),3,8,15).toISOString(),durationMinutes:45,totalQuestions:10,examType:'QUIZ'}] : {content:[{classId:'class-one',className:'Physics',subjectName:'Mechanics'}]}});
    };
    const events=Array.from({length:5},(_,index)=>({id:'event-'+index,title:index===0?'Thực hành vật lý với tiêu đề rất dài để kiểm tra bố cục của lịch sự kiện':'Sự kiện '+index,date:'2026-10-03',startTime:'0'+(8+index)+':15',endTime:'0'+(9+index)+':00',type:index===0?'EXPERIMENT':'EXAM',location:index===0?'Lab 302':undefined,description:index===0?'Mô tả chi tiết thực hành.':undefined,href:'/course_detail?classId=class-one'}));
    // Use valid 24-hour clock values for every event.
    events.forEach((event,index)=>{event.startTime=String(8+index).padStart(2,'0')+':15';event.endTime=String(9+index).padStart(2,'0')+':00';});
    events.push({id:'outside',title:'Ngoài tháng',date:'2026-09-28',type:'CLASS'});
    function Harness(){
      const [loading,setLoading]=React.useState(false),[list,setList]=React.useState(events),[role,setRole]=React.useState(''),[permitted,setPermitted]=React.useState(false);
      window.monthlyLoading=setLoading;window.monthlyEvents=setList;window.monthlyRole=setRole;window.monthlyPermit=setPermitted;window.editCount=0;window.deleteCount=0;
      return role ? React.createElement(DashboardCalendar,{key:role,role}) : React.createElement(MonthlyCalendar,{events:list,initialMonth:new Date(2026,9,1),loading,canEdit:()=>permitted,canDelete:()=>permitted,onEdit:()=>window.editCount++,onDelete:()=>window.deleteCount++});
    }
    createRoot(host).render(React.createElement(Harness));
  })()`);
  await pause();
  errors.length = 0;
  assert.equal(await evaluate(`document.querySelectorAll('.monthly-day').length`), 35);
  assert.equal(await evaluate(`document.querySelector('.monthly-day').dataset.date`), '2026-09-28');
  assert.ok(
    await evaluate(
      `document.querySelector('.monthly-day[data-outside=true] .monthly-event').textContent.includes('Ngoài tháng')`
    )
  );
  assert.equal(
    await evaluate(`document.querySelectorAll('.monthly-day[data-date="2026-10-03"] .monthly-event').length`),
    2
  );
  assert.ok(await evaluate(`document.querySelector('.monthly-day__more').textContent.includes('+3')`));
  const location = await evaluate('location.href');
  await click('.monthly-day[data-date="2026-10-03"] .monthly-event');
  assert.equal(await evaluate('location.href'), location);
  assert.ok(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Lab 302')`));
  assert.ok(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('08:15')`));
  assert.equal(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Chỉnh sửa')`), false);
  await key('Escape');
  assert.equal(await evaluate(`!!document.querySelector('[role=dialog]')`), false);
  await click('.monthly-day__more');
  assert.equal(await evaluate(`document.querySelectorAll('.monthly-day-list .monthly-event').length`), 5);
  await click('.monthly-day-list .monthly-event:nth-child(3)');
  assert.ok(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Sự kiện 2')`));
  assert.equal(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Địa điểm')`), false);
  await click('[role=dialog] button[aria-label="Đóng"]');
  assert.equal(await evaluate(`document.activeElement.className`), 'monthly-day__more');
  await evaluate('window.monthlyPermit(true)');
  await pause();
  await click('.monthly-day[data-date="2026-10-03"] .monthly-event');
  await evaluate(
    `[...document.querySelectorAll('[role=dialog] button')].find(button=>button.textContent==='Chỉnh sửa').click()`
  );
  assert.equal(await evaluate('window.editCount'), 1);
  await evaluate(
    `[...document.querySelectorAll('[role=dialog] button')].find(button=>button.textContent==='Xóa').click()`
  );
  assert.equal(await evaluate('window.deleteCount'), 1);
  await key('Escape');
  await evaluate('window.monthlyPermit(false)');
  await pause();
  await click('.monthly-calendar__controls button[aria-label="Tháng sau"]');
  assert.ok(await evaluate(`document.querySelector('.monthly-calendar__header p').textContent.includes('11, 2026')`));
  assert.equal(await evaluate(`document.querySelectorAll('.monthly-day').length`), 42);
  assert.ok(
    await evaluate(`document.querySelector('.monthly-calendar__feedback').textContent.includes('chưa có sự kiện')`)
  );
  await evaluate('window.monthlyLoading(true)');
  await pause();
  assert.equal(await evaluate(`document.querySelectorAll('.monthly-day').length`), 42);
  assert.ok(await evaluate(`document.querySelector('.monthly-calendar__feedback').textContent.includes('Đang tải')`));
  await evaluate('window.monthlyLoading(false)');
  await pause();
  await click('.monthly-calendar__controls button[aria-label="Tháng trước"]');
  await mkdir('docs/test-feedback/monthly-calendar-screenshots', { recursive: true });
  for (const width of [1440, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`), false);
    assert.equal(
      await evaluate(
        `new Set([...document.querySelectorAll('.monthly-day')].map(day=>day.getBoundingClientRect().height)).size`
      ),
      1
    );
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(
      'docs/test-feedback/monthly-calendar-screenshots/calendar-' + width + '.png',
      Buffer.from(screenshot.data, 'base64')
    );
    await click('.monthly-day[data-date="2026-10-03"] .monthly-event');
    const fits = await evaluate(
      `(() =>{const r=document.querySelector('[role=dialog]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()`
    );
    assert.equal(fits, true);
    const modal = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(
      'docs/test-feedback/monthly-calendar-screenshots/modal-' + width + '.png',
      Buffer.from(modal.data, 'base64')
    );
    await evaluate(
      `document.querySelector('[role=dialog]').parentElement.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`
    );
    await pause();
    assert.equal(await evaluate(`!!document.querySelector('[role=dialog]')`), false);
  }
  for (const role of ['STUDENT', 'INSTRUCTOR', 'TA', 'ADMIN']) {
    await evaluate(`window.monthlyRequests=[];window.monthlyRole(${JSON.stringify(role)})`);
    await pause();
    await pause();
    assert.ok(await evaluate(`!!document.querySelector('.monthly-event')`));
    const calls = await evaluate('window.monthlyRequests');
    assert.ok(
      calls.includes(
        role === 'STUDENT' ? '/api/v1/students/me/classes?page=0&size=100' : '/api/v1/classes?page=0&size=100'
      )
    );
    assert.ok(calls.includes('/api/v1/exams/class/class-one'));
    await click('.monthly-calendar__controls button[aria-label="Tháng sau"]');
    assert.deepEqual(await evaluate('window.monthlyRequests'), calls);
    await click('.monthly-calendar__controls button[aria-label="Tháng trước"]');
    await evaluate(
      `[...document.querySelectorAll('.monthly-calendar__controls button')].find(button=>button.textContent==='Hôm nay').click()`
    );
    await pause();
    assert.equal(await evaluate(`document.querySelectorAll('.monthly-day[data-today="true"]').length`), 1);
    await click('.monthly-event');
    assert.equal(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Chỉnh sửa')`), false);
    assert.equal(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Xóa')`), false);
    await key('Escape');
  }
  await evaluate(`window.monthlyFailure=true;window.monthlyRole('STUDENT')`);
  await pause();
  await pause();
  assert.ok(await evaluate(`document.querySelector('[role=alert]').textContent.includes('chưa tải được')`));
  await evaluate('window.monthlyFailure=false');
  await click('.monthly-calendar__feedback button');
  await pause();
  assert.ok(await evaluate(`!!document.querySelector('.monthly-event')`));
  assert.deepEqual(errors, []);
  console.log(
    'PASS: month navigation, outside days, overflow dialog, event detail/close/focus/Escape/backdrop, long titles, empty/loading, equal cells, 1440/768/390/320px, permissions, four role API scopes and retry.'
  );
} finally {
  socket.close();
}
