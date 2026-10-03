import { writeFile, mkdir } from 'node:fs/promises';
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

  if (process.env.AUDIT_RICH) {
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `
      const baseMockFetch = window.fetch;
      const classRow = {classId:'class-one',classCode:'PHY101-01',className:'Vật lý đại cương 1',subjectId:'subject-one',subjectName:'Vật lý đại cương 1',status:'ACTIVE',studentCount:35,maxStudents:50};
      const material = {materialId:'material-one',topicId:'topic-one',title:'Định luật Newton và ứng dụng trong chuyển động của chất điểm',materialType:'TEXT',isApproved:true,contentText:'Nội dung học tập minh họa',topicName:'Cơ học',subjectName:'Vật lý đại cương 1'};
      const experiment = {experimentId:'experiment-one',subjectId:'subject-one',title:'Khảo sát chuyển động rơi tự do',description:'Đo độ cao và thời gian rơi để khảo sát gia tốc trọng trường.',sceneAssetsJson:{type:'FREE_FALL_3D'},instructions:'Ghi lại số liệu của ít nhất ba lần đo.'};
      const assignment = {...experiment,assignmentId:'assignment-one',classId:'class-one',classCode:'PHY101-01',experimentTitle:experiment.title};
      const exam = {examId:'exam-one',classId:'class-one',title:'Kiểm tra chương Cơ học',examName:'Kiểm tra chương Cơ học',examType:'MIDTERM',durationMinutes:45,totalQuestions:20,status:'OPEN',startTime:'2026-10-04T01:00:00Z',endTime:'2026-10-04T03:00:00Z'};
      window.fetch = async (input, options={}) => {
        const path=new URL(input,location.origin).pathname;
        let data;
        if(path==='/api/v1/students/me/classes') data=[classRow];
        if(path==='/api/v1/topics/topic-one/materials'||path==='/api/v1/students/me/materials') data=[material];
        if(path==='/api/v1/topics/topic-one/materials/material-one') data=material;
        if(path==='/api/v1/experiments') data=[experiment];
        if(path==='/api/v1/experiments/experiment-one') data=experiment;
        if(path==='/api/v1/students/me/experiment-assignments') data=[assignment];
        if(path==='/api/v1/experiments/assignments/assignment-one') data=assignment;
        if(path==='/api/v1/exams/class/class-one'||path==='/api/v1/exams') data=[exam];
        if(path==='/api/v1/exams/exam-one') data=exam;
        if(path==='/api/v1/students/me/evidence') data=[{evidenceId:'evidence-one',sourceType:'EXPERIMENT',sourceId:'assignment-one',createdAt:'2026-10-03T03:00:00Z'}];
        if(path==='/api/v1/students/me/activity-logs') data=[{logId:'log-one',actionType:'UPDATE',objectType:'EXPERIMENT',createdAt:'2026-10-03T03:00:00Z'}];
        if(path.startsWith('/api/v1/analytics/')) data=[{statId:'stat-one',questionId:'question-one',materialId:'material-one',gapId:'gap-one',topicName:'Cơ học',questionText:'Phân tích lực tác dụng lên vật chuyển động trên mặt phẳng nghiêng có ma sát.',title:material.title,avgScore:7.25,errorRate:0.25,correctRate:0.75,timesUsed:25,viewCount:120,period:'2026-10',qualityLabel:'Tốt',refusalCount:3}];
        if(path==='/api/v1/users/me') data={userId:'user-one',username:'tester',fullName:'Nguyễn Minh An',email:'test@example.test',role:JSON.parse(localStorage.getItem('ptit-physics-demo-session')).role};
        if(data!==undefined) return Response.json({status:200,data});
        return baseMockFetch(input,options);
      };
    `});
  }
  const report = { phase: process.env.AUDIT_PHASE || 'after', pages: [], runtimeErrors: [], layoutIssues: [], snapshots: [] };
  const inspect = () => evaluate(`(() => {
    const root=document.querySelector('#root');
    const visible=e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
    const controls=[...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]),textarea,select')].filter(visible);
    const viewport=document.documentElement.clientWidth;
    const outside=[...document.querySelectorAll('main,.page-academic-filters,.tabs-toolbar,.form-dialog,.lms-card')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.left < -1 || r.right > viewport+1;}).map(e=>({tag:e.tagName,class:e.className}));
    const fields=controls.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {name:e.name||e.id,type:e.type||e.tagName,width:r.width,paddingLeft:parseFloat(s.paddingLeft),paddingRight:parseFloat(s.paddingRight),height:r.height,border:s.borderColor};});
    const tabs=[...document.querySelectorAll('.tabs-list')].filter(visible).map(e=>({height:e.getBoundingClientRect().height,scrollWidth:e.scrollWidth,width:e.clientWidth,lines:new Set([...e.children].map(c=>Math.round(c.getBoundingClientRect().top))).size}));
    const toolbars=[...document.querySelectorAll('.tabs-toolbar')].filter(visible).map(e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}));
    return {title:document.title,rootText:root?.textContent.length||0,outside,fields,tabs,toolbars,tableCount:document.querySelectorAll('table').length,bodyOverflow:document.documentElement.scrollWidth>viewport+1};
  })()`);
  const widths = process.env.AUDIT_WIDTHS ? process.env.AUDIT_WIDTHS.split(',').map(Number) : [1440, 1280, 768, 390];
  const routes = process.env.AUDIT_ROUTES ? routeFiles.filter(file => process.env.AUDIT_ROUTES.split(',').includes(file)) : routeFiles;
  for (const width of widths) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    for (const file of routes) {
      errors.length=0;
      const params='?classId=class-one&subjectId=subject-one&topicId=topic-one'+(process.env.AUDIT_RICH ? '&experimentId=experiment-one&assignmentId=assignment-one' : '');
      await send('Page.navigate',{url:origin+'/'+file+params});
      for(let attempt=0;attempt<70;attempt++) {
        if(await evaluate("document.querySelector('#root')?.textContent.length > 20")) break;
        await pause(100);
      }
      await pause(180);
      const page={file,width,states:[{state:'initial',...await inspect()}]};
      const screenshot = async (suffix) => {
        if (!process.env.AUDIT_SCREENSHOTS || ![1280,390].includes(width)) return;
        await mkdir('docs/test-feedback/ui-polish-screenshots', { recursive: true });
        const path='docs/test-feedback/ui-polish-screenshots/'+file.replace('.html','')+'-'+width+'-'+suffix+'.png';
        const capture=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await writeFile(path,Buffer.from(capture.data,'base64'));
        report.snapshots.push(path);
      };
      await screenshot('page');
      if(width===1280 || width===390) {
        const labels=await evaluate(`[...document.querySelectorAll('.tabs-list')][0] ? [...document.querySelectorAll('.tabs-list')[0].querySelectorAll('[role=tab]')].map(e=>e.textContent) : []`);
        for(const label of labels) {
          await evaluate(`[...document.querySelectorAll('.tabs-list')][0]?.querySelectorAll('[role=tab]') && [...document.querySelectorAll('.tabs-list')[0].querySelectorAll('[role=tab]')].find(e=>e.textContent===${JSON.stringify(label)})?.click()`);
          await pause(120);
          page.states.push({state:label,...await inspect()});
        }
      }
      if(process.env.AUDIT_DIALOGS && [1280,390].includes(width)) {
        const createLabels={'admin_users.html':'Tạo tài khoản','admin_questions.html':'Tạo câu hỏi','admin_academics.html':'Tạo học kỳ','lecturer_materials.html':'Tạo học liệu','lecturer_question_bank.html':'Tạo câu hỏi','lecturer_labs.html':'Tạo thí nghiệm','lecturer_assessments.html':'Tạo đề thi'};
        const label=createLabels[file];
        if(label) {
          // Return to the first tab so create actions match their original context.
          await evaluate("document.querySelector('.tabs-list [role=tab]')?.click()");
          await pause(150);
          let clicked=await evaluate(`(() => { const button=[...document.querySelectorAll('button')].find(e=>e.textContent.includes(${JSON.stringify(label)})&&!e.disabled); if(!button)return false;button.click();return true; })()`);
          if(!clicked) {
            await evaluate(`(() => { const select=document.querySelector('.tabs-actions select,.tabs-filters select'); const option=select && [...select.options].find(option=>option.value&&option.value!=='ALL'); if(option){select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));} })()`);
            await pause(200);
            clicked=await evaluate(`(() => { const button=[...document.querySelectorAll('button')].find(e=>e.textContent.includes(${JSON.stringify(label)})&&!e.disabled); if(!button)return false;button.click();return true; })()`);
          }
          if(clicked) {
            await pause(250);
            page.states.push({state:'dialog:'+label,...await inspect()});
            await screenshot('dialog');
            await evaluate("document.querySelector('[role=dialog] button[aria-label=Đóng]')?.click()");
          }
        }
      }
      if(errors.length) report.runtimeErrors.push({file,width,errors:[...errors]});
      report.pages.push(page);
      for (const state of page.states) {
        const issues = [];
        if (state.outside.length || state.bodyOverflow) issues.push('viewport overflow');
        if (state.fields.some(field => field.paddingLeft < 8 && field.type !== 'file')) issues.push('insufficient input padding');
        if (state.tabs.some(tab => tab.lines > 1)) issues.push('wrapped tabs');
        if (issues.length) report.layoutIssues.push({ file, width, state: state.state, issues });
      }
      const issueCount=report.layoutIssues.filter(issue=>issue.file===file && issue.width===width).length;
      console.log(width,file,'states='+page.states.length,'issues='+issueCount);
    }
  }
  await mkdir('docs/test-feedback',{recursive:true});
  const path='docs/test-feedback/ui-polish-'+report.phase+'.json';
  await writeFile(path,JSON.stringify(report,null,2));
  console.log('Saved',path,'pages='+report.pages.length,'runtimeErrors='+report.runtimeErrors.length);
  if(report.runtimeErrors.length || (report.phase !== 'before' && report.layoutIssues.length)) process.exitCode=1;
} finally { socket.close(); }
