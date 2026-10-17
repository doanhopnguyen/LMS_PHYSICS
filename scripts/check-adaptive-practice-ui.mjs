import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5197';
const directory = path.resolve('.tmp-adaptive-practice');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9478',
    `--user-data-dir=${path.join(directory, `chrome-${process.pid}`)}`,
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
      target = (await (await fetch('http://127.0.0.1:9478/json')).json()).find((t) => t.type === 'page');
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
    for (let i = 0; i < 200; i++) {
      if (await evaluate('Boolean(' + expression + ')')) return;
      await pause(100);
    }
    throw new Error(
      `Timed out: ${expression} ${JSON.stringify(await evaluate('({url:location.href,text:document.body.innerText,calls:testCalls.slice(-8)})'))}`
    );
  };
  const go = async (route) => {
    await send('Page.navigate', { url: `${origin}/${route}` });
    await wait(`document.querySelector('#root')?.textContent.length > 100`);
    await pause(200);
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
  await send('Emulation.setTimezoneOverride', { timezoneId: 'Asia/Saigon' });
  socket.addEventListener('message', ({ data }) => {
    if (JSON.parse(data).method === 'Page.javascriptDialogOpening')
      socket.send(JSON.stringify({ id: 999999, method: 'Page.handleJavaScriptDialog', params: { accept: true } }));
  });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: String.raw`
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'STUDENT',userId:'student1'}));
    localStorage.setItem('ptit-physics-access-token','test-token');
    window.confirm=()=>true;window.testCalls=[];
    const scenario=new URLSearchParams(location.search).get('scenario');
    const topics=[
      {topicId:'t1',topicName:'Định luật Newton',chapterName:'Động lực học',wrongCount:6,correctCount:4,totalAnswered:10,accuracyRate:.4,weaknessLevel:'NEEDS_PRACTICE',hasEnoughData:true,recommendation:'Luyện lại cách xác định lực tác dụng lên vật.'},
      {topicId:'t2',topicName:'Công và năng lượng',chapterName:'Cơ học',wrongCount:2,correctCount:8,totalAnswered:10,accuracyRate:.8,weaknessLevel:'IMPROVING',hasEnoughData:true,recommendation:'Tiếp tục vận dụng định luật bảo toàn năng lượng.'},
      {topicId:'t3',topicName:'Dao động cơ',chapterName:'Dao động',wrongCount:0,totalAnswered:0,accuracyRate:0,weaknessLevel:'INSUFFICIENT_DATA',hasEnoughData:false,recommendation:'Làm thêm câu hỏi để có đủ dữ liệu đánh giá.'}
    ];
    const baseQuestions=[
      {questionId:'q1',content:'Đơn vị của lực là gì?',questionType:'MCQ_SINGLE',isReviewed:true,topicName:'Định luật Newton',options:[{optionId:'a',content:'Newton'},{optionId:'b',content:'Joule'}]},
      {questionId:'q2',content:'Chọn các đại lượng vectơ.',questionType:'MCQ_MULTI',options:[{optionId:'c',content:'Vận tốc'},{optionId:'d',content:'Gia tốc'},{optionId:'e',content:'Khối lượng'}]},
      {questionId:'q3',content:'Lực là đại lượng vectơ.',questionType:'TRUE_FALSE',options:[{optionId:'f',content:'Đúng'},{optionId:'g',content:'Sai'}]},
      {questionId:'q4',content:'Gia tốc rơi tự do có giá trị xấp xỉ bao nhiêu?',questionType:'SHORT_ANSWER',options:[]}
    ];
    let session=JSON.parse(localStorage.getItem('test-adaptive-session')||'null');
    function results(){return {sessionId:'p1',status:'COMPLETED',totalQuestions:4,correctCount:2,wrongCount:2,totalScore:2,accuracyRate:.5,updatedWeakTopics:topics,questions:session.questions.map((q,i)=>({...q,isCorrect:scenario==='hidden'?null:i<2,acceptedAnswers:q.questionType==='SHORT_ANSWER'&&scenario!=='hidden'?['9.8']:null,options:q.options.map((o,index)=>({...o,isCorrect:scenario==='hidden'?null:index===0}))}))};}
    window.fetch=async(input,options={})=>{
      const p=new URL(input,location.origin).pathname,m=options.method||'GET',body=options.body?JSON.parse(options.body):null;
      testCalls.push({path:p,method:m,body,query:new URL(input,location.origin).search});let data=[];
      if(p==='/api/v1/users/me')data={userId:'student1',role:'STUDENT',username:'student'};
      if(p.endsWith('/profile'))data={fullName:'Sinh viên kiểm thử'};
      if(p==='/api/v1/semesters')data=[{semesterId:'sem1',semesterName:'Học kỳ 1'},{semesterId:'sem2',semesterName:'Học kỳ 2'},{semesterId:'sem3',semesterName:'Học kỳ 3'}];
      if(p==='/api/v1/student/classes'||p==='/api/v1/students/my-classes'||p==='/api/v1/students/me/classes')data=[{classId:'c1',subjectId:'s1',semesterId:'sem1',subjectName:'Vật lý 1',classCode:'VL01'},{classId:'c2',subjectId:'s2',semesterId:'sem2',subjectName:'Physics 2',classCode:'VL02'}];
      if(p==='/api/v1/students/me/schedule')data=[{scheduleId:'sch1',classId:'c1',semesterId:'sem1',classCode:'VL01',subjectName:'Vật lý 1',dayOfWeek:2,startTime:'07:00',endTime:'09:00'},{scheduleId:'sch2',classId:'c2',semesterId:'sem2',classCode:'VL02',subjectName:'Physics 2',dayOfWeek:3,startTime:'09:00',endTime:'11:00'}];
      if(scenario==='examfilters'){
        if(p==='/api/v1/exams/class/c1')data=[{examId:'e1',classId:'c1',title:'Kiểm tra Vật lý 1',examType:'QUIZ',status:'PUBLISHED'}];
        if(p==='/api/v1/exams/class/c2')data=[{examId:'e2',classId:'c2',title:'Kiểm tra Physics 2',examType:'MIDTERM',status:'PUBLISHED'}];
        if(p==='/api/v1/exams/my-transferred-exams')data=[{examId:'e3',classId:'c2',title:'Đề được chuyển lớp 2',examType:'QUIZ',status:'PUBLISHED'}];
      }
      if(p.endsWith('/weak-topics'))data=scenario==='empty'?[]:topics;
      if(p.endsWith('/practice-recommendations')){
        await new Promise(r=>setTimeout(r,100));
        if(scenario==='locked')return Response.json({message:'Hoạt động luyện tập hiện đang bị khóa đối với lớp này'},{status:400});
        session={sessionId:'p1',classId:p.split('/')[5],status:'IN_PROGRESS',totalQuestions:4,questions:baseQuestions,isDeficient:true,deficiencyNotice:'Chủ đề cần ôn tập chỉ có 4/10 câu hỏi khả dụng.'};
        localStorage.setItem('test-adaptive-session',JSON.stringify(session));data=session;
      }
      if(p==='/api/v1/student/practice-sessions/p1')data=session;
      if(p.endsWith('/p1/answers')){
        if(scenario==='savefail')return Response.json({message:'Save unavailable'},{status:503});
        await new Promise(r=>setTimeout(r,80));Object.assign(session.questions.find(q=>q.questionId===body.questionId),body);localStorage.setItem('test-adaptive-session',JSON.stringify(session));
        return new Response(null,{status:200});
      }
      if(p.endsWith('/p1/submit')){session.status='COMPLETED';localStorage.setItem('test-adaptive-session',JSON.stringify(session));data=results();}
      if(p.endsWith('/p1/results'))data=results();
      return Response.json(data);
    };
  `,
  });
  const set = async (selector, value) => {
    await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`
    );
    await pause(40);
  };
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    await go('exam_practice_center?class=c1');
    await wait(`document.querySelectorAll('[role=tab]').length===2`);
    assert.equal(
      await evaluate(
        `Array.from(document.querySelectorAll('[role=tabpanel] button')).some(button=>button.textContent.trim()==='Tải lại')`
      ),
      false
    );
    assert.equal(
      await evaluate(`document.querySelector('[role=tab][aria-selected=true]').textContent`),
      'Đề luyện của giảng viên'
    );
    assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/weak-topics'))`), false);
    await evaluate(`document.querySelectorAll('[role=tab]')[1].click()`);
    await wait(`document.querySelector('[role=tab][aria-selected=true]')?.textContent==='Gợi ý luyện tập'`);
    await wait(`document.querySelectorAll('.adaptive-topic').length===3`);
    assert.equal(await evaluate(`document.querySelector('.adaptive-practice').classList.contains('card')`), false);
    assert.equal(await evaluate(`document.querySelectorAll('.adaptive-topic > .stat-card').length`), 3);
    assert.equal(
      await evaluate(`document.body.textContent.includes('Ưu tiên chủ đề cần củng cố; kết hợp câu mới')`),
      false
    );
    assert.equal(
      await evaluate(`getComputedStyle(document.querySelector('.adaptive-practice__preferences input')).borderRadius`),
      '50%'
    );
    assert.equal(await evaluate(`document.querySelectorAll('select[name=adaptiveClassId]').length`), 0);
    assert.equal(await evaluate(`document.querySelector('.adaptive-topic__status').textContent`), 'Cần củng cố');
    assert.equal(
      await evaluate(
        `document.querySelectorAll('.adaptive-topic')[2].textContent.includes('Chưa đủ dữ liệu đánh giá')`
      ),
      true
    );
    await screenshot('recommendations-' + width);
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
    await set('select[name=adaptiveQuestionCount]', '10');
    await evaluate(
      `document.querySelector('.adaptive-topic button').click();document.querySelector('.adaptive-topic button')?.click()`
    );
    await wait(`document.querySelector('.exam-taking-question')`);
    const creation = await evaluate(`testCalls.filter(c=>c.path.endsWith('/practice-recommendations'))`);
    assert.equal(creation.length, 1);
    assert.deepEqual(creation[0].body, { questionCount: 10, topicId: 't1', allowExpandedSubjectTopics: false });
    await wait(`document.querySelector('.adaptive-session__info')`);
    await evaluate(`document.querySelector('.question-response input').click()`);
    await wait(`testCalls.some(c=>c.path.endsWith('/answers')&&c.body.selectedOptionIds?.includes('a'))`);
    await wait(`document.querySelector('.question-response__save')?.textContent===''`);
    await send('Page.reload');
    await wait(`document.querySelector('.question-response input')?.checked===true`);
    assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/practice-recommendations'))`), false);
    await evaluate(`document.querySelectorAll('.exam-taking-question-grid button')[1].click()`);
    await wait(`document.querySelector('.question-response input')?.type==='checkbox'`);
    await evaluate(
      `document.querySelectorAll('.question-response input')[0].click();document.querySelectorAll('.question-response input')[1].click()`
    );
    await wait(`testCalls.some(c=>c.body?.questionId==='q2'&&c.body.selectedOptionIds.length===2)`);
    await evaluate(`document.querySelectorAll('.exam-taking-question-grid button')[2].click()`);
    await wait(`document.querySelector('.question-response__choices[data-binary=true]')`);
    await evaluate(`document.querySelector('.question-response input').click()`);
    await screenshot('practice-binary-' + width);
    await evaluate(`document.querySelector('.exam-taking-question-heading button').click()`);
    assert.equal(
      await evaluate(`document.querySelector('.exam-taking-question-heading button').getAttribute('aria-pressed')`),
      'true'
    );
    await evaluate(`document.querySelectorAll('.exam-taking-view-toggle button')[1].click()`);
    await wait(`document.querySelectorAll('.exam-taking-question').length===4`);
    await evaluate(`document.querySelectorAll('.exam-taking-view-toggle button')[0].click()`);
    await wait(`document.querySelectorAll('.exam-taking-question').length===1`);
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
    assert.equal(
      await evaluate(`getComputedStyle(document.querySelector('.exam-taking-navigator')).position`),
      'fixed'
    );

    await evaluate(`document.querySelectorAll('.exam-taking-question-grid button')[3].click()`);
    await wait(`document.querySelector('.question-response__text input')`);
    await set('.question-response__text input', '9.8');
    await screenshot('practice-short-' + width);
    await evaluate(`document.querySelector('[data-action=submit-practice]').click()`);
    await wait(`document.querySelector('.adaptive-result-summary')`);
    assert.equal(
      await evaluate(`document.querySelector('.adaptive-result-summary').textContent.includes('50%')`),
      true
    );
    assert.equal(await evaluate(`testCalls.filter(c=>c.path.endsWith('/submit')).length`), 1);
    assert.equal(
      await evaluate(
        `testCalls.some(c=>c.path.endsWith('/answers')&&c.body.questionId==='q4'&&c.body.answerText==='9.8')`
      ),
      true
    );
    assert.equal(
      await evaluate(`testCalls.some(c=>c.body?.isCorrect!==undefined||c.body?.totalScore!==undefined)`),
      false
    );
    await screenshot('practice-results-' + width);
    await send('Page.reload');
    await wait(`document.querySelector('.adaptive-result-summary')`);
    assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/results'))`), true);
    assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/submit'))`), false);
    assert.equal(await evaluate(`Boolean(document.querySelector('.adaptive-session__toolbar'))`), false);
    await evaluate(`document.querySelector('.header-back-button').click()`);
    await wait(`document.querySelector('[role=tab][aria-selected=true]')?.textContent==='Gợi ý luyện tập'`);
    await send('Page.reload');
    await wait(`document.querySelector('[role=tab][aria-selected=true]')?.textContent==='Gợi ý luyện tập'`);
    await evaluate(`document.querySelector('[role=tab]').click()`);
    await wait(`document.querySelector('[role=tab][aria-selected=true]')?.textContent==='Đề luyện của giảng viên'`);
    assert.equal(await evaluate(`Boolean(document.querySelector('.adaptive-practice'))`), false);
    console.log(`PASS: ${width}px recommendations, scoped creation, resume, all answer types and backend results`);
  }
  await go('exam_practice_center?practiceSessionId=p1&scenario=hidden');
  await wait(`document.querySelector('.adaptive-result-summary')`);
  assert.equal(
    await evaluate(`document.querySelector('.adaptive-result-list').textContent.includes('Đáp án được chấp nhận')`),
    false
  );
  assert.equal(
    await evaluate(`document.querySelector('.adaptive-result-list').textContent.includes('theo cấu hình của lớp học')`),
    true
  );
  await go('exam_practice_center?tab=suggestions&class=c1&scenario=locked');
  await wait(`document.querySelector('.adaptive-topic button')`);
  await evaluate(`document.querySelector('.adaptive-topic button').click()`);
  await wait(`document.querySelector('.adaptive-practice__notice')?.textContent.includes('bị khóa')`);
  assert.equal(await evaluate(`location.search.includes('practiceSessionId')`), false);
  await go('exam_practice_center?tab=suggestions&class=c1&scenario=empty');
  await wait(`document.querySelector('.adaptive-practice__empty')`);
  assert.equal(await evaluate(`document.querySelector('[data-action=start-practice]').disabled`), true);
  await go('exam_practice_center?tab=suggestions&class=c1&scenario=savefail');
  await wait(`document.querySelector('.adaptive-topic button')`);
  await evaluate(`document.querySelector('.adaptive-topic button').click()`);
  await wait(`document.querySelector('.exam-taking-question')`);
  await evaluate(`document.querySelector('[data-action=submit-practice]').click()`);
  await wait(`document.querySelector('[role=alert]')?.textContent.includes('Save unavailable')`);
  assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/submit'))`), false);
  await go('exam_practice_center?recommendClassId=c2');
  await wait(`document.querySelectorAll('.adaptive-topic').length===3`);
  assert.equal(await evaluate(`document.querySelector('select[name=academic-class]').value`), 'c2');
  await set('select[name=adaptiveQuestionCount]', '5');
  await evaluate(
    `document.querySelector('.adaptive-practice__preferences input').click();document.querySelector('[data-action=start-practice]').click()`
  );
  await wait(`document.querySelector('.exam-taking-question')`);
  const general = await evaluate(`testCalls.find(c=>c.path.endsWith('/practice-recommendations'))`);
  assert.equal(general.path, '/api/v1/student/classes/c2/practice-recommendations');
  assert.deepEqual(general.body, { questionCount: 5, allowExpandedSubjectTopics: true });
  await go('exam_practice_center?tab=teacher&class=c2');
  await wait(`testCalls.some(c=>c.path==='/api/v1/exams/class/c2')`);
  assert.equal(await evaluate(`testCalls.some(c=>c.path==='/api/v1/exams/class/c1')`), false);
  await evaluate(`document.querySelectorAll('[role=tab]')[1].click()`);
  await wait(`document.querySelectorAll('.adaptive-topic').length===3`);
  assert.equal(await evaluate(`document.querySelector('select[name=academic-class]').value`), 'c2');
  await set('select[name=academic-semester]', 'sem1');
  await wait(`testCalls.some(c=>c.path==='/api/v1/student/classes/c1/weak-topics')`);
  await wait(`document.querySelectorAll('.adaptive-topic').length===3`);
  assert.equal(await evaluate(`document.querySelector('select[name=academic-class]').value`), 'ALL');
  assert.equal(await evaluate(`document.querySelector('select[name=academic-class]').options.length`), 2);
  await evaluate(`document.querySelector('.adaptive-practice__preferences input').click()`);
  assert.equal(
    await evaluate(
      `getComputedStyle(document.querySelector('.adaptive-practice__preferences input')).backgroundColor===getComputedStyle(document.querySelector('.adaptive-practice__preferences input')).borderTopColor`
    ),
    true
  );
  await screenshot('filters-checkbox-390');
  await set('select[name=academic-semester]', 'sem3');
  await wait(`document.querySelector('.adaptive-practice__empty')`);
  assert.equal(await evaluate(`document.querySelector('select[name=academic-class]').disabled`), true);
  assert.equal(await evaluate(`Boolean(document.querySelector('.adaptive-topic'))`), false);
  console.log('PASS: shared class/semester filters, no duplicate class picker, empty semester, round red checkbox');
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    await go('exam_practice_center?tab=suggestions&class=ALL');
    await wait(`document.querySelectorAll('.adaptive-topic').length===6`);
    assert.equal(await evaluate(`document.querySelector('select[name=academic-class]').value`), 'ALL');
    assert.equal(await evaluate(`document.querySelectorAll('[data-practice-class]').length`), 2);
    assert.equal(
      await evaluate(
        `testCalls.some(c=>c.path==='/api/v1/student/classes/c1/weak-topics') && testCalls.some(c=>c.path==='/api/v1/student/classes/c2/weak-topics')`
      ),
      true
    );
    await set('select[name=academic-class]', 'c2');
    await wait(`document.querySelectorAll('.adaptive-topic').length===3`);
    assert.equal(await evaluate(`document.querySelector('[data-practice-class]').dataset.practiceClass`), 'c2');
    await set('select[name=academic-class]', 'ALL');
    await wait(`document.querySelectorAll('.adaptive-topic').length===6`);
    await screenshot('practice-all-classes-' + width);
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
    await evaluate(`document.querySelector('[data-practice-class="c2"] .adaptive-topic button').click()`);
    await wait(`document.querySelector('.exam-taking-question')`);
    assert.equal(
      await evaluate(`testCalls.filter(c=>c.path.endsWith('/practice-recommendations')).at(-1).path`),
      '/api/v1/student/classes/c2/practice-recommendations'
    );
    await go('exam_session?scenario=examfilters');
    await wait(`document.querySelectorAll('.stat-card').length===3`);
    await wait(`document.querySelector('select[name=academic-class]')?.options.length===3`);
    await set('select[name=academic-class]', 'c1');
    await wait(`document.querySelectorAll('.stat-card').length===1`);
    assert.equal(
      await evaluate(`document.querySelector('.stat-card').textContent.includes('Kiểm tra Vật lý 1')`),
      true
    );
    await set('select[name=academic-semester]', 'sem2');
    await wait(`document.querySelectorAll('.stat-card').length===2`);
    assert.equal(await evaluate(`document.querySelector('select[name=academic-class]').value`), 'ALL');
    await screenshot('exam-filters-' + width);
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
    await send('Page.reload');
    await wait(`document.querySelectorAll('.stat-card').length===2`);
    assert.equal(await evaluate(`testCalls.some(c=>c.path==='/api/v1/exams/class/c1')`), false);
    await set('select[name=academic-semester]', 'sem3');
    await wait(`document.body.textContent.includes('Chưa có đề kiểm tra nào.')`);
    await set('select[name=academic-semester]', '');
    await wait(`document.querySelectorAll('.stat-card').length===3`);
    console.log(`PASS: ${width}px all-class practice, per-class creation and exam filters including transferred exams`);
  }
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    await go('my_courses');
    await wait(`document.querySelectorAll('.stat-card').length===2`);
    await wait(`document.querySelector('select[name=academic-class]')?.options.length===3`);
    assert.equal(
      await evaluate(`document.querySelector('[aria-label="Thời khóa biểu"]').textContent.includes('Physics 2')`),
      true
    );
    await set('select[name=academic-class]', 'c2');
    await wait(
      `document.querySelectorAll('.stat-card').length===1 && document.querySelector('.stat-card').textContent.includes('Physics 2')`
    );
    await wait(`!document.querySelector('[aria-label="Thời khóa biểu"]').textContent.includes('Vật lý 1')`);
    assert.equal(
      await evaluate(`document.querySelector('[aria-label="Thời khóa biểu"]').textContent.includes('Physics 2')`),
      true
    );
    await set('select[name=academic-semester]', 'sem1');
    await wait(
      `document.querySelectorAll('.stat-card').length===1 && document.querySelector('.stat-card').textContent.includes('Vật lý 1')`
    );
    assert.equal(await evaluate(`document.querySelector('select[name=academic-class]').value`), 'ALL');
    assert.equal(await evaluate(`document.querySelector('select[name=academic-class]').options.length`), 2);
    await wait(`!document.querySelector('[aria-label="Thời khóa biểu"]').textContent.includes('Physics 2')`);
    await screenshot('my-courses-filtered-' + width);
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
    await send('Page.reload');
    await wait(
      `document.querySelectorAll('.stat-card').length===1 && document.querySelector('.stat-card').textContent.includes('Vật lý 1')`
    );
    assert.equal(
      await evaluate(`testCalls.some(c=>c.path==='/api/v1/students/me/materials' && c.query.includes('c2'))`),
      false
    );
    await set('select[name=academic-semester]', 'sem3');
    await wait(`document.body.textContent.includes('Không có học phần trong phạm vi đã chọn.')`);
    await wait(`document.body.textContent.includes('Không có lịch học trong phạm vi đã chọn.')`);
    assert.equal(await evaluate(`document.querySelector('select[name=academic-class]').disabled`), true);
    await set('select[name=academic-semester]', '');
    await wait(`document.querySelectorAll('.stat-card').length===2`);
    console.log(
      `PASS: ${width}px My Courses filters courses and timetable, semester resets class, reload and empty scope`
    );
  }
  console.log('PASS: failed save blocks submission; class scope and explicit expansion reach the API');
  assert.deepEqual(errors, []);
  console.log('PASS: hidden solutions, locked practice and empty history states');
} finally {
  socket?.close();
  browser.kill();
}
