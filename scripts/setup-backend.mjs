#!/usr/bin/env node
/**
 * Configure Adaptive Food Coach backend env files and verify the hosted stack.
 *
 * Usage:
 *   node scripts/setup-backend.mjs
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/setup-backend.mjs
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/setup-backend.mjs
 */

import { readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT_REF = 'nhdjdifnylqxkrcdskny';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const apiEnvPath = path.join(root, 'artifacts/api-server/.env');
const expoEnvPath = path.join(root, 'artifacts/adaptive-food-coach/.env');
const AUTH_REDIRECTS = ['http://localhost:8081/**', 'adaptive-food-coach://**'];
const SITE_URL = 'http://localhost:8081';

function parseEnv(text) {
  const map = new Map();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    map.set(trimmed.slice(0, i), trimmed.slice(i + 1));
  }
  return map;
}

function serializeEnv(map) {
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
}

async function readEnv(file) {
  try {
    await access(file, constants.F_OK);
    return parseEnv(await readFile(file, 'utf8'));
  } catch {
    return new Map();
  }
}

async function management(pathname, { method = 'GET', body } = {}) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) return null;
  const response = await fetch(`https://api.supabase.com/v1${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!response.ok) throw new Error(`Management API ${method} ${pathname}: ${response.status} ${text.slice(0, 300)}`);
  return json;
}

async function fetchServiceRoleKey() {
  const keys = await management(`/projects/${PROJECT_REF}/api-keys?reveal=true`);
  if (!keys) return null;
  const list = Array.isArray(keys) ? keys : keys?.data ?? keys?.keys ?? [];
  const service = list.find((k) => k.name === 'service_role' || k.type === 'secret' || k.role === 'service_role');
  return service?.api_key ?? service?.key ?? null;
}

async function configureAuthUrls() {
  return management(`/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    body: {
      site_url: SITE_URL,
      uri_allow_list: AUTH_REDIRECTS.join(','),
    },
  });
}

async function checkAuth() {
  const anon = process.env.SUPABASE_ANON_KEY;
  const key = anon ?? (await readEnv(expoEnvPath)).get('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!key) return { ok: false, detail: 'missing anon key' };
  const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: key } });
  return { ok: response.ok, detail: response.ok ? 'GoTrue healthy' : `HTTP ${response.status}` };
}

async function checkApi() {
  try {
    const response = await fetch('http://localhost:3001/api/healthz');
    return { ok: response.ok, detail: response.ok ? 'API listening on :3001' : `HTTP ${response.status}` };
  } catch {
    return { ok: false, detail: 'API not running on :3001' };
  }
}

