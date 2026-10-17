from pathlib import Path
p=Path('src/pages/students/AdaptivePracticeSession.jsx')
s=p.read_text(encoding='utf-8')
s=s.replace("import { QuestionResponse } from '../../components/QuestionResponse.jsx';", "import { ExamTakingWorkspace } from '../../components/ExamTakingWorkspace.jsx';\nimport { DetailToolbar } from '../../components/DetailToolbar.jsx';")
s=s.replace('  const [active, setActive] = useState(0);\n','')
s=s.replace('  const question = questions[active];\n  const answered = questions.filter((row) => row.answerText?.trim() || row.selectedOptionIds?.length).length;\n','')
s=s.replace('      showChatLauncher={false}\n', '''      showChatLauncher={false}
      showChrome={Boolean(result)}
      footer={Boolean(result)}
      contentClass={result ? '' : 'exam-taking-page'}
      toolbar={!result ? <DetailToolbar title="Luyện tập theo gợi ý"
        subtitle="Câu trả lời được tự động lưu" backLabel="Về gợi ý ôn tập" onBack={leave}
        actions={session && <div className="exam-taking-actions">
          <Button icon="task_alt" data-action="submit-practice" disabled={busy || !questions.length} onClick={finish}>
            {busy ? 'Đang lưu và nộp…' : 'Nộp bài luyện'}
          </Button>
        </div>} /> : undefined}
''')
s=s.replace('      <PageContainer className="adaptive-session">\n        <PageTitle','      <PageContainer className={result ? "adaptive-session" : undefined}>\n        {result && <><PageTitle')
s=s.replace('        </div>\n        {error && (', '        </div></>}\n        {error && (',1)
a=s.index('              <div className="adaptive-session__layout">')
b=s.index('\n            </>\n          )',a)
s=s[:a]+'''              <ExamTakingWorkspace key={sessionId} allQuestions={questions}
                disabled={busy} savingQuestions={saving} onAnswerChange={change}
                onAnswerSave={(row) => { if (!locked.current) save(row); }}
                questionDetails={(row) => <div className="adaptive-question-context">
                  <StatusBadge tone={row.isReviewed ? 'warning' : 'neutral'}>
                    {row.isReviewed ? 'Ôn lại câu đã sai' : 'Câu hỏi mới'}
                  </StatusBadge>
                  <span>{[row.chapterName, row.topicName].filter(Boolean).join(' / ')}</span>
                </div>}
                sidebar={<Card className="exam-taking-info">
                  <h2 className="text-headline-sm font-bold">Thông tin bài luyện</h2>
                  <dl className="mt-5 space-y-4 text-body-sm">
                    <div className="border-b border-[#E2E8F0] pb-3">
                      <dt className="text-[#64748B]">Loại đề</dt>
                      <dd className="mt-1 font-semibold">Gợi ý từ câu đã trả lời sai</dd>
                    </div>
                    <div className="border-b border-[#E2E8F0] pb-3">
                      <dt className="text-[#64748B]">Số câu hỏi</dt>
                      <dd className="mt-1 font-semibold">{questions.length} câu</dd>
                    </div>
                    <div>
                      <dt className="text-[#64748B]">Thời gian làm bài</dt>
                      <dd className="mt-1 font-semibold">Không giới hạn</dd>
                    </div>
                  </dl>
                  <p className="mt-5 text-body-sm text-[#64748B]">
                    Bài gợi ý tập trung vào chủ đề cần ôn. Bạn có thể quay lại để tiếp tục bài đã lưu.
                  </p>
                </Card>} />'''+s[b:]
# Results already have their own toolbar; submission belongs to the shared taking header.
a=s.index('          {!result && session && (')
b=s.index('\n        </div></>}',a)
s=s[:a]+s[b:]
p.write_text(s,encoding='utf-8')
