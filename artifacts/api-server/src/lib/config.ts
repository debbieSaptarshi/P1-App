import { z } from 'zod';
const schema = z.object({
  NODE_ENV: z.enum(['development','production','test']).default('development'),
  SUPABASE_URL: z.string().url(), SUPABASE_ANON_KEY: z.string().min(10), SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  CORS_ORIGINS: z.string().default('http://localhost:8081,http://localhost:19006'),
  AI_PROVIDER: z.enum(['openai','anthropic']).default('openai'),
  OPENAI_API_KEY: z.string().optional(), ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(), ANTHROPIC_MODEL: z.string().optional(),
  OPENAI_TRANSCRIPTION_MODEL: z.string().default('gpt-4o-mini-transcribe'),
  AI_DAILY_LIMIT: z.coerce.number().int().positive().max(1000).default(30),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(60000),
});
export type Config = z.infer<typeof schema>;
let cached: Config | undefined;
export function config(): Config { return cached ??= schema.parse(process.env); }
