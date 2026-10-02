export function questionTopicName(question, topics = []) {
  const topic = topics.find((item) =>
    question?.topicId != null && String(item.topicId) === String(question.topicId)
  );
  return question?.topicName?.trim() || question?.topic?.topicName?.trim() || topic?.topicName?.trim() || '—';
}
