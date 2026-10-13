import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5194';
const dir = path.resolve('.tmp-authoring-ui/lms-spec');
await mkdir(dir, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--remote-debugging-port=9388',
    `--user-data-dir=${dir}/profile`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' }
);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let socket;
try {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    try {
      target = (await (await fetch('http://127.0.0.1:9388/json')).json()).find((r) => r.type === 'page');
    } catch {
      await delay(100);
    }
  }
  assert.ok(target, 'Chrome starts');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => socket.addEventListener('open', r, { once: true }));
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', ({ data }) => {
    const m = JSON.parse(data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
    if (pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  });
  const send = async (method, params = {}) => {
    const id = ++sequence;
    const m = await new Promise((r) => {
      pending.set(id, r);
      socket.send(JSON.stringify({ id, method, params }));
    });
    if (m.error) throw Error(JSON.stringify(m.error));
    return m.result;
  };
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const wait = async (expression) => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw Error(`Timed out: ${expression}\n${await evaluate('document.body.innerText')}`);
  };
  const go = async (route) => {
    await send('Page.navigate', { url: `${origin}/${route}` });
    await wait('document.readyState === "complete" && !!document.querySelector("h1, h2")');
    await delay(250);
  };
  const click = async (label) => {
    await evaluate(
      `(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim().endsWith(${JSON.stringify(label)}));if(!e)throw Error('Missing button '+${JSON.stringify(label)});e.click()})()`
    );
    await delay(200);
  };
  const choose = async (label, value) => {
    await evaluate(
      `(()=>{const e=[...(document.querySelector('[role=dialog]')||document).querySelectorAll('select')].find(e=>[...e.labels].some(l=>l.textContent.trim().startsWith(${JSON.stringify(label)})));if(!e)throw Error('Missing select '+${JSON.stringify(label)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}))})()`
    );
    await delay(200);
  };
  const input = async (selector, value) => {
    await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input');Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`
    );
    await delay(100);
  };
  const shot = async (name) =>
    writeFile(
      `${dir}/${name}.png`,
      Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64')
    );
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    const role=location.pathname.startsWith('/admin')?'ADMIN':(location.pathname.startsWith('/lecturer')||location.pathname.startsWith('/teacher'))?'INSTRUCTOR':'STUDENT';
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role,userId:'u1',name:'Kiểm thử'}));localStorage.setItem('ptit-physics-access-token','isolated-test');
    window.testCalls=[];window.rejectSave=false;window.confirm=()=>true;
    const cls={classId:'c1',classCode:'VL01',subjectId:'s1',subjectName:'Vật lý 1',semesterId:'sem1',status:'ACTIVE'};
    const subject={subjectId:'s1',subjectCode:'VL1',subjectName:'Vật lý 1',isActive:true};
    const chapter={chapterId:'ch1',chapterName:'Cơ học',chapterCode:'CH1',orderIndex:1,isActive:true};
    const topic={topicId:'t1',topicName:'Động lực học',chapterId:'ch1',subjectId:'s1',orderIndex:1};
    const clo={cloId:'cl1',cloCode:'CLO1',description:'Vận dụng định luật Newton',isActive:true};
    window.fetch=async(url,opts={})=>{
      const p=new URL(url,location.origin).pathname,method=opts.method||'GET';
      const body=opts.body instanceof FormData?Object.fromEntries([...opts.body].map(([k,v])=>[k,v instanceof File?{name:v.name,size:v.size}:v])):opts.body?JSON.parse(opts.body):null;
      testCalls.push({p,method,body});
      if(window.failEnrollOnce && p.endsWith('/enroll-bulk')){window.failEnrollOnce=false;return Response.json({message:'Ghi danh thất bại từ BE'},{status:400});}
      if(rejectSave && method!=='GET')return Response.json({status:400,message:'Lỗi BE đã định dạng: dữ liệu không hợp lệ',data:null},{status:400});
      let data=[];
      if(p==='/api/v1/classes'&&method==='POST')data={...cls,...body};
      if(p==='/api/v1/users/me')data={userId:'u1',username:'test',role};
      if(p==='/api/v1/users/me/profile')data={fullName:'Kiểm thử'};
      if(p==='/api/v1/notifications/summary')data={unreadCount:0};
      if(p==='/api/v1/subjects/s1')data=subject;
      if(p==='/api/v1/topics/t1/materials'||p==='/api/v1/topics/t2/materials')data=[];
      if(p==='/api/v1/subjects')data={content:[subject],last:true};
      if(p==='/api/v1/semesters')data=[{semesterId:'sem1',semesterName:'Kỳ 1',semesterCode:'2026-1'}];
      if(['/api/v1/instructor/classes','/api/v1/classes','/api/v1/students/me/classes'].includes(p))data=method==='POST'?{...cls,...body}:{content:[cls],last:true};
      if(['/api/v1/instructor/classes/c1','/api/v1/classes/c1'].includes(p))data=cls;
      if(p==='/api/v1/subjects/s1/chapters')data=method==='GET'?[chapter]:{...chapter,...body};
      if(p==='/api/v1/subjects/s1/topics')data=[topic,{topicId:'t2',topicName:'Chủ đề cũ',subjectId:'s1'}];
      if(p==='/api/v1/subjects/s1/clos')data=method==='GET'?[clo]:{...clo,...body};
      if(p==='/api/v1/instructor/classes/c1/settings')data=method==='GET'?{classId:'c1',practiceEnabled:true,quizEnabled:true,maxPracticeAttempts:10,practiceShowSolution:true}:body;
      if(p==='/api/v1/instructor/classes/c1/weak-topics-summary')data={topics:[{topicName:topic.topicName,studentsNeedingPractice:3,averageAccuracyRate:55}]};
      if(p==='/api/v1/classes/c1/materials')data=[{materialId:'m1',topicId:'t1',title:'Học liệu chung',type:'TEXT',contentText:'Nội dung chuẩn của môn',scope:'SHARED',approvalStatus:'APPROVED',createdBy:'admin'}, {materialId:'m2',topicId:'t1',title:'Học liệu riêng',type:'TEXT',contentText:'Nội dung riêng của lớp',scope:'CLASS',classId:'c1',approvalStatus:'APPROVED',createdBy:'u1'}];
      if(p==='/api/v1/classes/c1/topics/t1/materials')data={materialId:'m3',...body,approvalStatus:'PENDING'};
      if(p==='/api/v1/students/me/progress'){if(method==='PUT')localStorage.setItem('qa-topic-progress',JSON.stringify([{...body,status:'COMPLETED'}]));data=JSON.parse(localStorage.getItem('qa-topic-progress')||'[]');}
      if(p==='/api/v1/questions')data=method==='GET'?{content:[{questionId:'q1',content:'Câu hỏi nháp',approvalStatus:'DRAFT',subjectId:'s1'}],last:true,totalElements:1}:{questionId:'q2',...body};
      if(p==='/api/v1/questions/q1/submit-review')data={questionId:'q1',content:'Câu hỏi nháp',approvalStatus:'PENDING',subjectId:'s1'};
      if(p==='/api/v1/users/admin/users')data={content:[{userId:'u1',username:'Giảng viên',role:'INSTRUCTOR'},{userId:'sv1',username:'Sinh viên',role:'STUDENT'}],last:true};
      const matrix={matrixId:'mx1',matrixName:'FINAL mẫu',subjectId:'s1',subjectName:'Vật lý 1',examType:'FINAL',matrixFamilyId:'fam1',revisionNumber:1,matrixStatus:'PUBLISHED',isLocked:true,details:[{topicId:'t1',cloId:'cl1',difficultyLevel:'MEDIUM',numQuestions:1,weightPercent:100}]};
      if(p==='/api/v1/admin/exam-matrices')data=[matrix];
      if(p==='/api/v1/admin/exam-matrices/final')data={...matrix,...body,matrixId:'mx2',matrixStatus:'DRAFT',isLocked:false};
      if(p==='/api/v1/admin/exam-matrices/mx1/validate')data={matrixId:'mx1',valid:true,totalRequired:1,totalAvailable:5,items:[],warnings:[]};
      if(p==='/api/v1/admin/exams/bulk-provision-final')data={matrixId:'mx1',totalClassesRequested:1,totalClassesProvisioned:1,createdExams:[{examId:'e1',classId:'c1',title:body.title||'FINAL mẫu',startTime:body.startTime}]};
      const practiceQuestions=[{questionId:'pq1',questionType:'FILL_BLANK',content:'Gia tốc bằng ___',topicName:'Động lực học',options:[],acceptedAnswers:null,answerText:null},{questionId:'pq2',questionType:'MCQ_SINGLE',content:'Đơn vị lực',topicName:'Động lực học',options:[{optionId:'po1',content:'N',isCorrect:null},{optionId:'po2',content:'kg',isCorrect:null}]}];
      if(p==='/api/v1/student/classes/c1/weak-topics')return Response.json([{topicId:'t1',topicName:'Động lực học',accuracyRate:50,hasEnoughData:true,weaknessLevel:'NEEDS_PRACTICE'}]);
      if(p==='/api/v1/student/classes/c1/practice-recommendations'){localStorage.removeItem('qa-practice-answers');localStorage.removeItem('qa-practice-completed');return Response.json({sessionId:'ps1',classId:'c1',status:'IN_PROGRESS',totalQuestions:2,questions:practiceQuestions});}
      if(p==='/api/v1/student/practice-sessions/ps1/answers') { await new Promise(r=>setTimeout(r,80));const answers=JSON.parse(localStorage.getItem('qa-practice-answers')||'{}');answers[body.questionId]=body;localStorage.setItem('qa-practice-answers',JSON.stringify(answers));return new Response(null,{status:200}); }
      if(p==='/api/v1/student/practice-sessions/ps1/submit')localStorage.setItem('qa-practice-completed','yes');
      if(p.startsWith('/api/v1/student/practice-sessions/ps1')) {const completed=localStorage.getItem('qa-practice-completed')==='yes';const answers=JSON.parse(localStorage.getItem('qa-practice-answers')||'{}');const questions=practiceQuestions.map(q=>({...q,...answers[q.questionId],...(completed?{isCorrect:true,acceptedAnswers:q.questionType==='FILL_BLANK'?['9.8']:null}:{})}));return Response.json({sessionId:'ps1',classId:'c1',status:completed?'COMPLETED':'IN_PROGRESS',totalQuestions:2,questions,...(completed?{correctCount:2,wrongCount:0,totalScore:2,accuracyRate:100,updatedWeakTopics:[]}: {})}); }
      const submitted=localStorage.getItem('qa-exam-submitted')==='yes';const exam={examId:'e1',title:'Bài kiểm tra',classId:'c1',examType:'QUIZ',totalQuestions:2,durationMinutes:45};const examAttempt={attemptId:'a1',examId:'e1',status:submitted?'GRADED':'IN_PROGRESS',totalScore:submitted?2:null,startedAt:new Date().toISOString(),...(submitted?{submittedAt:new Date().toISOString()}: {})};
      if(p==='/api/v1/exams/e1')data=exam;
      if(p==='/api/v1/exams/e1/attempt-policy')data={canStartAttempt:!submitted,hasInProgressAttempt:!submitted,currentAttemptId:'a1',remainingAttempts:1};
      if(p==='/api/v1/exams/e1/my-attempts')data=[examAttempt];
      if(p==='/api/v1/exams/attempts/a1')data=examAttempt;
      if(p==='/api/v1/exams/attempts/a1/questions'){const answers=JSON.parse(localStorage.getItem('qa-exam-answers')||'{}');data=practiceQuestions.map((q,i)=>({...q,...answers[q.questionId],orderIndex:i+1,isCorrect:submitted?true:null}));}
      if(p==='/api/v1/exams/attempts/a1/progress')data={attemptId:'a1',remainingSeconds:900,isExpired:false,totalQuestions:2,answeredQuestions:0};
      if(p==='/api/v1/exams/attempts/a1/answers'){await new Promise(r=>setTimeout(r,100));const answers=JSON.parse(localStorage.getItem('qa-exam-answers')||'{}');answers[body.questionId]=body;localStorage.setItem('qa-exam-answers',JSON.stringify(answers));data=null;}
      if(p==='/api/v1/exams/attempts/a1/autosave'){localStorage.setItem('qa-autosave',JSON.stringify(body));data={savedCount:body.answers.length};}
      if(p==='/api/v1/exams/attempts/a1/submit'){localStorage.setItem('qa-exam-submitted','yes');data={...examAttempt,status:'GRADED',totalScore:2,submittedAt:new Date().toISOString()};}
      return Response.json({status:200,data});
    };
  `,
  });
  await go('admin/subjects');
  await wait(`[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='/admin/subjects/s1/curriculum')`);
  await evaluate(`[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/admin/subjects/s1/curriculum').click()`);
  await wait('location.pathname==="/admin/subjects/s1/curriculum" && document.body.innerText.includes("Cơ học")');
  await click('Thêm chương');
  await input('input[name=chapterCode]', 'CH2');
  await input('input[name=chapterName]', 'Điện học');
  await click('Lưu');
  assert.equal(await evaluate('testCalls.find(c=>c.method==="POST"&&c.p.endsWith("/chapters")).body.subjectId'),'s1');
  await go('admin/subjects/s1/banks');
  await click('Thêm câu hỏi');
  await choose('Chủ đề','t1');
  await choose('Loại câu hỏi','FILL_BLANK');
  await input('textarea[name=content]','Lực bằng ___');
  await input('textarea[name=acceptedAnswers]','10\n10 N');
  await evaluate('window.rejectSave=true');
  await click('Lưu thay đổi');
  await wait('document.querySelector("[role=dialog]")?.innerText.includes("Lỗi BE đã định dạng: dữ liệu không hợp lệ")');
  assert.equal(await evaluate('document.querySelectorAll("[role=alert]").length'),1);
  await evaluate('window.rejectSave=false');
  await click('Lưu thay đổi');
  await wait('!document.querySelector("[role=dialog]")');
  const body=await evaluate('testCalls.filter(c=>c.method==="POST"&&c.p==="/api/v1/questions").at(-1).body');
  assert.equal(body.subjectId,'s1'); assert.equal(body.topicId,'t1'); assert.equal(body.questionType,'FILL_BLANK');
  await go('admin/classes/new');
  await choose('Học kỳ','sem1');await choose('Môn học','s1');await choose('Giảng viên','u1');
  await click('Tiếp tục');
  await evaluate('document.querySelector("input[type=checkbox]").click()');
  await click('Tiếp tục');
  await evaluate('window.failEnrollOnce=true');
  await click('Tạo lớp');
  await wait('document.body.innerText.includes("Ghi danh thất bại từ BE")');
  assert.equal(await evaluate('testCalls.filter(c=>c.p==="/api/v1/classes"&&c.method==="POST").length'),1);
  await click('Thử lại ghi danh');
  await wait('location.pathname==="/admin/classes/c1"');
  await go('teacher/classes/c2');
  await wait('document.body.innerText.includes("Bạn không có quyền mở trang này")');
  assert.equal(await evaluate('testCalls.some(c=>c.p==="/api/v1/instructor/classes/c2")'),false);
  await go('student/classes/c1/learn/t1');
  await wait('document.body.innerText.includes("Nội dung chuẩn của môn")');
  assert.equal(await evaluate('testCalls.some(c=>c.p==="/api/v1/classes/c1")'),false,'student avoids forbidden class detail endpoint');
  assert.equal(await evaluate('document.body.innerText.includes("Nội dung riêng của lớp")'),false);
  await evaluate('window.rejectSave=true');
  await click('Đánh dấu hoàn thành');
  await wait('document.body.innerText.includes("Lỗi BE đã định dạng")');
  assert.equal(await evaluate('document.querySelector("[data-testid=overall-progress]").innerText'),'Tiến trình 0%');
  await evaluate('window.rejectSave=false');await click('Đánh dấu hoàn thành');
  await wait('document.querySelector("[data-testid=overall-progress]")?.innerText==="Tiến trình 50%"');
  const progressBody=await evaluate('testCalls.filter(c=>c.p==="/api/v1/students/me/progress"&&c.method==="PUT").at(-1).body');
  assert.deepEqual(progressBody,{classId:'c1',topicId:'t1',progressPercent:100});
  await click('Học liệu của GV');await wait('document.body.innerText.includes("Học liệu riêng")');
  assert.equal(await evaluate('document.body.innerText.includes("Nội dung chuẩn của môn")'),false);
  await go('student/classes/c1/learn/t1');
  await wait('document.querySelector("[data-testid=overall-progress]")?.innerText==="Tiến trình 50%"');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await click('Chương và chủ đề');
  await wait('!!document.querySelector("[role=dialog]")');
  await shot('student-topic-mobile');await evaluate(`document.querySelector('[aria-label="Đóng"]').click()`);
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'student mobile overflow');
  await go('admin/subjects/s1/curriculum');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await shot('curriculum-mobile');
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'mobile overflow');
  assert.deepEqual(errors,[],'browser runtime errors');
  console.log('PASS: nested routes, subject curriculum, question payload, BE error dialog, class guard, mobile');
} finally {socket?.close();browser.kill();}
