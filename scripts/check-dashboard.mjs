import assert from 'node:assert/strict';
import fs from 'node:fs';

// Run against a local dev server and a disposable Chromium debugging profile.
const origin = process.env.DASHBOARD_ORIGIN || 'http://127.0.0.1:5188';
const debugging = process.env.DASHBOARD_DEBUG || 'http://127.0.0.1:9224';
const pages = await (await fetch(`${debugging}/json`)).json();
const socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const response = JSON.parse(data);
  if (pending.has(response.id)) {
    const { resolve, reject } = pending.get(response.id);
    pending.delete(response.id);
    response.error ? reject(response.error) : resolve(response.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin });
  await pause(1200);
  for (const [role, route] of [['STUDENT', 'dashboard.html'], ['INSTRUCTOR', 'lecturer_dashboard.html'], ['TA', 'ta_dashboard.html'], ['ADMIN', 'admin_dashboard.html']]) {
    await evaluate(`localStorage.setItem('ptit-physics-demo-session', '${role}')`);
    await send('Page.navigate', { url: `${origin}/${route}` });
    for (let attempt = 0; attempt < 30; attempt++) {
      await pause(150);
      if (await evaluate(`!!document.querySelector('.dashboard-calendar')`)) break;
    }
    const geometry = await evaluate(`(() => {
      const stats = [...document.querySelectorAll('.dashboard-overview .stat-card')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right};});
      const calendar = document.querySelector('.dashboard-calendar').getBoundingClientRect();
      return {stats, calendarX:calendar.x, events:document.querySelectorAll('.dashboard-calendar__event').length, overflow:document.documentElement.scrollWidth > innerWidth};
    })()`);
    assert.equal(geometry.stats.length, 4, role);
    assert.equal(geometry.stats[0].y, geometry.stats[1].y, role);
    assert.equal(geometry.stats[2].y, geometry.stats[3].y, role);
    assert.ok(geometry.stats[2].y > geometry.stats[0].y, role);
    assert.ok(geometry.calendarX > geometry.stats[1].right, role);
    assert.equal(geometry.events, 5, role);
    assert.equal(geometry.overflow, false, role);
    await evaluate(`document.querySelector('.dashboard-calendar__controls button:last-child').click()`);
    await pause(100);
    assert.equal(await evaluate(`document.querySelectorAll('.dashboard-calendar__event').length`), 0);
    await evaluate(`document.querySelectorAll('.dashboard-calendar__controls button')[1].click()`);
    await pause(100);
    assert.equal(await evaluate(`document.querySelectorAll('.dashboard-calendar__event').length`), 5);
    if (role === 'STUDENT') {
      assert.ok(await evaluate(`document.querySelector('.dashboard-resume').getBoundingClientRect().height < 90`));
      await evaluate(`document.querySelector('.dashboard-overview').scrollIntoView()`);
      fs.writeFileSync('.tmp-dashboard-desktop.png', Buffer.from((await send('Page.captureScreenshot')).data, 'base64'));
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth`), false, `${role} mobile overflow`);
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    console.log(`${role}: 4 metrics, 2x2 layout, calendar on right, week navigation, mobile width passed.`);
  }
} finally {
  socket.close();
}
