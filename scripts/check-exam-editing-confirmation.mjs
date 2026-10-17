import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5199';
const directory = path.resolve('.tmp-exam-distribution');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9387',
    `--user-data-dir=${path.join(directory, `chrome-editing-${process.pid}`)}`,
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
      target = (await (await fetch('http://127.0.0.1:9387/json')).json()).find((t) => t.type === 'page');
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
    throw new Error(`Timed out: ${expression} ${await evaluate('document.body.innerText')} ${errors.join(' | ')}`);
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
  const set = async (selector, value) => {
    await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`
    );
    await pause(60);
  };
  const click = async (text) => {
    await evaluate(
      `(()=>{const e=[...document.querySelectorAll('button')].filter(b=>b.textContent.includes(${JSON.stringify(text)})).at(-1);if(!e)throw Error('Missing button '+${JSON.stringify(text)});e.click()})()`
    );
    await pause(100);
  };
  const openMenu = async (selector) => {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    await wait(`!!document.querySelector('[role=menuitem]')`);
  };
  const bankMenu = 'section[aria-label="Ngân hàng câu hỏi"] button[aria-haspopup="menu"]';
  const openSource = async (query = 'classId=c1') => {
    await go('lecturer_assessments.html?' + query);
    await wait(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Đề nguồn')`);
    await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Đề nguồn').click()`);
    await wait(
      `Array.from(document.querySelectorAll('[role=dialog] .tabs-actions button')).some(button=>button.textContent.includes('Sửa thông tin đề'))`
    );
  };
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: await readFile('scripts/fixtures/exam-distribution-api.js', 'utf8'),
  });
  await go('lecturer_exam_create?classId=c1');
  await wait(
    `document.querySelector('input[name=title]') && !document.querySelector('form.authoring-grouped-form button[type=submit]').disabled`
  );
  assert.equal(await evaluate(`document.body.textContent.includes('Giao thêm cho lớp cùng môn')`), false);
  await set('input[name=title]', 'Đề cho một lớp');
  await set('input[name=durationMinutes]', '30');
  await set('input[name=startTime]', new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  await set('input[name=endTime]', new Date(Date.now() + 90000000).toISOString().slice(0, 16));
  await evaluate(`document.querySelector('form.authoring-grouped-form').requestSubmit()`);
  await wait(`testCalls.some(c=>c.path==='/api/v1/exams' && c.method==='POST')`);
  await wait(`!document.querySelector('input[name=title]')`);
  assert.equal(await evaluate(`document.body.textContent.includes('Các lớp đã nhận đề')`), false);
  assert.equal(await evaluate(`document.querySelectorAll('[role=tab]').length`), 4);
  assert.equal(
    await evaluate(`document.querySelector('[role=tab][aria-selected=true]').textContent.trim()`),
    'Câu hỏi trong đề'
  );
  assert.deepEqual(
    await evaluate(`testCalls.filter(c=>c.path==='/api/v1/exams' && c.method==='POST').map(c=>c.body.classId)`),
    ['c1']
  );
  console.log('PASS: exam creation omits extra-class controls and creates only for the selected class');
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    for (const tab of ['Tổng quan', 'Câu hỏi trong đề', 'Bài làm', 'Danh sách sinh viên']) {
      await evaluate(
        `Array.from(document.querySelectorAll('[role=tab]')).find(button=>button.textContent.trim()===${JSON.stringify(tab)}).click()`
      );
      await pause(150);
      assert.equal(await evaluate(`document.querySelector('[role=tab][aria-selected=true]').textContent.trim()`), tab);
      if (width === 1440) {
        assert.equal(await evaluate(`(()=>{const tabs=document.querySelector('[role=tablist]').getBoundingClientRect();const actions=document.querySelector('.tabs-actions').getBoundingClientRect();return Math.abs((tabs.top+tabs.height/2)-(actions.top+actions.height/2))<2})()`), true);
      }
      if (tab === 'Tổng quan') {
        await wait(`Array.from(document.querySelectorAll('dd')).some(item=>item.textContent==='30 phút')`);
        assert.equal(await evaluate(`document.querySelector('dl').textContent.includes('Chưa thiết lập')`), false);
      }
      if (tab === 'Câu hỏi trong đề') {
        assert.equal(await evaluate(`!!document.querySelector('section[aria-label="Câu hỏi trong đề"]') && !!document.querySelector('section[aria-label="Ngân hàng câu hỏi"]')`), true);
        assert.equal(await evaluate(`(()=>{const a=document.querySelector('section[aria-label="Câu hỏi trong đề"]').getBoundingClientRect();const b=document.querySelector('section[aria-label="Ngân hàng câu hỏi"]').getBoundingClientRect();return ${width}===1440 ? Math.abs(a.top-b.top)<2 && b.left>a.left : b.top>a.top})()`), true);
        await wait(`!!document.querySelector(${JSON.stringify(bankMenu)})`);
        await openMenu(bankMenu);
        assert.equal(await evaluate(`document.querySelectorAll('[role=menu]').length`), 1);
        assert.equal(await evaluate(`(()=>{const rect=document.querySelector('[role=menu]').getBoundingClientRect();return rect.left>=0 && rect.right<=innerWidth && rect.top>=0 && rect.bottom<=innerHeight})()`), true);
        await evaluate(`document.querySelector('[role=menu]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
        await wait(`!document.querySelector('[role=menu]')`);
      }
      assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
      await screenshot(
        'exam-management-' +
          width +
          '-' +
          ['Tổng quan', 'Câu hỏi trong đề', 'Bài làm', 'Danh sách sinh viên'].indexOf(tab)
      );
    }
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await openSource('classId=c1&classCatalogError=true&missingClass=true');
  await click('Sửa thông tin đề');
  await wait(`document.querySelector('input[name=startTime]')`);
  await evaluate(`Array.from(document.querySelectorAll('[role=dialog] button[aria-label="Mở rộng toàn màn hình"]')).at(-1).click()`);
  assert.equal(await evaluate(`!!document.querySelector('.form-dialog--expanded input[name=startTime]')`), true);
  await evaluate(`document.querySelector('.form-dialog--expanded button[aria-label="Thu nhỏ"]').click()`);
  assert.equal(
    await evaluate(`document.querySelector('form.authoring-grouped-form button[type=submit]').disabled`),
    false
  );
  for (const [field, days, hour] of [
    ['startTime', 1, '08'],
    ['endTime', 2, '09'],
  ]) {
    await evaluate(
      `document.querySelector('input[name=${field}]').parentElement.querySelector('.picker-trigger').click()`
    );
    await wait(`document.querySelector('.date-picker-panel')`);
    const date = await evaluate(
      `(()=>{const d=new Date(document.querySelector('input[name=${field}]').value);d.setDate(d.getDate()+${days});return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})()`
    );
    if (!(await evaluate(`!!document.querySelector('.date-picker-panel [data-day="${date}"]')`))) {
      await evaluate(`document.querySelector('.date-picker-panel button[aria-label="Tháng sau"]').click()`);
      await wait(`document.querySelector('.date-picker-panel [data-day="${date}"]')`);
    }
    await evaluate(`document.querySelector('.date-picker-panel [data-day="${date}"]').click()`);
    await set('.date-picker-time-fields input', hour);
    await evaluate(
      `[...document.querySelectorAll('.date-picker-panel button')].find(b=>b.textContent.includes('Xác nhận')).click()`
    );
    await wait(`!document.querySelector('.date-picker-panel')`);
  }
  const expected = await evaluate(
    `Object.fromEntries(['startTime','endTime'].map(k=>[k,new Date(document.querySelector('input[name='+k+']').value).toISOString()]))`
  );
  await evaluate(`window.testFailSave=true`);
  await click('Lưu thay đổi');
  await wait(`document.querySelector('[role=dialog] [role=alert]')?.textContent.includes('Không thể lưu lịch thi')`);
  assert.equal(
    await evaluate(`document.querySelector('form.authoring-grouped-form button[type=submit]').disabled`),
    false
  );
  assert.deepEqual(await evaluate(`testCalls.filter(c=>c.method==='PUT').at(-1).body`), expected);
  await screenshot('edit-save-error-retry');
  await evaluate(`window.testFailSave=false`);
  await click('Lưu thay đổi');
  await wait(`!document.querySelector('input[name=startTime]')`);
  assert.deepEqual(await evaluate(`testCalls.filter(c=>c.method==='PUT').at(-1).body`), expected);
  assert.equal(await evaluate(`testExams[0].endTime`), expected.endTime);
  console.log(
    'PASS save enabled with failed class catalog, missing detail class, real date-picker changes, precise UTC update and retry'
  );

  await openSource();
  await evaluate(
    `Array.from(document.querySelectorAll('[role=dialog] [role=tab]')).find(button=>button.textContent.trim()==='Câu hỏi trong đề').click()`
  );
  await wait(`!!document.querySelector(${JSON.stringify(bankMenu)})`);
  for (const panel of ['Câu hỏi trong đề', 'Ngân hàng câu hỏi']) {
    await openMenu(`section[aria-label="${panel}"] button[aria-haspopup="menu"]`);
    await click('Xem chi tiết');
    await wait(`Array.from(document.querySelectorAll('[role=dialog]')).at(-1)?.textContent.includes('Question explanation from API')`);
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('[role=dialog]')).at(-1).textContent.includes(${JSON.stringify(panel === 'Câu hỏi trong đề' ? 'Correct option from API' : '9.8')})`), true);
    await evaluate(`Array.from(document.querySelectorAll('[role=dialog]')).at(-1).querySelector('button[aria-label="Mở rộng toàn màn hình"]').click()`);
    assert.equal(await evaluate(`!!document.querySelector('.form-dialog--expanded')`), true);
    await evaluate(`Array.from(document.querySelectorAll('[role=dialog]')).at(-1).querySelector('button[aria-label="Đóng"]').click()`);
    await wait(`document.querySelectorAll('[role=dialog]').length===1`);
  }
  assert.equal(await evaluate(`testQuestions.source.length`), 2);
  console.log('PASS question details from exam and bank show API answers and explanations without changing the exam');
  await evaluate(`window.testFailAdd=true`);
  await openMenu(bankMenu);
  await click('Thêm vào đề');
  await wait(`document.querySelector('[role=dialog] [role=alert]')`);
  assert.equal(await evaluate(`Boolean(document.querySelector('[role=alertdialog]'))`), false);
  assert.equal(await evaluate(`testQuestions.source.length`), 2);
  await evaluate(`window.testFailAdd=false`);
  await openMenu(bankMenu);
  await evaluate(
    `(()=>{const button=Array.from(document.querySelectorAll('[role=menuitem]')).find(item=>item.textContent.includes('Thêm vào đề'));button.click();button.click()})()`
  );
  await wait(`testQuestions.source.length===3`);
  await wait(
    `!document.querySelector(${JSON.stringify(bankMenu)})`
  );
  assert.equal(await evaluate(`Boolean(document.querySelector('[role=alertdialog]'))`), false);
  assert.deepEqual(
    await evaluate(
      `testQuestions.source.find(q=>q.questionId==='q3')&&({questionId:testQuestions.source.at(-1).questionId,orderIndex:testQuestions.source.at(-1).orderIndex,scoreWeight:testQuestions.source.at(-1).scoreWeight})`
    ),
    { questionId: 'q3', orderIndex: 3, scoreWeight: 1 }
  );
  assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST').length`), 2);
  console.log('PASS direct add without confirmation, inline failure, retry and double-click guard');
  const before = await evaluate(`testCalls.filter(c=>c.method==='POST').length`);
  await click('Sinh theo ma trận');
  await wait(`document.querySelector('[role=alertdialog]')`);
  assert.equal(await evaluate(`testCalls.filter(c=>c.method==='POST').length`), before);
  await click('OK, sinh câu hỏi');
  await wait(`!document.querySelector('[role=alertdialog]')`);
  assert.equal(
    await evaluate(`testCalls.filter(c=>c.path.endsWith('/generate-questions')&&c.method==='POST').length`),
    1
  );
  console.log('PASS matrix generation requires explicit confirmation');
  await evaluate(`Array.from(document.querySelectorAll('[role=dialog] [role=tab]')).find(button=>button.textContent.trim()==='Tổng quan').click()`);
  await click('Xem toàn trang');
  await wait(`new URLSearchParams(location.search).get('view')==='page' && !document.querySelector('[role=dialog]') && document.querySelector('dl')`);
  assert.equal(await evaluate(`new URLSearchParams(location.search).get('examId')`), 'source');
  assert.equal(await evaluate(`document.querySelector('[role=tab][aria-selected=true]').textContent.trim()`), 'Tổng quan');
  await send('Page.reload');
  await wait(`document.querySelector('dl') && !document.querySelector('[role=dialog]')`);
  assert.equal(await evaluate(`document.querySelector('[role=tab][aria-selected=true]').textContent.trim()`), 'Tổng quan');
  console.log('PASS open management as a page preserves exam and selected tab after reload');
  await wait(`document.querySelector('.app-header h1')?.textContent.trim()==='Đề nguồn'`);
  assert.equal(await evaluate(`!!document.querySelector('.authoring-page__heading')`), false);
  for (const scenario of ['taken', 'error', 'loading']) {
    await go('lecturer_assessments.html?classId=c1');
    await wait(`Array.from(document.querySelectorAll('button')).some(button=>button.textContent==='Đề nguồn')`);
    await evaluate(`window.testSourceHasAttempts=${scenario === 'taken'};window.testFailAttempts=${scenario === 'error'};window.testHoldAttempts=${scenario === 'loading'};Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Đề nguồn').click()`);
    await wait(`Array.from(document.querySelectorAll('[role=dialog] .tabs-actions button')).some(button=>button.textContent.includes('Sửa thông tin đề') && button.classList.contains('!text-red-700'))`);
    if (scenario === 'loading') await wait(`typeof window.finishAttemptCheck==='function'`);
    await click('Sửa thông tin đề');
    const reason = scenario === 'taken' ? '1 lượt làm' : scenario === 'error' ? 'Không tải được danh sách lượt làm' : 'Đang kiểm tra lượt làm';
    await wait(`Array.from(document.querySelectorAll('[role=alert]')).some(node=>node.textContent.includes(${JSON.stringify(reason)}))`);
    assert.equal(await evaluate(`!!document.querySelector('input[name=title]')`), false);
    if (scenario === 'taken') {
      assert.equal(await evaluate(`(()=>{const toast=document.querySelector('.auth-alert--dismissible');const rect=toast.getBoundingClientRect();return getComputedStyle(toast).position==='fixed' && innerWidth-rect.right<=24 && rect.width<=420})()`), true);
      await wait(`!document.querySelector('.auth-alert--dismissible')`);
      await click('Sửa thông tin đề');
      await wait(`!!document.querySelector('.auth-alert--dismissible')`);
      await evaluate(`document.querySelector('.auth-alert--dismissible button[aria-label="Đóng thông báo"]').click()`);
      await wait(`!document.querySelector('.auth-alert--dismissible')`);
    }
    if (scenario === 'error') {
      await evaluate(`window.testFailAttempts=false`);
      await click('Kiểm tra lại');
    }
    if (scenario === 'loading') await evaluate(`window.testHoldAttempts=false;window.finishAttemptCheck()`);
    if (scenario !== 'taken') {
      await wait(`Array.from(document.querySelectorAll('[role=dialog] .tabs-actions button')).some(button=>button.textContent.includes('Sửa thông tin đề') && !button.classList.contains('!text-red-700'))`);
      await click('Sửa thông tin đề');
      await wait(`document.querySelector('input[name=title]')`);
    }
  }
  console.log('PASS editing explains existing attempts, load failure and pending checks; retry restores editing');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('ptit-physics-demo-session', JSON.stringify({ role: 'ADMIN', userId: 'admin' }));`,
  });
  await go('admin_assessments.html?view=page&examId=source&classId=c1&examTab=questions&largeBank=true');
  await wait(`document.querySelector('.app-header h1')?.textContent.trim()==='Đề nguồn' && document.querySelector('section[aria-label="Ngân hàng câu hỏi"]')`);
  assert.equal(await evaluate(`document.querySelectorAll('[role=tab]').length`), 4);
  assert.equal(await evaluate(`!!document.querySelector('.authoring-page__heading')`), false);
  await wait(`document.querySelector('.exam-question-panel--bank ol')?.children.length===10`);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.exam-question-panel')).backgroundColor !== getComputedStyle(document.querySelector('.exam-question-panel--bank')).backgroundColor`), true);
  const checkPinnedFilters = async () => {
    const before = await evaluate(`document.querySelector('.exam-question-panel__filters').getBoundingClientRect().top`);
    await evaluate(`(()=>{const list=document.querySelector('.exam-question-panel--bank .exam-question-panel__list');list.scrollTop=0;list.scrollTop=list.scrollHeight;list.dispatchEvent(new Event('scroll',{bubbles:true}))})()`);
    await pause(100);
    assert.equal(await evaluate(`document.querySelector('.exam-question-panel--bank .exam-question-panel__list').scrollTop>0`), true);
    assert.equal(await evaluate(`document.querySelector('.exam-question-panel__filters').getBoundingClientRect().top`), before);
    assert.equal(await evaluate(`(()=>{const filters=document.querySelector('.exam-question-panel__filters').getBoundingClientRect();const panel=document.querySelector('.exam-question-panel--bank').getBoundingClientRect();return Math.abs(filters.bottom-panel.bottom)<2})()`), true);
  };
  await checkPinnedFilters();
  await screenshot('simple-admin-exam-desktop');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: true });
  await pause(150);
  await checkPinnedFilters();
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
  await screenshot('simple-admin-exam-mobile');
  console.log('PASS management page uses exam title, distinct column colors and pinned bank filters during scrolling on desktop/mobile');
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
