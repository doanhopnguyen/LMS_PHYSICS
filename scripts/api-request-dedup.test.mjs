import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiRequest, tokenStore } from '../src/lib/apiClient.js';

const storage = new Map();
globalThis.window = {
  location: { origin: 'http://localhost:5173' },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
};
const response = (data, status = 200) => new Response(JSON.stringify({ data }), { status });

test('concurrent reads share a request; later reloads fetch fresh data', async () => {
  let calls = 0;
  let release;
  globalThis.fetch = async () => {
    calls++;
    await new Promise((resolve) => {
      release = resolve;
    });
    return response({ version: calls });
  };
  const first = apiRequest('/dedup');
  const second = apiRequest('/dedup');
  assert.equal(calls, 1);
  release();
  assert.deepEqual(await Promise.all([first, second]), [{ version: 1 }, { version: 1 }]);
  const reload = apiRequest('/dedup');
  assert.equal(calls, 2);
  release();
  assert.deepEqual(await reload, { version: 2 });
});

test('accounts, queries, writes and abortable requests remain independent', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return response('ok');
  };
  tokenStore.set({ accessToken: 'account-a' });
  const first = apiRequest('/isolation');
  tokenStore.set({ accessToken: 'account-b' });
  const second = apiRequest('/isolation');
  await Promise.all([
    first,
    second,
    apiRequest('/isolation', { query: { page: 1 } }),
    apiRequest('/isolation', { method: 'POST', body: {} }),
    apiRequest('/isolation', { method: 'POST', body: {} }),
    apiRequest('/isolation', { signal: new AbortController().signal }),
    apiRequest('/isolation', { signal: new AbortController().signal }),
  ]);
  assert.equal(calls, 7);
  tokenStore.clear();
});

test('a failed read can be retried', async () => {
  globalThis.fetch = async () => {
    throw new Error('offline');
  };
  await assert.rejects(apiRequest('/retry'));
  globalThis.fetch = async () => response('recovered');
  assert.equal(await apiRequest('/retry'), 'recovered');
});

test('shared reads refresh an expired token and retry without a promise cycle', async () => {
  tokenStore.set({ accessToken: 'expired', refreshToken: 'refresh' });
  let reads = 0;
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/users/refresh')) {
      refreshes++;
      return response({ accessToken: 'renewed' });
    }
    reads++;
    return options.headers.Authorization === 'Bearer renewed' ? response('authorized') : response(null, 401);
  };
  assert.deepEqual(await Promise.all([apiRequest('/protected'), apiRequest('/protected')]), [
    'authorized',
    'authorized',
  ]);
  assert.equal(reads, 2);
  assert.equal(refreshes, 1);
  tokenStore.clear();
});
