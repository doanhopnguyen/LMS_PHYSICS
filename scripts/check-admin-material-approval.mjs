import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5198';
const directory = path.resolve('.tmp-admin-material-approval');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9383',
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
      target = (await (await fetch('http://127.0.0.1:9383/json')).json()).find((t) => t.type === 'page');
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
    for (let i = 0; i < 100; i++) {
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
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: String.raw`
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'ADMIN'}));localStorage.setItem('ptit-physics-access-token','isolated-test');
    window.calls=[];window.failEnrollment=false;window.failSubjects=false;window.failCurriculum=false;
    const subjects=Array.from({length:24},(_,i)=>({subjectId:'s'+i,subjectCode:'PHY'+i,subjectName:'Vật lý '+i,isActive:i!==23}));
    const semesters=[{semesterId:'sem1',semesterCode:'2026-1',semesterName:'Học kỳ 1',academicYear:'2026–2027',isCurrent:true}];
    const classes=Array.from({length:13},(_,i)=>({classId:'c'+i,classCode:'VL-'+i,subjectId:'s'+(i%2),semesterId:'sem1',maxStudents:50,instructorId:'teacher1',status:'ACTIVE'}));
    const enrolled=[{enrollmentId:'e1',studentId:'stu1',fullName:'Sinh viên Một',username:'sv1',studentCode:'SV001',status:'ACTIVE'}];
    const clos=[{cloId:'clo1',subjectId:'s0',cloCode:'CLO1',description:'Vận dụng định luật cơ học',orderIndex:1,isActive:true,questionCount:4},{cloId:'clo2',subjectId:'s0',cloCode:'CLO2',description:'Phân tích hiện tượng vật lý',orderIndex:2,isActive:true,questionCount:0},{cloId:'clo3',subjectId:'s0',cloCode:'CLO3',description:'Chuẩn đầu ra cũ',orderIndex:3,isActive:false,questionCount:1},{cloId:'foreign',subjectId:'s1',cloCode:'CLO11',description:'CLO môn khác',orderIndex:1,isActive:true,questionCount:0}];
    const questions=Array.from({length:26},(_,i)=>({questionId:'q'+i,subjectId:'s0',topicId:'t1',questionType:'MCQ_SINGLE',content:'Câu hỏi '+i,mediaUrl:'',difficultyLevel:'EASY',cognitiveLevel:'',approvalStatus:'DRAFT',cloIds:i%2===0||i===25?['clo1']:[],options:[{content:'Đúng',isCorrect:true,explanation:''},{content:'Sai',isCorrect:false,explanation:''}]}));
    if(location.pathname.includes('admin_materials')){for(let i=26;i<=105;i++)questions.push({...questions[0],questionId:'q'+i,content:'Câu hỏi '+i,approvalStatus:'DRAFT'});for(const id of ['q22','q24','q25','q105'])questions.find(q=>q.questionId===id).approvalStatus='PENDING';}
    window.qaQuestions=questions;
    const reviewMaterials=[{materialId:'m1',topicId:'t1',title:'Bài đọc',type:'TEXT',contentText:'Nội dung học liệu',scope:'SHARED',approvalStatus:'PENDING'},{materialId:'m2',topicId:'t1',title:'PDF đã duyệt',type:'PDF',scope:'SHARED',approvalStatus:'APPROVED'}];
    const savedMaterials = new Map();
    window.fetch=async(input,options={})=>{
      const url=new URL(input,location.origin),p=url.pathname,m=options.method||'GET';
      const body=options.body instanceof FormData?Object.fromEntries(options.body):typeof options.body==='string'?JSON.parse(options.body):null;
      calls.push({path:p,query:Object.fromEntries(url.searchParams),method:m,body});
      if((window.failReview||window.failImportApproval&&p.includes('/import-q2/'))&&m==='PUT'&&(p.endsWith('/approve')||p.endsWith('/reject')))return Response.json({message:'Không thể duyệt nội dung lúc này'},{status:500});
      if(window.failQuestions&&m==='GET'&&p==='/api/v1/questions')return Response.json({message:'Không thể tải hàng chờ'},{status:500});
      if(window.failSubmission&&m==='PUT'&&p.endsWith('/submit-review'))return Response.json({message:'Chưa gửi duyệt được, thử lại'},{status:500});
      if((window.failEnrollment&&p.endsWith('/enroll-bulk'))||(window.failSubjects&&p==='/api/v1/subjects'))return Response.json({message:'Lỗi thử nghiệm'},{status:500});
      if(window.failCurriculum&&p.endsWith('/materials')&&m==='GET')return Response.json({message:'Không thể tải học liệu'},{status:500});
      if(window.failClos&&p.includes('/clos')&&m==='GET')return Response.json({message:'Không tải được CLO'},{status:500});
      if(p.startsWith('/api/v1/clos/')&&m==='DELETE'&&clos.find(c=>c.cloId===p.split('/').pop())?.questionCount>0)return Response.json({message:'Không thể xóa CLO đang được liên kết với câu hỏi'},{status:409});
      const paged=rows=>{const size=Number(url.searchParams.get('size')||20),page=Number(url.searchParams.get('page')||0);return {content:rows.slice(page*size,(page+1)*size),totalElements:rows.length,totalPages:Math.ceil(rows.length/size),last:(page+1)*size>=rows.length}};
      let data=[];
      if(p==='/api/v1/users/me')data={userId:'admin1',role:'ADMIN',username:'admin'};
      if(p==='/api/v1/notifications/summary')data={unreadCount:0};
      if(p==='/api/v1/semesters')data=m==='POST'?{...body,semesterId:'sem2'}:semesters;
      if(p==='/api/v1/semesters/sem1')data=semesters[0];
      if(p==='/api/v1/subjects')data=m==='POST'?{...body,subjectId:'new-subject'}:paged(subjects);
      if(p.startsWith('/api/v1/subjects/s')&&p.split('/').length===5)data=subjects.find(s=>s.subjectId===p.split('/').pop());
      if(p.endsWith('/toggle-status')){const s=subjects.find(s=>s.subjectId===p.split('/').at(-2));s.isActive=!s.isActive;data=s;}
      if(p==='/api/v1/classes')data=m==='POST'?{...body,classId:'created-class'}:paged(classes.filter(c=>(!url.searchParams.get('subjectId')||c.subjectId===url.searchParams.get('subjectId'))&&(!url.searchParams.get('semesterId')||c.semesterId===url.searchParams.get('semesterId'))));
      if(p.startsWith('/api/v1/classes/')&&p.split('/').length===5)data=classes[0];
      if(p==='/api/v1/users/admin/users')data=paged([{userId:'admin1',username:'admin',role:'ADMIN',status:'ACTIVE'},{userId:'teacher1',username:'gv1',fullName:'Giảng viên Một',role:'INSTRUCTOR',status:'ACTIVE'},{userId:'locked-teacher',username:'locked',role:'INSTRUCTOR',status:'LOCKED'},{userId:'stu1',username:'sv1',role:'STUDENT',status:'ACTIVE'}]);
      if(p.endsWith('/staff'))data=[{userId:'teacher1',fullName:'Giảng viên Một',roleInClass:'INSTRUCTOR'}];
      if(p.endsWith('/students'))data=paged(enrolled.filter(s=>!url.searchParams.get('status')||s.status===url.searchParams.get('status')));
      if(p.endsWith('/students/stu1')&&m==='DELETE')enrolled.length=0;
      if(p==='/api/v1/students/search')data={userId:'stu1',fullName:'Sinh viên Một',username:'sv1',role:'STUDENT'};
      if(p.endsWith('/chapters'))data=m==='POST'?body:[{chapterId:'ch1',chapterCode:'C1',chapterName:'Chương Cơ học',isActive:true},...(window.tallTree?Array.from({length:20},(_,i)=>({chapterId:'extra'+i,chapterName:'Chương mở rộng '+(i+2),isActive:true})):[])];
      if(p.endsWith('/topics')||p.endsWith('/topics/unassigned'))data=m==='POST'?body:[{topicId:'t1',topicName:'Động lực học',chapterId:'ch1'},{topicId:'t2',topicName:'Chủ đề độc lập',chapterId:null}];
      if(p.endsWith('/materials'))data=m==='POST'?body:p.includes('/t2/')?[]:[{materialId:'m1',topicId:'t1',title:'Bài đọc',type:'TEXT',contentText:'Nội dung học liệu',scope:'SHARED',updatedAt:'2026-10-14T08:00:00Z'},{materialId:'m2',topicId:'t1',title:'PDF bài giảng',type:'PDF',scope:'SHARED',updatedAt:'2026-10-13T08:00:00Z'},{materialId:'m3',topicId:'t1',title:'Video bài giảng',type:'VIDEO',scope:'SHARED',contentText:'Hướng dẫn động lực học',updatedAt:'2026-10-12T08:00:00Z'}];
      if(p.endsWith('/materials/m1'))data={materialId:'m1',topicId:'t1',title:'Bài đọc',type:'TEXT',contentText:'Nội dung học liệu'};
      if(location.pathname.includes('admin_materials')){
        if(p.endsWith('/topics')&&p.includes('/subjects/')&&!p.includes('/s0/'))data=[];
        if(p.endsWith('/materials'))data=p.includes('/t2/')?[]:reviewMaterials;
        if(p.endsWith('/materials/m1'))data=reviewMaterials[0];
        if(p.endsWith('/materials/m1/approve')){reviewMaterials[0].approvalStatus='APPROVED';data=reviewMaterials[0];}
      }
      if(p.endsWith('/materials')&&m==='POST') {data={...body,materialId:'created-m'+savedMaterials.size,topicId:p.split('/')[4],approvalStatus:'PENDING'};savedMaterials.set(data.materialId,data);}
      if(m==='PUT'&&/^\/api\/v1\/topics\/[^/]+\/materials\/[^/]+$/.test(p)) {data={...body,materialId:p.split('/')[6],topicId:p.split('/')[4],approvalStatus:'PENDING'};savedMaterials.set(data.materialId,data);}
      if(p.includes('/materials/')&&p.endsWith('/approve')) {
        if(window.failAutoMaterialApproval)return Response.json({message:'Temporary approval failure'},{status:500});
        const id=p.split('/')[6];data={...(savedMaterials.get(id)||{}),materialId:id,approvalStatus:'APPROVED'};savedMaterials.set(id,data);
      }
      if(p.endsWith('/clos')&&p.includes('/subjects/')){const sid=p.split('/')[4];if(m==='POST'){data={...body,subjectId:sid,cloId:'new-clo',questionCount:0};clos.push(data);}else data=clos.filter(c=>c.subjectId===sid);}
      if(p.startsWith('/api/v1/clos/')){const id=p.split('/')[4],clo=clos.find(c=>c.cloId===id);if(m==='PUT')Object.assign(clo,body);if(m==='PATCH')clo.isActive=url.searchParams.get('isActive')==='true';if(m==='DELETE')clos.splice(clos.findIndex(c=>c.cloId===id),1);data=clo;}
      if(p==='/api/v1/questions') {if(m==='POST'){data={...body,questionId:'new-q'};questions.push(data);}else data=paged(questions.filter(q=>!url.searchParams.get('subjectId')||q.subjectId===url.searchParams.get('subjectId')));}
      if(p==='/api/v1/questions/import-excel'&&m==='POST'){const imported=[1,2].map(i=>({...questions[0],questionId:'import-q'+i,content:'Câu nhập Excel '+i,approvalStatus:'DRAFT'}));questions.push(...imported);data={totalParsed:2,totalImported:2,questions:imported,warnings:['Dòng 4 chưa đủ dữ liệu']};}
      if(p.startsWith('/api/v1/questions/')&&!p.includes('/import-excel')){const id=p.split('/')[4],q=questions.find(q=>q.questionId===id);if(q){if(m==='PUT'){if(p.endsWith('/clos'))q.cloIds=body;else if(p.endsWith('/submit-review'))q.approvalStatus='PENDING';else if(p.endsWith('/approve'))q.approvalStatus='APPROVED';else if(p.endsWith('/reject')){q.approvalStatus='REJECTED';q.rejectionReason=body.rejectionReason;}else Object.assign(q,body);}data=q;}}
      if(p==='/api/v1/exam-matrices')data=[];
      return Response.json({data});
    };
  `,
  });

  await go('admin_subject_detail?subjectId=s0');
  await wait(`document.querySelectorAll('[role=tab]').length>=4`);
  const curriculumTab = await evaluate(`document.querySelectorAll('[role=tab]')[1].textContent.trim()`);
  await click(curriculumTab);
  await wait(`document.querySelector('[aria-label] .curriculum-tree-navigation')`);

  const chapterLabel = await evaluate(
    `Array.from(document.querySelectorAll('.curriculum-tree-navigation button')).find(e=>e.textContent.includes('(1')).textContent`
  );
  await evaluate(
    `Array.from(document.querySelectorAll('.curriculum-tree-navigation button')).find(e=>e.textContent.includes('(1')).click()`
  );
  await evaluate(
    `Array.from(document.querySelectorAll('.curriculum-tree-navigation button')).find(e=>e.textContent.includes(String.fromCharCode(272)+'\u1ed9ng l\u1ef1c h\u1ecdc')).click()`
  );
  const newMaterial = await evaluate(
    `Array.from(document.querySelectorAll('.curriculum-material-toolbar button')).at(-1).textContent.replace('add','').trim()`
  );
  await click(newMaterial);
  await set('[name=title]', 'Admin Material');
  await set('[name=type]', 'TEXT');
  await set('[name=contentText]', 'Published material');
  const saveLabel = await evaluate(`document.querySelector('[role=dialog] button[type=submit]').textContent.trim()`);
  await click(saveLabel);
  await wait(`calls.some(c=>c.path.endsWith('/created-m0/approve'))`);
  await wait(`!document.querySelector('[role=dialog]')`);
  await check('Admin creation automatically approves its saved material', async () => {
    assert.equal(await evaluate(`calls.filter(c=>c.path.endsWith('/materials')&&c.method==='POST').length`), 1);
    assert.equal(await evaluate(`calls.filter(c=>c.path.endsWith('/created-m0/approve')).length`), 1);
  });
  await evaluate(`window.failAutoMaterialApproval=true`);
  await click(newMaterial);
  await set('[name=title]', 'Retry Material');
  await set('[name=type]', 'MARKDOWN');
  await set('[name=contentText]', '# Saved once');
  await click(saveLabel);
  await wait(`calls.some(c=>c.path.endsWith('/created-m1/approve'))`);
  await wait(`!document.querySelector('[role=dialog]')`);
  await evaluate(`window.failAutoMaterialApproval=false`);
  const retryLabel = await evaluate(
    `Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('Th'+String.fromCharCode(7917)+' l'+String.fromCharCode(7841)+'i l')).textContent.trim()`
  );
  await click(retryLabel);
  await wait(`calls.filter(c=>c.path.endsWith('/created-m1/approve')).length===2`);
  await check('Retry finishes approval without creating a duplicate material', async () => {
    assert.equal(await evaluate(`calls.filter(c=>c.path.endsWith('/materials')&&c.method==='POST').length`), 2);
  });
  assert.deepEqual(errors, []);
  await writeFile(path.join(directory, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`${results.length} admin material browser scenarios passed.`);
} finally {
  socket?.close();
  browser.kill();
}
