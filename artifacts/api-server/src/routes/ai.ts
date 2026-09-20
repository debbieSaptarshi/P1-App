import { randomUUID } from 'node:crypto';
import { Router, type Request } from 'express';
import { z } from 'zod';
import { analysisRequestSchema, analysisResultSchema, coachResultSchema, planResultSchema, exerciseResultSchema, AI_PROMPT_VERSION, type AiTask } from '@workspace/backend-contracts';
import { admin, dbError } from '../lib/supabase';
import { config } from '../lib/config';
import { HttpError } from '../lib/errors';
import { providerFor, type ModelInput } from '../ai/providers';
import { SYSTEM, foodOutput, coachOutput, planOutput, exerciseOutput } from '../ai/schemas';
export const aiRouter = Router();
export function validateImage(image?: { base64: string; mediaType: string }) {
  if (!image) return;
  const bytes = Buffer.from(image.base64, 'base64');
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
  if (bytes.length > 6_000_000 || !(image.mediaType === 'image/jpeg' && jpeg || image.mediaType === 'image/png' && png || image.mediaType === 'image/webp' && webp)) throw new HttpError(400, 'INVALID_IMAGE', 'Use a JPEG, PNG, or WebP image under 6 MB.');
}
async function context(userId: string) {
  const [profile, logs] = await Promise.all([
    admin().from('app_records').select('data').eq('user_id',userId).eq('collection','profile').eq('id','self').maybeSingle(),
    admin().from('app_records').select('collection,data').eq('user_id',userId).in('collection',['food_entries','exercise']).order('updated_at',{ascending:false}).limit(20),
  ]); dbError(profile.error); dbError(logs.error);
  const p = profile.data?.data ?? {};
  return { preferences: { dietPattern:p.dietPattern, allergies:p.allergies, goals:p.goals, nutrientGoals:p.nutrientGoals }, recentLogs:logs.data??[] };

}
async function execute(req: Request, task: AiTask, input: ModelInput, schema: z.ZodTypeAny) {
  const provider = providerFor(task), requestId = randomUUID();
  const requestKey = z.string().uuid().parse(req.header('Idempotency-Key'));
  const reservation = await admin().rpc('reserve_ai_request', { p_user:req.user.id, p_id:requestId, p_key:requestKey, p_task:task, p_provider:provider.name, p_model:provider.model, p_version:AI_PROMPT_VERSION, p_limit:config().AI_DAILY_LIMIT }); dbError(reservation.error);
  const record = reservation.data;
  if (record.task !== task) throw new HttpError(409,'IDEMPOTENCY_CONFLICT','This request key was used for another operation.');
  if (record.id !== requestId) {
    if (record.status === 'completed') return record.result;
    throw new HttpError(409, 'AI_REQUEST_EXISTS', record.status === 'pending' ? 'This request is already processing. Try again shortly with the same request.' : 'This request failed. Start a new request to retry.');
  }
  try {
    const output = await provider.generate(input);
    const parsed = schema.safeParse(output.value);
    if (!parsed.success) throw new HttpError(502,'AI_INVALID_OUTPUT','The AI returned invalid data. Please try again.');
    const result = { ...parsed.data, analysisId: requestId, provider: provider.name, model: provider.model, promptVersion: AI_PROMPT_VERSION };
    const { error } = await admin().from('ai_requests').update({ status:'completed', result, input_tokens:output.inputTokens, output_tokens:output.outputTokens, completed_at:new Date().toISOString() }).eq('id',requestId).eq('user_id',req.user.id); dbError(error);
    return result;
  } catch(error) {
    await admin().from('ai_requests').update({ status:'failed', error_code:error instanceof HttpError ? error.code : 'AI_ERROR', completed_at:new Date().toISOString() }).eq('id',requestId).eq('user_id',req.user.id);
    throw error;
  }
}
aiRouter.post('/analyze', async (req,res) => {
  const input = analysisRequestSchema.parse(req.body); validateImage(input.image);
  const result = await execute(req,input.kind,{ system:SYSTEM, text:JSON.stringify({ task:input.kind, description:input.text ?? '', preferences:await context(req.user.id) }), image:input.image, schema:foodOutput },analysisResultSchema);
  res.json(result);
});
const promptSchema = z.object({ message:z.string().trim().min(1).max(4000), consent:z.literal(true), history:z.array(z.object({ role:z.enum(['user','assistant']), content:z.string().max(6000) })).max(12).default([]) });
for (const task of ['coach','plan','exercise'] as const) {
  aiRouter.post(`/${task}`, async (req,res) => {
    const input = promptSchema.parse(req.body);
    res.json(await execute(req,task,{ system:SYSTEM, text:JSON.stringify({ task, message:input.message, conversation:input.history, context:await context(req.user.id) }), schema:task === 'coach' ? coachOutput : task === 'plan' ? planOutput : exerciseOutput },task === 'coach' ? coachResultSchema : task === 'plan' ? planResultSchema : exerciseResultSchema));
  });
}
aiRouter.get('/requests/:id', async (req,res) => {
  const id = z.string().uuid().parse(req.params.id);
  const { data,error } = await admin().from('ai_requests').select('id,status,result,error_code').eq('user_id',req.user.id).eq('request_key',id).maybeSingle(); dbError(error);
  if (!data) throw new HttpError(404,'NOT_FOUND','Request not found.'); res.json(data);
});
aiRouter.post('/transcribe', async (req,res) => {
  const input = z.object({ base64:z.string().min(4).max(12_000_000).regex(/^[A-Za-z0-9+/]*={0,2}$/), consent:z.literal(true) }).parse(req.body);
  const c = config();
  if (!c.OPENAI_API_KEY) throw new HttpError(503,'TRANSCRIPTION_NOT_CONFIGURED','Voice transcription requires an OpenAI API key on the server. You can type instead.');
  const bytes = Buffer.from(input.base64,'base64');
  if (bytes.length > 8_000_000) throw new HttpError(413,'AUDIO_TOO_LARGE','Keep recordings under 8 MB.');
  const isWebm = bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
  const isMp4 = bytes.subarray(4,8).toString() === 'ftyp';
  if (!isWebm && !isMp4) throw new HttpError(400,'INVALID_AUDIO','Record audio in M4A or WebM format.');
  const id = randomUUID(), key = z.string().uuid().parse(req.header('Idempotency-Key'));
  const reservation = await admin().rpc('reserve_ai_request',{p_user:req.user.id,p_id:id,p_key:key,p_task:'transcribe',p_provider:'openai',p_model:c.OPENAI_TRANSCRIPTION_MODEL,p_version:AI_PROMPT_VERSION,p_limit:c.AI_DAILY_LIMIT}); dbError(reservation.error);
  if (reservation.data.id !== id) {
    if (reservation.data.task === 'transcribe' && reservation.data.status === 'completed') { res.json(reservation.data.result); return; }
    throw new HttpError(409,'AI_REQUEST_EXISTS','This request already exists.');
  }
  try {
    const form = new FormData(); form.append('file',new Blob([bytes],{type:isWebm?'audio/webm':'audio/mp4'}),isWebm?'recording.webm':'recording.m4a'); form.append('model',c.OPENAI_TRANSCRIPTION_MODEL);
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${c.OPENAI_API_KEY}`},body:form,signal:AbortSignal.timeout(c.AI_TIMEOUT_MS)});
    if (!response.ok) throw new HttpError(502,'TRANSCRIPTION_FAILED','Transcription failed. Please try again or type your description.');
    const result = z.object({text:z.string().max(12000)}).parse(await response.json());
    const update = await admin().from('ai_requests').update({status:'completed',result,completed_at:new Date().toISOString()}).eq('id',id); dbError(update.error);
    res.json(result);
  } catch(error) {
    await admin().from('ai_requests').update({status:'failed',error_code:'TRANSCRIPTION_FAILED'}).eq('id',id);
    throw error instanceof HttpError ? error : new HttpError(502,'TRANSCRIPTION_FAILED','Transcription failed. Try typing instead.');
  }
});
