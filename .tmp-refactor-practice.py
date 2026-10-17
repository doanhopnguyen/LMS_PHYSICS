from pathlib import Path
root = Path('D:/DEV/LMS_PHYSICS')
p = root/'src/pages/students/ExamSessionPage.jsx'
s = p.read_text(encoding='utf-8')
start = s.index('          <div className="mx-auto max-w-6xl space-y-6">', s.index('export function AttemptSession'))
end = s.index('\n        )}\n      </PageContainer>', start)
markup = s[start:end]
side_start = markup.index('                <Card className="exam-taking-info">')
side_end = markup.index('\n              </aside>', side_start)
sidebar = markup[side_start:side_end].strip()
markup = markup[:side_start] + '                {sidebar}' + markup[side_end:]
a = markup.index('                {!attempt && (')
b = markup.index('                {attempt && !isCompleted && questions.length', a)
markup = markup[:a] + '                {!enabled && emptyContent}\n' + markup[b:]
a = markup.index('                {false && attempt')
b = markup.index('\n              </Card>', a)
markup = markup[:a] + markup[b:]
markup = markup.replace('attempt && !isCompleted', 'enabled').replace('disabled={submitting}', 'disabled={disabled}')
markup = markup.replace('updateAnswer(question, patch)', 'onAnswerChange(question, patch)').replace('saveAnswer(question)', 'onAnswerSave(question)')
markup = markup.replace('                        {question.mediaUrl && (', '                        {questionDetails?.(question)}\n                        {question.mediaUrl && (')
markup = markup.replace('disabled={activeQuestion === 0}', 'disabled={disabled || activeQuestion === 0}').replace('disabled={activeQuestion >= allQuestions.length - 1}', 'disabled={disabled || activeQuestion >= allQuestions.length - 1}')
markup = markup.replace('key={question.questionId}\n                        aria-label=', 'key={question.questionId}\n                        disabled={disabled}\n                        aria-label=')
effect_start = s.index('  useEffect(() => {\n    const navigator =', s.index('export function AttemptSession'))
effect_end = s.index('  useEffect(() => {\n    if (takeMode', effect_start)
effects = s[effect_start:effect_end].replace('[loading, attempt?.attemptId, attempt?.status, error]', '[enabled, allQuestions.length]')
component = '''import React, { useEffect, useState } from 'react';
import { Button } from './Button.jsx';
import { Card } from './Card.jsx';
import { FileImage } from './FileImage.jsx';
import { QuestionResponse } from './QuestionResponse.jsx';
import '../styles/exam-session.css';

// The exam and recommended-practice flows share presentation while keeping
// their own API contracts, save queues and server-side scoring.
export function ExamTakingWorkspace({
  allQuestions = [], enabled = true, disabled = false, savingQuestions = [],
  onAnswerChange, onAnswerSave, sidebar, questionDetails, emptyContent, progress,
}) {
  const [layout, setLayout] = useState('single');
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const questions = layout === 'single'
    ? (allQuestions[activeQuestion] ? [allQuestions[activeQuestion]] : []) : allQuestions;
'''+effects+'\n  return (\n'+markup+'\n  );\n}\n'
(root/'src/components/ExamTakingWorkspace.jsx').write_text(component, encoding='utf-8')
replacement = '''          <ExamTakingWorkspace
            key={attempt?.attemptId || examId}
            allQuestions={allQuestions}
            enabled={Boolean(attempt && !isCompleted)}
            disabled={submitting}
            savingQuestions={savingQuestions}
            onAnswerChange={updateAnswer}
            onAnswerSave={saveAnswer}
            progress={progress}
            emptyContent={<p role="status" className="text-body-sm text-[#64748B]">
              {isCompleted ? 'Bạn đã hoàn thành lượt làm bài' : availability.reason || 'Đang mở bài thi…'}
            </p>}
            sidebar={'''+sidebar+'''}
          />'''
s = s[:start]+replacement+s[end:]
s = s[:effect_start]+s[effect_end:]
s = s.replace("import { QuestionResponse } from '../../components/QuestionResponse.jsx';", "import { ExamTakingWorkspace } from '../../components/ExamTakingWorkspace.jsx';")
s = s.replace("import { FileImage } from '../../components/FileImage.jsx';\n", '')
s = s.replace("  const [questions, setQuestions] = useState([]);\n", '')
for line in ["  const [layout, setLayout] = useState('single');\n", '  const [activeQuestion, setActiveQuestion] = useState(0);\n', '  const [flaggedQuestions, setFlaggedQuestions] = useState([]);\n', '      setQuestions([]);\n', '          setQuestions(rows);\n']:
    s = s.replace(line, '')
a = s.index('  useEffect(() => {\n    setQuestions(')
b = s.index('  useEffect(() => {', a+10)
s = s[:a]+s[b:]
p.write_text(s, encoding='utf-8')

p = root/'src/pages/students/ExamPracticePage.jsx'
s = p.read_text(encoding='utf-8').replace('function PracticeCenter() {', 'function TeacherPracticePanel() {')
s = s.replace("import { AdaptivePracticePanel }", "import { Tabs } from '../../components/Tabs.jsx';\nimport { AdaptivePracticePanel }")
a = s.index('    <AppShell', s.index('function TeacherPracticePanel'))
b = s.index('        <AuthAlert>', a)
s = s[:a]+'''    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="secondary" icon="refresh" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}>
          Tải lại
        </Button>
      </div>
'''+s[b:]
s = s.replace('      </PageContainer>\n    </AppShell>\n  );\n}', '    </div>\n  );\n}')
s += '''
function PracticeCenter() {
  const params = new URLSearchParams(window.location.search);
  const activeTab = params.get('tab') === 'suggestions' || (!params.has('tab') && params.has('recommendClassId'))
    ? 'suggestions' : 'teacher';
  const changeTab = (tab) => {
    const query = new URLSearchParams(window.location.search);
    query.set('tab', tab);
    navigate(`exam_practice_center.html?${query}`);
  };
  return (
    <AppShell currentPage="exam_practice_center.html" title="Trung tâm ôn luyện · PTIT Physics 1"
      breadcrumbs={['Ôn luyện']} current="Trung tâm ôn luyện">
      <PageContainer>
        <PageTitle eyebrow="LUYỆN TẬP CÁ NHÂN" title="Trung tâm ôn luyện"
          description="Luyện đề của giảng viên hoặc củng cố kiến thức từ những câu đã trả lời sai." />
        <Tabs activeId={activeTab} onChange={changeTab} items={[
          { id: 'teacher', label: 'Đề luyện của giảng viên' },
          { id: 'suggestions', label: 'Gợi ý luyện tập' },
        ]}>
          {(tab) => <section role="tabpanel" aria-label={tab === 'teacher' ? 'Đề luyện của giảng viên' : 'Gợi ý luyện tập'}
            className="pt-6">
            {tab === 'teacher' ? <TeacherPracticePanel /> : <AdaptivePracticePanel />}
          </section>}
        </Tabs>
      </PageContainer>
    </AppShell>
  );
}
'''
p.write_text(s, encoding='utf-8')

p = root/'src/lib/adaptivePractice.js'
s = p.read_text(encoding='utf-8').replace('exam_practice_center.html?practiceSessionId=', 'exam_practice_center.html?tab=suggestions&practiceSessionId=')
s = s.replace("`exam_practice_center.html${classId ? `?recommendClassId=${encodeURIComponent(classId)}` : ''}`", "`exam_practice_center.html?tab=suggestions${classId ? `&recommendClassId=${encodeURIComponent(classId)}` : ''}`")
p.write_text(s, encoding='utf-8')
