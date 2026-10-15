const FILE_PREFIX = '/api/v1/files/';
const localHost = (host) => ['localhost', '127.0.0.1', '[::1]'].includes(host);

// Upload metadata alone does not prove storage retained the original bytes.
export async function verifyStoredUpload(file, result, read, options = {}) {
  try {
    if (!result || !(result.fileId || result.fileUrl || result.url || result.evidenceUrl || result.downloadUrl))
      throw new Error('BE chưa trả về thông tin tệp đã lưu.');
    const stored = await read(result, options);
    if (!stored.blob.size || stored.blob.size !== file.size)
      throw new Error('Dung lượng tệp đã lưu không khớp tệp gốc.');
    return result;
  } catch (error) {
    if (options.signal?.aborted || error.name === 'AbortError') throw error;
    const failure = new Error(`BE đã tiếp nhận yêu cầu nhưng chưa xác minh được tệp lưu đầy đủ. ${error.message}`);
    failure.code = 'UPLOAD_VERIFICATION_FAILED';
    failure.cause = error;
    throw failure;
  }
}

export function fileUrls(apiBaseUrl, frontendOrigin) {
  const backend = new URL(apiBaseUrl || frontendOrigin, frontendOrigin);
  const resolve = (value) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error('Chưa có đường dẫn tệp.');
    const text = value.trim();
    const url = new URL(
      !text.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(text) ? FILE_PREFIX + text : text,
      backend
    );
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Đường dẫn tệp không hợp lệ.');
    // Stored API paths always belong to BE, including old localhost FE links.
    if (
      url.pathname.startsWith(FILE_PREFIX) &&
      (url.origin === frontendOrigin || url.origin === backend.origin || localHost(url.hostname))
    ) {
      return new URL(url.pathname + url.search, backend).href;
    }
    return url.href;
  };
  const isBackend = (value) => {
    if (!value || !new URL(value, backend).pathname.startsWith(FILE_PREFIX)) return false;
    const url = new URL(resolve(value));
    return url.origin === backend.origin && url.pathname.startsWith(FILE_PREFIX);
  };
  return {
    resolve,
    isBackend,
    persisted: (value) => {
      if (!value?.trim()) return '';
      const resolved = resolve(value);
      const url = new URL(resolved);
      // Persist stable BE paths, never a localhost FE origin or a blob URL.
      if (isBackend(resolved) && /^\/api\/v1\/files\/[^/]+\/download$/.test(url.pathname)) return url.pathname;
      return isBackend(resolved) ? url.pathname + url.search : resolved;
    },
  };
}

export function createFileReader({ request, resolve, isBackend, fetchFile = (...args) => fetch(...args) }) {
  const location = async (file, { signal } = {}) => {
    signal?.throwIfAborted();
    const item = typeof file === 'string' ? { fileUrl: file } : file || {};
    const reference = item.downloadUrl || item.fileUrl || item.url || item.evidenceUrl;
    const resolvedReference = !item.fileId && reference ? resolve(reference) : null;
    const signedFileId =
      resolvedReference && isBackend(resolvedReference)
        ? new URL(resolvedReference).pathname.match(/^\/api\/v1\/files\/([^/]+)\/download$/)?.[1]
        : null;
    const fileId = item.fileId || signedFileId;
    const metadata = fileId
      ? await request(`${FILE_PREFIX}${encodeURIComponent(fileId)}/download-url`, { method: 'POST', signal })
      : item;
    const url = resolve(metadata.downloadUrl || metadata.fileUrl || metadata.url || item.evidenceUrl);
    const fileName =
      metadata.fileName || item.fileName || decodeURIComponent(new URL(url).pathname.split('/').pop()) || 'tai-lieu';
    return { ...item, ...metadata, url, fileName };
  };
  const read = async (file, options = {}) => {
    const metadata = await location(file, options);
    options.signal?.throwIfAborted();
    let blob;
    if (isBackend(metadata.url)) {
      const url = new URL(metadata.url);
      blob = await request(url.pathname + url.search, { responseType: 'blob', signal: options.signal });
    } else {
      // External references must never receive our JWT.
      const response = await fetchFile(metadata.url, { signal: options.signal });
      if (!response.ok) throw new Error(`Không thể tải tệp (${response.status}).`);
      blob = await response.blob();
    }
    if (!(blob instanceof Blob)) throw new Error('Máy chủ chưa trả về dữ liệu tệp.');
    if (!blob.size)
      throw new Error('Máy chủ trả về tệp rỗng (0 byte). Vui lòng tải lại tệp gốc sau khi hệ thống lưu trữ được khắc phục.');
    const expectedSize = metadata.fileSize ?? metadata.fileSizeBytes ?? metadata.size;
    if (expectedSize != null && Number(expectedSize) > 0 && blob.size !== Number(expectedSize))
      throw new Error('Dữ liệu tệp tải về không đủ hoặc không khớp dung lượng. Vui lòng thử lại hoặc tải lại tệp gốc.');
    if (blob.type.split(';')[0] === 'text/html' && !/\.(html?|xhtml)$/i.test(metadata.fileName))
      throw new Error('Đường dẫn trả về trang web thay vì tệp. Vui lòng kiểm tra cấu hình API backend.');
    return { ...metadata, blob };
  };
  const download = async (file, options) => {
    const result = await read(file, options);
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return result;
  };
  return { location, read, download };
}
