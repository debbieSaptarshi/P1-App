import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import type { Server } from 'node:http';
import { verifyWhatsappSignature } from '../src/lib/care';

process.env.SUPABASE_URL = 'http://supabase.test';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.WHATSAPP_VERIFY_TOKEN = 'verify-token-test';
process.env.WHATSAPP_APP_SECRET = 'whatsapp-app-secret';
process.env.WHATSAPP_TOKEN = 'whatsapp-token-test';
process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';

const { default: app } = await import('../src/app');

const originalFetch = globalThis.fetch;
let server: Server;
let base = '';

before(async () => {
  globalThis.fetch = async (url, init) => {
    const href = String(url);
    if (href.startsWith('http://supabase.test')) {
      if (href.endsWith('/auth/v1/user')) {
        const token = new Headers(init?.headers).get('authorization');
        return token === 'Bearer valid-token'
          ? Response.json({ id: '11111111-1111-4111-8111-111111111111', email: 'test@example.com' })
          : Response.json({ message: 'Invalid token' }, { status: 401 });
      }
      if (href.includes('/rest/v1/whatsapp_identities')) return Response.json(null, { status: 200, headers: { 'Content-Range': '*/0' } });
      if (href.includes('/rest/v1/whatsapp_messages')) return Response.json(null, { status: 201 });
      throw new Error(`Unexpected Supabase request: ${href}`);
    }
    if (href.includes('graph.facebook.com')) return Response.json({ messages: [{ id: 'wamid.ok' }] });
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

test('WhatsApp signature compare is timing-safe and rejects tampered bodies', () => {
  const body = Buffer.from('{"ok":true}');
  const secret = 'whatsapp-app-secret';
  const header = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  assert.equal(verifyWhatsappSignature(body, header, secret), true);
  assert.equal(verifyWhatsappSignature(Buffer.from('{"ok":false}'), header, secret), false);
  assert.equal(verifyWhatsappSignature(body, 'sha256=deadbeef', secret), false);
});

test('WhatsApp webhook verifies the subscribe challenge', async () => {
  const response = await fetch(`${base}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify-token-test&hub.challenge=12345`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '12345');
  assert.equal((await fetch(`${base}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1`)).status, 403);
});

test('unsigned WhatsApp posts are rejected before any Graph call', async () => {
  const response = await fetch(`${base}/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entry: [] }),
  });
  assert.equal(response.status, 401);
});

test('signed WhatsApp posts ack immediately', async () => {
  const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
  const header = `sha256=${createHmac('sha256', 'whatsapp-app-secret').update(body).digest('hex')}`;
  const response = await fetch(`${base}/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': header },
    body,
  });
  assert.equal(response.status, 200);
});
