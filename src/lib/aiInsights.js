export function filterAIActivity(records, filters) {
  const anchor = new Date('2026-09-22T23:59:59');
  const rangeStart =
    filters.range === 'ALL'
      ? null
      : filters.range === '7D'
      ? new Date('2026-09-16T00:00:00')
      : filters.range === '30D'
        ? new Date('2026-08-24T00:00:00')
        : filters.range === 'SEMESTER'
          ? new Date('2026-08-01T00:00:00')
          : filters.customStart
            ? new Date(`${filters.customStart}T00:00:00`)
            : null;
  const rangeEnd = filters.range === 'CUSTOM' && filters.customEnd ? new Date(`${filters.customEnd}T23:59:59`) : anchor;
  return records.filter((record) => {
    const date = new Date(`${record.date}T12:00:00`);
    return (
      (!filters.classId || filters.classId === 'ALL' || record.classId === filters.classId) &&
      (!filters.chapterId || filters.chapterId === 'ALL' || record.chapterId === filters.chapterId) &&
      (!rangeStart || date >= rangeStart) &&
      (!rangeEnd || date <= rangeEnd)
    );
  });
}

export function getAIStats(records, topics) {
  const totalQuestions = records.reduce((sum, item) => sum + item.questionCount, 0);
  const totalResponses = records.reduce((sum, item) => sum + item.responseCount, 0);
  const cited = records.reduce((sum, item) => sum + item.citedResponseCount, 0);
  const insufficient = records.reduce((sum, item) => sum + item.insufficientEvidenceCount, 0);
  const uniqueStudents = new Set(records.flatMap((item) => item.studentIds)).size;
  const topicCounts = Object.groupBy
    ? Object.groupBy(records, (item) => item.topicId)
    : records.reduce((groups, item) => ({ ...groups, [item.topicId]: [...(groups[item.topicId] ?? []), item] }), {});
  const topTopicId = Object.entries(topicCounts).sort(
    (a, b) =>
      b[1].reduce((sum, item) => sum + item.questionCount, 0) - a[1].reduce((sum, item) => sum + item.questionCount, 0)
  )[0]?.[0];
  return {
    totalQuestions,
    totalResponses,
    cited,
    insufficient,
    uniqueStudents,
    citationRate: totalResponses ? (cited / totalResponses) * 100 : 0,
    topTopic: topics.find((topic) => topic.id === topTopicId)?.name ?? '—',
  };
}

export function getAIActivityByChapter(records) {
  const ids = [...new Set(records.map((item) => item.chapterId))];
  return ids
    .map((chapterId) => {
      const rows = records.filter((item) => item.chapterId === chapterId);
      const questions = rows.reduce((sum, item) => sum + item.questionCount, 0);
      const responses = rows.reduce((sum, item) => sum + item.responseCount, 0);
      const insufficient = rows.reduce((sum, item) => sum + item.insufficientEvidenceCount, 0);
      return {
        id: chapterId,
        questions,
        students: new Set(rows.flatMap((item) => item.studentIds)).size,
        cited: rows.reduce((sum, item) => sum + item.citedResponseCount, 0),
        insufficient,
        refusalRate: responses ? (insufficient / responses) * 100 : 0,
      };
    })
    .sort((a, b) => b.questions - a.questions);
}

export function getTopAITopics(records, topics) {
  return topics
    .map((topic) => {
      const rows = records.filter((item) => item.topicId === topic.id);
      return {
        ...topic,
        questions: rows.reduce((sum, item) => sum + item.questionCount, 0),
        students: new Set(rows.flatMap((item) => item.studentIds)).size,
        cited: rows.reduce((sum, item) => sum + item.citedResponseCount, 0),
        insufficient: rows.reduce((sum, item) => sum + item.insufficientEvidenceCount, 0),
        responses: rows.reduce((sum, item) => sum + item.responseCount, 0),
      };
    })
    .filter((item) => item.questions > 0)
    .sort((a, b) => b.questions - a.questions);
}

export function getInsufficientEvidenceTopics(records, topics) {
  return getTopAITopics(records, topics)
    .filter((topic) => topic.insufficient > 0)
    .sort((a, b) => b.insufficient - a.insufficient);
}

export function getAIActivityByDate(records) {
  return [...new Set(records.map((item) => item.date))].sort().map((date) => {
    const rows = records.filter((item) => item.date === date);
    return {
      date,
      questions: rows.reduce((sum, item) => sum + item.questionCount, 0),
      cited: rows.reduce((sum, item) => sum + item.citedResponseCount, 0),
      insufficient: rows.reduce((sum, item) => sum + item.insufficientEvidenceCount, 0),
    };
  });
}
