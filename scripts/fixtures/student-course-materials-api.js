localStorage.setItem(
  'ptit-physics-demo-session',
  JSON.stringify({ role: 'STUDENT', userId: 'student-course', name: 'Sinh viên' })
);
localStorage.setItem('ptit-physics-access-token', 'isolated-test');
window.calls = [];
if (new URL(location.href).searchParams.get('format') === 'YOUTUBE') {
  window.__videoClock = 0;
  Object.defineProperty(performance, 'now', { value: () => window.__videoClock });
  window.YT = {
    Player: class {
      constructor(mount, options) {
        this.time = 0;
        this.duration = 10;
        this.state = 2;
        this.rate = 1;
        this.options = options;
        window.__youtube = this;
        queueMicrotask(() => options.events.onReady());
      }
      getCurrentTime() {
        return this.time;
      }
      getDuration() {
        return this.duration;
      }
      getPlayerState() {
        return this.state;
      }
      getPlaybackRate() {
        return this.rate;
      }
      pauseVideo() {
        this.state = 2;
      }
      setPlaybackRate(rate) {
        this.rate = rate;
      }
      seekTo(time) {
        this.time = time;
      }
      destroy() {}
    },
  };
}
const studentCourse = {
  classId: 'course1',
  subjectId: 'subject1',
  classCode: 'VL-01',
  subjectName: 'Vật lý đại cương',
  instructorName: 'Nguyễn Văn A',
};
const studentTopics = [
  { topicId: 'topic1', topicName: 'Động học', subjectId: 'subject1', chapterId: 'chapter1' },
  { topicId: 'topic2', topicName: 'Động lực học', subjectId: 'subject1', chapterId: 'chapter2' },
  { topicId: 'topic3', topicName: 'Chủ đề bổ sung', subjectId: 'subject1' },
];
const studentMaterials = [
  ...Array.from({ length: 2 }, (_, i) => ({ materialId: 'shared' + i, scope: 'SHARED', title: 'Học liệu chính ' + i })),
  ...Array.from({ length: 12 }, (_, i) => ({
    materialId: 'private' + i,
    scope: 'CLASS',
    classId: 'course1',
    title: 'Bài giao riêng ' + i,
  })),
].map((material) => ({
  ...material,
  topicId: 'topic1',
  subjectId: 'subject1',
  approvalStatus: 'APPROVED',
  type: 'TEXT',
  contentText: 'Nội dung ' + material.title,
}));
studentMaterials.push({
  materialId: 'shared-next',
  scope: 'SHARED',
  title: 'Học liệu chương 2',
  topicId: 'topic2',
  subjectId: 'subject1',
  approvalStatus: 'APPROVED',
  type: 'TEXT',
  contentText: 'Nội dung chương tiếp theo',
});
window.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
  const pathname = url.pathname;
  if (pathname === '/fixtures/learning.pdf') {
    const stream = 'BT /F1 12 Tf 20 100 Td (Student PDF preview) Tj ET';
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } });
  }
  const method = options.method || 'GET';
  const body = typeof options.body === 'string' ? JSON.parse(options.body) : null;
  calls.push({ pathname, method, query: Object.fromEntries(url.searchParams), body });
  let data = [];
  if (pathname === '/api/v1/users/me' || pathname === '/api/v1/users/profile')
    data = { userId: 'student-course', role: 'STUDENT', fullName: 'Sinh viên' };
  if (pathname === '/api/v1/notifications/summary') data = { unreadCount: 0, latestNotifications: [] };
  if (pathname === '/api/v1/students/me/classes') data = [studentCourse];
  if (pathname === '/api/v1/subjects/subject1/topics') data = studentTopics;
  if (pathname === '/api/v1/subjects/subject1/chapters')
    data = [
      { chapterId: 'chapter1', chapterName: 'Chương 1. Cơ học', orderIndex: 1 },
      { chapterId: 'chapter2', chapterName: 'Chương 2. Động lực học', orderIndex: 2 },
    ];
  if (pathname === '/api/v1/subjects/subject1/topics/topic1') data = studentTopics[0];
  if (pathname === '/api/v1/subjects/subject1/topics/topic2') data = studentTopics[1];
  if (pathname === '/api/v1/subjects/subject1/topics/topic3') data = studentTopics[2];
  if (pathname === '/api/v1/students/me/materials') {
    data = studentMaterials.filter(
      (material) =>
        (!url.searchParams.get('topicId') || url.searchParams.get('topicId') === material.topicId) &&
        (!new URL(location.href).searchParams.has('empty') || material.scope === 'SHARED')
    );
    const format = new URL(location.href).searchParams.get('format');
    if (format)
      data = data.map((material) =>
        material.materialId !== 'shared0'
          ? material
          : {
              ...material,
              type: format === 'YOUTUBE' ? 'VIDEO' : format,
              sourceCitation: format === 'YOUTUBE' ? 'https://youtu.be/abcdefghijk' : undefined,
              contentText: format === 'MARKDOWN' ? '# Bài học Markdown\n\n**Nội dung nổi bật**' : '',
              fileUrl: ['PDF', 'VIDEO'].includes(format)
                ? `${location.origin}/fixtures/${format === 'PDF' ? 'learning.pdf' : 'learning.mp4'}`
                : undefined,
            }
      );
  }
  if (method === 'POST' && pathname.includes('progress')) data = body;
  return Response.json({ data });
};
