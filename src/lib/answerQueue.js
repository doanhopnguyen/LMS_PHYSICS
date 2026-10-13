// Preserve write order and retry unsaved answers before submitting a session.
export function createAnswerQueue(send) {
  let pending = Promise.resolve();
  const failed = new Map();
  const latest = new Map();
  let version = 0;
  function enqueue(body) {
    const item = { body, version: ++version };
    latest.set(body.questionId, item);
    const request = pending
      .catch(() => {})
      .then(async () => {
        try {
          await send(body);
          if (failed.get(body.questionId)?.version <= item.version) failed.delete(body.questionId);
        } catch (error) {
          failed.set(body.questionId, item);
          throw error;
        }
      });
    pending = request;
    return request;
  }
  async function flush() {
    await pending.catch(() => {});
    for (const questionId of [...failed.keys()]) await enqueue(latest.get(questionId).body);
    await pending;
  }
  return { enqueue, flush };
}
