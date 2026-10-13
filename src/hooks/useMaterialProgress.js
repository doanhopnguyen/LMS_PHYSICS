import { useRef, useState } from 'react';
import { api } from '../lib/apiClient.js';
import {
  progressKey,
  progressPercent,
  readMaterialProgress,
  writeMaterialProgress,
  reconcileMaterialProgress,
} from '../lib/materialProgress.js';

export function useMaterialProgress() {
  const [state, setState] = useState({ completed: [], watched: {}, sources: {} });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const context = useRef(null);
  const current = useRef(state);
  const queue = useRef(Promise.resolve());
  function store(next) {
    if (context.current) writeMaterialProgress(context.current.key, next);
    current.current = next;
    setState(next);
  }
  function sync(next) {
    const scope = context.current;
    const percent = progressPercent(next.completed, scope.materials.length);
    if (!scope.classId) return Promise.resolve();
    setSaving(true);
    // Serialize percentage writes so a slower old request cannot overwrite a new completion.
    const request = queue.current
      .catch(() => {})
      .then(() =>
        api.students.updateProgress({ classId: scope.classId, topicId: scope.topicId, progressPercent: percent })
      );
    queue.current = request;
    request.then(
      () => {
        if (queue.current === request) {
          setSaving(false);
          setError('');
        }
      },
      (failure) => {
        if (queue.current === request) {
          setSaving(false);
          setError(`Đã lưu trên thiết bị, chưa đồng bộ tiến độ: ${failure.message}`);
        }
      }
    );
    return request;
  }
  function initialize(materials, server, classId, topicId) {
    const key = progressKey(classId, topicId);
    context.current = { materials, classId, topicId, key };
    const next = reconcileMaterialProgress(materials, readMaterialProgress(key), server);
    store(next);
    setError('');
    if (
      Number(server?.progressPercent ?? server?.completionPercent ?? 0) !==
      progressPercent(next.completed, materials.length)
    )
      sync(next).catch(() => {});
    return next;
  }
  function markComplete(id, videoEnded = false) {
    const key = String(id);
    const material = context.current?.materials.find((item) => String(item.materialId) === key);
    if (!material || current.current.completed.includes(key)) return;
    if (material.type === 'VIDEO' && !videoEnded && !current.current.watched[key]?.finished) return;
    const next = { ...current.current, completed: [...current.current.completed, key] };
    store(next);
    sync(next).catch(() => {});
  }
  function watch(id, progress) {
    const key = String(id);
    const previous = current.current.watched[key];
    const record = { seconds: progress.watched, finished: Boolean(progress.finished) };
    if (previous?.seconds === record.seconds && previous?.finished === record.finished) return;
    const next = { ...current.current, watched: { ...current.current.watched, [key]: record } };
    store(next);
    if (record.finished) markComplete(key, true);
  }
  return {
    ...state,
    saving,
    error,
    initialize,
    markComplete,
    watch,
    retry: () => sync(current.current).catch(() => {}),
    percent: progressPercent(state.completed, context.current?.materials.length || 0),
  };
}
