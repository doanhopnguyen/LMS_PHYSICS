import { api } from './apiClient.js';

export const CHUNK_SIZE = 102400;
const hex = (bytes) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
export async function fileFingerprint(file, signal) {
  const hashes = [];
  for (let start = 0; start < file.size; start += CHUNK_SIZE) {
    signal?.throwIfAborted();
    hashes.push(hex(await crypto.subtle.digest('SHA-256', await file.slice(start, start + CHUNK_SIZE).arrayBuffer())));
  }
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashes.join(':'))));
}

// Storage retains metadata only. Resume always requires the original file bytes.
export async function uploadInChunks(
  file,
  { ownerId, uploadId, storage, signal, onProgress = () => {}, service = api.files } = {}
) {
  if (!file?.size) throw new Error('Chọn tệp có nội dung.');
  if (!ownerId) throw new Error('Cần đăng nhập để tải tệp.');
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  onProgress({ phase: 'hashing', totalChunks, percent: 0 });
  const fingerprint = await fileFingerprint(file, signal);
  const key = `ptit-chunk:${ownerId}:${encodeURIComponent(file.name)}:${file.size}:${fingerprint}`;
  let stored;
  try {
    stored = JSON.parse(storage?.getItem(key) || 'null');
  } catch {}
  const id = uploadId || stored?.uploadId || crypto.randomUUID();
  try {
    storage?.setItem(key, JSON.stringify({ uploadId: id, fileName: file.name, fileSize: file.size, fingerprint }));
  } catch {}
  let status;
  try {
    status = await service.chunkStatus(id);
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  if (status?.status === 'MERGING') throw new Error('Tệp đang được ghép. Thử lại sau.');
  const acknowledged = new Set(status?.uploadedChunks || []);
  if (status?.status === 'COMPLETED') for (let index = 0; index < totalChunks; index++) acknowledged.add(index);
  const report = (phase) =>
    onProgress({
      uploadId: id,
      phase,
      uploadedChunks: acknowledged.size,
      totalChunks,
      percent: Math.round((acknowledged.size / totalChunks) * 100),
    });
  async function retry(operation) {
    for (let attempt = 0; ; attempt++) {
      signal?.throwIfAborted();
      try {
        return await operation();
      } catch (error) {
        if (attempt >= 2 || (error.status && error.status < 500 && error.status !== 429)) throw error;
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
      }
    }
  }
  async function sendChunk(index) {
    if (!Number.isInteger(index) || index < 0 || index >= totalChunks) throw new Error('Chỉ số chunk không hợp lệ.');
    const form = new FormData();
    form.set('uploadId', id);
    form.set('chunkIndex', String(index));
    form.set('totalChunks', String(totalChunks));
    form.set('fileName', file.name);
    form.set('chunk', file.slice(index * CHUNK_SIZE, Math.min((index + 1) * CHUNK_SIZE, file.size)), file.name);
    await retry(() => service.chunk(form));
    acknowledged.add(index);
    report('uploading');
  }
  if (status?.status !== 'COMPLETED') {
    report('uploading');
    for (let index = 0; index < totalChunks; index++) if (!acknowledged.has(index)) await sendChunk(index);
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    signal?.throwIfAborted();
    report('merging');
    try {
      const result = await retry(() => service.merge(id));
      if (result.status !== 'COMPLETED' || !result.fileId) throw new Error('Máy chủ chưa hoàn tất ghép tệp.');
      report('completed');
      return result;
    } catch (error) {
      if (
        error.status !== 409 ||
        error.data?.status !== 'INCOMPLETE' ||
        !Array.isArray(error.data.missingChunks) ||
        attempt === 2
      )
        throw error;
      for (const index of error.data.missingChunks) {
        acknowledged.delete(index);
        await sendChunk(index);
      }
    }
  }
}
