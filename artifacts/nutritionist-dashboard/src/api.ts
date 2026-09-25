import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
export const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in.');
  const response = await fetch(`${apiUrl}/api/v1${path}`, {
    method: options.method ?? 'GET',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Request failed');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
