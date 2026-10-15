import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:5198';
const directory = path.resolve('.tmp-student-course-materials');
await mkdir(directory, { recursive: true });
const browser = spawn(
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=9382',
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
      target = (await (await fetch('http://127.0.0.1:9382/json')).json()).find((t) => t.type === 'page');
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
  await send('Emulation.setTimezoneOverride', { timezoneId: 'Asia/Saigon' });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source:
      (await readFile('scripts/fixtures/student-course-materials-api.js', 'utf8')) +
      "\nstudentTopics.push({topicId:'topic4',topicName:'Extra topic',subjectId:'subject1',chapterId:'chapter1'});",
  });

  await go('course_detail.html?classId=course1');
  await wait(`document.querySelectorAll('[role=tab]').length===2`);
  await evaluate(
    `Object.keys(localStorage).filter(k=>k.startsWith('ptit-material-progress-v1')).forEach(k=>localStorage.removeItem(k))`
  );
  await check('Main curriculum keeps subject topics and shared-material links', async () => {
    assert.equal(await evaluate(`document.querySelectorAll('a[href*="scope=SHARED"]').length`), 3);
    assert.equal(await evaluate(`document.querySelectorAll('a[href*="scope=CLASS"]').length`), 0);
  });
  const privateTab = await evaluate(`document.querySelectorAll('[role=tab]')[1].textContent.trim()`);
  await click(privateTab);
  await wait(`document.querySelector('a[href*="scope=CLASS"]')`);
  await check('Private learning tree contains all assigned materials', async () => {
    assert.equal(await evaluate(`document.querySelectorAll('a[href*="scope=CLASS"]').length`), 12);
    assert.equal(await evaluate(`document.querySelectorAll('a[href*="scope=SHARED"]').length`), 0);
  });
  await check('The open topic can be collapsed and reopened', async () => {
    assert.equal(await evaluate(`document.querySelectorAll('.student-learning-tree__chapter').length`), 1);
    await evaluate(`document.querySelector('.student-learning-tree__topic summary').click()`);
    assert.equal(await evaluate(`document.querySelector('.student-learning-tree__topic').open`), false);
    await evaluate(`document.querySelector('.student-learning-tree__topic summary').click()`);
    assert.equal(await evaluate(`document.querySelector('.student-learning-tree__topic').open`), true);
  });
  const selectedTabRoute = await evaluate(`location.search`);
  await check('Class material tab is retained in the URL', async () => {
    assert.equal(selectedTabRoute.includes('tab=private-materials'), true);
  });
  const originalClassPath = await evaluate(`location.pathname`);
  await evaluate(`document.querySelector('a[href*="materialId=private11"]').click()`);
  await wait(`document.querySelector('#chapter-lesson-panel h1')`);
  await check('Tree selection opens the correct lesson in its group', async () => {
    assert.equal(await evaluate(`location.pathname`), originalClassPath);
    assert.equal(
      await evaluate(`document.querySelector('#chapter-lesson-panel h1').textContent.trim()`),
      'B' + String.fromCharCode(224) + 'i giao ri' + String.fromCharCode(234) + 'ng 11'
    );
    assert.equal(
      await evaluate(`document.querySelectorAll('.chapter-outline .student-learning-tree__lesson').length`),
      12
    );
    assert.equal(
      await evaluate(
        `document.querySelector('.chapter-outline').textContent.includes('H'+String.fromCharCode(7885)+'c li'+String.fromCharCode(7879)+'u ch'+String.fromCharCode(237)+'nh')`
      ),
      false
    );
  });
  await evaluate(`document.querySelector('.lesson-controls button:nth-child(2)').click()`);
  await wait(`calls.some(c=>c.method==='PUT'&&c.body?.progressPercent===7)`);
  await check('Tree progress updates immediately after completion', async () => {
    assert.equal(
      await evaluate(
        `document.querySelector('.student-learning-tree__progress [role=progressbar]').getAttribute('aria-valuenow')`
      ),
      '8'
    );
    assert.equal(
      await evaluate(`document.querySelector('a[aria-current=page] .material-symbols-outlined').textContent`),
      'check_circle'
    );
  });
  await check('Completion retains the denominator across both material groups', async () =>
    assert.equal(
      await evaluate(
        `JSON.parse(localStorage.getItem('ptit-material-progress-v1:student-course:course1:topic1')).completed.includes('private11')`
      ),
      true
    )
  );
  await go('learning_module.html?classId=course1&subjectId=subject1&topicId=topic1&scope=SHARED');
  await wait(`document.querySelectorAll('.chapter-outline .student-learning-tree__lesson').length===3`);
  const start = await evaluate(
    `document.querySelector('#chapter-lesson-panel .chapter-empty button').textContent.replace('play_arrow','').trim()`
  );
  await click(start);
  await wait(`document.querySelector('#chapter-lesson-panel h1')`);
  await check('Main curriculum opens shared lessons and preserves private completion', async () => {
    assert.equal(await evaluate(`document.querySelector('#chapter-lesson-panel h1').textContent.includes('0')`), true);
    assert.equal(
      await evaluate(
        `JSON.parse(localStorage.getItem('ptit-material-progress-v1:student-course:course1:topic1')).completed.includes('private11')`
      ),
      true
    );
  });
  await check('Opening a topic or chapter closes the previous branch', async () => {
    await evaluate(
      `document.querySelectorAll('.student-learning-tree__chapter')[0].querySelectorAll('.student-learning-tree__topic summary')[1].click()`
    );
    assert.equal(await evaluate(`document.querySelectorAll('.student-learning-tree__topic[open]').length`), 1);
    assert.equal(await evaluate(`document.querySelector('.student-learning-tree__topic').open`), false);
    await evaluate(`document.querySelectorAll('.student-learning-tree__chapter')[1].querySelector('summary').click()`);
    assert.equal(await evaluate(`document.querySelectorAll('.student-learning-tree__chapter[open]').length`), 1);
    assert.equal(await evaluate(`document.querySelector('.student-learning-tree__chapter').open`), false);
    assert.equal(await evaluate(`document.querySelectorAll('.student-learning-tree__topic[open]').length`), 0);
    await evaluate(
      `document.querySelectorAll('.student-learning-tree__chapter')[1].querySelector('.student-learning-tree__topic summary').click()`
    );
    assert.equal(await evaluate(`document.querySelectorAll('.student-learning-tree__topic[open]').length`), 1);
  });
  await evaluate(`document.querySelector('.chapter-outline a[href*="materialId=shared-next"]').click()`);
  await wait(
    `location.search.includes('topicId=topic2') && document.querySelector('a[aria-current=page][href*="shared-next"]')`
  );
  await check('Selecting another chapter opens its lesson and uses its own progress', async () => {
    assert.equal(await evaluate(`document.querySelectorAll('.student-learning-tree__chapter[open]').length`), 1);
    assert.equal(await evaluate(`document.querySelectorAll('.student-learning-tree__topic[open]').length`), 1);
    await evaluate(`document.querySelector('.lesson-controls button:nth-child(2)').click()`);
    await wait(`calls.some(c=>c.method==='PUT' && c.body?.topicId==='topic2' && c.body?.progressPercent===100)`);
    assert.equal(
      await evaluate(
        `JSON.parse(localStorage.getItem('ptit-material-progress-v1:student-course:course1:topic1')).completed.includes('private11')`
      ),
      true
    );
  });
  await go('learning_module.html?classId=course1&subjectId=subject1&topicId=topic3&scope=CLASS');
  await wait(`document.querySelector('#chapter-lesson-panel .chapter-empty')`);
  await check('Workspace can offer another assigned lesson when the requested topic is empty', async () =>
    assert.equal(await evaluate(`document.querySelectorAll('#chapter-lesson-panel .chapter-empty button').length`), 1)
  );
  await go('course_detail.html?classId=course1&tab=private-materials&empty=1');
  await wait(`document.querySelectorAll('[role=tab]').length===2`);
  await check('Empty private tab shows an empty state', async () =>
    assert.equal(await evaluate(`document.querySelectorAll('a[href*="scope=CLASS"]').length`), 0)
  );
  await go('course_detail.html?classId=foreign');
  await wait(`!document.querySelector('[role=tab]')`);
  await check('Unknown class does not fall back to another enrolled class', async () =>
    assert.equal(await evaluate(`calls.some(c=>c.query?.classId==='foreign')`), false)
  );
  await go('course_detail.html?classId=course1&tab=private-materials&topicId=topic1&materialId=private0');
  await wait(`document.querySelector('a[href*="scope=CLASS"]')`);
  await screenshot('private-materials-desktop');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await check('Student learning tree fits mobile width', async () =>
    assert.equal(
      await evaluate(
        `document.documentElement.scrollWidth<=window.innerWidth && document.querySelector('a[href*="scope=CLASS"]').getBoundingClientRect().right<=window.innerWidth`
      ),
      true
    )
  );
  await screenshot('private-materials-mobile');
  await evaluate(`document.querySelector('a[href*="materialId=private1&"]').click()`);
  await wait(`document.querySelector('#chapter-lesson-panel h1').getBoundingClientRect().top < innerHeight`);
  await check('Mobile selection brings the rendered material into view', async () => {
    assert.equal(await evaluate(`location.pathname.includes('learning')`), false);
  });

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await go('course_detail.html?classId=course1&format=MARKDOWN');
  await wait(`document.querySelector('a[href*="materialId=shared0"]')`);
  const beforeMarkdownPath = await evaluate(`location.pathname`);
  await evaluate(`document.querySelector('a[href*="materialId=shared0"]').click()`);
  await wait(`document.querySelector('.lesson-content strong')`);
  await check('Markdown renders inline without leaving the class page', async () => {
    assert.equal(await evaluate(`location.pathname`), beforeMarkdownPath);
    assert.equal(await evaluate(`document.querySelectorAll('.lesson-content h1').length`), 1);
  });
  await go('course_detail.html?classId=course1&format=PDF&materialId=shared0&topicId=topic1');
  await wait(`document.querySelector('.lesson-content iframe')`);
  await check('PDF renders inside the adjacent material panel', async () => {
    assert.equal(await evaluate(`document.querySelector('.lesson-content iframe').src.startsWith('blob:')`), true);
  });
  await go('course_detail.html?classId=course1&format=VIDEO&materialId=shared0&topicId=topic1');
  await wait(`document.querySelector('#chapter-lesson-panel video')`);
  await check('Video player renders inline and blocks premature completion', async () => {
    assert.equal(await evaluate(`document.querySelector('.lesson-controls button:nth-child(2)').disabled`), true);
  });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await go('learning_module.html?classId=course1&subjectId=subject1&topicId=topic1&materialId=shared0&scope=SHARED');
  await wait(`document.querySelector('a[aria-current=page]')`);
  await screenshot('learning-tree-desktop');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await check('Lesson tree and content fit mobile width', async () => {
    assert.equal(
      await evaluate(`document.querySelector('.chapter-panel').getBoundingClientRect().right <= window.innerWidth`),
      true
    );
  });
  await screenshot('learning-tree-mobile');
  await go('course_detail.html?classId=course1&format=YOUTUBE&materialId=shared0&topicId=topic1');
  await wait(`!!window.__youtube`);
  for (let time = 1; time <= 9; time++) {
    await evaluate(`window.__videoClock+=1000;window.__youtube.time=${time};window.__youtube.state=1`);
    await pause(280);
  }
  await evaluate(`window.__videoClock+=400;window.__youtube.time=9.4;window.__youtube.state=1`);
  await pause(280);
  await evaluate(
    `window.__videoClock+=600;window.__youtube.time=0;window.__youtube.duration=0;window.__youtube.state=0;window.__youtube.options.events.onStateChange({data:0})`
  );
  await wait(`calls.some(c=>c.method==='PUT'&&c.body?.topicId==='topic1'&&c.body?.progressPercent===7)`);
  await check('YouTube completion updates the rendered lesson, tree and class API', async () => {
    assert.equal(
      await evaluate(`document.querySelector('a[aria-current=page] .material-symbols-outlined').textContent`),
      'check_circle'
    );
    assert.equal(
      await evaluate(
        `document.querySelector('.student-learning-tree__progress [role=progressbar]').getAttribute('aria-valuenow')`
      ),
      '66'
    );
    assert.equal(
      await evaluate(
        `JSON.parse(localStorage.getItem('ptit-material-progress-v1:student-course:course1:topic1')).completed.includes('shared0')`
      ),
      true
    );
  });
  await check('Switching and closing lessons removes old YouTube players instead of stacking them', async () => {
    for (let repeat = 0; repeat < 3; repeat++) {
      const previousPlayer = await evaluate(`window.__youtubePlayers.length - 1`);
      await evaluate(`document.querySelector('a[href*="materialId=shared1&"]').click()`);
      await wait(`document.querySelector('#chapter-lesson-panel h1')?.textContent.includes('1')`);
      await pause(80);
      assert.equal(await evaluate(`document.querySelectorAll('#chapter-lesson-panel iframe').length`), 0);
      assert.equal(await evaluate(`window.__youtubePlayers[${previousPlayer}].destroyed`), true);
      assert.equal(await evaluate(`document.querySelectorAll('.chapter-panel-heading').length`), 1);
      await evaluate(`document.querySelector('a[href*="materialId=shared0&"]').click()`);
      await wait(`document.querySelector('#chapter-lesson-panel iframe')`);
      assert.equal(await evaluate(`document.querySelectorAll('#chapter-lesson-panel iframe').length`), 1);
      assert.equal(await evaluate(`window.__youtubePlayers.filter(player=>!player.destroyed).length`), 1);
    }
    await evaluate(`document.querySelector('button[aria-label="Đóng học liệu"]').click()`);
    await wait(`document.querySelector('#chapter-lesson-panel .chapter-empty')`);
    await pause(80);
    assert.equal(await evaluate(`document.querySelectorAll('#chapter-lesson-panel iframe').length`), 0);
    assert.equal(await evaluate(`window.__youtubePlayers.filter(player=>!player.destroyed).length`), 0);
  });
  assert.deepEqual(errors, []);

  await writeFile(path.join(directory, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`${results.length} student class browser scenarios passed.`);
} finally {
  socket?.close();
  browser.kill();
}
