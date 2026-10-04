import test from 'node:test';
import assert from 'node:assert/strict';
import {
  materialSourceParts,
  videoSource,
  materialVideoSource,
  validateVideoMaterial,
} from '../src/lib/materialSources.js';

test('video lessons embed their citation and use uploaded videos when no citation is set', () => {
  assert.deepEqual(materialVideoSource({ sourceCitation: 'https://youtu.be/abcdefghijk', fileUrl: '/old.mp4' }), {
    type: 'embed',
    url: 'https://www.youtube-nocookie.com/embed/abcdefghijk',
  });
  assert.deepEqual(materialVideoSource({ sourceCitation: '', fileUrl: '/new.mp4' }), {
    type: 'video',
    url: '/new.mp4',
  });
  assert.equal(materialVideoSource({ sourceCitation: 'javascript:alert(1)' }), null);
});

test('video authoring accepts link-only and upload-only materials and validates replacements', () => {
  const data = new FormData();
  data.set('type', 'VIDEO');
  assert.match(validateVideoMaterial(data), /nguồn video/);
  data.set('sourceCitation', 'https://youtube.com/watch?v=abcdefghijk');
  assert.equal(validateVideoMaterial(data), '');
  data.set('sourceCitation', '');
  assert.equal(validateVideoMaterial(data, { fileUrl: '/existing.mp4' }), '');
  data.set('file', new Blob(['video'], { type: 'video/mp4' }), 'new.mp4');
  assert.equal(validateVideoMaterial(data), '');
  data.set('file', new Blob(['pdf'], { type: 'application/pdf' }), 'wrong.pdf');
  assert.match(validateVideoMaterial(data), /tệp video/);
});

test('source descriptions preserve text and punctuation while opening multiple video links', () => {
  const text = 'Bài giảng (https://youtu.be/abcdefghijk). Tham khảo https://example.com/clip.mp4?token=123';
  const parts = materialSourceParts(text);
  assert.equal(parts.map((part) => part.text).join(''), text);
  assert.deepEqual(
    parts.filter((part) => part.video).map((part) => part.video.type),
    ['embed', 'video']
  );
  assert.equal(parts.find((part) => part.video?.type === 'video').video.url, 'https://example.com/clip.mp4?token=123');
});
test('YouTube watch, shorts, live and embed links and Vimeo produce trusted players', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=abcdefghijk',
    'https://youtube.com/shorts/abcdefghijk',
    'https://youtube.com/live/abcdefghijk',
    'https://youtube.com/embed/abcdefghijk',
  ]) {
    assert.equal(videoSource(url).url, 'https://www.youtube-nocookie.com/embed/abcdefghijk');
  }
  assert.equal(videoSource('https://vimeo.com/123456').url, 'https://player.vimeo.com/video/123456');
});
test('plain citations, malformed URLs and unsafe or misleading links do not become video embeds', () => {
  assert.deepEqual(materialSourceParts('Giáo trình Vật lý'), [{ text: 'Giáo trình Vật lý' }]);
  assert.doesNotThrow(() => materialSourceParts('Nguồn http://)'));
  assert.equal(videoSource('javascript:clip.mp4'), null);
  assert.equal(videoSource('https://youtube.com.evil.example/watch?v=abcdefghijk'), null);
  assert.equal(videoSource('https://youtu.be/invalid'), null);
  assert.equal(materialSourceParts('www.youtube.com/watch?v=abcdefghijk')[0].video.type, 'embed');
});
