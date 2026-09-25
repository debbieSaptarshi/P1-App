import type { AiTask } from '@workspace/backend-contracts';
import { config } from '../lib/config';
import { HttpError } from '../lib/errors';

export interface ModelInput { system: string; text: string; schema: Record<string, unknown>; image?: { base64: string; mediaType: string }; imageDetail?: 'auto' | 'high'; }
export interface ModelOutput { value: unknown; inputTokens?: number; outputTokens?: number; }
export interface AiProvider { name: string; model: string; generate(input: ModelInput): Promise<ModelOutput>; }
async function request(url: string, headers: Record<string,string>, body: unknown) {
  let response: Response;
  try { response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(config().AI_TIMEOUT_MS) }); }
  catch { throw new HttpError(504, 'AI_TIMEOUT', 'The AI service did not respond. Please try again.'); }
  if (!response.ok) throw new HttpError(502, 'AI_UNAVAILABLE', 'The AI service is temporarily unavailable. Please try again.');
  return response.json() as Promise<any>;
}
export class OpenAIProvider implements AiProvider {
  readonly name = 'openai';
  constructor(public model: string, private key: string) {}
  async generate(input: ModelInput): Promise<ModelOutput> {
    const content: unknown[] = [{ type: 'input_text', text: input.text }];
    if (input.image) content.push({ type: 'input_image', image_url: `data:${input.image.mediaType};base64,${input.image.base64}`, detail: input.imageDetail ?? 'auto' });
    const result = await request('https://api.openai.com/v1/responses', { Authorization: `Bearer ${this.key}` }, {
      model: this.model, store: false, instructions: input.system, input: [{ role: 'user', content }],
      max_output_tokens: 4096, text: { format: { type: 'json_schema', name: 'food_coach_result', strict: true, schema: input.schema } },
    });
    if (result.status !== 'completed') throw new HttpError(502, 'AI_INCOMPLETE', 'The AI response was incomplete. Try a simpler request.');
    const blocks = result.output?.flatMap((item: any) => item.content ?? []) ?? [];
    if (blocks.some((item: any) => item.type === 'refusal')) throw new HttpError(422, 'AI_REFUSAL', 'The AI could not help with this request.');
    const text = blocks.filter((item: any) => item.type === 'output_text').map((item: any) => item.text).join('');
    try { return { value: JSON.parse(text), inputTokens: result.usage?.input_tokens, outputTokens: result.usage?.output_tokens }; }
    catch { throw new HttpError(502, 'AI_INVALID_OUTPUT', 'The AI returned an unreadable response. Please try again.'); }
  }
}
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  constructor(public model: string, private key: string) {}
  async generate(input: ModelInput): Promise<ModelOutput> {
    const content: unknown[] = [];
    if (input.image) content.push({ type: 'image', source: { type: 'base64', media_type: input.image.mediaType, data: input.image.base64 } });
    content.push({ type: 'text', text: input.text });
    const result = await request('https://api.anthropic.com/v1/messages', { 'x-api-key': this.key, 'anthropic-version': '2023-06-01' }, {
      model: this.model, max_tokens: 4096, system: input.system, messages: [{ role: 'user', content }],
      tools: [{ name: 'record_result', description: 'Return the requested structured result.', input_schema: input.schema }],
      tool_choice: { type: 'tool', name: 'record_result' },
    });
    const tool = result.content?.find((item: any) => item.type === 'tool_use' && item.name === 'record_result');
    if (result.stop_reason !== 'tool_use' || !tool) throw new HttpError(502, 'AI_INVALID_OUTPUT', 'The AI could not complete this request.');
    return { value: tool.input, inputTokens: result.usage?.input_tokens, outputTokens: result.usage?.output_tokens };
  }
}
// Only server-controlled configuration selects providers/models. Never accept a
// client-supplied base URL, model, system prompt, or provider credentials.
export function providerFor(task: AiTask): AiProvider {
  const c = config();
  const provider = process.env[`AI_${task.toUpperCase()}_PROVIDER`] ?? c.AI_PROVIDER;
  const model = process.env[`AI_${task.toUpperCase()}_MODEL`] ?? (provider === 'openai' ? c.OPENAI_MODEL : c.ANTHROPIC_MODEL);
  const key = provider === 'openai' ? c.OPENAI_API_KEY : c.ANTHROPIC_API_KEY;
  if (!model || !key) throw new HttpError(503, 'AI_NOT_CONFIGURED', 'AI is not configured yet. You can still log food manually.');
  if (provider === 'openai') return new OpenAIProvider(model, key);
  if (provider === 'anthropic') return new AnthropicProvider(model, key);
  throw new HttpError(503, 'AI_NOT_CONFIGURED', 'This AI provider is not configured.');
}
