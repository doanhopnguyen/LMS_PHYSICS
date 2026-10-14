import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5198';
const directory = path.resolve('.tmp-admin-management');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9378',
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
      target = (await (await fetch('http://127.0.0.1:9378/json')).json()).find((t) => t.type === 'page');
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
    await wait(`location.pathname.includes(${JSON.stringify(route.split('?')[0])}) && document.querySelector('header')`);
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
    const point = await evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send('Input.dispatchMouseEvent', {type:'mousePressed',button:'left',clickCount:1,...point});
    await send('Input.dispatchMouseEvent', {type:'mouseReleased',button:'left',clickCount:1,...point});
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
    source: `
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
  await check('Semester page has no content tabs; sidebar includes content review; titles appear in header', async () => {
    await go('admin_academics');
    assert.equal(await evaluate(`document.querySelectorAll('[role=tab]').length`), 0);
    assert.equal(await evaluate(`document.querySelectorAll('aside a').length`), 8);
    assert.ok(await evaluate(`document.querySelector('header')?.textContent.includes('Quản trị học kỳ')`));
    assert.equal(await evaluate(`document.querySelectorAll('.stat-card').length`), 1);
    await screenshot('semesters-desktop');
    await pointerClick('.stat-card__metrics');
    await wait(`location.pathname.includes('admin_classes')`);
    await wait(`document.querySelector('.stat-card')`);
    assert.equal(await evaluate(`document.querySelectorAll('.stat-card').length`), 10);
    await screenshot('classes-desktop');
    assert.ok(await evaluate(`calls.some(c=>c.path==='/api/v1/classes'&&c.query.semesterId==='sem1')`));
  });
  await check('Subject cards, pagination, search and status filtering', async () => {
    await go('admin_subjects');
    await screenshot('subjects-desktop');
    assert.equal(await evaluate(`document.querySelectorAll('button[aria-haspopup=menu]').length`), 10);
    assert.equal(await evaluate(`document.querySelectorAll('.stat-card').length`), 10);
    assert.equal(await evaluate(`document.querySelectorAll('button button').length`), 0);
    await evaluate(`document.querySelector('[aria-label="Trang sau"]').click()`);
    await pause(100);
    assert.ok(await evaluate(`document.body.textContent.includes('PHY10')`));
    await set('input[type=search]', 'Vật lý 23');
    assert.equal(await evaluate(`document.querySelectorAll('button[aria-haspopup=menu]').length`), 1);
    await set('select', 'true');
    assert.ok(await evaluate(`document.body.textContent.includes('Không có dữ liệu phù hợp')`));
    await set('select', '');
  });
  await check('Subject menu changes status and edits details via API', async () => {
    await pointerClick('button[aria-haspopup=menu]');
    assert.ok(await evaluate(`location.pathname.includes('admin_subjects')`));
    await pause(80);
    await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Kích hoạt').click()`);
    await pause(200);
    assert.ok(await evaluate(`calls.some(c=>c.path==='/api/v1/subjects/s23/toggle-status'&&c.method==='PUT')`));
    await evaluate(`document.querySelector('button[aria-haspopup=menu]').click()`);
    await pause(80);
    await evaluate(
      `[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Chỉnh sửa thông tin').click()`
    );
    await wait(`document.querySelector('[role=dialog] input[name=subjectName]')`);
    await set('[name=subjectName]', 'Vật lý cập nhật');
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(
      await evaluate(
        `calls.some(c=>c.path==='/api/v1/subjects/s23'&&c.method==='PUT'&&c.body.subjectName==='Vật lý cập nhật')`
      )
    );
  });
  await check('New subject form posts the documented fields', async () => {
    await click('Tạo mới học phần');
    await set('[name=subjectCode]', 'NEW');
    await set('[name=subjectName]', 'Học phần mới');
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(
      await evaluate(`calls.some(c=>c.path==='/api/v1/subjects'&&c.method==='POST'&&c.body.subjectCode==='NEW')`)
    );
  });
  await check('Subject detail tabs keep question bank and matrix inside admin scope', async () => {
    await go('admin_subject_detail?subjectId=s0');
    assert.equal(await evaluate(`document.querySelectorAll('[role=tab]').length`), 5);
    assert.equal(await evaluate(`document.querySelectorAll('.header-back-button,.page-content-actions').length`), 0);
    assert.ok(
      await evaluate(
        `document.querySelector('[role=tablist]').getBoundingClientRect().top-document.querySelector('header').getBoundingClientRect().bottom<=8`
      )
    );
    await click('Ngân hàng');
    assert.equal(await evaluate(`document.querySelectorAll('aside').length`), 1);
    assert.ok(await evaluate(`calls.some(c=>c.path==='/api/v1/questions'&&c.query.subjectId==='s0')`));
    await click('Ma trận');
    await click('Tạo ma trận');
    assert.ok(await evaluate(`!!document.querySelector('[role=dialog]')`));
    assert.ok(await evaluate(`location.pathname.includes('admin_subject_detail')`));
    await evaluate(`document.querySelector('[role=dialog] button[aria-label="Đóng"]').click()`);
  });
  await check(
    'Subject CLO manager creates, edits, toggles and deletes; linked CLO deletion is blocked visibly',
    async () => {
      await click('Chuẩn đầu ra (CLO)');
      await wait(`document.querySelector('[aria-label="Thao tác với CLO1"]')`);
      await screenshot('clo-manager-desktop');
      await click('Tạo mới CLO');
      await set('[name=cloCode]', 'CLO4');
      await set('[name=description]', 'Chuẩn đầu ra mới');
      await click('Lưu CLO');
      await wait(`!document.querySelector('[role=dialog]')`);
      await wait(`document.querySelector('[aria-label="Thao tác với CLO4"]')`);
      assert.ok(
        await evaluate(
          `calls.some(c=>c.method==='POST'&&c.path==='/api/v1/subjects/s0/clos'&&c.body.cloCode==='CLO4'&&Number.isInteger(c.body.orderIndex))`
        )
      );
      await evaluate(`document.querySelector('[aria-label="Thao tác với CLO4"]').click()`);
      await pause(100);
      await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Chỉnh sửa').click()`);
      await set('[name=description]', 'Mô tả cập nhật');
      await click('Lưu CLO');
      await wait(`!document.querySelector('[role=dialog]')`);
      assert.ok(
        await evaluate(
          `calls.some(c=>c.method==='PUT'&&c.path==='/api/v1/clos/new-clo'&&c.body.description==='Mô tả cập nhật')`
        )
      );
      await evaluate(`document.querySelector('[aria-label="Thao tác với CLO4"]').click()`);
      await pause(100);
      await evaluate(
        `[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Ngừng hoạt động').click()`
      );
      await pause(150);
      assert.ok(
        await evaluate(
          `calls.some(c=>c.method==='PATCH'&&c.path==='/api/v1/clos/new-clo/toggle-status'&&c.query.isActive==='false')`
        )
      );
      await evaluate(`document.querySelector('[aria-label="Thao tác với CLO4"]').click()`);
      await pause(100);
      await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Xóa').click()`);
      await click('Xóa CLO');
      await wait(`!document.querySelector('[role=alertdialog]')`);
      await evaluate(`document.querySelector('[aria-label="Thao tác với CLO1"]').click()`);
      await pause(100);
      await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Xóa').click()`);
      await click('Xóa CLO');
      await wait(`document.querySelector('[role=alertdialog]')?.textContent.includes('Không thể xóa CLO')`);
      await click('Hủy');
    }
  );
  await check('Question editor submits multiple same-subject CLOs and disables inactive choices', async () => {
    await click('Ngân hàng');
    await click('Tạo câu hỏi');
    await wait(`document.querySelector('[aria-label="Chọn CLO1"]')`);
    await set('[role=dialog] [name=topicId]', 't1');
    await set('[name=content]', 'Câu hỏi có nhiều CLO');
    await set('[aria-label="Nội dung đáp án 1"]', 'Đáp án đúng');
    await set('[aria-label="Nội dung đáp án 2"]', 'Đáp án sai');
    await evaluate(
      `document.querySelector('[name=correct-answer]').click();document.querySelector('[aria-label="Chọn CLO1"]').click();document.querySelector('[aria-label="Chọn CLO2"]').click()`
    );
    assert.equal(await evaluate(`document.querySelector('[aria-label="Chọn CLO3"]').disabled`), true);
    await screenshot('question-clo-editor');
    await click('Tạo câu hỏi');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.deepEqual(await evaluate(`calls.find(c=>c.method==='POST'&&c.path==='/api/v1/questions').body.cloIds`), [
      'clo1',
      'clo2',
    ]);
    await wait(`window.qaQuestions.find(q=>q.questionId==='new-q')?.approvalStatus==='APPROVED'`);
    assert.equal(await evaluate(`calls.find(c=>c.method==='POST'&&c.path==='/api/v1/questions').body.approvalStatus`),'PENDING');
  });
  await check('CLO filter searches every API page and quick assignment sends a raw array', async () => {
    await set('select[name=cloFilter]', 'clo1');
    await wait(`document.body.textContent.includes('Câu hỏi 25')`);
    assert.equal(await evaluate(`calls.some(c=>c.path==='/api/v1/questions'&&'cloId' in c.query)`), false);
    await set('select[name=cloFilter]', '');
    await wait(`document.querySelector('[aria-label="Thao tác với câu hỏi"]')`);
    await evaluate(`document.querySelector('[aria-label="Thao tác với câu hỏi"]').click()`);
    await pause(100);
    await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Gán CLO').click()`);
    await wait(`document.querySelector('[aria-label="Chọn CLO2"]')`);
    await evaluate(
      `document.querySelector('[aria-label="Chọn CLO1"]').click();document.querySelector('[aria-label="Chọn CLO2"]').click()`
    );
    await click('Lưu CLO câu hỏi');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.deepEqual(await evaluate(`calls.find(c=>c.method==='PUT'&&c.path==='/api/v1/questions/q0/clos').body`), [
      'clo2',
    ]);
  });
  await check(
    'Editing keeps topic and inactive CLO until explicitly removed; failed CLO loading supports retry',
    async () => {
      await evaluate(
        `qaQuestions[0].cloIds=['clo3'];document.querySelector('[aria-label="Thao tác với câu hỏi"]').click()`
      );
      await pause(100);
      await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Chỉnh sửa').click()`);
      await wait(`document.querySelector('[aria-label="Chọn CLO3"]')`);
      assert.equal(await evaluate(`document.querySelector('[role=dialog] [name=topicId]').value`), 't1');
      assert.equal(await evaluate(`document.querySelector('[aria-label="Chọn CLO3"]').checked`), true);
      await click('Lưu thay đổi');
      assert.ok(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('ngừng hoạt động')`));
      await evaluate(
        `document.querySelector('[aria-label="Chọn CLO3"]').click();document.querySelector('[aria-label="Chọn CLO2"]').click()`
      );
      await click('Lưu thay đổi');
      await wait(`!document.querySelector('[role=dialog]')`);
      assert.deepEqual(await evaluate(`calls.find(c=>c.method==='PUT'&&c.path==='/api/v1/questions/q0').body.cloIds`), [
        'clo2',
      ]);
      await evaluate('window.failClos=true');
      await click('Tạo câu hỏi');
      await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Không tải được CLO')`);
      assert.equal(await evaluate(`document.querySelector('[role=dialog] button[type=submit]').disabled`), true);
      await evaluate('window.failClos=false');
      await click('Thử lại');
      await wait(`document.querySelector('[aria-label="Chọn CLO1"]')`);
      await evaluate(`document.querySelector('[role=dialog] [aria-label="Đóng"]').click()`);
    }
  );
  await check('Matrix criteria send the selected CLO and keep optional criteria unrestricted', async () => {
    await click('Ma trận');
    await click('Tạo ma trận');
    await set('[name=matrixName]', 'Ma trận có CLO');
    await set('[name=topicId-0]', 't1');
    await set('[name=cloId-0]', 'clo1');
    await evaluate(`document.querySelector('[role=dialog] button[type=submit]').click()`);
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.equal(
      await evaluate(`calls.find(c=>c.method==='POST'&&c.path==='/api/v1/exam-matrices').body.details[0].cloId`),
      'clo1'
    );
    await click('Tạo ma trận');
    await set('[name=matrixName]', 'Ma trận không giới hạn CLO');
    await set('[name=topicId-0]', 't1');
    await evaluate(`document.querySelector('[role=dialog] button[type=submit]').click()`);
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.equal(
      await evaluate(`calls.filter(c=>c.method==='POST'&&c.path==='/api/v1/exam-matrices').at(-1).body.details[0].cloId`),
      null
    );
  });
  await check('Curriculum navigates chapters → topics → materials and previews content', async () => {
    await click('Chương trình đào tạo');
    await wait(`document.querySelector('[aria-label="Cây chương trình đào tạo"]')`);
    await click('Chương Cơ học (1 chủ đề)');
    await click('Động lực học');
    await screenshot('curriculum-tree-desktop');
    await click('Bài đọc');
    await wait(`document.querySelector('[role=dialog]')`);
    assert.ok(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Nội dung học liệu')`));
    await screenshot('material-preview');
    await evaluate(`document.querySelector('[role=dialog] button[aria-label="Đóng"]').click()`);
  });
  await check('Creates material and topic in their selected parent scope', async () => {
    await click('Tạo mới học liệu');
    await set('input[name=title]', 'Học liệu mới');
    await set('select[name=type]', 'TEXT');
    await set('textarea[name=contentText]', 'Nội dung mới');
    await evaluate(`document.querySelector('[aria-label="Mở rộng toàn màn hình"]').click()`);
    await wait(`document.querySelector('[aria-label="Thu nhỏ"]')`);
    assert.ok(await evaluate(`(() => {const r=document.querySelector('[role=dialog]').getBoundingClientRect();return r.width===innerWidth&&r.height===innerHeight&&r.x===0&&r.y===0})()`));
    await screenshot('material-create-fullscreen-desktop');
    await evaluate(`document.querySelector('[aria-label="Thu nhỏ"]').click()`);
    await wait(`document.querySelector('[aria-label="Mở rộng toàn màn hình"]')`);
    assert.ok(await evaluate(`document.querySelector('[role=dialog]').getBoundingClientRect().width<innerWidth`));
    assert.equal(await evaluate(`document.querySelector('[name=title]').value`), 'Học liệu mới');
    assert.equal(await evaluate(`document.querySelector('[name=contentText]').value`), 'Nội dung mới');
    await evaluate(`document.querySelector('[aria-label="Mở rộng toàn màn hình"]').click()`);
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(
      await evaluate(
        `calls.some(c=>c.path==='/api/v1/topics/t1/materials'&&c.method==='POST'&&c.body.scope==='SHARED'&&c.body.contentText==='Nội dung mới')`
      )
    );
    await click('Tạo mới chủ đề');
    await set('[name=topicName]', 'Chủ đề mới');
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(
      await evaluate(
        `calls.some(c=>c.path==='/api/v1/subjects/s0/topics'&&c.method==='POST'&&c.body.chapterId==='ch1')`
      )
    );
  });
  await check('Creates chapter and handles unassigned topics without invalid chapter URLs', async () => {
    await click('Tạo mới chương');
    await set('[name=chapterCode]', 'C2');
    await set('[name=chapterName]', 'Chương mới');
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(
      await evaluate(
        `calls.some(c=>c.path==='/api/v1/subjects/s0/chapters'&&c.method==='POST'&&c.body.chapterCode==='C2')`
      )
    );
    await click('Chủ đề chưa phân chương (1 chủ đề)');
    await click('Chủ đề độc lập');
    await click('Tạo mới học liệu');
    await set('[name=title]', 'Tài liệu độc lập');
    await set('[name=type]', 'TEXT');
    await set('[name=contentText]', 'Nội dung độc lập');
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(await evaluate(`calls.some(c=>c.path==='/api/v1/topics/t2/materials'&&c.method==='POST')`));
    assert.equal(await evaluate(`calls.some(c=>c.path==='/api/v1/chapters/unassigned/topics')`), false);
  });
  await check('Curriculum tree expands, collapses and searches material descendants', async () => {
    await go('admin_subject_detail?subjectId=s0');
    await click('Chương trình đào tạo');
    await wait(`document.querySelector('[aria-label="Cây chương trình đào tạo"]')`);
    await evaluate(`document.querySelector('[aria-label="Mở rộng Động lực học"]').click()`);
    await pause(100);
    assert.ok(await evaluate(`document.querySelector('#topic-t1').textContent.includes('Bài đọc')`));
    await evaluate(`document.querySelector('[aria-label="Thu gọn Chương Cơ học"]').click()`);
    await pause(100);
    assert.equal(await evaluate(`!!document.querySelector('#chapter-ch1')`), false);
    await set('input[placeholder="Tìm kiếm chương, chủ đề, học liệu…"]', 'Bài đọc');
    assert.ok(await evaluate(`!!document.querySelector('#chapter-ch1')`));
    await evaluate(`document.querySelector('[aria-label="Thu gọn Chương Cơ học"]').click()`);
    await pause(100);
    assert.equal(await evaluate(`!!document.querySelector('#chapter-ch1')`), false);
    await evaluate(`document.querySelector('[aria-label="Mở rộng Chương Cơ học"]').click()`);
    await pause(100);
    assert.ok(
      await evaluate(`document.querySelector('[aria-label="Chương và chủ đề"]').textContent.includes('Bài đọc')`)
    );
    assert.equal(
      await evaluate(
        `document.querySelector('[aria-label="Chương và chủ đề"]').textContent.includes('Chủ đề chưa phân chương')`
      ),
      false
    );
    await set('input[placeholder="Tìm kiếm chương, chủ đề, học liệu…"]', 'Không tồn tại');
    assert.ok(
      await evaluate(
        `document.querySelector('[aria-label="Chương và chủ đề"]').textContent.includes('Không có dữ liệu phù hợp')`
      )
    );
    await set('input[placeholder="Tìm kiếm chương, chủ đề, học liệu…"]', '');
    await evaluate(`document.querySelector('[aria-label="Mở rộng Chương Cơ học"]').click()`);
    await pause(100);
    await screenshot('curriculum-tree-expanded-desktop');
  });
  await check('Material cards filter by format with create button on the same row and no extra search', async () => {
    assert.equal(
      await evaluate(`document.querySelectorAll('[aria-label="Nội dung chương trình"] input[type=search]').length`),
      0
    );
    assert.ok(
      await evaluate(
        `(()=>{const t=document.querySelector('.curriculum-material-toolbar');return Math.abs(t.querySelector('button').getBoundingClientRect().y-t.querySelector('.select-field').getBoundingClientRect().y)<5})()`
      )
    );
    await set('[aria-label="Nội dung chương trình"] select', 'PDF');
    assert.ok(await evaluate(`!!document.querySelector('[aria-label="Thao tác với PDF bài giảng"]')`));
    assert.equal(await evaluate(`!!document.querySelector('[aria-label="Thao tác với Bài đọc"]')`), false);
    await set('[aria-label="Nội dung chương trình"] select', '');
    assert.ok(
      await evaluate(`document.querySelector('[aria-label="Nội dung chương trình"] h2').textContent==='Động lực học'`)
    );
  });
  await check('Curriculum context menus edit chapters, topics and materials in the correct scope', async () => {
    async function editFromMenu(label) {
      await evaluate(`document.querySelector(${JSON.stringify(`[aria-label="${label}"]`)}).click()`);
      await pause(100);
      await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Chỉnh sửa').click()`);
      await wait(`document.querySelector('[role=dialog] input')`);
    }
    await editFromMenu('Thao tác với Chương Cơ học');
    await set('[name=chapterName]', 'Cơ học cập nhật');
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(
      await evaluate(
        `calls.some(c=>c.method==='PUT'&&c.path==='/api/v1/chapters/ch1'&&c.body.chapterName==='Cơ học cập nhật')`
      )
    );
    await editFromMenu('Thao tác với Động lực học');
    await set('[name=topicName]', 'Chủ đề cập nhật');
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(
      await evaluate(
        `calls.some(c=>c.method==='PUT'&&c.path==='/api/v1/subjects/s0/topics/t1'&&c.body.chapterId==='ch1')`
      )
    );
    await editFromMenu('Thao tác với Bài đọc');
    await set('[name=title]', 'Bài đọc cập nhật');
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(
      await evaluate(
        `calls.some(c=>c.method==='PUT'&&c.path==='/api/v1/topics/t1/materials/m1'&&c.body.title==='Bài đọc cập nhật'&&c.body.contentText==='Nội dung học liệu')`
      )
    );
    await evaluate(`document.querySelector('[aria-label="Thao tác với Bài đọc"]').click()`);
    await pause(100);
    await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Xóa').click()`);
    await wait(`document.querySelector('[role=alertdialog]')`);
    assert.equal(await evaluate(`calls.some(c=>c.method==='DELETE'&&c.path.endsWith('/materials/m1'))`), false);
    await click('Hủy');
    assert.equal(await evaluate(`calls.some(c=>c.method==='DELETE'&&c.path.endsWith('/materials/m1'))`), false);
  });
  await check('Curriculum loading errors support retry and preserve the selected topic', async () => {
    await evaluate(`window.failCurriculum=true;document.querySelector('[aria-label="Thao tác với Bài đọc"]').click()`);
    await pause(100);
    await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Chỉnh sửa').click()`);
    await wait(`document.querySelector('[role=dialog] input')`);
    await click('Lưu');
    await wait(`document.body.textContent.includes('Không thể tải học liệu')`);
    await evaluate('window.failCurriculum=false');
    await click('Thử lại');
    await wait(`document.querySelector('[aria-label="Thao tác với Bài đọc"]')`);
    assert.ok(
      await evaluate(`document.querySelector('[aria-label="Nội dung chương trình"] h2').textContent==='Động lực học'`)
    );
  });
  await check(
    'Curriculum panes resize with pointer and keyboard while tree height and floating search stay fixed',
    async () => {
      await evaluate('window.tallTree=true');
      await click('Ngân hàng');
      await click('Chương trình đào tạo');
      await wait(`document.querySelector('[role=separator].resizable-panels-handle')`);
      await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
      const geometry = () =>
        evaluate(
          `(()=>{const frame=document.querySelector('.resizable-panels'),left=frame.querySelector('.resizable-panels-left'),right=frame.querySelector('.resizable-panels-right'),handle=frame.querySelector('[role=separator]'),tree=left.querySelector('[aria-label="Cây chương trình đào tạo"]'),search=tree.querySelector('.curriculum-tree-search');return {height:tree.getBoundingClientRect().height,left:left.getBoundingClientRect().width,right:right.getBoundingClientRect().width,x:handle.getBoundingClientRect().x+8,y:handle.getBoundingClientRect().y+80,searchBottom:search.getBoundingClientRect().bottom,treeBottom:tree.getBoundingClientRect().bottom}})()`
        );
      const before = await geometry();
      assert.equal(before.height, 640);
      assert.equal(
        await evaluate(
          `document.querySelector('[aria-label="Cây chương trình đào tạo"]').textContent.includes('Tìm trong chương trình')`
        ),
        false
      );
      assert.ok(before.treeBottom - before.searchBottom <= 20);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: before.x, y: before.y });
      await send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: before.x,
        y: before.y,
        button: 'left',
        clickCount: 1,
      });
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: before.x + 140,
        y: before.y,
        buttons: 1,
        button: 'left',
      });
      await send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: before.x + 140,
        y: before.y,
        button: 'left',
        clickCount: 1,
      });
      await pause(100);
      const resized = await geometry();
      assert.ok(Math.abs(resized.left - before.left - 140) <= 1, JSON.stringify({ before, resized }));
      assert.ok(Math.abs(before.right - resized.right - 140) <= 1);
      assert.equal(resized.height, before.height);
      await screenshot('curriculum-resized-desktop');
      await evaluate(`document.querySelector('[role=separator].resizable-panels-handle').focus()`);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Home', code: 'Home' });
      await pause(100);
      assert.equal((await geometry()).left, 260);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' });
      await pause(100);
      assert.equal((await geometry()).left, 276);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'End', code: 'End' });
      await pause(100);
      assert.ok((await geometry()).right >= 380);
      assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`));
      await evaluate(`document.querySelector('[aria-label="Chương và chủ đề"]').scrollTop=9999`);
      assert.ok(
        await evaluate(
          `document.querySelector('[aria-label="Chương và chủ đề"]').scrollHeight>document.querySelector('[aria-label="Chương và chủ đề"]').clientHeight`
        )
      );
      assert.equal((await geometry()).searchBottom, before.searchBottom);
      await set('input[placeholder="Tìm kiếm chương, chủ đề, học liệu…"]', 'Không tồn tại');
      assert.equal((await geometry()).height, 640);
      await set('input[placeholder="Tìm kiếm chương, chủ đề, học liệu…"]', '');
      const end = await geometry();
      await send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: end.x,
        y: end.y,
        button: 'left',
        clickCount: 2,
      });
      await send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: end.x,
        y: end.y,
        button: 'left',
        clickCount: 2,
      });
      await pause(100);
      assert.equal((await geometry()).left, 340);
    }
  );
  await check('Class creation validates required fields and preserves four-step context', async () => {
    await go('admin_class_create?subjectId=s0&semesterId=sem1');
    assert.equal(await evaluate(`document.querySelector('ol[aria-label="Các bước tạo lớp"]').children.length`), 4);
    await click('Tiếp tục');
    assert.ok(await evaluate(`!!document.querySelector('input[required]')`));
    await set('input[pattern]', 'VL-NEW');
    await click('Tiếp tục');
    assert.ok(
      await evaluate(`document.querySelector('ol li:first-child span.relative').className.includes('bg-green-600')`)
    );
    assert.deepEqual(await evaluate(`[...document.querySelector('select').options].map(o=>o.value)`), ['', 'teacher1']);
    await set('select', 'teacher1');
    await click('Tiếp tục');
    await set('input[placeholder="Nhập thông tin sinh viên"]', 'sv1');
    await click('Tìm kiếm');
    await wait(`document.querySelector('input[type=radio]')`);
    await evaluate(`document.querySelector('input[type=radio]').click()`);
    await pause(100);
    await click('Thêm vào danh sách');
    await click('Tiếp tục');
    await screenshot('wizard-confirmation');
  });
  await check('Enrollment failure can be retried without creating a second class', async () => {
    await evaluate('window.failEnrollment=true');
    await click('Xác nhận tạo lớp');
    await wait(`document.body.textContent.includes('Thử lại ghi danh')`);
    assert.equal(await evaluate(`calls.filter(c=>c.path==='/api/v1/classes'&&c.method==='POST').length`), 1);
    await evaluate('window.failEnrollment=false');
    await click('Thử lại ghi danh');
    await wait(`location.pathname.includes('admin_class_detail')`);
  });
  await check('Class detail edits information, assigns instructor and removes student with confirmation', async () => {
    await go('admin_class_detail?classId=c0');
    await click('Sửa thông tin');
    await set('[name=classCode]', 'VL-EDIT');
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(
      await evaluate(`calls.some(c=>c.path==='/api/v1/classes/c0'&&c.method==='PUT'&&c.body.classCode==='VL-EDIT')`)
    );
    await click('Phân công giảng viên');
    await set('[name=instructorId]', 'teacher1');
    await click('Lưu');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(
      await evaluate(`calls.some(c=>c.path==='/api/v1/classes/c0/instructor'&&c.body.instructorId==='teacher1')`)
    );
    await click('Sinh viên');
    await wait(`document.querySelector('button[aria-haspopup=menu]')`);
    await screenshot('class-students');
    await evaluate(`document.querySelector('button[aria-haspopup=menu]').click()`);
    await pause(80);
    await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Xóa khỏi lớp').click()`);
    await wait(`document.querySelector('[role=alertdialog]')`);
    assert.equal(await evaluate(`calls.some(c=>c.method==='DELETE')`), false);
    await click('Xóa khỏi lớp');
    await wait(`!document.querySelector('[role=alertdialog]')`);
    assert.ok(await evaluate(`calls.some(c=>c.path==='/api/v1/classes/c0/students/stu1'&&c.method==='DELETE')`));
  });
  await check('Failed list requests show error and retry successfully', async () => {
    await go('admin_subjects');
    await evaluate(
      `window.failSubjects=true;document.querySelector('input[type=search]').dispatchEvent(new Event('input',{bubbles:true}))`
    );
    await go('admin_subjects');
    await evaluate(`window.failSubjects=true;document.querySelector('button[aria-haspopup=menu]').click()`);
    await pause(80);
    await evaluate(`[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent==='Tạm ngưng').click()`);
    await wait(`document.body.textContent.includes('Thử lại')`);
    await evaluate('window.failSubjects=false');
    await click('Thử lại');
    await wait(`document.querySelector('button[aria-haspopup=menu]')`);
  });
  await check('Inactive subjects cannot create CLOs', async () => {
    await go('admin_subject_detail?subjectId=s23');
    await click('Chuẩn đầu ra (CLO)');
    await wait(`!document.querySelector('#root [role=status]')`);
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Tạo mới CLO')).disabled`), true);
  });
  await check('Admin creation retries automatic approval without creating a duplicate question', async () => {
    await go('admin_subject_detail?subjectId=s0');
    await click('Ngân hàng');
    await click('Tạo câu hỏi');
    await wait(`document.querySelector('[aria-label="Chọn CLO1"]')`);
    await set('[role=dialog] [name=topicId]','t1');
    await set('[name=content]','Câu mới được duyệt ngay');
    await set('[aria-label="Nội dung đáp án 1"]','Đúng');
    await set('[aria-label="Nội dung đáp án 2"]','Sai');
    await evaluate(`document.querySelector('[name=correct-answer]').click();window.failReview=true`);
    await click('Tạo câu hỏi');
    await wait(`!document.querySelector('[role=dialog]')&&document.body.textContent.includes('Câu hỏi đã được tạo nhưng chưa duyệt xong')`);
    assert.equal(await evaluate(`calls.filter(c=>c.method==='POST'&&c.path==='/api/v1/questions').length`),1);
    await evaluate(`window.failReview=false`);
    await click('Thử duyệt lại câu hỏi vừa tạo');
    await wait(`!document.body.textContent.includes('Câu hỏi vừa tạo chưa duyệt xong')`);
    assert.equal(await evaluate(`window.qaQuestions.find(q=>q.questionId==='new-q').approvalStatus`),'APPROVED');
    assert.equal(await evaluate(`calls.filter(c=>c.method==='POST'&&c.path==='/api/v1/questions').length`),1);
  });
  await check('Admin Excel import approves every new question and retries partial failures without reimporting', async () => {
    await go('admin_subject_detail?subjectId=s0');
    await click('Ngân hàng');
    await click('Nhập Excel');
    await wait(`document.querySelector('[name=importSubjectId] option[value=s0]')`);
    await set('[name=importSubjectId]','s0');
    await wait(`document.querySelector('[name=importTopicId] option[value=t1]')`);
    await set('[name=importTopicId]','t1');
    await evaluate(`const files=new DataTransfer();files.items.add(new File(['mock workbook'],'cau-hoi.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));document.querySelector('[name=file]').files=files.files;window.failImportApproval=true`);
    await click('Nhập câu hỏi');
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Đã duyệt 1/2')`);
    assert.ok(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Dòng 4 chưa đủ dữ liệu')`));
    await screenshot('admin-import-approval-partial');
    await evaluate(`document.querySelector('[role=dialog] [aria-label="Đóng"]').click()`);
    await click('Nhập Excel');
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Đã duyệt 1/2')`);
    await evaluate(`window.failImportApproval=false`);
    await click('Thử duyệt lại câu hỏi đã nhập');
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Đã duyệt 2/2')`);
    assert.equal(await evaluate(`calls.filter(c=>c.method==='POST'&&c.path==='/api/v1/questions/import-excel').length`),1);
    assert.equal(await evaluate(`calls.filter(c=>c.method==='PUT'&&c.path==='/api/v1/questions/import-q1/approve').length`),1);
    assert.ok(await evaluate(`window.qaQuestions.filter(q=>q.questionId.startsWith('import-q')).every(q=>q.approvalStatus==='APPROVED')`));
    await screenshot('admin-import-approval-complete');
    await evaluate(`document.querySelector('[role=dialog] [aria-label="Đóng"]').click()`);
  });
  await check('Admin draft submission supports comments, retry and the complete approval flow', async () => {
    await go('admin_subject_detail?subjectId=s0');
    await click('Ngân hàng');
    await set('[name=approvalFilter]','DRAFT');
    await wait(`document.querySelector('[aria-label="Thao tác với câu hỏi"]')`);
    await evaluate(`document.querySelector('[aria-label="Thao tác với câu hỏi"]').click()`);
    assert.ok(await evaluate(`![...document.querySelectorAll('[role=menuitem]')].some(e=>e.textContent==='Duyệt câu hỏi')`));
    await click('Gửi duyệt câu hỏi');
    await set('[name=comment]','Câu hỏi đã kiểm tra');
    await evaluate(`window.failSubmission=true`);
    await click('Xác nhận gửi duyệt');
    await wait(`document.querySelector('[role=dialog] [role=alert]')?.textContent.includes('Chưa gửi duyệt được')`);
    assert.equal(await evaluate(`document.querySelector('[name=comment]').value`),'Câu hỏi đã kiểm tra');
    await evaluate(`window.failSubmission=false`);
    await click('Xác nhận gửi duyệt');
    await wait(`!document.querySelector('[role=dialog]')`);
    assert.ok(await evaluate(`calls.some(c=>c.method==='PUT'&&c.path==='/api/v1/questions/q0/submit-review'&&c.query.comment==='Câu hỏi đã kiểm tra'&&c.body===null)`));
    await set('[name=approvalFilter]','PENDING');
    await wait(`document.querySelectorAll('tbody tr').length===1`);
    await evaluate(`document.querySelector('[aria-label="Thao tác với câu hỏi"]').click()`);
    await click('Xem câu hỏi');
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Đáp án đúng')`);
    assert.ok(await evaluate(`![...document.querySelectorAll('[role=dialog] button')].some(e=>e.textContent.includes('Gửi duyệt câu hỏi'))`));
    await click('Duyệt câu hỏi');
    await click('Xác nhận duyệt');
    await wait(`!document.querySelector('[role=dialog]')&&document.querySelectorAll('tbody tr').length===0`);
    assert.equal(await evaluate(`window.qaQuestions.find(q=>q.questionId==='q0').approvalStatus`),'APPROVED');
  });
  await check('Review queue defaults to pending across all pages and previews answers before approval', async () => {
    await go('admin_materials');
    assert.equal(await evaluate(`document.querySelector('[name=approvalFilter]').value`),'PENDING');
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),4);
    assert.ok(await evaluate(`document.body.textContent.includes('Câu hỏi 105')`));
    assert.ok(await evaluate(`![...document.querySelectorAll('button')].some(e=>e.textContent.includes('Tạo câu hỏi')||e.textContent.includes('Nhập Excel'))`));
    await screenshot('admin-review-questions-desktop');
    await set('[name=questionSearch]','Câu hỏi 105');
    await evaluate(`document.querySelector('[aria-label="Thao tác với câu hỏi"]').click()`);
    await click('Xem câu hỏi');
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Đáp án đúng')`);
    await screenshot('admin-review-question-preview');
    await click('Duyệt câu hỏi');
    await set('[name=comment]','Đáp án đã kiểm tra');
    await click('Xác nhận duyệt');
    await wait(`!document.querySelector('[role=dialog]')`);
    await wait(`document.querySelectorAll('tbody tr').length===0`);
    assert.ok(await evaluate(`calls.some(c=>c.path==='/api/v1/questions/q105/approve'&&c.method==='PUT'&&c.query.comment==='Đáp án đã kiểm tra'&&c.body===null)`));
    assert.ok(await evaluate(`calls.filter(c=>c.path==='/api/v1/questions').every(c=>!('approvalStatus' in c.query))`));
    await set('[name=approvalFilter]','APPROVED');
    await wait(`document.querySelectorAll('tbody tr').length===1`);
  });
  await check('Question rejection requires a reason, keeps input after failure and removes reviewed rows', async () => {
    await set('[name=questionSearch]','Câu hỏi 25');
    await set('[name=approvalFilter]','PENDING');
    await evaluate(`document.querySelector('[aria-label="Thao tác với câu hỏi"]').click()`);
    await click('Từ chối câu hỏi');
    const count=await evaluate(`calls.filter(c=>c.path.endsWith('/reject')).length`);
    await click('Xác nhận từ chối');
    assert.equal(await evaluate(`calls.filter(c=>c.path.endsWith('/reject')).length`),count);
    await set('[name=rejectionReason]','Sai đáp án và thiếu giải thích');
    await evaluate(`window.failReview=true`);
    await click('Xác nhận từ chối');
    await wait(`document.querySelector('[role=dialog] [role=alert]')?.textContent.includes('Không thể duyệt')`);
    assert.equal(await evaluate(`document.querySelector('[name=rejectionReason]').value`),'Sai đáp án và thiếu giải thích');
    await evaluate(`window.failReview=false`);
    await click('Xác nhận từ chối');
    await wait(`!document.querySelector('[role=dialog]')`);
    await wait(`document.querySelectorAll('tbody tr').length===0`);
    assert.ok(await evaluate(`calls.some(c=>c.path==='/api/v1/questions/q25/reject'&&c.method==='PUT'&&c.body.rejectionReason==='Sai đáp án và thiếu giải thích')`));
    await set('[name=approvalFilter]','REJECTED');
    await evaluate(`document.querySelector('[aria-label="Thao tác với câu hỏi"]').click()`);
    assert.ok(await evaluate(`![...document.querySelectorAll('[role=menuitem]')].some(e=>e.textContent==='Duyệt câu hỏi'||e.textContent==='Từ chối câu hỏi')`));
    await click('Xem câu hỏi');
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Lý do từ chối: Sai đáp án')`);
    await evaluate(`document.querySelector('[role=dialog] [aria-label="Đóng"]').click()`);
  });
  await check('Review queue load failure is visible and retry restores pending rows', async () => {
    await set('[name=questionSearch]','');
    await set('[name=approvalFilter]','PENDING');
    await evaluate(`window.failQuestions=true`);
    await click('Làm mới');
    await wait(`document.body.textContent.includes('Không thể tải hàng chờ')`);
    await evaluate(`window.failQuestions=false`);
    await click('Thử lại');
    await wait(`document.querySelectorAll('tbody tr').length===2`);
  });
  await check('Rejected questions can be resubmitted from preview and disappear from the rejected filter', async () => {
    await set('[name=questionSearch]','Câu hỏi 25');
    await set('[name=approvalFilter]','REJECTED');
    await evaluate(`document.querySelector('[aria-label="Thao tác với câu hỏi"]').click()`);
    await click('Xem câu hỏi');
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Sai đáp án')`);
    await click('Gửi duyệt lại');
    await screenshot('admin-question-submit-review');
    await set('[name=comment]','Đã kiểm tra lại');
    await click('Xác nhận gửi duyệt');
    await wait(`!document.querySelector('[role=dialog]')&&document.querySelectorAll('tbody tr').length===0`);
    assert.equal(await evaluate(`window.qaQuestions.find(q=>q.questionId==='q25').approvalStatus`),'PENDING');
  });
  await check('Material review previews content, confirms approval and keeps failed approval retryable', async () => {
    await click('Học liệu');
    await wait(`document.querySelectorAll('tbody tr').length===1`);
    await screenshot('admin-review-materials-desktop');
    await click('Xem chi tiết');
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Nội dung học liệu')`);
    await click('Duyệt học liệu');
    await evaluate(`window.failReview=true`);
    await click('Duyệt học liệu');
    await wait(`document.querySelector('[role=alertdialog] [role=alert]')?.textContent.includes('Không thể duyệt')`);
    await evaluate(`window.failReview=false`);
    await click('Duyệt học liệu');
    await wait(`!document.querySelector('[role=alertdialog]')`);
    assert.ok(await evaluate(`calls.some(c=>c.method==='PUT'&&c.path==='/api/v1/topics/t1/materials/m1/approve')`));
    await evaluate(`document.querySelector('[role=dialog] [aria-label="Đóng"]').click()`);
    await wait(`document.querySelectorAll('tbody tr').length===0`);
    await set('[name=materialStatus]','APPROVED');
    await wait(`document.querySelectorAll('tbody tr').length===2`);
  });
  await check('Desktop and mobile pages render without horizontal overflow or runtime errors', async () => {
    for (const width of [1440, 390]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width === 390,
      });
      for (const route of [
        'admin_academics',
        'admin_subjects',
        'admin_classes',
        'admin_class_create',
        'admin_subject_detail?subjectId=s0',
        'admin_class_detail?classId=c0',
        'admin_materials',
      ]) {
        await go(route);
        assert.ok(
          await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),
          `${route}: ${width}px overflow`
        );
        if (width === 390) await screenshot(route.split('?')[0] + '-mobile');
        if(route==='admin_materials'){
          await click('Học liệu');
          await wait(`!document.querySelector('#root [role=status]')`);
          assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`));
          if(width===390)await screenshot('admin-review-materials-mobile');
        }
        if (route.startsWith('admin_subject_detail')) {
          for (const tab of ['Chương trình đào tạo', 'Chuẩn đầu ra (CLO)', 'Ngân hàng', 'Ma trận']) {
            await click(tab);
            await wait(`!document.querySelector('#root [role=status]')`);
            assert.ok(
              await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),
              `${tab}: ${width}px overflow`
            );
            if (width === 390 && tab === 'Chương trình đào tạo') await screenshot('curriculum-tree-mobile');
            if (width === 390 && tab === 'Chương trình đào tạo') {
              await click('Chương Cơ học (1 chủ đề)');
              await click('Động lực học');
              await click('Tạo mới học liệu');
              await set('[name=title]', 'Bản nháp mobile');
              await evaluate(`document.querySelector('[aria-label="Mở rộng toàn màn hình"]').click()`);
              await wait(`document.querySelector('[aria-label="Thu nhỏ"]')`);
              assert.ok(await evaluate(`(() => {const r=document.querySelector('[role=dialog]').getBoundingClientRect();return r.width===innerWidth&&r.height===innerHeight&&document.documentElement.scrollWidth<=innerWidth+1})()`));
              await screenshot('material-create-fullscreen-mobile');
              await evaluate(`document.querySelector('[aria-label="Thu nhỏ"]').click()`);
              await wait(`document.querySelector('[aria-label="Mở rộng toàn màn hình"]')`);
              assert.equal(await evaluate(`document.querySelector('[name=title]').value`), 'Bản nháp mobile');
              await evaluate(`document.querySelector('[role=dialog] [aria-label="Đóng"]').click()`);
              await click('Tạo mới học liệu');
              assert.ok(await evaluate(`!!document.querySelector('[aria-label="Mở rộng toàn màn hình"]')`));
              await evaluate(`document.querySelector('[role=dialog] [aria-label="Đóng"]').click()`);
            }
            if (width === 390 && tab === 'Chuẩn đầu ra (CLO)') await screenshot('clo-manager-mobile');
          }
        }
      }
    }
    assert.deepEqual(errors, []);
  });
  await writeFile(path.join(directory, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`${results.length} browser scenarios passed.`);
} finally {
  socket?.close();
  browser.kill();
}
