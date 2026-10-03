import { api } from './apiClient.js';

export function experimentHref(page, { experimentId, classId, assignmentId }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ experimentId, classId, assignmentId })) {
    if (value) query.set(key, value);
  }
  return query.size ? `${page}?${query}` : page;
}

export async function loadStudentExperiment(experimentId, assignmentId) {
  const [experiment, response] = await Promise.all([
    api.experiments.get(experimentId),
    assignmentId ? api.students.myExperimentAssignments() : Promise.resolve([]),
  ]);
  const assignments = Array.isArray(response) ? response : response?.content || [];
  const assignment = assignments.find((item) => String(item.assignmentId) === String(assignmentId));
  if (assignmentId && (!assignment || String(assignment.experimentId) !== String(experimentId))) {
    throw new Error('Không tìm thấy bài giao phù hợp với thí nghiệm này. Hãy mở lại từ danh sách thí nghiệm.');
  }
  return {
    ...experiment,
    instructions: assignment?.instructionsOverride?.trim() ? assignment.instructionsOverride : experiment.instructions,
  };
}
