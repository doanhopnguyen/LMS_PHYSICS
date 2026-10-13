import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5194';
const dir = path.resolve('.tmp-authoring-ui/backend-alignment');
await mkdir(dir, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--remote-debugging-port=9387',
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
      target = (await (await fetch('http://127.0.0.1:9387/json')).json()).find((r) => r.type === 'page');
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
      `(()=>{const e=[...document.querySelectorAll('select')].find(e=>[...e.labels].some(l=>l.textContent.trim().startsWith(${JSON.stringify(label)})));if(!e)throw Error('Missing select '+${JSON.stringify(label)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}))})()`
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
    const role=location.pathname.startsWith('/admin')?'ADMIN':location.pathname.startsWith('/lecturer')?'INSTRUCTOR':'STUDENT';
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
      if(rejectSave && method!=='GET')return Response.json({status:400,message:'Lỗi BE đã định dạng: dữ liệu không hợp lệ',data:null},{status:400});
      let data=[];
      if(p==='/api/v1/users/me')data={userId:'u1',username:'test',role};
      if(p==='/api/v1/users/me/profile')data={fullName:'Kiểm thử'};
      if(p==='/api/v1/notifications/summary')data={unreadCount:0};
      if(p==='/api/v1/subjects')data={content:[subject],last:true};
      if(p==='/api/v1/semesters')data=[{semesterId:'sem1',semesterName:'Kỳ 1'}];
      if(['/api/v1/instructor/classes','/api/v1/classes','/api/v1/students/me/classes'].includes(p))data={content:[cls],last:true};
      if(['/api/v1/instructor/classes/c1','/api/v1/classes/c1'].includes(p))data=cls;
      if(p==='/api/v1/subjects/s1/chapters')data=method==='GET'?[chapter]:{...chapter,...body};
      if(p==='/api/v1/subjects/s1/topics')data=[topic,{topicId:'t2',topicName:'Chủ đề cũ',subjectId:'s1'}];
      if(p==='/api/v1/subjects/s1/clos')data=method==='GET'?[clo]:{...clo,...body};
      if(p==='/api/v1/instructor/classes/c1/settings')data=method==='GET'?{classId:'c1',practiceEnabled:true,quizEnabled:true,maxPracticeAttempts:10,practiceShowSolution:true}:body;
      if(p==='/api/v1/instructor/classes/c1/weak-topics-summary')data={topics:[{topicName:topic.topicName,studentsNeedingPractice:3,averageAccuracyRate:55}]};
      if(p==='/api/v1/classes/c1/materials')data=[{materialId:'m1',topicId:'t1',title:'Học liệu chung',scope:'SHARED',approvalStatus:'APPROVED',createdBy:'admin'}, {materialId:'m2',topicId:'t1',title:'Học liệu riêng',scope:'CLASS',classId:'c1',approvalStatus:'PENDING',createdBy:'u1'}];
      if(p==='/api/v1/classes/c1/topics/t1/materials')data={materialId:'m3',...body,approvalStatus:'PENDING'};
      if(p==='/api/v1/questions')data=method==='GET'?{content:[{questionId:'q1',content:'Câu hỏi nháp',approvalStatus:'DRAFT',subjectId:'s1'}],last:true,totalElements:1}:{questionId:'q2',...body};
      if(p==='/api/v1/questions/q1/submit-review')data={questionId:'q1',content:'Câu hỏi nháp',approvalStatus:'PENDING',subjectId:'s1'};
      if(p==='/api/v1/users/admin/users')data={content:[{userId:'u1',username:'Giảng viên',role:'INSTRUCTOR'}],last:true};
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
  await go('admin_academics');
  await click('Chương');
  await choose('Môn học', 's1');
  await wait('document.body.innerText.includes("Cơ học")');
  await shot('admin-curriculum');
  assert.ok(await evaluate('document.body.innerText.includes("Chủ đề cũ")'));
  await click('Thêm chương');
  await input('input[name=chapterCode]', 'CH2');
  await input('input[name=chapterName]', 'Điện học');
  await click('Lưu');
  assert.equal(
    await evaluate('testCalls.find(c=>c.method==="POST"&&c.p.endsWith("/chapters")).body.chapterName'),
    'Điện học'
  );
  await go('admin_academics');
  await click('Lớp học');
  await click('Tạo lớp');
  await input('input[name=classCode]', 'VL02');
  await choose('Môn học', 's1');
  await choose('Học kỳ', 'sem1');
  await choose('Giảng viên', 'u1');
  await wait('document.body.innerText.includes("Cơ học")');
  await click('Lưu lớp');
  assert.equal(await evaluate('testCalls.find(c=>c.method==="POST"&&c.p==="/api/v1/classes").body.instructorId'), 'u1');
  await go('admin_assessments');
  await wait('document.body.innerText.includes("FINAL mẫu")');
  assert.equal(await evaluate('[...document.querySelectorAll("button")].some(e=>e.textContent.trim()==="Sửa")'), false);
  await choose('Môn học', 's1');
  await click('Tạo ma trận FINAL');
  await input('input[name=matrixName]', 'FINAL mới');
  await choose('Chủ đề', 't1');
  await choose('CLO', 'cl1');
  await click('Lưu ma trận');
  assert.equal(
    await evaluate('testCalls.find(c=>c.method==="POST"&&c.p.endsWith("/final")).body.details[0].cloId'),
    'cl1'
  );
  await click('Cấp phát');
  await wait('!!document.querySelector("fieldset input[type=checkbox]")');
  await evaluate('document.querySelector("fieldset input[type=checkbox]").click()');
  await input('input[name=durationMinutes]', '45');
  await input('input[name=startTime]', '2026-11-01T08:00');
  await input('input[name=endTime]', '2026-11-01T09:00');
  await click('Xem lại');
  await click('Xác nhận cấp phát');
  await wait('document.body.innerText.includes("Đã cấp phát")');
  const provision = await evaluate('testCalls.find(c=>c.p.endsWith("bulk-provision-final")).body');
  assert.deepEqual(provision.classIds, ['c1']);
  assert.equal(provision.autoGenerateQuestions, true);
  assert.ok(provision.startTime.endsWith('Z'));
  await shot('admin-final-provision');
  await go('admin_questions');
  await click('Tạo câu hỏi');
  await choose('Học phần *', 's1');
  await choose('Chủ đề *', 't1');
  await choose('Loại câu hỏi', 'FILL_BLANK');
  await input('textarea[name=content]', 'Gia tốc bằng ___');
  await input('textarea[name=acceptedAnswers]', '9,8\n9.8');
  await evaluate('document.querySelector("fieldset input[type=checkbox]").click()');
  await click('Lưu thay đổi');
  const question = await evaluate('testCalls.find(c=>c.method==="POST"&&c.p==="/api/v1/questions").body');
  assert.deepEqual(question.acceptedAnswers, ['9,8', '9.8']);
  assert.deepEqual(question.cloIds, ['cl1']);
  assert.deepEqual(question.options, []);
  await go('lecturer_course_detail?classId=c1');
  await click('Chương trình');
  await wait('document.body.innerText.includes("Cơ học")');
  await click('Cấu hình đánh giá');
  await wait('!!document.querySelector("input[type=number]")');
  await input('input[type=number]', '6');
  await click('Lưu cấu hình');
  assert.equal(
    await evaluate('testCalls.find(c=>c.method==="PUT"&&c.p.endsWith("/settings")).body.maxPracticeAttempts'),
    6
  );
  await click('Chủ đề cần hỗ trợ');
  await wait('document.body.innerText.includes("55%")');
  await shot('instructor-weak-topics');
  await go('lecturer_material_create?classId=c1');
  await wait('!!document.querySelector("textarea[name=contentText]")');
  await choose('Chủ đề', 't1');
  await input('input[name=title]', 'Bài lớp');
  await input('textarea[name=contentText]', '# Bài học');
  await evaluate('rejectSave=true');
  await click('Lưu học liệu');
  await wait('document.body.innerText.includes("Lỗi BE đã định dạng: dữ liệu không hợp lệ")');
  assert.equal(await evaluate('document.querySelector("textarea[name=contentText]").value'), '# Bài học');
  await evaluate('rejectSave=false');
  await click('Lưu học liệu');
  await wait('location.pathname==="/lecturer_materials"');
  await go('lecturer_materials?classId=c1');
  await wait('document.body.innerText.includes("Học liệu chung")');
  assert.equal(
    await evaluate('[...document.querySelectorAll("button")].filter(e=>e.textContent.trim()==="Sửa").length'),
    1
  );
  assert.equal(await evaluate('!!document.querySelector("a[href*=lecturer_question_bank]")'), false);
  await go('exam_session?examId=e1&attemptId=a1&mode=take');
  await wait('!!document.querySelector("input[type=text]")');
  await input('input[type=text]', '9,8');
  await evaluate('document.querySelector("input[type=text]").focus()');
  await click('Nộp bài');
  await wait('location.pathname==="/exam_results"');
  const autoSave = await evaluate('JSON.parse(localStorage.getItem("qa-autosave"))');
  assert.equal(autoSave.answers.find((q) => q.questionId === 'pq1').answerText, '9,8');
  await go('exam_practice_center');
  await choose('Lớp học', 'c1');
  await click('Bắt đầu luyện tập');
  await wait('location.pathname==="/practice_session" && !!document.querySelector("input[type=text]")');
  await input('input[type=text]', '9,8');
  await evaluate('document.querySelector("input[type=radio]").click()');
  await click('Nộp luyện tập');
  await wait('document.body.innerText.includes("Đã hoàn thành")');
  const answers = await evaluate('JSON.parse(localStorage.getItem("qa-practice-answers"))');
  assert.equal(answers.pq1.answerText, '9,8');
  assert.deepEqual(answers.pq2.selectedOptionIds, ['po1']);
  assert.equal(await evaluate('testCalls.filter(c=>c.p.endsWith("/submit")).length'), 1);
  await shot('adaptive-results');
  await go('practice_session?sessionId=ps1&classId=c1');
  await wait('document.body.innerText.includes("2/2 câu đúng")');
  assert.equal(await evaluate('document.querySelectorAll("input[type=radio]").length'), 0);
  await go('lecturer_materials?classId=c1');
  await wait('document.body.innerText.includes("Học liệu chung")');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await shot('instructor-materials-mobile');
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 2'), 'mobile has no page overflow');
  assert.deepEqual(errors, [], 'no browser runtime errors');
  console.log(
    'PASS: curriculum, FILL_BLANK/CLO payload, settings, weak topics, CLASS authoring/ownership, backend errors, mobile layout'
  );
} finally {
  socket?.close();
  browser.kill();
}
