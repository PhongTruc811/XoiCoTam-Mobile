const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  connectionReducer,
  initialConnectionState,
  SUCCESS_REVEAL_DELAY_MS,
  verifyBackendConnection,
} = require('../src/features/be-connection/model.ts');

test('keeps the original palette while checking and after a failed first check', () => {
  const checking = connectionReducer(initialConnectionState, { type: 'checking' });
  assert.equal(checking.brandThemeEnabled, false);
  const failed = connectionReducer(checking, { type: 'error', message: 'Network error' });
  assert.equal(failed.status, 'error');
  assert.equal(failed.brandThemeEnabled, false);
});

test('waits 2.5 seconds after success before revealing the brand palette', () => {
  assert.equal(SUCCESS_REVEAL_DELAY_MS, 2500);
  const connected = connectionReducer(initialConnectionState, { type: 'success' });
  assert.equal(connected.status, 'success');
  assert.equal(connected.brandThemeEnabled, false);
  const revealed = connectionReducer(connected, { type: 'reveal' });
  assert.equal(revealed.brandThemeEnabled, true);
  const checking = connectionReducer(revealed, { type: 'checking' });
  const failed = connectionReducer(checking, { type: 'error', message: 'Timeout' });
  assert.equal(checking.brandThemeEnabled, true);
  assert.equal(failed.brandThemeEnabled, true);
  assert.equal(failed.status, 'error');
});

test('validates the actual response before marking the connection successful', async (t) => {
  const signal = new AbortController().signal;
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://example.com/api/backend-status');
    assert.equal(options.signal, signal);
    return new Response(JSON.stringify({ status: 'SUCCESS' }));
  });
  await verifyBackendConnection('https://example.com/', signal);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('rejects HTTP errors, invalid JSON and non-SUCCESS payloads', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch');
  const signal = new AbortController().signal;
  const responses = [
    new Response('Server error', { status: 503 }),
    new Response('invalid JSON'),
    new Response('null'),
    new Response('{}'),
    new Response(JSON.stringify({ status: 'ERROR' })),
  ];
  for (const response of responses) {
    fetchMock.mock.mockImplementation(async () => response);
    await assert.rejects(verifyBackendConnection('https://example.com', signal));
  }
});

test('explicit mock mode succeeds without making a network request', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('E2E UI tests must not contact a backend');
  });
  await verifyBackendConnection('', new AbortController().signal, 'mock');
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('mock mode supports mobile AbortSignal implementations without throwIfAborted', async () => {
  await verifyBackendConnection('', { aborted: false }, 'mock');
  await assert.rejects(verifyBackendConnection('', { aborted: true }, 'mock'), { name: 'AbortError' });
});

test('mock mode respects cancellation', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(verifyBackendConnection('', controller.signal, 'mock'), { name: 'AbortError' });
});

test('propagates network failure and cancellation without enabling the palette', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Network request failed');
  });
  const controller = new AbortController();
  await assert.rejects(
    verifyBackendConnection('https://example.com', controller.signal),
    /Network request failed/
  );
  controller.abort();
  fetchMock.mock.mockImplementation(async (_url, { signal }) => {
    signal.throwIfAborted();
  });
  await assert.rejects(
    verifyBackendConnection('https://example.com', controller.signal),
    { name: 'AbortError' }
  );
});
