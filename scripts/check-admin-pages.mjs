import assert from 'node:assert/strict';
import { routeFiles } from '../src/lib/routes.js';

// Isolated browser with intercepted API responses; no backend writes.
const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5188';
const targets = await (await fetch('http://127.0.0.1:9339/json')).json();
const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', ({ data }) => {
  const reply = JSON.parse(data);
  if (reply.method === 'Log.entryAdded' && reply.params.entry.level === 'error') console.log('Browser error:', reply.params.entry.text);
  if (reply.method === 'Runtime.exceptionThrown') errors.push(reply.params.exceptionDetails.exception?.description || reply.params.exceptionDetails.text);
  const entry = pending.get(reply.id);
  if (entry) { pending.delete(reply.id); reply.error ? entry.reject(reply.error) : entry.resolve(reply.result); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'ADMIN'}));
    localStorage.setItem('ptit-physics-access-token','isolated-test-token');
    window.testCalls = [];
    window.fetch = async (input, options = {}) => {
      const path = new URL(input, location.origin).pathname;
      window.testCalls.push({path,method:options.method || 'GET',body:typeof options.body === 'string' ? JSON.parse(options.body) : null});
      let data = [];
      if(path === '/api/v1/notifications/summary') data = {unreadCount:0};
      if(path === '/api/v1/users/me') data = {userId:'admin-one',username:'tester',role:JSON.parse(localStorage.getItem('ptit-physics-demo-session')).role};
      if(path === '/api/v1/classes/class-one') data = {classId:'class-one',className:'Lớp Vật lý',subjectId:'subject-one',status:'ACTIVE',maxStudents:50};
      if(path === '/api/v1/users/admin/users') data = {content:[{userId:'user-one',username:'student',email:'test@example.test',role:'STUDENT',status:'ACTIVE'}],totalElements:1};
      if(path === '/api/v1/subjects') data = {content:[{subjectId:'subject-one',subjectName:'Vật lý',subjectCode:'PHY',isActive:true}],totalElements:1};
      if(path === '/api/v1/classes') data = {content:[{classId:'class-one',className:'Lớp Vật lý',subjectId:'subject-one',status:'ACTIVE'}],totalElements:1};
      if(path === '/api/v1/semesters') data = [{semesterId:'semester-one',semesterName:'Học kỳ 1',academicYear:'2026',isCurrent:true}];
      if(path.endsWith('/topics')) data = [{topicId:'topic-one',topicName:'Cơ học',orderIndex:1}];
      if(path === '/api/v1/questions') data = {content:[{questionId:'question-one',subjectId:'subject-one',topicId:'topic-one',content:'Câu hỏi thử nghiệm',questionType:'SINGLE_CHOICE',difficultyLevel:'EASY',approvalStatus:'APPROVED'}],totalElements:1};
      if(path === '/api/v1/exam-matrices') data = [{matrixId:'matrix-one',matrixName:'Ma trận thử nghiệm',subjectId:'subject-one',totalPoints:10,details:[]}];
      if(path === '/api/v1/admin/settings') data = [
        {settingKey:'exam.max_attempts',settingValue:'3'},
        {settingKey:'exam.late_penalty_percent',settingValue:'0'},
        {settingKey:'ai.daily_message_limit',settingValue:'50'},
        {settingKey:'file.max_upload_mb',settingValue:'50'},
        {settingKey:'analytics.cron_expression',settingValue:'0 0 1 * * *'},
        {settingKey:'internal.secret',settingValue:'hidden-technical-value'}
      ];
      if(path === '/api/v1/admin/audit-logs') data = {content:[{auditId:'audit-one',userId:'user-one',entity:'SUBJECT',action:'UPDATE',oldValue:{subjectName:'Vật lý cũ',isActive:false},newValue:{subjectName:'Vật lý mới',isActive:true},createdAt:'2026-10-02T03:00:00Z'}],totalElements:1};
      if(path === '/api/v1/admin/activity-logs') data = {content:[{logId:'log-one',userId:'user-one',actionType:'UPDATE',objectType:'SUBJECT',details:{title:'Vật lý',changes:['subjectName']},createdAt:'2026-10-02T03:00:00Z'}],totalElements:1};
      return Response.json({status:200,data});
    };
  ` });
  for (const route of ['admin_dashboard','admin_users','admin_academics','admin_questions','admin_assessments','admin_operations','admin_analytics']) {
    errors.length = 0;
    await send('Page.navigate', {url:`${origin}/${route}`});
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(`document.querySelector('#root')?.textContent.length > 100`)) break;
      await pause(200);
    }
    await pause(400);
    console.log(route, await evaluate(`document.querySelector('#root')?.textContent.slice(0,120)`), errors);
    if (route === 'admin_users') {
      await evaluate(`document.querySelector('button[aria-label="Thao tác với student"]').click()`);
      await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent.includes('Xóa tài khoản')).click()`);
      await pause(150);
      assert.ok(await evaluate(`!!document.querySelector('[role=alertdialog].form-dialog')`));
      assert.equal(await evaluate(`document.activeElement.textContent.trim()`), 'Hủy');
      assert.equal(await evaluate(`getComputedStyle(document.querySelector('[role=alertdialog]')).borderTopColor`), 'rgb(226, 232, 240)');
      await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape'});
      await pause(100);
      assert.equal(await evaluate(`!!document.querySelector('[role=alertdialog]')`), false);
      console.log('Shared confirmation dialog: neutral border, initial focus and Escape passed.');
    }
    if (await evaluate(`!!document.querySelector('table thead th')`)) {
      const colors = await evaluate(`(() => {
        const table=document.querySelector('table');
        const header=table.querySelector('thead th');
        const first=table.querySelector('tbody tr');
        const clone=first?.cloneNode(true);
        if(clone) first.after(clone);
        const result={border:getComputedStyle(table).borderTopColor,header:getComputedStyle(header).backgroundColor,text:getComputedStyle(header).color,odd:first && getComputedStyle(first).backgroundColor,even:clone && getComputedStyle(clone).backgroundColor};
        clone?.remove();return result;
      })()`);
      assert.equal(colors.border, 'rgb(229, 34, 32)');
      assert.equal(colors.header, 'rgb(196, 30, 26)');
      assert.equal(colors.text, 'rgb(255, 255, 255)');
      if (colors.odd) {
        assert.equal(colors.odd, 'rgb(255, 241, 242)');
        assert.equal(colors.even, 'rgb(255, 255, 255)');
      }
      console.log(`${route}: red table header/border and alternating rows passed.`);
    }
    if (route === 'admin_operations') {
      assert.equal(await evaluate(`document.querySelectorAll('form input[type=number]').length`), 4);
      assert.equal(await evaluate(`document.body.textContent.includes('hidden-technical-value') || document.body.textContent.includes('cron_expression') || document.body.textContent.includes('Tái tạo dashboard')`), false);
      assert.equal(await evaluate(`testCalls.some(c=>c.path === '/api/v1/classes')`), false);
      await evaluate(`(() => { const input=document.querySelector('input[name="exam.late_penalty_percent"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'101');input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
      assert.equal(await evaluate(`document.querySelector('input[name="exam.late_penalty_percent"]').checkValidity()`), false);
      await evaluate(`(() => { const input=document.querySelector('input[name="exam.late_penalty_percent"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'10');input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
      await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Lưu cấu hình').click()`);
      await pause(300);
      const save = await evaluate(`testCalls.find(c=>c.path === '/api/v1/admin/settings/bulk' && c.method==='POST')`);
      assert.deepEqual(save?.body, {settings:{'exam.late_penalty_percent':'10','exam.max_attempts':'3','ai.daily_message_limit':'50','file.max_upload_mb':'50'}});
      console.log('Basic settings: four fields, validation, filtered save payload passed.');
      await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Nhật ký kiểm toán')).click()`);
      await pause(300);
      await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Xem thay đổi').click()`);
      await pause(300);
      assert.ok(await evaluate(`document.querySelector('[role=dialog]')?.textContent.includes('Vật lý mới')`), `Audit change dialog should display object values: ${errors.join('\n')}`);
      await evaluate(`document.querySelector('[role=dialog] button[aria-label="Đóng"]').click()`);
      await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Nhật ký hoạt động')).click()`);
      await pause(300);
      assert.ok(await evaluate(`document.querySelector('tbody')?.textContent.includes('subjectName')`), 'Activity detail objects should render safely');
    }
    const tabs = await evaluate(`[...document.querySelectorAll('[role=tab]')].map(e=>e.textContent)`);
    for (const label of tabs) {
      await evaluate(`[...document.querySelectorAll('[role=tab]')].find(e=>e.textContent===${JSON.stringify(label)}).click()`);
      await pause(250);
      console.log('tab', label, errors);
      if(errors.length) break;
    }
    assert.ok(await evaluate(`document.querySelector('#root')?.textContent.length > 100`), `${route} is blank`);
    assert.deepEqual(errors, [], `${route} runtime errors`);
  }
  await send('Page.addScriptToEvaluateOnNewDocument', {source: `
    const page=location.pathname.split('/').pop();
    const role=page.startsWith('admin_')?'ADMIN':page.startsWith('lecturer_')?'INSTRUCTOR':page.startsWith('ta_')?'TA':'STUDENT';
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role}));
  `});
  for (const file of routeFiles.filter((file) => !file.startsWith('admin_'))) {
    const route = file.replace('.html', '');
    errors.length = 0;
    await send('Page.navigate', {url:`${origin}/${route}${route.includes('detail') || route === 'ta_class_support' ? '?classId=class-one' : ''}`});
    for (let attempt=0;attempt<100;attempt++) {
      if(await evaluate(`document.querySelector('#root')?.textContent.length > 20`)) break;
      await pause(100);
    }
    await pause(150);
    assert.deepEqual(errors, [], `${route} runtime errors`);
    assert.ok(await evaluate(`document.querySelector('#root')?.textContent.length > 20`), `${route} is blank`);
    assert.equal(await evaluate(`document.querySelectorAll('label label').length`), 0, `${route} nested labels`);
  }
  console.log(`${routeFiles.length} routes: no blank screens, runtime exceptions or nested labels with mocked APIs.`);
} finally {
  await send('Browser.close').catch(() => {});
  socket.close();
}
