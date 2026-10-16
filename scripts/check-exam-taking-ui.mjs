import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-exam-taking');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9405',
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
      target = (await (await fetch('http://127.0.0.1:9405/json')).json()).find((t) => t.type === 'page');
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
      localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'STUDENT'}));
      localStorage.setItem('ptit-physics-access-token','isolated-test-token');
      window.confirm=()=>true;
      history.replaceState({ptitPrevious:'/dashboard'},'',location.href);
      window.testCalls=[];
      const scenario=new URLSearchParams(location.search).get('scenario');
      let hasAttempt=scenario!=='new'&&scenario!=='denied'&&scenario!=='future';
      const practice=location.pathname.includes('practice');
      const exam={examId:'exam1',title:'Bài kiểm tra Cơ học',examType:practice?'PRACTICE':'QUIZ',totalQuestions:3,durationMinutes:30,isPublished:true,startTime:new Date(Date.now()-3600000).toISOString(),endTime:new Date(Date.now()+7200000).toISOString()};
      const attempt={attemptId:'attempt1',examId:'exam1',attemptNumber:1,status:'IN_PROGRESS',startedAt:new Date().toISOString()};
      if(scenario==='completed'){attempt.status='SUBMITTED';attempt.submittedAt=new Date().toISOString();}
      if(scenario==='future')exam.startTime=new Date(Date.now()+3600000).toISOString();
      const questions=[
        {questionId:'q1',content:'Chọn một đáp án đúng.',questionType:'MCQ_SINGLE',options:[{optionId:'a',content:'Đáp án A'},{optionId:'b',content:'Đáp án B'}]},
        {questionId:'q2',content:'Chọn các đáp án đúng.',questionType:'MCQ_MULTI',options:[{optionId:'c',content:'Đáp án C'},{optionId:'d',content:'Đáp án D'}]},
        {questionId:'q3',content:'Nhập câu trả lời ngắn.',questionType:'SHORT_ANSWER',options:[]}
      ];
      if(new URLSearchParams(location.search).has('many')) {
        for(let index=4;index<=60;index++) questions.push({questionId:'q'+index,content:'Câu hỏi '+index,questionType:'MCQ_SINGLE',options:[{optionId:'x'+index,content:'Đáp án A'},{optionId:'y'+index,content:'Đáp án B'}]});
      }
      exam.totalQuestions=questions.length;
      window.fetch=async(input,options={})=>{
        const path=new URL(input,location.origin).pathname,body=options.body?JSON.parse(options.body):null;
        testCalls.push({path,method:options.method||'GET',body});
        let data=[];
        if(path==='/api/v1/users/me')data={userId:'student',role:'STUDENT',fullName:'Sinh viên'};
        if(path==='/api/v1/exams/exam1')data=exam;
        if(path.endsWith('/attempt-policy'))data={canStart:scenario!=='denied',maxAttempts:3,usedAttempts:1};
        if(path.endsWith('/attempt1')||path.endsWith('/my-attempt'))data=hasAttempt?attempt:null;
        if(path.endsWith('/attempts')&&options.method==='POST'){hasAttempt=true;data=attempt;}
        if(path.endsWith('/questions'))data=questions;
        if(path.endsWith('/progress'))data={answeredQuestions:questions.filter(q=>q.selectedOptionIds?.length||q.answerText).length,totalQuestions:questions.length,remainingSeconds:1800};
        if(path.endsWith('/answers'))Object.assign(questions.find(q=>q.questionId===body.questionId),body);
        if(path.endsWith('/submit')){attempt.status='SUBMITTED';attempt.submittedAt=new Date().toISOString();data=attempt;}
        return Response.json({status:200,data});
      };
    `,
  });
  for (const route of ['exam_session.html', 'exam_practice_center.html']) {
    for (const width of [1440, 768, 390]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width === 390,
      });
      await go(`${route}?examId=exam1&attemptId=attempt1&mode=take`);
      await wait(`document.querySelectorAll('.exam-taking-question-grid button').length===3`);
      assert.equal(await evaluate(`document.querySelector('.detail-toolbar-back').textContent`), 'Về trang trước');
      assert.equal(await evaluate(`document.body.textContent.includes('tổng quan đề')`), false);
      assert.equal(await evaluate(`document.querySelector('.page-academic-filters')===null`), true);
      assert.equal(await evaluate(`document.querySelector('select')===null`), true);
      const fits = await evaluate(
        `(()=>{const selectors=['.exam-taking-workspace','.detail-toolbar-actions','.exam-taking-timer','.exam-taking-question-grid'];return selectors.every(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1;})})()`
      );
      assert.equal(fits, true, `${route} fits ${width}px`);
      assert.equal(
        await evaluate(`document.querySelector('.exam-taking-option input').getBoundingClientRect().height`),
        17
      );
      await evaluate(`document.querySelector('.exam-taking-option input').click();true`);
      await wait(`document.querySelector('.exam-taking-option[data-selected="true"]')`);
      assert.equal(
        await evaluate(`testCalls.some(c=>c.path.endsWith('/answers')&&c.body.selectedOptionIds[0]==='a')`),
        true
      );
      await evaluate(
        `document.querySelector('.exam-taking-question-heading button').click();document.querySelectorAll('.exam-taking-question-grid button')[1].click();true`
      );
      await wait(`document.querySelector('.exam-taking-question-number')?.textContent==='Câu 2'`);
      for (const index of [0, 1]) {
        await evaluate(`document.querySelectorAll('.exam-taking-option input')[${index}].click();true`);
        await wait(`document.querySelectorAll('.exam-taking-option[data-selected="true"]').length===${index + 1}`);
      }
      await evaluate(`document.querySelectorAll('.exam-taking-question-grid button')[2].click();true`);
      await wait(`document.querySelector('textarea')`);
      await evaluate(
        `(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'9.8');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new FocusEvent('focusout',{bubbles:true}));})()`
      );
      await wait(`testCalls.some(c=>c.path.endsWith('/answers')&&c.body.answerText==='9.8')`);
      await evaluate(`document.querySelectorAll('.exam-taking-view-toggle button')[1].click();true`);
      await wait(`document.querySelectorAll('.exam-taking-question').length===3`);
      await evaluate(`document.querySelector('.exam-taking-view-toggle button').click();true`);
      await evaluate(`document.querySelector('.exam-taking-question-grid button').click();scrollTo(0,0);true`);
      await wait(
        `document.querySelector('.exam-taking-question-heading button')?.getAttribute('aria-pressed')==='true'`
      );
      await screenshot(`${route}-${width}`);
      await evaluate(`document.querySelector('.detail-toolbar-actions button').click();true`);
      await wait(`location.pathname.includes('exam_results')`);
      assert.equal(
        await evaluate(
          `testCalls.some(c=>c.path.endsWith('/autosave'))&&testCalls.some(c=>c.path.endsWith('/submit'))`
        ),
        true
      );
      results.push({ route, width, saved: true, submitted: true });
    }
  }
  for (const route of ['exam_session.html', 'exam_practice_center.html']) {
    for (const scenario of ['existing', 'new']) {
      await go(`${route}?examId=exam1&scenario=${scenario}`);
      await wait(`document.querySelectorAll('.exam-taking-question-grid button').length===3`);
      assert.equal(
        await evaluate(`testCalls.filter(c=>c.path==='/api/v1/exams/exam1/attempts'&&c.method==='POST').length`),
        scenario === 'new' ? 1 : 0
      );
      await evaluate(`window.confirm=()=>false;document.querySelector('.detail-toolbar-back').click();true`);
      assert.equal(await evaluate(`location.search.includes('examId=exam1')`), true);
      await evaluate(`window.confirm=()=>true;document.querySelector('.detail-toolbar-back').click();true`);
      await wait(`location.pathname==='/dashboard'`);
    }
    await go(`${route}?examId=exam1&scenario=completed`);
    await wait(`location.pathname.includes('exam_results')`);
    assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/attempts')&&c.method==='POST')`), false);
    await go(`${route}?examId=exam1&scenario=denied`);
    await wait(`document.querySelector('.exam-taking-workspace [role=status]')`);
    assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/attempts')&&c.method==='POST')`), false);
    await go(`${route}?examId=exam1&scenario=future`);
    await wait(`document.querySelector('[role=timer]')?.getAttribute('aria-label')==='Đếm ngược đến giờ thi'`);
    assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/attempts')&&c.method==='POST')`), false);
  }
  for (const width of [1440, 768, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    await go('exam_session.html?examId=exam1&many=1');
    await wait(`document.querySelectorAll('.exam-taking-question-grid button').length===60`);
    assert.equal(
      await evaluate(`getComputedStyle(document.querySelector('.exam-taking-navigator')).position`),
      'fixed'
    );
    await evaluate(`document.querySelectorAll('.exam-taking-view-toggle button')[1].click();true`);
    await wait(`document.querySelectorAll('.exam-taking-question').length===60`);
    await evaluate(`document.querySelectorAll('.exam-taking-question-grid button')[49].click();true`);
    await wait(
      `document.querySelector('#exam-question-q50').getBoundingClientRect().top < 180 && document.querySelector('#exam-question-q50').getBoundingClientRect().top > 50`
    );
    assert.equal(await evaluate(`document.querySelectorAll('.exam-taking-question').length`), 60);
    const dock = await evaluate(
      `(()=>{const n=document.querySelector('.exam-taking-navigator'),r=n.getBoundingClientRect(),b=n.querySelector('[aria-current]').getBoundingClientRect(),s=n.querySelector('.exam-taking-question-grid').getBoundingClientRect();return {visible:r.bottom<=innerHeight&&r.top>innerHeight/2&&r.left>=0&&r.right<=innerWidth,selected:b.left>=s.left&&b.right<=s.right}})()`
    );
    assert.deepEqual(dock, { visible: true, selected: true });
    await screenshot('dock-long-list-' + width);
    await evaluate(`scrollTo(0,document.body.scrollHeight);true`);
    await pause(150);
    assert.equal(
      await evaluate(
        `document.querySelector('#exam-question-q60').getBoundingClientRect().bottom < document.querySelector('.exam-taking-navigator').getBoundingClientRect().top`
      ),
      true
    );
    await go('exam_session.html?examId=exam1&scenario=future');
    await wait(`document.querySelector('.exam-waiting-countdown')`);
    assert.equal(await evaluate(`document.querySelector('.page-academic-filters')===null`), true);
    assert.equal(
      await evaluate(
        `(()=>{const r=document.querySelector('.exam-waiting-countdown').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})()`
      ),
      true
    );
    assert.equal(await evaluate(`document.querySelector('.exam-waiting-main > button').disabled`), true);
    await screenshot('waiting-room-' + width);
    results.push({ width, fixedDock: true, longListNavigation: true, waitingRoom: true });
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, results }, null, 2));
} finally {
  socket?.close();
  browser.kill();
}
