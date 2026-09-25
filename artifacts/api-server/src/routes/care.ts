import { Router } from 'express';
import {
  bootstrapHouseholdSchema,
  createFoodEventSchema,
  joinHouseholdSchema,
  updateProxySchema,
} from '@workspace/backend-contracts';
import {
  bootstrapHousehold,
  createFoodEvent,
  householdSnapshot,
  joinHousehold,
  listFoodEvents,
  replaceProxies,
  requireHouseholdAccess,
  requireMember,
  snapshotForUser,
} from '../lib/care';

export const careRouter = Router();

careRouter.get('/household', async (req, res) => {
  res.json(await snapshotForUser(req.user.id));
});

careRouter.post('/household', async (req, res) => {
  const input = bootstrapHouseholdSchema.parse(req.body);
  res.status(201).json(await bootstrapHousehold(req.user.id, input));
});

careRouter.post('/household/join', async (req, res) => {
  const { inviteCode } = joinHouseholdSchema.parse(req.body);
  res.status(201).json(await joinHousehold(req.user.id, inviteCode));
});

careRouter.put('/household/proxy', async (req, res) => {
  const { pairs } = updateProxySchema.parse(req.body);
  res.json(await replaceProxies(req.user.id, pairs));
});

careRouter.get('/household/:id', async (req, res) => {
  await requireHouseholdAccess(req.user.id, req.params.id);
  res.json(await householdSnapshot(req.params.id));
});

careRouter.get('/food-events', async (req, res) => {
  const actor = await requireMember(req.user.id);
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  const subject = typeof req.query.subjectMemberId === 'string' ? req.query.subjectMemberId : undefined;
  res.json({ events: await listFoodEvents(actor.household_id, date, subject) });
});

careRouter.post('/food-events', async (req, res) => {
  const input = createFoodEventSchema.parse(req.body);
  res.status(201).json(await createFoodEvent(req.user.id, input, 'app'));
});
