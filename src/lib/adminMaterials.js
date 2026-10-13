import { apiRequest } from './apiClient.js';
import { itemsOf, loadAllPages } from './lecturerUtils.js';

export async function loadAdminMaterials(request = apiRequest) {
  const subjects = await loadAllPages(request, '/api/v1/subjects');
  const groups = await Promise.all(
    subjects.map(async (subject) => {
      const topics = itemsOf(await request(`/api/v1/subjects/${encodeURIComponent(subject.subjectId)}/topics`));
      const materials = await Promise.all(
        topics.map(async (topic) => {
          const rows = await loadAllPages(request, `/api/v1/topics/${encodeURIComponent(topic.topicId)}/materials`);
          return rows.map((row) => ({
            ...row,
            topicId: topic.topicId,
            topicName: topic.topicName,
            subjectId: subject.subjectId,
            subjectName: subject.subjectName,
          }));
        })
      );
      return {
        topics: topics.map((topic) => ({ ...topic, subjectId: subject.subjectId })),
        materials: materials.flat(),
      };
    })
  );
  return {
    subjects,
    topics: groups.flatMap((group) => group.topics),
    materials: groups.flatMap((group) => group.materials),
  };
}
