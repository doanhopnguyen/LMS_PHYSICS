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
  const classes = await loadAllPages(request, '/api/v1/classes');
  const subjectById = new Map(subjects.map((row) => [row.subjectId, row]));
  const topicById = new Map(groups.flatMap((group) => group.topics).map((row) => [row.topicId, row]));
  const classGroups = await Promise.all(
    classes.map(async (row) => {
      const materials = itemsOf(await request(`/api/v1/classes/${encodeURIComponent(row.classId)}/materials`));
      return materials
        .filter((material) => material.scope === 'CLASS')
        .map((material) => ({
          ...material,
          classCode: row.classCode,
          subjectId: row.subjectId,
          subjectName: subjectById.get(row.subjectId)?.subjectName,
          topicName: topicById.get(material.topicId)?.topicName,
        }));
    })
  );
  return {
    subjects,
    topics: groups.flatMap((group) => group.topics),
    materials: [
      ...new Map(
        [...groups.flatMap((group) => group.materials), ...classGroups.flat()].map((material) => [
          material.materialId,
          material,
        ])
      ).values(),
    ],
  };
}
