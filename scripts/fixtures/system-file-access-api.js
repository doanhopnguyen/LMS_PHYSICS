const fileFixtureFetch = window.fetch;
const fileAccessMode = new URLSearchParams(location.search).get('access') || 'signed';
window.fileCalls = [];
window.allowProtectedFile = fileAccessMode !== 'denied';
window.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
  if (url.pathname.startsWith('/api/v1/files/')) {
    fileCalls.push({ url: url.href, method: options.method || 'GET', authorization: options.headers?.Authorization });
    if (options.headers?.Authorization !== 'Bearer isolated-test')
      return Response.json({ message: 'Missing JWT' }, { status: 401 });
    if (url.pathname.endsWith('/download-url')) {
      if (!window.allowProtectedFile)
        return Response.json({ message: 'Bạn không có quyền tải học liệu này.' }, { status: 403 });
      return Response.json({
        data: {
          fileId: 'protected',
          fileName: 'Bài học Vật lý.pdf',
          downloadUrl: '/api/v1/files/protected/download?token=temporary&expires=9999999999999',
        },
      });
    }
    if (url.pathname.endsWith('image.png')) {
      const data = Uint8Array.from(
        atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jY1sAAAAASUVORK5CYII='),
        (c) => c.charCodeAt(0)
      );
      return new Response(data, { headers: { 'Content-Type': 'image/png' } });
    }
    return fileFixtureFetch('/fixtures/learning.pdf', {});
  }
  const response = await fileFixtureFetch(input, options);
  if (url.pathname === '/api/v1/students/me/materials') {
    const payload = await response.json();
    payload.data = payload.data.map((item) =>
      item.materialId !== 'shared0'
        ? item
        : {
            ...item,
            ...(fileAccessMode === 'markdown'
              ? {
                  type: 'MARKDOWN',
                  contentText: '# Tài liệu\n\n![Ảnh](/api/v1/files/image.png)\n\n[Tải PDF](/api/v1/files/legacy.pdf)',
                  fileUrl: null,
                }
              : {
                  fileId: fileAccessMode === 'legacy' ? null : 'protected',
                  fileUrl: 'http://localhost:5173/api/v1/files/legacy.pdf',
                }),
          }
    );
    return Response.json(payload);
  }
  return response;
};
