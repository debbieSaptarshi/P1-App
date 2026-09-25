import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { api } from './api';
import type { FoodPlateResult } from '@workspace/backend-contracts';
import type { FoodItem } from '@/types';

function plateDir() {
  const dir = new Directory(Paths.document, 'food-plates');
  if (!dir.exists) dir.create();
  return dir;
}

export async function persistPlateImage(cacheKey: string, imageBase64: string, mediaType: string): Promise<string> {
  const ext = mediaType === 'image/png' ? 'png' : mediaType === 'image/webp' ? 'webp' : 'jpg';
  const file = new File(plateDir(), `${cacheKey}.${ext}`);
  if (!file.exists) file.write(imageBase64, { encoding: 'base64' });
  return file.uri;
}

/** Cheapest plate thumbnail. Meal photos are sent as a reference so the saucer matches the real portion. */
export async function ensureFoodPlate(
  foods: Pick<FoodItem, 'name' | 'servingSize' | 'calories' | 'protein' | 'carbs' | 'fat'>[],
  image?: { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' },
): Promise<string | undefined> {
  if (!foods.length) return undefined;
  const result = await api<FoodPlateResult>('/ai/food-plate', {
    method: 'POST',
    idempotencyKey: Crypto.randomUUID(),
    body: {
      consent: true,
      foods: foods.slice(0, 8).map((food) => ({
        name: food.name,
        servingSize: food.servingSize,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      })),
      ...(image ? { image } : {}),
    },
  });
  return persistPlateImage(result.cacheKey, result.imageBase64, result.mediaType);
}
