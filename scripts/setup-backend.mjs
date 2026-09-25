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
const AUTH_REDIRECTS = [
  'http://localhost:8081/**',
  'adaptive-food-coach://**',
  'exp://**',
  'exps://**',
];
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

async function fetchProjectApiKeys() {
  const keys = await management(`/projects/${PROJECT_REF}/api-keys?reveal=true`);
  if (!keys) return null;
  const list = Array.isArray(keys) ? keys : keys?.data ?? keys?.keys ?? [];
  const enabled = list.filter((k) => !k.disabled);
  return {
    publishable: enabled.find((k) => k.type === 'publishable')?.api_key ?? null,
    secret: enabled.find((k) => k.type === 'secret')?.api_key ?? null,
    anon: enabled.find((k) => k.name === 'anon')?.api_key ?? null,
    serviceRole: enabled.find((k) => k.name === 'service_role')?.api_key ?? null,
  };
}

const OTP_CONFIRMATION_TEMPLATE = `<h2>Confirm your email</h2><p>Enter this code in Adaptive Food Coach:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p><p>This code expires in about an hour.</p>`;
const OTP_RECOVERY_TEMPLATE = `<h2>Reset your password</h2><p>Enter this code in Adaptive Food Coach:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p><p>If you did not request this, you can ignore this email.</p>`;

function socialProviderPatch() {
  const patch = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    patch.external_google_enabled = true;
    patch.external_google_client_id = process.env.GOOGLE_CLIENT_ID;
    patch.external_google_secret = process.env.GOOGLE_CLIENT_SECRET;
  }
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    patch.external_facebook_enabled = true;
    patch.external_facebook_client_id = process.env.FACEBOOK_CLIENT_ID;
    patch.external_facebook_secret = process.env.FACEBOOK_CLIENT_SECRET;
  }
  if (process.env.APPLE_CLIENT_ID) {
    patch.external_apple_enabled = true;
    patch.external_apple_client_id = process.env.APPLE_CLIENT_ID;
    if (process.env.APPLE_SECRET) patch.external_apple_secret = process.env.APPLE_SECRET;
  }
  return patch;
}

