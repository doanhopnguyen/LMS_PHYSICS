import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5197';
const directory = path.resolve('.tmp-question-types/ui');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9471',
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
      target = (await (await fetch('http://127.0.0.1:9471/json')).json()).find((t) => t.type === 'page');
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
    const role=location.pathname.includes('admin_')?'ADMIN':location.pathname.includes('lecturer_')?'INSTRUCTOR':'STUDENT';
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role,userId:'user1'}));
    localStorage.setItem('ptit-physics-access-token','isolated-test');
    window.confirm=()=>true;window.testCalls=[];
    const subject={subjectId:'s1',subjectName:'Vật lý 1',subjectCode:'PHY1',isActive:true};
    const topic={topicId:'t1',subjectId:'s1',topicName:'Định luật Newton'};
    const exam={examId:'e1',title:'Kiểm tra bốn loại câu hỏi',examType:'QUIZ',totalQuestions:5,durationMinutes:30,isPublished:true,startTime:new Date(Date.now()-3600000).toISOString(),endTime:new Date(Date.now()+7200000).toISOString()};
    const attempt={attemptId:'a1',examId:'e1',status:'IN_PROGRESS',startedAt:new Date().toISOString(),attemptNumber:1};
    const questions=[
      {questionId:'q1',content:'Đơn vị của lực là gì?',questionType:'MCQ_SINGLE',options:[{optionId:'o1',content:'Newton'},{optionId:'o2',content:'Joule'}]},
      {questionId:'q2',content:'Chọn các đại lượng vectơ.',questionType:'MCQ_MULTI',options:[{optionId:'o3',content:'Vận tốc'},{optionId:'o4',content:'Gia tốc'},{optionId:'o5',content:'Khối lượng'}]},
      {questionId:'q3',content:'Gia tốc rơi tự do gần mặt đất bằng bao nhiêu?',questionType:'SHORT_ANSWER',options:[]},
      {questionId:'q4',content:'Lực là một đại lượng vectơ.',questionType:'TRUE_FALSE',options:[{optionId:'o6',content:'Đúng'},{optionId:'o7',content:'Sai'}]},
      {questionId:'q5',content:'Đơn vị của lực là ____.',questionType:'FILL_BLANK',options:[]}
    ];
    let created;
    window.fetch=async(input,options={})=>{
      const p=new URL(input,location.origin).pathname,m=options.method||'GET',body=typeof options.body==='string'?JSON.parse(options.body):null;
      testCalls.push({path:p,method:m,body});let data=[];
      if(p==='/api/v1/users/me')data={userId:'user1',role,username:'test'};
      if(p.endsWith('/profile'))data={fullName:'Tài khoản kiểm thử'};
      if(p==='/api/v1/subjects')data=[subject];
      if(p.endsWith('/topics'))data=[topic];
      if(p==='/api/v1/instructor/classes')data=[{classId:'c1',subjectId:'s1',instructorId:'user1',classCode:'VL01'}];
      if(p==='/api/v1/questions'&&m==='GET')data={content:[],totalElements:0,totalPages:0,last:true};
      if(p==='/api/v1/questions'&&m==='POST'){created={...body,questionId:'created',approvalStatus:'PENDING'};data=created;}
      if(p==='/api/v1/questions/created')data=created;
      if(p.endsWith('/approve')){created.approvalStatus='APPROVED';data=created;}
      if(p==='/api/v1/exams/e1')data=exam;
      if(p.endsWith('/attempt-policy'))data={canStart:true,maxAttempts:3,usedAttempts:1};
      if(p.endsWith('/a1')||p.endsWith('/my-attempt'))data={...attempt,questions:attempt.status==='GRADED'?questions:undefined};
      if(p.endsWith('/a1/questions'))data=questions;
      if(p.endsWith('/progress'))data={totalQuestions:5,answeredQuestions:questions.filter(q=>q.selectedOptionIds?.length||q.answerText).length,remainingSeconds:1800};
      if(p.endsWith('/answers')){await new Promise(r=>setTimeout(r,120));Object.assign(questions.find(q=>q.questionId===body.questionId),body);}
      if(p.endsWith('/autosave')){body.answers.forEach(a=>Object.assign(questions.find(q=>q.questionId===a.questionId),a));data={savedCount:5};}
      if(p.endsWith('/submit')){Object.assign(attempt,{status:'GRADED',submittedAt:new Date().toISOString(),totalScore:3,maxScore:5,scoreOnTen:6});data=attempt;}
      return Response.json({status:200,data});
    };
  `,
  });
  const set = async (selector, value) => {
    await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});const prototype=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`
    );
    await pause(40);
  };
  for (const role of ['admin', 'lecturer']) {
    for (const type of ['MCQ_SINGLE', 'MCQ_MULTI', 'SHORT_ANSWER', 'TRUE_FALSE']) {
      await go(
        role === 'admin' ? 'admin_questions' : 'lecturer_question_bank?subjectId=s1&topicId=t1&tab=contributions'
      );
      await wait(
        `[...document.querySelectorAll('button')].some(e=>e.textContent.trim().replace(/^add\s*/, '')==='Tạo câu hỏi')`
      );
      await evaluate(
        `[...document.querySelectorAll('button')].find(e=>e.textContent.trim().replace(/^add\s*/, '')==='Tạo câu hỏi').click()`
      );
      await wait(`!!document.querySelector('.question-type-picker')`);
      if (role === 'admin') {
        await set('[role=dialog] select[name=subjectId]', 's1');
        await wait(`document.querySelector('[role=dialog] select[name=topicId] option[value=t1]')`);
        await set('[role=dialog] select[name=topicId]', 't1');
      }
      await evaluate(`document.querySelector('.question-type-picker input[value=${type}]').click()`);
      await set('[role=dialog] textarea[name=content]', 'Câu hỏi kiểm thử ' + type);
      const typeIndex = ['MCQ_SINGLE', 'MCQ_MULTI', 'SHORT_ANSWER', 'TRUE_FALSE'].indexOf(type);
      const difficulty = ['EASY', 'MEDIUM', 'HARD'][typeIndex % 3];
      const cognitive = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'][typeIndex];
      assert.deepEqual(
        await evaluate(
          `[...document.querySelector('[role=dialog] select[name=difficultyLevel]').options].map(o=>o.value)`
        ),
        ['EASY', 'MEDIUM', 'HARD']
      );
      assert.deepEqual(
        await evaluate(
          `[...document.querySelector('[role=dialog] select[name=cognitiveLevel]').options].map(o=>o.value)`
        ),
        ['', 'NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO']
      );
      await set('[role=dialog] select[name=difficultyLevel]', difficulty);
      await set('[role=dialog] select[name=cognitiveLevel]', cognitive);
      if (type === 'SHORT_ANSWER') await set('.question-answer-editor textarea', '9.8\n9,8');
      else {
        const binary = type === 'TRUE_FALSE';
        if (!binary)
          for (let i = 0; i < 4; i++)
            await set(
              `.question-answer-editor__option:nth-child(${i + 1}) .question-answer-editor__text input`,
              String.fromCharCode(65 + i)
            );
        await evaluate(`document.querySelector('.question-answer-editor__correct input').click()`);
        if (type === 'MCQ_MULTI')
          await evaluate(`document.querySelectorAll('.question-answer-editor__correct input')[1].click()`);
        if (binary)
          assert.equal(await evaluate(`document.querySelectorAll('.question-answer-editor__option').length`), 2);
      }
      await screenshot(`author-${role}-${type}`);
      await evaluate(
        `document.querySelector('[role=dialog] button[type=submit]${role === 'lecturer' ? '[value=submit]' : ''}').click()`
      );
      await wait(`testCalls.some(c=>c.path==='/api/v1/questions'&&c.method==='POST')`);
      const payload = await evaluate(`testCalls.find(c=>c.path==='/api/v1/questions'&&c.method==='POST').body`);
      assert.equal(payload.questionType, type);
      assert.equal(payload.difficultyLevel, difficulty);
      assert.equal(payload.cognitiveLevel, cognitive);
      if (type === 'SHORT_ANSWER') {
        assert.deepEqual(payload.acceptedAnswers, ['9.8', '9,8']);
        assert.deepEqual(payload.options, []);
      } else assert.equal(payload.options.filter((o) => o.isCorrect).length, type === 'MCQ_MULTI' ? 2 : 1);
      console.log(`PASS: ${role} creates ${type} with the correct API payload`);
    }
  }
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    await go('exam_session?examId=e1&attemptId=a1&mode=take');
    await wait(`document.querySelectorAll('.exam-taking-question-grid button').length===5`);
    assert.equal(await evaluate(`document.querySelector('.question-response input').type`), 'radio');
    await evaluate(`document.querySelector('.question-response input').click()`);
    await evaluate(`document.querySelectorAll('.exam-taking-question-grid button')[1].click()`);
    await wait(`document.querySelector('.question-response input')?.type==='checkbox'`);
    await evaluate(
      `document.querySelectorAll('.question-response input')[0].click();document.querySelectorAll('.question-response input')[1].click()`
    );
    await wait(`testCalls.some(c=>c.body?.questionId==='q2'&&c.body.selectedOptionIds.length===2)`);
    await evaluate(`document.querySelectorAll('.exam-taking-question-grid button')[2].click()`);
    await wait(`!!document.querySelector('.question-response__text input')`);
    await set('.question-response__text input', '9.8');
    await evaluate(`document.querySelectorAll('.exam-taking-question-grid button')[3].click()`);
    await wait(`!!document.querySelector('.question-response__choices[data-binary=true]')`);
    assert.equal(await evaluate(`document.querySelectorAll('.question-response input').length`), 2);
    await evaluate(`document.querySelectorAll('.question-response input')[1].click()`);
    await screenshot('take-binary-' + width);
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
    await evaluate(`document.querySelectorAll('.exam-taking-question-grid button')[4].click()`);
    await wait(`!!document.querySelector('.question-response__text input')`);
    await set('.question-response__text input', 'Newton');
    await screenshot('take-short-' + width);
    // Submit directly while the text field is still focused: the draft must be included.
    await evaluate(`document.querySelector('.detail-toolbar-actions button').click()`);
    await wait(`location.pathname.includes('exam_results')`);
    await wait(`document.body.textContent.includes('6/10')`);
    const body = await evaluate(`testCalls.find(c=>c.path.endsWith('/autosave')).body`);
    assert.equal(body.answers.find((a) => a.questionId === 'q3').answerText, '9.8');
    assert.equal(body.answers.find((a) => a.questionId === 'q5').answerText, 'Newton');
    assert.deepEqual(body.answers.find((a) => a.questionId === 'q2').selectedOptionIds, ['o3', 'o4']);
    assert.deepEqual(body.answers.find((a) => a.questionId === 'q4').selectedOptionIds, ['o7']);
    assert.equal(await evaluate(`testCalls.filter(c=>c.path.endsWith('/submit')).length`), 1);
    console.log(`PASS: ${width}px exam saves all types, preserves drafts and shows backend score`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: no browser runtime exceptions');
} finally {
  socket?.close();
  browser.kill();
}
