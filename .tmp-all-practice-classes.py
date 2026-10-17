from pathlib import Path
p=Path('src/components/AdaptivePracticePanel.jsx')
s=p.read_text(encoding='utf-8')
s=s.replace('export function AdaptivePracticePanel() {', 'function PracticeClassPanel({ classItem }) {\n  const classId = classItem.classId;')
for line in ['  const [classes, setClasses] = useState([]);\n', "  const [classId, setClassId] = useState('');\n", '  const [loadingClasses, setLoadingClasses] = useState(true);\n', "  const [classError, setClassError] = useState('');\n", '  const [version, setVersion] = useState(0);\n']:
    s=s.replace(line,'')
a=s.index('  useEffect(() => {')
b=s.index('  useEffect(() => {',a+10)
s=s[:a]+s[b:]
s=s.replace('[classId, version]', '[classId]')
s=s.replace('const selectedClass = classes.find((row) => row.classId === classId);', 'const selectedClass = classItem;')
a=s.index('      {loadingClasses ? (')
b=s.index('          <div className="adaptive-practice__controls">',a)
s=s[:a]+s[b:]
a=s.rfind('        </>\n      )}')
s=s[:a]+s[a:].replace('        </>\n      )}', '', 1)
outer='''export function AdaptivePracticePanel() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const params = new URLSearchParams(window.location.search);
  const semester = params.get('semester') || '';
  const classId = params.has('class') ? params.get('class') || 'ALL' : params.get('recommendClassId') || 'ALL';
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api.students.myClasses()
      .then((data) => {
        if (alive) setClasses(rowsOf(data).filter((row) =>
          (!semester || String(row.semesterId) === semester) &&
          (classId === 'ALL' || String(row.classId) === classId)));
      })
      .catch((err) => { if (alive) setError(err.message || 'Không thể tải lớp học.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [semester, classId, retry]);
  if (loading) return <LoadingIndicator>Đang tải lớp học…</LoadingIndicator>;
  if (error) return <div className="adaptive-practice__notice" role="alert">
    {error}<Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>Thử lại</Button>
  </div>;
  if (!classes.length) return <div className="adaptive-practice__empty">
    <AdaptivePracticeIcon name="school" />
    <h3>Gợi ý sẽ xuất hiện theo lớp học</h3>
    <p>Không có lớp học trong phạm vi đã chọn để bắt đầu luyện tập.</p>
    <a href="my_courses.html">Xem học phần của tôi</a>
  </div>;
  return <div className="space-y-10">
    {classes.map((item) => <section key={item.classId} data-practice-class={item.classId} className="space-y-5">
      {classes.length > 1 && <h2 className="text-headline-md font-bold">
        {[item.subjectName || item.subjectCode, item.classCode || item.className].filter(Boolean).join(' · ') || 'Lớp học'}
      </h2>}
      <PracticeClassPanel classItem={item} />
    </section>)}
  </div>;
}

'''
i=s.index('function PracticeClassPanel')
s=s[:i]+outer+s[i:]
p.write_text(s,encoding='utf-8')
