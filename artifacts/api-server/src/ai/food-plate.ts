import { createHash } from 'node:crypto';
import { cropToSaucer, SAUCER_CROP_VERSION } from './crop-saucer';
import { config } from '../lib/config';
import { HttpError } from '../lib/errors';

export interface PlateFood {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PlateReference {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
}

/** Bucket calories so similar portions share one cached thumbnail. */
export function bucketCalories(value: number): number {
  return Math.round(value / 50) * 50;
}

export function foodPlateCacheKey(foods: PlateFood[], model: string, reference?: PlateReference): string {
  const signature = foods
    .map((food) =>
      [
        food.name.trim().toLowerCase().replace(/\s+/g, ' '),
        food.servingSize.trim().toLowerCase().replace(/\s+/g, ' '),
        String(bucketCalories(food.calories)),
        String(Math.round(food.protein)),
        String(Math.round(food.carbs)),
        String(Math.round(food.fat)),
      ].join('|'),
    )
    .sort()
    .join(';');
  const photo = reference ? createHash('sha256').update(reference.base64).digest('hex').slice(0, 24) : 'none';
  return createHash('sha256').update(`${model}|low|${SAUCER_CROP_VERSION}|${photo}|${signature}`).digest('hex');
}

export function foodPlatePrompt(foods: PlateFood[], hasReference: boolean): string {
  const dishes = foods
    .map(
      (food) =>
        `${food.name} (${food.servingSize}; ~${Math.round(food.calories)} kcal, ${Math.round(food.protein)}g protein, ${Math.round(food.carbs)}g carbs, ${Math.round(food.fat)}g fat)`,
    )
    .join('; ');
  const reference = hasReference
    ? 'Use the attached photo only as a visual reference for the real food, colors, and portion size. Keep the same ingredients and the same amount of food; do not add extra items or enlarge the portion.'
    : 'Show only the estimated portion described below.';
  return [
    'Photorealistic top-down studio photo of this meal on a round white ceramic saucer:',
    dishes + '.',
    reference,
    'The saucer is a perfect circle, centered in a square frame.',
    'All food stays inside the saucer rim; nothing overlaps or spills past the circular edge.',
    'No utensils, hands, table clutter, logos, or text.',
    'Soft even lighting, plain light gray background.',
  ].join(' ');
}

async function readImageResponse(response: Response, model: string) {
  if (!response.ok) throw new HttpError(502, 'AI_UNAVAILABLE', 'The AI service is temporarily unavailable. Please try again.');
  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const b64 = payload.data?.[0]?.b64_json;
  if (b64) return { imageBase64: b64, mediaType: 'image/jpeg' as const, model };
  const url = payload.data?.[0]?.url;
  if (!url) throw new HttpError(502, 'AI_INVALID_OUTPUT', 'The AI returned an unreadable response. Please try again.');
  const image = await fetch(url, { signal: AbortSignal.timeout(config().AI_TIMEOUT_MS) });
  if (!image.ok) throw new HttpError(502, 'AI_UNAVAILABLE', 'The AI service is temporarily unavailable. Please try again.');
  const bytes = Buffer.from(await image.arrayBuffer());
  return { imageBase64: bytes.toString('base64'), mediaType: 'image/jpeg' as const, model };
}

export async function generateFoodPlate(
  foods: PlateFood[],
  reference?: PlateReference,
): Promise<{ imageBase64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; model: string }> {
  const c = config();
  if (!c.OPENAI_API_KEY) throw new HttpError(503, 'AI_NOT_CONFIGURED', 'AI is not configured yet. You can still log food manually.');
  const model = c.OPENAI_IMAGE_MODEL;
  const prompt = foodPlatePrompt(foods, !!reference);
  try {
    if (reference) {
      const bytes = Buffer.from(reference.base64, 'base64');
      const form = new FormData();
      form.append('model', model);
      form.append('prompt', prompt);
      form.append('n', '1');
      form.append('size', c.OPENAI_IMAGE_SIZE);
      form.append('quality', c.OPENAI_IMAGE_QUALITY);
      form.append('output_format', 'jpeg');
      form.append('image', new Blob([bytes], { type: reference.mediaType }), reference.mediaType === 'image/png' ? 'reference.png' : 'reference.jpg');
      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${c.OPENAI_API_KEY}` },
        body: form,
        signal: AbortSignal.timeout(c.AI_TIMEOUT_MS),
      });
      const generated = await readImageResponse(response, model);
      const cropped = cropToSaucer(generated.imageBase64, generated.mediaType);
      return { ...cropped, model };
    }
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: c.OPENAI_IMAGE_SIZE,
        quality: c.OPENAI_IMAGE_QUALITY,
        output_format: 'jpeg',
      }),
      signal: AbortSignal.timeout(c.AI_TIMEOUT_MS),
    });
    const generated = await readImageResponse(response, model);
    const cropped = cropToSaucer(generated.imageBase64, generated.mediaType);
    return { ...cropped, model };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(504, 'AI_TIMEOUT', 'The AI service did not respond. Please try again.');
  }
}
