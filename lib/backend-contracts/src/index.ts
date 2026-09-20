import { z } from 'zod';

export const idSchema = z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Invalid date');
const text = z.string().trim().min(1).max(300);
const amount = z.number().finite().min(0).max(100000);
export const nutrientsSchema = z.object({ calories: amount, protein: amount, carbs: amount, fat: amount, fiber: amount, sodium: amount });
export const foodSchema = z.object({
  id: idSchema, name: text, brand: text.optional(), servingSize: text,
  calories: amount, protein: amount, carbs: amount, fat: amount, fiber: amount.optional(), sodium: amount.optional(),
  image: z.string().max(2000).optional(),
  source: z.enum(['manual', 'ai', 'barcode', 'catalog']).optional(),
  analysisId: z.string().uuid().optional(), confidence: z.number().min(0).max(1).optional(),
  warnings: z.array(z.string().max(500)).max(20).optional(),
});
export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export const exerciseTypeSchema = z.enum(['walking','running','cycling','strength','yoga','swimming','hiit','other']);
export const profileSchema = z.object({
  id: z.string().max(120), name: z.string().max(100), email: z.string().max(320), avatar: z.string().max(2000).optional(),
  gender: z.enum(['male','female','other','prefer_not_to_say']), dateOfBirth: z.union([dateSchema, z.literal('')]),
  heightCm: z.number().min(0).max(300), currentWeightKg: z.number().min(0).max(700), targetWeightKg: z.number().min(0).max(700),
  workoutFrequency: z.enum(['never','rarely','1_2_per_week','3_4_per_week','5_plus_per_week']),
  goals: z.array(z.enum(['lose_weight','maintain_weight','gain_muscle','improve_health','manage_condition'])).max(5),
  dietPattern: z.enum(['omnivore','vegetarian','vegan','pescatarian','keto','mediterranean','custom']),
  allergies: z.array(text).max(40), dailyStepGoal: z.number().int().min(0).max(100000),
  nutrientGoals: nutrientsSchema.extend({ waterMl: amount }),
  units: z.object({ weight: z.enum(['kg','lb']), height: z.enum(['cm','ft']) }),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
});
export const exerciseSchema = z.object({ id: idSchema, date: dateSchema, type: exerciseTypeSchema, durationMinutes: z.number().positive().max(1440), distanceKm: amount.optional(), pace: z.string().max(100).optional(), caloriesBurned: amount, notes: z.string().max(3000).optional() });
export const recordSchemas = {
  profile: profileSchema,
  onboarding: z.object({ stepIndex: z.number().int().min(0).max(100), totalSteps: z.number().int().min(1).max(100), answers: z.record(z.union([z.string().max(2000), z.array(z.string().max(300)).max(50), z.number().finite()])), generating: z.boolean(), complete: z.boolean() }),
  foods: foodSchema,
  food_entries: z.object({ id: idSchema, date: dateSchema, mealType: mealTypeSchema, food: foodSchema, quantity: z.number().positive().max(100), loggedAt: z.string().datetime() }),
  hydration: z.object({ date: dateSchema, waterMl: z.number().int().min(0).max(20000) }),
  saved_foods: z.object({ id: idSchema, name: text, notes: z.string().max(3000).optional(), ingredients: z.array(z.object({ foodId: idSchema, quantity: z.number().positive().max(100) })).max(100), calories: amount, createdAt: z.string().datetime() }),
  recipes: z.object({ id: idSchema, name: text, description: z.string().max(3000).optional(), servings: z.number().positive().max(100), ingredients: z.array(foodSchema).max(100), totalCalories: amount, totalProtein: amount, totalCarbs: amount, totalFat: amount, createdAt: z.string().datetime() }),
  exercise: exerciseSchema,
  steps: z.object({ date: dateSchema, count: z.number().int().min(0).max(100000), source: z.enum(['manual','device']) }),
  weights: z.object({ id: idSchema, date: dateSchema, weightKg: z.number().positive().max(700), note: z.string().max(3000).optional() }),
  preferences: z.object({ reminders: z.object({daily:z.boolean().optional(),weekly:z.boolean().optional(),sound:z.boolean().optional()}).optional(), theme: z.enum(['light','dark','system']).optional(), notifications: z.boolean().optional(), aiConsent: z.boolean().optional() }),
};
export type Collection = keyof typeof recordSchemas;
export const collections = Object.keys(recordSchemas) as [Collection, ...Collection[]];
export const changeSchema = z.object({ collection: z.enum(collections), id: idSchema, data: z.record(z.unknown()).nullable() }).superRefine((value, ctx) => {
  if (value.data === null) return;
  const result = recordSchemas[value.collection].safeParse(value.data);
  if (!result.success) for (const issue of result.error.issues) ctx.addIssue({ ...issue, path: ['data', ...issue.path] });
  if ('id' in value.data && value.data.id !== value.id && value.collection !== 'profile') ctx.addIssue({ code: 'custom', message: 'Record ID mismatch' });
  if (['profile','onboarding','preferences'].includes(value.collection) && value.id !== 'self') ctx.addIssue({ code: 'custom', message: 'Singleton ID must be self' });
  if (['hydration','steps'].includes(value.collection) && value.id !== value.data.date) ctx.addIssue({ code: 'custom', message: 'Hydration ID must be date' });
});
export const syncSchema = z.object({ mutationId: z.string().uuid(), expectedRevision: z.number().int().nonnegative(), changes: z.array(changeSchema).min(1).max(500) });
export type RecordChange = z.infer<typeof changeSchema>;
export interface CloudRecord { collection: Collection; id: string; data: Record<string, unknown>; }
export interface Snapshot { revision: number; records: CloudRecord[]; }

export const analysisRequestSchema = z.object({
  kind: z.enum(['food', 'label', 'text']), text: z.string().trim().min(1).max(4000).optional(),
  image: z.object({ base64: z.string().min(4).max(8_000_000).regex(/^[A-Za-z0-9+/]*={0,2}$/), mediaType: z.enum(['image/jpeg','image/png','image/webp']) }).optional(),
  consent: z.literal(true),
}).refine(v => v.kind === 'text' ? !!v.text : !!v.image, 'An image or text description is required');
export const analysisResultSchema = z.object({
  foods: z.array(z.object({ name: text, servingSize: text, calories: amount, protein: amount, carbs: amount, fat: amount, fiber: amount, sodium: amount, confidence: z.number().min(0).max(1) })).max(20),
  warnings: z.array(z.string().max(500)).max(20), notes: z.string().max(2000),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export const coachResultSchema = z.object({ reply: z.string().min(1).max(6000), suggestions: z.array(z.string().max(500)).max(5) });
export const planResultSchema = z.object({ meals: z.array(z.object({ name: text, mealType: mealTypeSchema, ingredients: z.array(text).max(30), instructions: z.string().max(2500), calories: amount, protein: amount, carbs: amount, fat: amount, fiber: amount })).min(1).max(7), notes: z.string().max(2000) });
export const exerciseResultSchema = z.object({ type: exerciseTypeSchema, durationMinutes: z.number().positive().max(1440), distanceKm: z.number().min(0).max(1000).nullable(), caloriesBurned: amount, notes: z.string().max(2000) });
export const aiTasks = ['food', 'label', 'text', 'coach', 'plan', 'exercise'] as const;
export type AiTask = typeof aiTasks[number];
export const AI_PROMPT_VERSION = '2026-09-20.1';
