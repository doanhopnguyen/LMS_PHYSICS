from pathlib import Path
p=Path('scripts/check-adaptive-practice-ui.mjs')
s=p.read_text(encoding='utf-8')
s=s.replace("    await go('exam_practice_center');\n    await wait", """    await go('exam_practice_center');
    await wait(`document.querySelectorAll('[role=tab]').length===2`);
    assert.equal(await evaluate(`document.querySelector('[role=tab][aria-selected=true]').textContent`), 'Đề luyện của giảng viên');
    assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/weak-topics'))`), false);
    await evaluate(`document.querySelectorAll('[role=tab]')[1].click()`);
    await wait(`document.querySelector('[role=tab][aria-selected=true]')?.textContent==='Gợi ý luyện tập'`);
    await wait""")
s=s.replace('.adaptive-session__question-grid', '.exam-taking-question-grid')
s=s.replace('.adaptive-session__question', '.exam-taking-question')
s=s.replace('.adaptive-session__toolbar button:last-child', '[data-action=submit-practice]')
s=s.replace('exam_practice_center?scenario=', 'exam_practice_center?tab=suggestions&scenario=')
needle="    await screenshot('practice-binary-' + width);"
s=s.replace(needle,needle+"""
    await evaluate(`document.querySelector('.exam-taking-question-heading button').click()`);
    assert.equal(await evaluate(`document.querySelector('.exam-taking-question-heading button').getAttribute('aria-pressed')`), 'true');
    await evaluate(`document.querySelectorAll('.exam-taking-view-toggle button')[1].click()`);
    await wait(`document.querySelectorAll('.exam-taking-question').length===4`);
    await evaluate(`document.querySelectorAll('.exam-taking-view-toggle button')[0].click()`);
    await wait(`document.querySelectorAll('.exam-taking-question').length===1`);
    assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`), true);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.exam-taking-navigator')).position`), 'fixed');
""")
needle="    assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/submit'))`), false);\n    console.log"
s=s.replace(needle,"""    assert.equal(await evaluate(`testCalls.some(c=>c.path.endsWith('/submit'))`), false);
    await evaluate(`document.querySelector('.adaptive-session__toolbar button').click()`);
    await wait(`document.querySelector('[role=tab][aria-selected=true]')?.textContent==='Gợi ý luyện tập'`);
    await send('Page.reload');
    await wait(`document.querySelector('[role=tab][aria-selected=true]')?.textContent==='Gợi ý luyện tập'`);
    await evaluate(`document.querySelector('[role=tab]').click()`);
    await wait(`document.querySelector('[role=tab][aria-selected=true]')?.textContent==='Đề luyện của giảng viên'`);
    assert.equal(await evaluate(`Boolean(document.querySelector('.adaptive-practice'))`), false);
    console.log""")
p.write_text(s,encoding='utf-8')