async function configureAuthUrls() {
  return management(`/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    body: {
      site_url: SITE_URL,
      uri_allow_list: AUTH_REDIRECTS.join(','),
      mailer_subjects_confirmation: 'Your Adaptive Food Coach verification code',
      mailer_templates_confirmation_content: OTP_CONFIRMATION_TEMPLATE,
      mailer_subjects_recovery: 'Your Adaptive Food Coach reset code',
      mailer_templates_recovery_content: OTP_RECOVERY_TEMPLATE,
      ...socialProviderPatch(),
    },
  });
}

async function checkSocialProviders() {
  const key = process.env.SUPABASE_ANON_KEY ?? (await readEnv(expoEnvPath)).get('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!key) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: key } });
  if (!response.ok) return null;
  const json = await response.json();
  const ext = json.external ?? {};
  return { google: !!ext.google, facebook: !!ext.facebook, apple: !!ext.apple };
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
  apiEnv.set('LEGAL_CONTACT_EMAIL', apiEnv.get('LEGAL_CONTACT_EMAIL') ?? 'support@sevenlabs.app');
  apiEnv.set('AI_PROVIDER', apiEnv.get('AI_PROVIDER') ?? 'openai');
  apiEnv.set('AI_DAILY_LIMIT', apiEnv.get('AI_DAILY_LIMIT') ?? '30');

  expoEnv.set('EXPO_PUBLIC_SUPABASE_URL', SUPABASE_URL);
  expoEnv.set('EXPO_PUBLIC_API_URL', expoEnv.get('EXPO_PUBLIC_API_URL') ?? 'http://localhost:3001');
  expoEnv.set('EXPO_PUBLIC_DEMO_MODE', expoEnv.get('EXPO_PUBLIC_DEMO_MODE') ?? 'false');
  expoEnv.set('EXPO_PUBLIC_ENABLE_FACEBOOK', expoEnv.get('EXPO_PUBLIC_ENABLE_FACEBOOK') ?? 'false');
  expoEnv.set('EXPO_PUBLIC_SUPPORT_EMAIL', expoEnv.get('EXPO_PUBLIC_SUPPORT_EMAIL') ?? 'support@sevenlabs.app');

  if (process.env.SUPABASE_SECRET_KEY) {
    apiEnv.set('SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY);
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    apiEnv.set('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  if (process.env.OPENAI_API_KEY) {
    apiEnv.set('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
  }
  apiEnv.set('OPENAI_MODEL', apiEnv.get('OPENAI_MODEL') ?? 'gpt-4o-mini');
  apiEnv.set('OPENAI_IMAGE_MODEL', apiEnv.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-1-mini');
  apiEnv.set('OPENAI_IMAGE_QUALITY', apiEnv.get('OPENAI_IMAGE_QUALITY') ?? 'low');
  apiEnv.set('OPENAI_IMAGE_SIZE', apiEnv.get('OPENAI_IMAGE_SIZE') ?? '1024x1024');

  if (process.env.SUPABASE_ACCESS_TOKEN) {
    console.log('Using SUPABASE_ACCESS_TOKEN for Management API…');
    try {
      const keys = await fetchProjectApiKeys();
      if (keys?.publishable) {
        apiEnv.set('SUPABASE_PUBLISHABLE_KEY', keys.publishable);
        expoEnv.set('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', keys.publishable);
        console.log('✓ Synced publishable key');
      }
      if (keys?.anon) {
        apiEnv.set('SUPABASE_ANON_KEY', keys.anon);
        expoEnv.set('EXPO_PUBLIC_SUPABASE_ANON_KEY', keys.anon);
        console.log('✓ Synced legacy anon key');
      }
      if (keys?.secret) {
        apiEnv.set('SUPABASE_SECRET_KEY', keys.secret);
        console.log('✓ Fetched secret key');
      } else if (keys?.serviceRole && !apiEnv.get('SUPABASE_SECRET_KEY') && !apiEnv.get('SUPABASE_SERVICE_ROLE_KEY')) {
        apiEnv.set('SUPABASE_SERVICE_ROLE_KEY', keys.serviceRole);
        console.log('✓ Fetched legacy service_role key');
      }
      await configureAuthUrls();
      console.log('✓ Auth site URL and redirect URLs configured');
      const social = socialProviderPatch();
      if (Object.keys(social).length) {
        console.log(`✓ Social providers updated: ${Object.keys(social).filter((k) => k.endsWith('_enabled')).join(', ')}`);
      } else {
        console.log('○ Social providers unchanged (set GOOGLE_*, FACEBOOK_*, APPLE_* env vars to enable)');
      }
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
  if (!apiEnv.get('SUPABASE_PUBLISHABLE_KEY') && expoEnv.get('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY')) {
    apiEnv.set('SUPABASE_PUBLISHABLE_KEY', expoEnv.get('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'));
  }

  await writeFile(apiEnvPath, serializeEnv(apiEnv));
  await writeFile(expoEnvPath, serializeEnv(expoEnv));
  console.log(`✓ Wrote ${path.relative(root, apiEnvPath)}`);
  console.log(`✓ Wrote ${path.relative(root, expoEnvPath)}`);

  const auth = await checkAuth();
  console.log(`${auth.ok ? '✓' : '✗'} Supabase Auth — ${auth.detail}`);

  const social = await checkSocialProviders();
  if (social) {
    console.log(`${social.google ? '✓' : '✗'} Google provider ${social.google ? 'enabled' : 'OFF — Google button cannot finish login'}`);
    console.log(`${social.facebook ? '✓' : '○'} Facebook provider ${social.facebook ? 'enabled' : 'off (hidden in store builds)'}`);
    console.log(`${social.apple ? '✓' : '○'} Apple provider ${social.apple ? 'enabled' : 'off (native iOS Sign in with Apple still works)'}`);
    if (!social.google) {
      console.log('\nTo turn Google on, create the OAuth app then either:');
      console.log('  1. Paste client ID + secret in https://supabase.com/dashboard/project/nhdjdifnylqxkrcdskny/auth/providers');
      console.log('  2. Or rerun setup with GOOGLE_CLIENT_ID/SECRET plus SUPABASE_ACCESS_TOKEN');
      console.log('Callback URL:');
      console.log(`  ${SUPABASE_URL}/auth/v1/callback`);
    }
  }

  const missing = [];
  if (!apiEnv.get('SUPABASE_SECRET_KEY') && !apiEnv.get('SUPABASE_SERVICE_ROLE_KEY')) {
    missing.push('SUPABASE_SECRET_KEY (sb_secret_...) in artifacts/api-server/.env');
  }
  if (!apiEnv.get('OPENAI_API_KEY')) {
    missing.push('OPENAI_API_KEY (needed for AI scan/coach/voice)');
  }

  if (missing.length) {
    console.log('\nStill needed:');
    for (const item of missing) console.log(`  • ${item}`);
    if (!apiEnv.get('SUPABASE_SECRET_KEY') && !apiEnv.get('SUPABASE_SERVICE_ROLE_KEY')) {
      console.log('\nCreate a secret key in Settings → API Keys (not the old JWT service_role):');
      console.log(`  https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api-keys`);
      console.log('Then run:');
      console.log('  SUPABASE_SECRET_KEY="sb_secret_..." node scripts/setup-backend.mjs');
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
