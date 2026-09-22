import { labGradingResults } from '../data/lecturerData.js';

const STORAGE_KEY = 'ptit-physics-lab-gradings';

export function loadLabGradings() {
  if (typeof window === 'undefined') return labGradingResults;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    const storedIds = new Set(stored.map((item) => item.submissionId));
    return [...stored, ...labGradingResults.filter((item) => !storedIds.has(item.submissionId))];
  } catch {
    return labGradingResults;
  }
}

export function saveLabGrading(result) {
  const current = loadLabGradings();
  const next = current.some((item) => item.submissionId === result.submissionId)
    ? current.map((item) => (item.submissionId === result.submissionId ? result : item))
    : [result, ...current];
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function gradingForSubmission(submissionId) {
  return loadLabGradings().find((item) => item.submissionId === submissionId) ?? null;
}
