import { Router } from 'express';
import { z } from 'zod';
import { CAMPUS_DISHES, CAMPUS_OUTLETS, matchCampusFood, toFoodItem, dishesForHostel } from '@workspace/campus-food';
import { syncCampusCatalog } from '../campus/sync';

export const campusRouter = Router();

campusRouter.get('/foods', async (req, res) => {
  const query = z.object({
    hostel: z.string().max(16).optional(),
    outletId: z.string().max(80).optional(),
    priority: z.coerce.number().int().min(1).max(3).optional(),
    q: z.string().max(120).optional(),
  }).parse(req.query);
  const matches = query.q
    ? matchCampusFood({ text: query.q, hostel: query.hostel, outletId: query.outletId, limit: 80 })
    : dishesForHostel(query.hostel)
      .filter((dish) => !query.outletId || dish.outletId === query.outletId)
      .map((dish) => ({ ...dish, outletName: CAMPUS_OUTLETS.find((outlet) => outlet.id === dish.outletId)?.name ?? dish.outletId, priority: CAMPUS_OUTLETS.find((outlet) => outlet.id === dish.outletId)?.priority ?? 3, score: 0 }));
  const foods = matches
    .filter((dish) => !query.priority || dish.priority === query.priority)
    .slice(0, 200)
    .map((dish) => ({ ...toFoodItem(dish), outletId: dish.outletId, priority: dish.priority }));
  res.json({
    outlets: CAMPUS_OUTLETS.filter((outlet) => !query.priority || outlet.priority === query.priority),
    foods,
    counts: { outlets: CAMPUS_OUTLETS.length, dishes: CAMPUS_DISHES.length },
  });
});

campusRouter.post('/sync', async (_req, res) => {
  res.json(await syncCampusCatalog());
});
