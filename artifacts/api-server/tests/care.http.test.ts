import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';

process.env.SUPABASE_URL = 'http://supabase.test';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

const { default: app } = await import('../src/app');
const originalFetch = globalThis.fetch;
let server: Server;
let base = '';
const user = '11111111-1111-4111-8111-111111111111';
const headers = { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' };

before(async () => {
  globalThis.fetch = async (url, init) => {
    const href = String(url);
    if (href.startsWith('http://supabase.test') && href.endsWith('/auth/v1/user')) {
      const token = new Headers(init?.headers).get('authorization');
      return token === 'Bearer valid-token'
        ? Response.json({ id: user, email: 'test@example.com' })
        : Response.json({ message: 'Invalid token' }, { status: 401 });
    }
    if (href.startsWith('http://supabase.test')) {
      return Response.json(null, { status: 200 });
    }
    return originalFetch(url, init);
  };
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  globalThis.fetch = originalFetch;
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
});

test('care and nutritionist routes require a session', async () => {
  assert.equal((await fetch(`${base}/api/v1/care/household`)).status, 401);
  assert.equal((await fetch(`${base}/api/v1/nutritionist/households`)).status, 401);
});

test('care bootstrap rejects invalid phones before database writes', async () => {
  const response = await fetch(`${base}/api/v1/care/household`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ whoFor: 'family', whatsappPhone: 'not-a-phone' }),
  });
  assert.equal(response.status, 400);
});

test('nutritionist day lookup requires a valid date', async () => {
  const response = await fetch(`${base}/api/v1/nutritionist/households/11111111-1111-4111-8111-111111111111/days/nope`, { headers });
  assert.equal(response.status, 400);
});

test('nutritionist queue requires a valid date', async () => {
  const response = await fetch(`${base}/api/v1/nutritionist/queue?date=nope`, { headers });
  assert.equal(response.status, 400);
});

test('nutritionist queue, feedback, and questions require a session', async () => {
  const eventId = '11111111-1111-4111-8111-111111111111';
  assert.equal((await fetch(`${base}/api/v1/nutritionist/queue`)).status, 401);
  assert.equal((await fetch(`${base}/api/v1/nutritionist/food-events/${eventId}/feedback`, { method: 'POST' })).status, 401);
  assert.equal((await fetch(`${base}/api/v1/nutritionist/food-events/${eventId}/questions`, { method: 'POST' })).status, 401);
});

test('nutritionist feedback requires a tag or comment', async () => {
  const response = await fetch(`${base}/api/v1/nutritionist/food-events/11111111-1111-4111-8111-111111111111/feedback`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 400);
});

test('nutritionist questions require a kind and prompt', async () => {
  const missingPrompt = await fetch(`${base}/api/v1/nutritionist/food-events/11111111-1111-4111-8111-111111111111/questions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ kind: 'oil' }),
  });
  const invalidKind = await fetch(`${base}/api/v1/nutritionist/food-events/11111111-1111-4111-8111-111111111111/questions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ kind: 'calories', prompt: 'How many calories?' }),
  });
  assert.equal(missingPrompt.status, 400);
  assert.equal(invalidKind.status, 400);
});
