import { getDemoSession } from './demoSession.js';
import { materialVideoSource } from './materialSources.js';

export const progressPercent = (completed, total) =>
  !total ? 0 : Math.min(100, Math.floor((completed.length * 100) / total));
export function progressKey(classId, topicId) {
  const user = getDemoSession();
  return `ptit-material-progress-v1:${user?.userId || user?.username || user?.role || 'guest'}:${classId || ''}:${topicId || ''}`;
}
export function readMaterialProgress(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key)) || null;
  } catch {
    return null;
  }
}
export function writeMaterialProgress(key, state) {
  window.localStorage.setItem(key, JSON.stringify(state));
}
export function reconcileMaterialProgress(materials, previous, server = {}) {
  const ids = new Set(materials.map((row) => String(row.materialId)));
  let completed = previous?.completed;
  if (!Array.isArray(completed)) {
    // Preserve legacy completion only for material that existed at the recorded access time.
    const cutoff = Date.parse(server.lastAccessedAt);
    const older = materials
      .filter((row) => Number.isFinite(cutoff) && Date.parse(row.createdAt) <= cutoff)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    const count = Math.floor(
      (older.length * Math.min(100, Math.max(0, Number(server.progressPercent ?? server.completionPercent) || 0))) / 100
    );
    completed = older.slice(0, count).map((row) => String(row.materialId));
  }
  completed = [...new Set(completed.map(String))].filter((id) => ids.has(id));
  const watched = { ...(previous?.watched || {}) };
  const sources = {};
  for (const material of materials) {
    const id = String(material.materialId);
    sources[id] = materialVideoSource(material)?.url || '';
    if (previous?.sources && previous.sources[id] !== sources[id]) {
      delete watched[id];
      if (material.type === 'VIDEO') completed = completed.filter((done) => done !== id);
    }
  }
  return { completed, watched: Object.fromEntries(Object.entries(watched).filter(([id]) => ids.has(id))), sources };
}
