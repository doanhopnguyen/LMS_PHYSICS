export const UPLOAD_CHUNK_SIZE = 100 * 1024;
export const UPLOAD_CONCURRENCY = 10;
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
const CHUNK_PATH = '/api/v1/files/chunks';
const sessions = new WeakMap();

export function validateChunkFile(file) {
  if (!(file instanceof Blob) || !file.size || !file.name) throw new Error('Vui lòng chọn tệp có nội dung để tải lên.');
  const totalChunks = Math.ceil(file.size / UPLOAD_CHUNK_SIZE);
  if (totalChunks * UPLOAD_CHUNK_SIZE > MAX_UPLOAD_SIZE)
    throw new Error('Tệp vượt giới hạn tải lên 50 MB. Vui lòng chọn tệp nhỏ hơn.');
  return totalChunks;
}

function checkAbort(signal) {
  signal?.throwIfAborted();
}

async function retryRequest(operation, signal) {
  for (let attempt = 0; ; attempt++) {
    checkAbort(signal);
    try {
      return await operation();
    } catch (error) {
      if (
        signal?.aborted ||
        error.name === 'AbortError' ||
        attempt >= 2 ||
        (error.status != null && error.status !== 429 && error.status < 500)
      )
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
    }
  }
}

// request uses the existing authenticated API client; chunks and merge return
// plain objects rather than the usual { data } envelope.
export async function uploadFileInChunks(file, request, options = {}) {
  validateChunkFile(file);
  let fileSessions = sessions.get(file);
  if (!fileSessions) sessions.set(file, (fileSessions = new WeakMap()));
  let session = fileSessions.get(request);
  if (!session) {
    session = { uploadId: crypto.randomUUID(), started: false, pending: null };
    fileSessions.set(request, session);
  }
  if (session.pending) return session.pending;
  session.pending = performUpload(file, request, options, session);
  try {
    return await session.pending;
  } finally {
    session.pending = null;
  }
}

async function performUpload(file, request, { onProgress, signal, verify }, session) {
  const totalChunks = validateChunkFile(file);
  checkAbort(signal);
  let status;
  if (session.started) {
    try {
      status = await retryRequest(() => request(`${CHUNK_PATH}/${session.uploadId}/status`, { signal }), signal);
      if (status?.uploadId !== session.uploadId || status.totalChunks !== totalChunks)
        throw new Error('Thông tin phiên tải lên không khớp với tệp đã chọn.');
      if (['EXPIRED', 'FAILED'].includes(status.status)) {
        session.uploadId = crypto.randomUUID();
        status = null;
      }
    } catch (error) {
      if (error.status !== 404) throw error;
      // The first chunk may never have reached BE. Reuse the same UUID.
    }
  }
  const uploadId = session.uploadId;
  const acknowledged = new Set();
  let uploadedBytes = 0;
  const progress = (phase) =>
    onProgress?.({
      uploadId,
      fileName: file.name,
      totalChunks,
      uploadedChunks: acknowledged.size,
      uploadedBytes,
      totalBytes: file.size,
      phase,
      percent: phase === 'completed' ? 100 : Math.min(99, Math.floor((uploadedBytes / file.size) * 100)),
    });
  const sendChunk = async (index) => {
    checkAbort(signal);
    const chunk = file.slice(index * UPLOAD_CHUNK_SIZE, Math.min((index + 1) * UPLOAD_CHUNK_SIZE, file.size));
    const formData = new FormData();
    formData.set('uploadId', uploadId);
    formData.set('chunkIndex', String(index));
    formData.set('totalChunks', String(totalChunks));
    formData.set('fileName', file.name);
    formData.set('chunk', chunk, file.name);
    const response = await retryRequest(() => request(CHUNK_PATH, { method: 'POST', formData, signal }), signal);
    if (
      response?.uploaded !== true ||
      response.uploadId !== uploadId ||
      response.chunkIndex !== index ||
      response.totalChunks !== totalChunks
    )
      throw new Error('Máy chủ chưa xác nhận đúng phần tệp đã tải. Vui lòng thử lại.');
    if (!acknowledged.has(index)) {
      acknowledged.add(index);
      uploadedBytes += chunk.size;
    }
    progress('uploading');
  };
  const sendChunks = async (indices) => {
    let next = 0;
    let failure;
    const workers = Array.from({ length: Math.min(UPLOAD_CONCURRENCY, indices.length) }, async () => {
      while (!failure && next < indices.length) {
        const index = indices[next++];
        try {
          await sendChunk(index);
        } catch (error) {
          failure ??= error;
        }
      }
    });
    // Wait for in-flight chunks before returning an error; never merge a partial upload.
    await Promise.all(workers);
    if (failure) throw failure;
  };
  let remaining = Array.from({ length: totalChunks }, (_, index) => index);
  if (status) {
    const missing = status.status === 'COMPLETED' ? [] : status.missingChunks;
    if (
      !Array.isArray(missing) ||
      missing.some((index) => !Number.isInteger(index) || index < 0 || index >= totalChunks)
    )
      throw new Error('Máy chủ trả về danh sách phần tệp còn thiếu không hợp lệ.');
    remaining = [...new Set(missing)];
    const missingIds = new Set(remaining);
    for (let index = 0; index < totalChunks; index++) {
      if (!missingIds.has(index)) {
        acknowledged.add(index);
        uploadedBytes += Math.min(UPLOAD_CHUNK_SIZE, file.size - index * UPLOAD_CHUNK_SIZE);
      }
    }
  }
  progress('uploading');
  session.started = true;
  // Establish the BE upload session before sending concurrent requests.
  if (remaining.includes(0)) await sendChunk(0);
  await sendChunks(remaining.filter((index) => index !== 0));
  for (let recovery = 0; ; recovery++) {
    checkAbort(signal);
    progress('merging');
    let result;
    try {
      result = await retryRequest(
        () =>
          request(`${CHUNK_PATH}/merge`, {
            method: 'POST',
            body: { uploadId },
            signal,
          }),
        signal
      );
    } catch (error) {
      const missing = error.data?.missingChunks;
      if (
        recovery >= 2 ||
        error.status !== 409 ||
        !Array.isArray(missing) ||
        !missing.length ||
        missing.some((index) => !Number.isInteger(index) || index < 0 || index >= totalChunks)
      )
        throw error;
      await sendChunks([...new Set(missing)]);
      continue;
    }
    if (
      result?.status !== 'COMPLETED' ||
      result.uploadId !== uploadId ||
      !result.fileId ||
      !result.fileUrl ||
      result.fileSize !== file.size ||
      result.totalChunks !== totalChunks
    )
      throw new Error('Máy chủ chưa xác nhận tệp đã ghép đầy đủ. Vui lòng thử lại.');
    if (verify) await verify(result);
    progress('completed');
    return result;
  }
}
