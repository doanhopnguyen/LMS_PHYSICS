import test from 'node:test';
import assert from 'node:assert/strict';
import { questionTopicName } from '../src/lib/topicLabels.js';

const topics = [{ topicId: 'topic-1', topicName: 'Động lực học' }];

test('question topics use names returned by the API', () => {
  assert.equal(questionTopicName({ topicId: 'topic-1', topicName: 'Cơ học' }, topics), 'Cơ học');
  assert.equal(questionTopicName({ topic: { topicName: 'Nhiệt học' } }), 'Nhiệt học');
});

test('question topics resolve IDs through the topic list', () => {
  assert.equal(questionTopicName({ topicId: 'topic-1' }, topics), 'Động lực học');
  assert.equal(questionTopicName({ topicId: 'topic-1', topicName: '  ' }, topics), 'Động lực học');
  assert.equal(questionTopicName({ topicId: 1 }, [{ topicId: '1', topicName: 'Điện học' }]), 'Điện học');
});

test('unavailable topics never expose raw IDs', () => {
  assert.equal(questionTopicName({ topicId: 'unknown-id' }, topics), '—');
  assert.equal(questionTopicName(null, topics), '—');
});
