import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { RequestHandler } from 'express';
import { config } from './config';
import { HttpError } from './errors';
let adminClient: SupabaseClient | undefined;
export function admin() {
  const c = config();
  return adminClient ??= createClient(c.SUPABASE_URL, c.adminKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
declare global { namespace Express { interface Request { user: User; } } }
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '')?.[1];
  if (!token) throw new HttpError(401, 'AUTH_REQUIRED', 'Please sign in.');
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'INVALID_SESSION', 'Your session has expired. Please sign in again.');
  req.user = data.user;
  next();
};
export function dbError(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.message.includes('REVISION_CONFLICT')) throw new HttpError(409, 'REVISION_CONFLICT', 'Your account changed on another device. Review the sync conflict before saving.');
  if (error.message.includes('AI_QUOTA_EXCEEDED')) throw new HttpError(429, 'AI_QUOTA_EXCEEDED', 'Your daily AI limit has been reached. Try again later.');
  if (error.code === '23503') throw new HttpError(404, 'NOT_FOUND', 'The requested item no longer exists.');
  throw error;
}
