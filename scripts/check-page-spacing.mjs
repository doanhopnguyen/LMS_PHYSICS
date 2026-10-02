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

  await send('Page.addScriptToEvaluateOnNewDocument', {source: `
    const page=location.pathname.split('/').pop();
    const role=page.startsWith('admin_')?'ADMIN':page.startsWith('lecturer_')?'INSTRUCTOR':page.startsWith('ta_')?'TA':'STUDENT';
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role}));
  `});
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    for (const file of routeFiles) {
      errors.length=0;
      await send('Page.navigate',{url:origin+'/'+file+'?classId=class-one'});
      for(let attempt=0;attempt<70;attempt++) {
        if(await evaluate("document.querySelector('#root')?.textContent.length > 20")) break;
        await pause(100);
      }
      await pause(150);
      const result=await evaluate(`(() => {
        const body=document.querySelector('.page-body');
        if(!body) return null;
        const filter=document.querySelector('.page-academic-filters');
        const toolbar=document.querySelector('.detail-toolbar-shell');
        const header=document.querySelector('.app-header') || toolbar?.firstElementChild;
        const first=filter || body.firstElementChild;
        if(!first || !header) return null;
        const corners=element=>{
          const style=getComputedStyle(element);
          return [style.borderTopLeftRadius,style.borderTopRightRadius,style.borderBottomRightRadius,style.borderBottomLeftRadius];
        };
        const footer=document.querySelector('.app-footer');
        const top=filter ? Math.min(...[...filter.children].map(child=>child.getBoundingClientRect().top)) : first.getBoundingClientRect().top;
        return {gap:top-header.getBoundingClientRect().bottom,
          headerCorners:corners(header),
          footerCorners:footer ? corners(footer) : null,
          footerBackground:footer ? getComputedStyle(footer).backgroundImage : null,
          bodyGap:getComputedStyle(body).paddingTop,
          first:first.tagName+'.'+first.className,
          header:header.className,
          rootMargin:getComputedStyle(body.firstElementChild).marginTop};
      })()`);
      assert.deepEqual(errors,[],file+' runtime error');
      if(result) {
        console.log(width,file,JSON.stringify(result));
        assert.equal(result.bodyGap,'16px',file+' shared padding');
        assert.ok(Math.abs(result.gap-16)<1,width+' '+file+' first component gap: '+result.gap);
        assert.equal(result.rootMargin,'0px',file+' doubled root margin');
        if(result.headerCorners) {
          assert.deepEqual(result.headerCorners.slice(0,2),['0px','0px'],file+' header square top corners');
          assert.ok(result.headerCorners.slice(2).every(radius=>parseFloat(radius)>0),file+' header rounded bottom corners');
        }
        if(result.footerCorners) {
          assert.ok(result.footerCorners.slice(0,2).every(radius=>parseFloat(radius)>0),file+' footer rounded top corners');
          assert.deepEqual(result.footerCorners.slice(2),['0px','0px'],file+' footer square bottom corners');
          assert.ok(!result.footerBackground.includes('gradient'),file+' footer has no dark overlay');
        }
      }
    }
  }
  console.log('All routed page shells have a 16px header-to-content gap at desktop and mobile widths.');
} finally {
  await send('Browser.close').catch(()=>{});
  socket.close();
}