async function main() {
  console.log('Adaptive Food Coach — backend setup\n');

  const apiEnv = await readEnv(apiEnvPath);
  const expoEnv = await readEnv(expoEnvPath);

  apiEnv.set('NODE_ENV', apiEnv.get('NODE_ENV') ?? 'development');
  apiEnv.set('PORT', apiEnv.get('PORT') ?? '3001');
  apiEnv.set('SUPABASE_URL', SUPABASE_URL);
  apiEnv.set('CORS_ORIGINS', apiEnv.get('CORS_ORIGINS') ?? 'http://localhost:8081,http://localhost:19006');
  apiEnv.set('AI_PROVIDER', apiEnv.get('AI_PROVIDER') ?? 'openai');
  apiEnv.set('AI_DAILY_LIMIT', apiEnv.get('AI_DAILY_LIMIT') ?? '30');

  expoEnv.set('EXPO_PUBLIC_SUPABASE_URL', SUPABASE_URL);
  expoEnv.set('EXPO_PUBLIC_API_URL', expoEnv.get('EXPO_PUBLIC_API_URL') ?? 'http://localhost:3001');
  expoEnv.set('EXPO_PUBLIC_DEMO_MODE', expoEnv.get('EXPO_PUBLIC_DEMO_MODE') ?? 'false');

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    apiEnv.set('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  if (process.env.OPENAI_API_KEY) {
    apiEnv.set('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
  }

  if (process.env.SUPABASE_ACCESS_TOKEN) {
    console.log('Using SUPABASE_ACCESS_TOKEN for Management API…');
    try {
      if (!apiEnv.get('SUPABASE_SERVICE_ROLE_KEY')) {
        const serviceKey = await fetchServiceRoleKey();
        if (serviceKey) {
          apiEnv.set('SUPABASE_SERVICE_ROLE_KEY', serviceKey);
          console.log('✓ Fetched service role key');
        }
      }
      const publishable = await management(`/projects/${PROJECT_REF}/api-keys?reveal=true`);
      const list = Array.isArray(publishable) ? publishable : publishable?.data ?? publishable?.keys ?? [];
      const anon = list.find((k) => k.name === 'anon' || k.type === 'legacy');
      const publishableKey = list.find((k) => k.type === 'publishable');
      if (anon?.api_key) {
        apiEnv.set('SUPABASE_ANON_KEY', anon.api_key);
        expoEnv.set('EXPO_PUBLIC_SUPABASE_ANON_KEY', anon.api_key);
        console.log('✓ Synced anon key');
      }
      if (publishableKey?.api_key && !expoEnv.get('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY')) {
        expoEnv.set('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', publishableKey.api_key);
      }
      await configureAuthUrls();
      console.log('✓ Auth site URL and redirect URLs configured');
    } catch (error) {
      console.warn('⚠ Management API step failed:', error.message);
      console.warn('  Create a token at https://supabase.com/dashboard/account/tokens');
    }
  }

  if (!apiEnv.get('SUPABASE_ANON_KEY') && expoEnv.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')) {
    apiEnv.set('SUPABASE_ANON_KEY', expoEnv.get('EXPO_PUBLIC_SUPABASE_ANON_KEY'));
  }
  if (!expoEnv.get('EXPO_PUBLIC_SUPABASE_ANON_KEY') && apiEnv.get('SUPABASE_ANON_KEY')) {
    expoEnv.set('EXPO_PUBLIC_SUPABASE_ANON_KEY', apiEnv.get('SUPABASE_ANON_KEY'));
  }

  await writeFile(apiEnvPath, serializeEnv(apiEnv));
  await writeFile(expoEnvPath, serializeEnv(expoEnv));
  console.log(`✓ Wrote ${path.relative(root, apiEnvPath)}`);
  console.log(`✓ Wrote ${path.relative(root, expoEnvPath)}`);

  const auth = await checkAuth();
  console.log(`${auth.ok ? '✓' : '✗'} Supabase Auth — ${auth.detail}`);

  const missing = [];
  if (!apiEnv.get('SUPABASE_SERVICE_ROLE_KEY')) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY in artifacts/api-server/.env');
  }
  if (!apiEnv.get('OPENAI_API_KEY')) {
    missing.push('OPENAI_API_KEY (optional — needed for AI scan/coach/voice)');
  }

  if (missing.length) {
    console.log('\nStill needed:');
    for (const item of missing) console.log(`  • ${item}`);
    if (!apiEnv.get('SUPABASE_SERVICE_ROLE_KEY')) {
      console.log('\nFastest fix — paste the service role key from:');
      console.log(`  https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api`);
      console.log('\nThen run:');
      console.log('  SUPABASE_SERVICE_ROLE_KEY="eyJ..." node scripts/setup-backend.mjs');
      console.log('\nOr use a personal access token to fetch it automatically:');
      console.log('  SUPABASE_ACCESS_TOKEN="sbp_..." node scripts/setup-backend.mjs');
    }
    process.exitCode = 1;
  } else {
    console.log('\n✓ Backend env is complete. Start services:');
    console.log('  pnpm backend:dev');
    console.log('  pnpm app:dev');
  }

  const api = await checkApi();
  console.log(`${api.ok ? '✓' : '○'} ${api.detail}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
