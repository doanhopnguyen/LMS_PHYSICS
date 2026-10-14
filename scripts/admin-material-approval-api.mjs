import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Writes only to the isolated H2 test backend, never to port 8080.
const origin = 'http://127.0.0.1:18080';
const bundle = await build({
  entryPoints: ['src/lib/adminMaterialApproval.js'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify(origin) },
});
const { approveAdminMaterial } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);
let token;
async function request(path, method = 'GET', body) {
  const multipart = body instanceof FormData;
  const response = await fetch(origin + path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!multipart && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  });
  const payload = await response.json();
  assert.ok(response.ok, `${method} ${path}: ${response.status}`);
  return payload.data;
}
token = (await request('/api/v1/users/signin', 'POST', { username: 'admin', password: 'admin123456' })).accessToken;
assert.ok(token);
const subject = await request('/api/v1/subjects', 'POST', {
  subjectCode: `MAT-QA-${Date.now()}`,
  subjectName: 'Admin Material QA',
});
const chapter = await request(`/api/v1/subjects/${subject.subjectId}/chapters`, 'POST', {
  chapterCode: 'C1',
  chapterName: 'QA',
  orderIndex: 0,
  isActive: true,
});
const topic = await request(`/api/v1/subjects/${subject.subjectId}/topics`, 'POST', {
  topicName: 'QA Topic',
  chapterId: chapter.chapterId,
  orderIndex: 0,
});
const path = `/api/v1/topics/${topic.topicId}/materials`;
const client = {
  approve: (topicId, materialId) => request(`/api/v1/topics/${topicId}/materials/${materialId}/approve`, 'PUT'),
  get: (topicId, materialId) => request(`/api/v1/topics/${topicId}/materials/${materialId}`),
};
for (const type of ['TEXT', 'MARKDOWN']) {
  const form = new FormData();
  form.set('title', `Admin ${type}`);
  form.set('type', type);
  form.set('scope', 'SHARED');
  form.set('contentText', 'Published immediately');
  const created = await request(path, 'POST', form);
  const approved = await approveAdminMaterial(topic.topicId, created, client);
  assert.equal(approved.approvalStatus, 'APPROVED');
  assert.equal((await client.get(topic.topicId, created.materialId)).approvalStatus, 'APPROVED');
  console.log(`PASS Admin ${type} creation is persisted as approved`);
  const update = new FormData();
  update.set('title', `Updated ${type}`);
  update.set('type', type);
  update.set('contentText', 'Updated published content');
  const edited = await request(`${path}/${created.materialId}`, 'PUT', update);
  await approveAdminMaterial(topic.topicId, edited, client);
  const saved = await client.get(topic.topicId, created.materialId);
  assert.equal(saved.approvalStatus, 'APPROVED');
  assert.equal(saved.contentText, 'Updated published content');
  console.log(`PASS Admin ${type} editing remains approved`);
}
console.log('4 isolated material API scenarios passed.');
