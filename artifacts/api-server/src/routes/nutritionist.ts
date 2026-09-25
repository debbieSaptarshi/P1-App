import { Router } from 'express';
import { z } from 'zod';
import {
  careFeedbackSchema,
  careQuestionSchema,
  dateSchema,
  foodEventNoteSchema,
  nutritionistProfileSchema,
  createFoodEventSchema,
} from '@workspace/backend-contracts';
import {
  addFoodEventNote,
  createFoodEvent,
  inviteCode,
  isNutritionistFor,
  listFoodEvents,
  listNotes,
  mapFoodEventNote,
  nutritionistHouseholds,
  nutritionistQueue,
  requireHouseholdAccess,
  requireNutritionistFoodEvent,
  setFoodEventReviewStatus,
  upsertNutritionistProfile,
} from '../lib/care';
import { admin, dbError } from '../lib/supabase';
import { HttpError } from '../lib/errors';

export const nutritionistRouter = Router();
const eventIdSchema = z.string().uuid();

function queryDate(value: unknown) {
  if (value == null || value === '') return new Date().toISOString().slice(0, 10);
  return dateSchema.parse(Array.isArray(value) ? value[0] : value);
}

function feedbackNoteBody(tag?: string, body?: string) {
  if (tag && body) return `${tag}: ${body}`;
  if (tag) return tag.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
  return body ?? '';
}

nutritionistRouter.get('/me', async (req, res) => {
  res.json(await nutritionistHouseholds(req.user.id));
});

nutritionistRouter.put('/me', async (req, res) => {
  const { displayName } = nutritionistProfileSchema.parse(req.body);
  res.json(await upsertNutritionistProfile(req.user.id, displayName));
});

nutritionistRouter.get('/queue', async (req, res) => {
  res.json(await nutritionistQueue(req.user.id, queryDate(req.query.date)));
});

nutritionistRouter.get('/households', async (req, res) => {
  res.json(await nutritionistHouseholds(req.user.id));
});

nutritionistRouter.get('/households/:id/days/:date', async (req, res) => {
  const householdId = req.params.id;
  const date = dateSchema.parse(req.params.date);
  await requireHouseholdAccess(req.user.id, householdId);
  if (!(await isNutritionistFor(req.user.id, householdId))) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not assigned to this household.');
  }
  const [events, notes] = await Promise.all([listFoodEvents(householdId, date), listNotes(householdId, date)]);
  res.json({ date, events, notes });
});

nutritionistRouter.post('/households/:id/notes', async (req, res) => {
  const householdId = req.params.id;
  const input = foodEventNoteSchema.parse(req.body);
  if (!(await isNutritionistFor(req.user.id, householdId))) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not assigned to this household.');
  }
  res.status(201).json(await addFoodEventNote(req.user.id, householdId, input.body, input.foodEventId, input.localDate));
});

nutritionistRouter.post('/households/:id/food-events', async (req, res) => {
  const householdId = req.params.id;
  const input = createFoodEventSchema.parse(req.body);
  if (!(await isNutritionistFor(req.user.id, householdId))) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not assigned to this household.');
  }
  res.status(201).json(await createFoodEvent(req.user.id, input, 'nutritionist'));
});

nutritionistRouter.post('/households/:id/invite', async (req, res) => {
  const householdId = req.params.id;
  if (!(await isNutritionistFor(req.user.id, householdId))) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not assigned to this household.');
  }
  const code = inviteCode();
  const { data, error } = await admin().from('households').update({ invite_code: code }).eq('id', householdId).select('id, invite_code, name').single();
  dbError(error);
  if (!data) throw new HttpError(404, 'NOT_FOUND', 'Household not found.');
  res.json({ householdId: data.id, inviteCode: data.invite_code, name: data.name });
});

nutritionistRouter.post('/food-events/:id/feedback', async (req, res) => {
  const eventId = eventIdSchema.parse(req.params.id);
  const input = careFeedbackSchema.parse(req.body);
  const event = await requireNutritionistFoodEvent(req.user.id, eventId);
  const note = await addFoodEventNote(
    req.user.id,
    event.household_id,
    feedbackNoteBody(input.tag, input.body),
    event.id,
    event.local_date,
  );
  if (event.review_status === 'received') {
    await setFoodEventReviewStatus(event.id, 'reviewed');
  }
  res.status(201).json(mapFoodEventNote(note as Record<string, unknown>));
});

nutritionistRouter.post('/food-events/:id/questions', async (req, res) => {
  const eventId = eventIdSchema.parse(req.params.id);
  const input = careQuestionSchema.parse(req.body);
  const event = await requireNutritionistFoodEvent(req.user.id, eventId);
  const note = await addFoodEventNote(
    req.user.id,
    event.household_id,
    `Asked (${input.kind}): ${input.prompt}`,
    event.id,
    event.local_date,
  );
  res.status(201).json(mapFoodEventNote(note as Record<string, unknown>));
});
