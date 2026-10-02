import assert from 'node:assert/strict';

// Browser integration with intercepted API responses: never writes to the backend.
const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5188';
const debugging = process.env.UI_DEBUG || 'http://127.0.0.1:9339';
const pages = await (await fetch(`${debugging}/json`)).json();
const socket = new WebSocket(pages.find((page) => page.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const reply = JSON.parse(data);
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
async function until(expression) {
  for (let count = 0; count < 80; count++) { if (await evaluate(expression)) return; await pause(100); }
  throw new Error(`Timed out: ${expression}`);
}
const clickText = (label) => evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim().endsWith(${JSON.stringify(label)})).click()`);
try {
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.testCalls = [];
    window.testRead = false;
    window.testFailSearch = false;
    const note = () => ({notificationId:'note-one',title:'Thông báo từ API',content:'Nội dung từ backend',isRead:window.testRead,createdAt:'2026-10-02T03:00:00Z'});
    window.fetch = async (input, options={}) => {
      const url = new URL(input, location.origin);
      const method = options.method || 'GET';
      window.testCalls.push({path:url.pathname,query:url.search,method,body:typeof options.body==='string'?JSON.parse(options.body):null,auth:options.headers?.Authorization});
      let data = [];
      if (url.pathname === '/api/v1/users/me') data = {userId:'user-one',username:'tester',role:JSON.parse(localStorage.getItem('ptit-physics-demo-session') || '{}').role || 'STUDENT'};
      if (url.pathname === '/api/v1/notifications') data = {content:[note()],totalElements:1};
      if (url.pathname === '/api/v1/notifications/summary') data = {unreadCount:window.testRead?0:1,latestNotifications:[note()]};
      if (url.pathname === '/api/v1/notifications/note-one/read' || url.pathname === '/api/v1/notifications/read-all') {window.testRead=true;data=null;}
      if (url.pathname === '/api/v1/classes') data = {content:[{classId:'class-one',classCode:'PHY-01',className:'Lớp Vật lý',subjectId:'subject-one',status:'ACTIVE'}],totalPages:1};
      if (url.pathname === '/api/v1/classes/class-one') data = {classId:'class-one',className:'Lớp Vật lý',classCode:'PHY-01',subjectId:'subject-one',status:'ACTIVE'};
      if (url.pathname === '/api/v1/students/search') {
        if(window.testFailSearch) return Response.json({message:'Không tìm thấy sinh viên.'},{status:404});
        data={userId:'student-one',role:'STUDENT',username:'sv001',studentCode:'SV001',fullName:'Sinh viên API',email:'sv001@example.test',enrolledClasses:[]};
      }
      return Response.json({status:200,data});
    };
  ` });
  await send('Page.navigate', { url: origin });
  await until(`document.querySelector('#root')?.children.length > 0`);
  for (const [role, route] of [['STUDENT', 'dashboard'], ['INSTRUCTOR', 'lecturer_dashboard'], ['TA', 'ta_dashboard'], ['ADMIN', 'admin_dashboard'], ['STUDENT', 'ai_tutor'], ['STUDENT', 'document_viewer']]) {
    await evaluate(`localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:${JSON.stringify(role)}})); localStorage.setItem('ptit-physics-access-token','ui-test-token');`);
    await send('Page.navigate', { url: `${origin}/${route}` });
    await until(`document.querySelector('.notification-count')?.textContent === '1'`);
    assert.ok(await evaluate(`testCalls.some(c=>c.path==='/api/v1/notifications/summary' && c.auth==='Bearer ui-test-token')`));
    await evaluate(`document.querySelector('.notification-bell').click()`);
    await until(`document.querySelector('.notification-title')?.textContent === 'Thông báo từ API'`);
    assert.equal(await evaluate(`document.querySelector('.notification-content').textContent`), 'Nội dung từ backend');
    await evaluate(`document.querySelector('.notification-row > button:first-child').click()`);
    await until(`document.querySelector('article.notification-detail')?.textContent.includes('Nội dung từ backend')`);
    await until(`document.querySelector('article.notification-detail')?.textContent.includes('Đã đọc') && !document.querySelector('.notification-count')`);
    assert.ok(await evaluate(`location.pathname==='/notification_detail' && new URLSearchParams(location.search).get('notificationId')==='note-one'`));
    assert.ok(await evaluate(`testCalls.some(c=>c.path==='/api/v1/notifications/note-one/read'&&c.method==='PUT')`));
    assert.equal(await evaluate(`!!document.querySelector('.notification-panel')`),false);
    assert.equal(await evaluate(`testCalls.some(c=>c.path==='/api/v1/notifications/note-one'&&c.method==='GET')`),false);
    await send('Page.navigate',{url:`${origin}/${route}`});
    await until(`document.querySelector('.notification-count')?.textContent === '1'`);
    await evaluate(`document.querySelector('.notification-bell').click()`);
    await until(`!!document.querySelector('.notification-title')`);
    await clickText('Đọc tất cả');
    await until(`!document.querySelector('.notification-count')`);
    assert.ok(await evaluate(`testCalls.some(c=>c.path==='/api/v1/notifications/read-all' && c.method==='PUT')`));
    console.log(`${role} /${route}: authenticated API notifications, content and mark-all-read passed.`);
  }
  await evaluate(`localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'INSTRUCTOR'}))`);
  await send('Page.navigate', { url: `${origin}/lecturer_course_detail?classId=class-one` });
  await until(`document.querySelector('[role=tab]') !== null`);
  await clickText('Sinh viên');
  await until(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim().endsWith('Thêm sinh viên'))`);
  assert.equal(await evaluate(`document.body.textContent.includes('Nhập sinh viên Excel')`), false);
  await clickText('Thêm sinh viên');
  await until(`document.querySelector('input[placeholder="Nhập thông tin sinh viên"]') !== null`);
  await evaluate(`(() => {const e=document.querySelector('input[placeholder="Nhập thông tin sinh viên"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'SV001');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await clickText('Tìm kiếm');
  await until(`document.querySelector('[role=dialog] table')?.textContent.includes('Sinh viên API')`);
  assert.ok(await evaluate(`testCalls.some(c=>c.path==='/api/v1/students/search' && c.query==='?keyword=SV001' && c.auth==='Bearer ui-test-token')`));
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Thêm vào lớp').disabled`), true);
  await evaluate(`document.querySelector('[role=dialog] input[type=radio]').click()`);
  await clickText('Thêm vào lớp');
  await until(`!document.querySelector('[role=dialog]')`);
  assert.ok(await evaluate(`testCalls.some(c=>c.path==='/api/v1/classes/class-one/enroll-single' && c.method==='POST' && c.body.studentId==='student-one')`));
  await clickText('Thêm sinh viên');
  await evaluate(`window.testFailSearch=true;const e=document.querySelector('input[placeholder="Nhập thông tin sinh viên"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'unknown');e.dispatchEvent(new Event('input',{bubbles:true}));`);
  await clickText('Tìm kiếm');
  await until(`document.querySelector('[role=dialog] [role=alert]')?.textContent.includes('Không tìm thấy sinh viên.')`);
  assert.equal(await evaluate(`!!document.querySelector('[role=dialog] table')`), false);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Thêm vào lớp').disabled`), true);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth`), false);
  console.log('Class student search: real API contract, result table, selection, enrollment payload, error state and mobile width passed.');
} finally {
  await send('Browser.close').catch(() => {});
  socket.close();
}
