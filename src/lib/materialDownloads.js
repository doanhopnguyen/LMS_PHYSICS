import { api, apiRequest } from './apiClient.js';

export async function resolveMaterialDownload(material) {
  const source = material.fileId
    ? (await api.files.downloadUrl(material.fileId)).downloadUrl
    : material.downloadUrl || material.fileUrl || material.url || '';
  if (!source) return '';
  return new URL(source, import.meta.env.VITE_API_BASE_URL || location.origin).href;
}
export async function fetchMaterialBlob(material, signal) {
  const source = await resolveMaterialDownload(material);
  if (!source) throw new Error('Không có liên kết tài liệu.');
  const base = new URL(import.meta.env.VITE_API_BASE_URL || location.origin, location.origin);
  const url = new URL(source, base);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Liên kết tài liệu không hợp lệ.');
  // Attach JWT only to our backend file route, never to third-party citations.
  if (
    !material.fileId &&
    url.origin === base.origin &&
    url.pathname.startsWith('/api/v1/files/') &&
    !url.searchParams.has('token')
  ) {
    return { blob: await apiRequest(`${url.pathname}${url.search}`, { responseType: 'blob' }), source: url.href };
  }
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'Không thể tải tài liệu.');
  }
  return { blob: await response.blob(), source: url.href };
}
