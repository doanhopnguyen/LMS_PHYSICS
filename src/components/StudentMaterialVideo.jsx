import React, { useEffect, useState } from 'react';
import { GuardedVideoPlayer } from './GuardedVideoPlayer.jsx';
import { useMaterialProgress } from '../hooks/useMaterialProgress.js';
import { api } from '../lib/apiClient.js';
import { itemsOf } from '../lib/lecturerUtils.js';

export function StudentMaterialVideo({ material, fill = false }) {
  const learning = useMaterialProgress();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setReady(false);
    setError('');
    (async () => {
      if (!material.classId || !material.topicId) throw new Error('Mở video từ lớp học để ghi nhận tiến độ.');
      const [rows, progress] = await Promise.all([
        api.students.myMaterials({ classId: material.classId, topicId: material.topicId }),
        api.students.myProgress(material.classId),
      ]);
      if (!active) return;
      learning.initialize(
        itemsOf(rows).filter((row) => String(row.topicId) === String(material.topicId)),
        itemsOf(progress).find((row) => String(row.topicId) === String(material.topicId)) || {},
        material.classId,
        material.topicId
      );
      setReady(true);
    })().catch((failure) => active && setError(failure.message));
    return () => {
      active = false;
    };
  }, [material.classId, material.topicId, material.materialId]);
  if (error)
    return (
      <p role="alert" className="p-4 text-primary">
        {error}
      </p>
    );
  if (!ready)
    return (
      <p role="status" className="p-4">
        Đang tải tiến độ video…
      </p>
    );
  return (
    <div className={fill ? 'flex min-h-0 flex-1 flex-col' : 'space-y-2'}>
      {learning.error && (
        <p role="alert" className="p-3 text-primary">
          {learning.error}{' '}
          <button type="button" className="underline" onClick={learning.retry}>
            Đồng bộ lại
          </button>
        </p>
      )}
      <GuardedVideoPlayer
        key={material.materialId}
        material={material}
        fill={fill}
        completed={learning.completed.includes(String(material.materialId))}
        watchedSeconds={learning.watched[String(material.materialId)]?.seconds || 0}
        onProgress={(record) => learning.watch(material.materialId, record)}
      />
    </div>
  );
}
