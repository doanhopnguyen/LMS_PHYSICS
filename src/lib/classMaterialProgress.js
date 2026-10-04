import { api } from './apiClient.js';
import { itemsOf } from './lecturerUtils.js';
import {
  progressKey,
  progressPercent,
  readMaterialProgress,
  writeMaterialProgress,
  reconcileMaterialProgress,
} from './materialProgress.js';

export async function loadClassMaterialProgress(classId) {
  const [materialsData, progressData] = await Promise.all([
    api.students.myMaterials({ classId }),
    api.students.myProgress(classId),
  ]);
  const materials = itemsOf(materialsData);
  const previous = itemsOf(progressData);
  const topics = new Set([
    ...materials.map((item) => String(item.topicId)),
    ...previous.map((item) => String(item.topicId)),
  ]);
  return Promise.all(
    [...topics].map(async (topicId) => {
      const rows = materials.filter((item) => String(item.topicId) === topicId);
      const server = previous.find((item) => String(item.topicId) === topicId) || {};
      const key = progressKey(classId, topicId);
      const state = reconcileMaterialProgress(rows, readMaterialProgress(key), server);
      writeMaterialProgress(key, state);
      const percent = progressPercent(state.completed, rows.length);
      let syncError = '';
      if (Number(server.progressPercent ?? server.completionPercent ?? 0) !== percent) {
        try {
          await api.students.updateProgress({ classId, topicId, progressPercent: percent });
        } catch (error) {
          syncError = error.message;
        }
      }
      return { ...server, classId, topicId, progressPercent: percent, syncError };
    })
  );
}
