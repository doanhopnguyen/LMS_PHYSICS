import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-student-exam-availability');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9385',
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
      target = (await (await fetch('http://127.0.0.1:9385/json')).json()).find((t) => t.type === 'page');
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
    throw new Error(`Timed out: ${expression}`);
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
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: String.raw`
    localStorage.setItem('ptit-physics-demo-session',JSON.stringify({role:'STUDENT'}));
    localStorage.setItem('ptit-physics-access-token','isolated-test-token');
    window.testCalls=[]; window.testNow=Date.now(); Date.now=()=>window.testNow;
    window.denyStart=false; window.historyFailure=false;
    const ids=['new','done','future','history-error'];
    window.testExams=ids.flatMap(id=>['QUIZ','PRACTICE'].map(examType=>({examId:id+'-'+examType,title:id+' '+examType,examType,totalQuestions:10,isPublished:true,durationMinutes:30,startTime:new Date(Date.now()+(id==='future'?3600000:-3600000)).toISOString(),endTime:new Date(Date.now()+7200000).toISOString()})));
    window.testAttempts={};
    for(const type of ['QUIZ','PRACTICE'])testAttempts['done-'+type]=[
      {attemptId:'old-'+type,attemptNumber:1,status:'GRADED',totalScore:8,startedAt:new Date(Date.now()-3600000).toISOString(),submittedAt:new Date(Date.now()-1800000).toISOString()},
      {attemptId:'recent-'+type,attemptNumber:2,status:'SUBMITTED',startedAt:new Date(Date.now()-1200000).toISOString(),submittedAt:new Date(Date.now()-600000).toISOString()}
    ];
    window.fetch=async(input,options={})=>{
      const path=new URL(input,location.origin).pathname;
      window.testCalls.push({path,method:options.method||'GET'});
      let data=[];
      if(path==='/api/v1/users/me')data={userId:'student',role:'STUDENT',fullName:'Sinh viên'};
      if(path==='/api/v1/students/me/classes')data=[{classId:'c1',classCode:'PHY-01'}];
      if(path==='/api/v1/exams/class/c1')data=testExams;
      const match=path.match(/^\/api\/v1\/exams\/([^/]+)(?:\/(.*))?$/);
      if(match&&match[1]!=='class'&&match[1]!=='attempts'){
        const id=match[1],part=match[2],exam=testExams.find(e=>e.examId===id);
        if(exam){
          if(!part)data=exam;
          if(part==='attempt-policy')data={canStart:!window.denyStart&&Date.parse(exam.startTime)<=Date.now(),maxAttempts:3,usedAttempts:(testAttempts[id]||[]).length};
          if(part==='my-attempts'){
            if(window.historyFailure&&id.startsWith('history-error'))return Response.json({message:'Không thể tải lịch sử thử nghiệm'},{status:503});
            data=testAttempts[id]||[];
          }
          if(part==='my-attempt')data=(testAttempts[id]||[]).at(-1)||null;
          if(part==='attempts'&&options.method==='POST'){
            data={attemptId:'started-'+id,status:'IN_PROGRESS',attemptNumber:1,startedAt:new Date(Date.now()).toISOString()};
            testAttempts[id]=[data];
          }
        }
      }
      if(path.match(/\/exams\/attempts\/[^/]+$/))data=Object.values(testAttempts).flat().find(a=>path.endsWith('/'+a.attemptId));
      if(path.endsWith('/progress'))data={answeredQuestions:0,totalQuestions:10,remainingSeconds:1800};
      if(path.includes('/attempts/old-')&&path.endsWith('/questions'))data=[{scoreWeight:10}];
      return Response.json({status:200,data});
    };
  `,
  });
  for (const [route, type] of [
    ['exam_session.html', 'QUIZ'],
    ['exam_practice_center.html', 'PRACTICE'],
  ]) {
    await go(route);
    await wait(`document.querySelector('section[aria-label="done ${type}"]')`);
    await evaluate(`document.querySelector('section[aria-label="done ${type}"] button:last-child').click()`);
    await wait(`document.querySelector('[role=dialog] tbody tr')`);
    const history = await evaluate(
      `({rows:[...document.querySelectorAll('[role=dialog] tbody tr')].map(e=>e.textContent),links:[...document.querySelectorAll('[role=dialog] tbody a')].map(a=>a.getAttribute('href'))})`
    );
    assert.ok(history.rows[0].includes('Chờ chấm'));
    assert.ok(history.rows[1].includes('8/10'));
    assert.ok(history.links.some((link) => link.includes('attemptId=old-' + type)));
    await screenshot('history-' + type);
    await evaluate(`document.querySelector('[role=dialog] button[aria-label="Đóng"]').click()`);
    await evaluate(`document.querySelector('section[aria-label="new ${type}"] button:last-child').click()`);
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Bạn chưa có lượt làm bài')`);
    await evaluate(
      `document.querySelector('[role=dialog] button[aria-label="Đóng"]').click();window.historyFailure=true;document.querySelector('section[aria-label="history-error ${type}"] button:last-child').click()`
    );
    await wait(`document.querySelector('[role=dialog] [role=alert]')`);
    assert.equal(
      await evaluate(`document.querySelector('[role=dialog]').textContent.includes('Bạn chưa có lượt')`),
      false
    );
    await evaluate(
      `window.historyFailure=false;[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.includes('Thử lại')).click()`
    );
    await wait(`document.querySelector('[role=dialog]')?.textContent.includes('Bạn chưa có lượt làm bài')`);
    await evaluate(
      `document.querySelector('[role=dialog] button[aria-label="Đóng"]').click();[...document.querySelector('section[aria-label="future ${type}"]').querySelectorAll('button')].find(b=>b.textContent.includes('Vào sảnh chờ')).click()`
    );
    await wait(`document.querySelector('[role=timer]')`);
    assert.equal(
      await evaluate(
        `testCalls.filter(c=>c.method==='POST'||c.path.includes('future-')&&c.path.endsWith('/questions')).length`
      ),
      0
    );
    assert.equal(await evaluate(`document.querySelector('[role=timer]').textContent`), '01:00:00');
    assert.equal(
      await evaluate(
        `[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Chờ đến giờ thi')).disabled`
      ),
      true
    );
    await screenshot('waiting-' + type);
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await screenshot('waiting-mobile-' + type);
    assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`), false);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluate(`window.denyStart=true;window.testNow+=3601000`);
    await wait(`document.querySelector('[role=timer]')?.textContent==='00:00:00'`);
    await wait(`testCalls.filter(c=>c.path.endsWith('/attempt-policy')).length>=3`);
    assert.equal(
      await evaluate(
        `[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Chưa được phép làm')).disabled`
      ),
      true
    );
    await evaluate(
      `window.denyStart=false;[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Cập nhật trạng thái')).click()`
    );
    await wait(
      `[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Bắt đầu làm bài')&&!b.disabled)`
    );
    await evaluate(
      `window.denyStart=true;[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Bắt đầu làm bài')).click()`
    );
    await wait(
      `[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Chưa được phép làm')&&b.disabled)`
    );
    assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST').length`), 0);
    await evaluate(
      `window.denyStart=false;[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Cập nhật trạng thái')).click()`
    );
    await wait(
      `[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Bắt đầu làm bài')&&!b.disabled)`
    );
    await evaluate(
      `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Bắt đầu làm bài'));b.click();b.click()})()`
    );
    await wait(`location.search.includes('mode=take')&&location.search.includes('attemptId=started-')`);
    assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST').length`), 1);
    console.log(
      'PASS ' + route + ': history, empty/error/retry, countdown, mobile, permissions, duplicate start guard'
    );
    await go(route + '?examId=future-' + type);
    await wait(`document.querySelector('[role=timer]')`);
    assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST'||c.path.endsWith('/questions')).length`), 0);
    console.log('PASS ' + route + ': direct upcoming exam opens waiting room');
  }
  assert.deepEqual(errors, []);
} finally {
  if (socket) {
    try {
      socket.send(JSON.stringify({ id: 99999, method: 'Browser.close' }));
    } catch {}
    socket.close();
  }
  browser.kill();
}
