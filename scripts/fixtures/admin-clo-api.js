localStorage.setItem('ptit-physics-demo-session', JSON.stringify({ role: 'ADMIN', userId: 'admin' }));
localStorage.setItem('ptit-physics-access-token', 'isolated-test-token');
window.testCalls = [];
window.testClos = [
  {
    cloId: 'clo1',
    subjectId: 's1',
    cloCode: 'CLO1',
    description: 'Explain physical principles',
    orderIndex: 1,
    isActive: true,
    questionCount: 3,
  },
];
window.testSubject = { subjectId: 's1', subjectCode: 'PHY', subjectName: 'Physics', isActive: true };
window.fetch = async (input, options = {}) => {
  const url = new URL(input, location.origin);
  const path = url.pathname;
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : undefined;
  testCalls.push({ path, method, body, query: url.search });
  let data = [];
  if (path === '/api/v1/users/me') data = { userId: 'admin', role: 'ADMIN', fullName: 'Admin' };
  if (path === '/api/v1/subjects') data = [testSubject];
  if (path === '/api/v1/subjects/s1') data = testSubject;
  if (path === '/api/v1/subjects/s1/clos') {
    if (method === 'POST') {
      if (!testSubject.isActive) return Response.json({ message: 'Subject inactive' }, { status: 400 });
      data = { ...body, subjectId: 's1', cloId: `clo${testClos.length + 1}`, questionCount: 0 };
      testClos.push(data);
    } else data = testClos;
  }
  const match = path.match(/^\/api\/v1\/clos\/([^/]+)(\/toggle-status)?$/);
  if (match) {
    const clo = testClos.find((item) => item.cloId === match[1]);
    if (!clo) return Response.json({ message: 'CLO not found' }, { status: 404 });
    if (method === 'PUT') Object.assign(clo, body);
    if (method === 'PATCH') clo.isActive = url.searchParams.get('isActive') === 'true';
    if (method === 'DELETE') {
      if (clo.questionCount) return Response.json({ message: 'CLO has linked questions' }, { status: 409 });
      testClos = testClos.filter((item) => item.cloId !== clo.cloId);
    }
    data = clo;
  }
  return Response.json({ status: 200, data });
};
