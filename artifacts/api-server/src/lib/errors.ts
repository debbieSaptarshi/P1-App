import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Check your input.', fields: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })) } }); return; }
  if (error instanceof HttpError) { res.status(error.status).json({ error: { code: error.code, message: error.message } }); return; }
  if (error?.type === 'entity.too.large') { res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'This file is too large.' } }); return; }
  if (error instanceof SyntaxError && 'body' in error) { res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Invalid JSON.' } }); return; }
  // Never log request bodies, tokens, images, or provider errors containing input.
  req.log.error({ code: error?.code ?? 'INTERNAL_ERROR' }, 'Request failed');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to complete this request. Please try again.' } });
};
