const questionFixtureFetch = window.fetch;
const questionTestAdmin = location.pathname.includes('admin');
localStorage.setItem(
  'ptit-physics-demo-session',
  JSON.stringify({ role: questionTestAdmin ? 'ADMIN' : 'INSTRUCTOR', userId: 'teacher1' })
);
window.chunkCalls = [];
window.questionWrites = [];
window.failImageChunk = true;
window.releaseImageMerge = false;
const imageSessions = new Map();
window.fetch = async (input, options = {}) => {
  const pathname = new URL(typeof input === 'string' ? input : input.url, location.origin).pathname;
  const method = options.method || 'GET';
  if (pathname === '/api/v1/users/me')
    return Response.json({ data: { userId: 'teacher1', role: questionTestAdmin ? 'ADMIN' : 'INSTRUCTOR' } });
  if (pathname === '/api/v1/files/upload') throw new Error('Question images must use chunk upload');
  if (pathname.startsWith('/api/v1/files/chunks')) {
    const form = options.body;
    const uploadId =
      form instanceof FormData
        ? form.get('uploadId')
        : pathname.endsWith('/merge')
          ? JSON.parse(form).uploadId
          : pathname.split('/').at(-2);
    if (!imageSessions.has(uploadId)) imageSessions.set(uploadId, { parts: new Map() });
    const session = imageSessions.get(uploadId);
    chunkCalls.push({
      path: pathname,
      uploadId,
      index: form instanceof FormData ? Number(form.get('chunkIndex')) : null,
    });
    if (pathname.endsWith('/status'))
      return Response.json({
        uploadId,
        status: 'UPLOADING',
        totalChunks: session.totalChunks,
        uploadedChunks: [...session.parts.keys()],
        missingChunks: Array.from({ length: session.totalChunks }, (_, i) => i).filter((i) => !session.parts.has(i)),
      });
    if (pathname.endsWith('/merge')) {
      if (session.parts.size !== session.totalChunks) throw new Error('Cannot merge incomplete image');
      while (!window.releaseImageMerge) await new Promise((resolve) => setTimeout(resolve, 20));
      return Response.json({
        uploadId,
        status: 'COMPLETED',
        fileId: 'image-id',
        fileUrl: '/api/v1/files/chunked/question.png',
        fileSize: [...session.parts.values()].reduce((size, part) => size + part.size, 0),
        totalChunks: session.totalChunks,
      });
    }
    const index = Number(form.get('chunkIndex'));
    session.totalChunks = Number(form.get('totalChunks'));
    if (index === 1 && window.failImageChunk) return Response.json({ message: 'Lỗi mạng thử nghiệm' }, { status: 503 });
    if (form.get('chunk').size > 102400) throw new Error('Chunk exceeds 100 KB');
    session.parts.set(index, form.get('chunk'));
    return Response.json({ uploadId, chunkIndex: index, totalChunks: session.totalChunks, uploaded: true });
  }
  if (pathname === '/api/v1/questions' && method === 'POST') questionWrites.push(JSON.parse(options.body));
  if (pathname.endsWith('/approve')) {
    const result = lecturerQuestions.find((q) => pathname.includes(q.questionId));
    if (result) {
      result.approvalStatus = 'APPROVED';
      return Response.json({ data: result });
    }
  }
  return questionFixtureFetch(input, options);
};
