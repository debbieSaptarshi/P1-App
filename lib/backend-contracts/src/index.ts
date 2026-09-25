import { z } from 'zod';

export const idSchema = z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Invalid date');
const text = z.string().trim().min(1).max(300);
const amount = z.number().finite().min(0).max(100000);
export const nutrientsSchema = z.object({ calories: amount, protein: amount, carbs: amount, fat: amount, fiber: amount, sodium: amount });
export const foodSchema = z.object({
  id: idSchema, name: text, brand: text.optional(), servingSize: text,
  calories: amount, protein: amount, carbs: amount, fat: amount, fiber: amount.optional(), sodium: amount.optional(),
  image: z.string().max(4000).optional(),
  source: z.enum(['manual', 'ai', 'barcode', 'catalog']).optional(),
  analysisId: z.string().uuid().optional(), confidence: z.number().min(0).max(1).optional(),
  warnings: z.array(z.string().max(500)).max(20).optional(),
  catalogId: z.string().max(120).optional(), outletId: z.string().max(80).optional(),
  portionGrams: amount.optional(), oilTsp: z.number().min(0).max(20).optional(),
  matchMethod: z.enum(['catalog', 'visual', 'label', 'text']).optional(),
  caloriesLow: amount.optional(), caloriesHigh: amount.optional(),
});
export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export const exerciseTypeSchema = z.enum(['walking','running','cycling','strength','yoga','swimming','hiit','other']);
export const profileSchema = z.object({
  id: z.string().max(120), name: z.string().max(100), email: z.string().max(320), avatar: z.string().max(2000).optional(),
  gender: z.enum(['male','female','other','prefer_not_to_say']), dateOfBirth: z.union([dateSchema, z.literal('')]),
  heightCm: z.number().min(0).max(300), currentWeightKg: z.number().min(0).max(700), targetWeightKg: z.number().min(0).max(700),
  workoutFrequency: z.enum(['never','rarely','1_2_per_week','3_4_per_week','5_plus_per_week']),
  goals: z.array(z.enum(['lose_weight','maintain_weight','gain_muscle','improve_health','manage_condition','gain_weight'])).max(5),
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
  food_entries: z.object({
    id: idSchema, date: dateSchema, mealType: mealTypeSchema, food: foodSchema, quantity: z.number().positive().max(100), loggedAt: z.string().datetime(),
    subjectMemberId: z.string().uuid().optional(), loggedByMemberId: z.string().uuid().optional(), addedBy: z.string().max(120).optional(),
  }),
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
  hostel: z.string().trim().max(16).optional(),
  outletId: z.string().trim().max(80).optional(),
  mealSlot: mealTypeSchema.optional(),
}).refine(v => v.kind === 'text' ? !!v.text : !!v.image, 'An image or text description is required');
export const foodContextSchema = z.enum(['home', 'restaurant', 'unknown', 'mess', 'canteen', 'hostel_room', 'delivery']);
export const missingInputSchema = z.enum(['portion', 'oil', 'context', 'ingredients']);
export const analysisResultSchema = z.object({
  foods: z.array(z.object({
    name: text, servingSize: text, calories: amount, protein: amount, carbs: amount, fat: amount, fiber: amount, sodium: amount, confidence: z.number().min(0).max(1),
    catalogId: z.string().max(120).optional(), outletId: z.string().max(80).optional(),
    portionGrams: amount.optional(), oilTsp: z.number().min(0).max(20).optional(),
    matchMethod: z.enum(['catalog', 'visual', 'label', 'text']).optional(),
    caloriesLow: amount.optional(), caloriesHigh: amount.optional(),
  })).max(20),
  warnings: z.array(z.string().max(500)).max(20), notes: z.string().max(2000),
  assumptions: z.array(z.string().max(500)).max(20).optional(),
  missingInputs: z.array(missingInputSchema).max(10).optional(),
  contextGuess: foodContextSchema.optional(),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export const foodPlateItemSchema = z.object({
  name: text, servingSize: text, calories: amount, protein: amount, carbs: amount, fat: amount,
});
export const foodPlateRequestSchema = z.object({
  consent: z.literal(true),
  foods: z.array(foodPlateItemSchema).min(1).max(8),
  image: z.object({ base64: z.string().min(4).max(8_000_000).regex(/^[A-Za-z0-9+/]*={0,2}$/), mediaType: z.enum(['image/jpeg','image/png','image/webp']) }).optional(),
});
export const foodPlateResultSchema = z.object({
  cacheKey: z.string().min(16).max(128),
  cached: z.boolean(),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  imageBase64: z.string().min(32).max(400000),
  model: z.string().max(80),
});
export type FoodPlateRequest = z.infer<typeof foodPlateRequestSchema>;
export type FoodPlateResult = z.infer<typeof foodPlateResultSchema>;
export const coachResultSchema = z.object({ reply: z.string().min(1).max(6000), suggestions: z.array(z.string().max(500)).max(5) });
export const planResultSchema = z.object({ meals: z.array(z.object({ name: text, mealType: mealTypeSchema, ingredients: z.array(text).max(30), instructions: z.string().max(2500), calories: amount, protein: amount, carbs: amount, fat: amount, fiber: amount })).min(1).max(7), notes: z.string().max(2000) });
export const exerciseResultSchema = z.object({ type: exerciseTypeSchema, durationMinutes: z.number().positive().max(1440), distanceKm: z.number().min(0).max(1000).nullable(), caloriesBurned: amount, notes: z.string().max(2000) });
export const aiTasks = ['food', 'label', 'text', 'coach', 'plan', 'exercise', 'plate'] as const;
export type AiTask = typeof aiTasks[number];
export const AI_PROMPT_VERSION = '2026-09-21.2';

export const whoForSchema = z.enum(['self', 'family', 'caregiver']);
export const relationshipSchema = z.enum(['self', 'spouse', 'parent', 'child', 'sibling', 'other']);
export const ageBandSchema = z.enum(['child', 'teen', 'adult', 'older_adult']);
export const mealSlotSchema = mealTypeSchema;
export const foodChannelSchema = z.enum(['app', 'whatsapp', 'nutritionist']);
export const reviewStatusSchema = z.enum(['received', 'needs_subject', 'reviewed', 'flagged']);
export const e164Schema = z.string().regex(/^\+[1-9][0-9]{7,14}$/, 'Use an international phone number, like +9198…');
export const waIdSchema = z.string().regex(/^[0-9]{8,15}$/);
export const inviteCodeSchema = z.string().regex(/^[A-Z0-9]{6,12}$/);

export const householdMemberInputSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  relationship: z.enum(['spouse', 'parent', 'child', 'sibling', 'other']),
  ageBand: ageBandSchema.optional(),
  whatsappPhone: e164Schema.optional(),
});
export const proxyPairSchema = z.object({
  actorMemberId: z.string().uuid(),
  subjectMemberId: z.string().uuid(),
  granted: z.boolean(),
});
export const memberProfileInputSchema = z.object({
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  dateOfBirth: dateSchema.optional(),
  heightCm: z.number().min(0).max(300).optional(),
  weightKg: z.number().min(0).max(700).optional(),
  targetWeightKg: z.number().min(0).max(700).optional(),
  workoutFrequency: z.enum(['never', 'rarely', '1_2_per_week', '3_4_per_week', '5_plus_per_week']).optional(),
  goals: z.array(z.enum(['lose_weight', 'maintain_weight', 'gain_muscle', 'improve_health', 'manage_condition', 'gain_weight'])).max(5).optional(),
  dietPattern: z.enum(['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'mediterranean', 'custom']).optional(),
  allergies: z.array(text).max(40).optional(),
  whoFor: whoForSchema.optional(),
  proxyConsent: z.boolean().optional(),
});
export const bootstrapHouseholdSchema = z.object({
  householdName: z.string().trim().min(1).max(120).optional(),
  whoFor: whoForSchema,
  selfName: z.string().trim().min(1).max(80).optional(),
  members: z.array(householdMemberInputSchema).max(3).default([]),
  proxyAll: z.boolean().default(true),
  whatsappPhone: e164Schema.optional(),
  extraWhatsapp: z.array(z.object({ phone: e164Schema, memberIndex: z.number().int().min(0).max(3) })).max(3).default([]),
  nutritionistCode: inviteCodeSchema.optional(),
  profile: memberProfileInputSchema.optional(),
});
export const createFoodEventSchema = z.object({
  subjectMemberId: z.string().uuid(),
  mealSlot: mealSlotSchema.optional(),
  caption: z.string().trim().max(2000).optional(),
  context: foodContextSchema.optional(),
  localDate: dateSchema.optional(),
  mediaPath: z.string().max(500).optional(),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
  foodName: z.string().trim().min(1).max(300).optional(),
});
export const foodEventNoteSchema = z.object({
  body: z.string().trim().min(1).max(3000),
  foodEventId: z.string().uuid().optional(),
  localDate: dateSchema.optional(),
});
export const nutritionistProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
});
export const joinHouseholdSchema = z.object({
  inviteCode: inviteCodeSchema,
});
export const updateProxySchema = z.object({
  pairs: z.array(proxyPairSchema).min(1).max(12),
});
export const ackTagSchema = z.enum([
  'good_plate', 'more_protein', 'watch_oil', 'smaller_portion', 'add_fibre', 'nice_swap',
  'late_meal', 'swap_the_sweet', 'good_timing', 'protein_present', 'too_late',
]);
export const questionKindSchema = z.enum(['context', 'oil', 'portion', 'subject', 'items', 'free']);
export const careFeedbackSchema = z.object({
  tag: z.string().trim().min(1).max(80).optional(),
  body: z.string().trim().min(1).max(2000).optional(),
}).refine((value) => Boolean(value.tag || value.body), { message: 'A tag or a comment is required' });
export const careQuestionSchema = z.object({
  kind: questionKindSchema,
  prompt: z.string().trim().min(1).max(500),
});

export type WhoFor = z.infer<typeof whoForSchema>;
export type HouseholdMemberInput = z.infer<typeof householdMemberInputSchema>;
export type BootstrapHousehold = z.infer<typeof bootstrapHouseholdSchema>;
export type CreateFoodEvent = z.infer<typeof createFoodEventSchema>;
export type MemberProfileInput = z.infer<typeof memberProfileInputSchema>;
export type AckTag = z.infer<typeof ackTagSchema>;
export type QuestionKind = z.infer<typeof questionKindSchema>;
export type CareFeedback = z.infer<typeof careFeedbackSchema>;
export type CareQuestion = z.infer<typeof careQuestionSchema>;
