export const studentKey = (row) => String(row?.studentId ?? row?.userId ?? '');

export function groupStudentProgress(students, topics, progress) {
  const chapters = new Map(topics.map((topic) => [String(topic.topicId), topic]));
  for (const row of progress) {
    const id = String(row.topicId);
    if (row.topicId != null && !chapters.has(id)) chapters.set(id, { topicId: row.topicId, topicName: row.topicName });
  }
  const people = new Map(students.map((student) => [studentKey(student), student]));
  for (const row of progress) {
    const id = studentKey(row);
    if (id && !people.has(id)) people.set(id, { studentId: id, studentName: row.studentName });
  }
  return [...people.entries()]
    .filter(([id]) => id)
    .map(([id, student]) => {
      const own = new Map();
      for (const row of progress.filter((item) => studentKey(item) === id)) {
        const topicId = String(row.topicId);
        const previous = own.get(topicId);
        if (
          !previous ||
          !Number.isFinite(Date.parse(previous.lastAccessedAt)) ||
          Date.parse(row.lastAccessedAt) >= Date.parse(previous.lastAccessedAt)
        )
          own.set(topicId, row);
      }
      const chapterRows = [...chapters.entries()].map(([topicId, topic]) => {
        const row = own.get(topicId);
        return {
          ...topic,
          progressPercent: Math.min(100, Math.max(0, Number(row?.progressPercent) || 0)),
          lastAccessedAt: row?.lastAccessedAt,
        };
      });
      const lastAccessedAt = [...own.values()]
        .map((row) => row.lastAccessedAt)
        .filter((value) => Number.isFinite(Date.parse(value)))
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
      return {
        ...student,
        studentId: id,
        chapters: chapterRows,
        completedChapters: chapterRows.filter((row) => row.progressPercent === 100).length,
        progressPercent: chapterRows.length
          ? Math.floor(chapterRows.reduce((sum, row) => sum + row.progressPercent, 0) / chapterRows.length)
          : 0,
        lastAccessedAt,
      };
    });
}
