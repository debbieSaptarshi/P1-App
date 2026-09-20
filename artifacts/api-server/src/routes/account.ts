import { Router } from 'express';
import { z } from 'zod';
import { syncSchema } from '@workspace/backend-contracts';
import { admin, dbError } from '../lib/supabase';
import { HttpError } from '../lib/errors';
export const accountRouter = Router();
accountRouter.get('/state', async (req, res) => {
  const { data, error } = await admin().rpc('account_snapshot', { p_user: req.user.id }); dbError(error);
  res.json(data);
});
accountRouter.post('/sync', async (req, res) => {
  const input = syncSchema.parse(req.body);
  for (const change of input.changes) {
    if (change.collection === 'profile' && change.data) {
      change.data.id = req.user.id;
      change.data.email = req.user.email ?? '';
    }
  }
  const { data, error } = await admin().rpc('apply_record_changes', { p_user: req.user.id, p_mutation: input.mutationId, p_expected: input.expectedRevision, p_changes: input.changes }); dbError(error);
  res.json({ revision: data });
});
accountRouter.get('/account/export', async (req, res) => {
  const snapshot = await admin().rpc('account_snapshot', { p_user: req.user.id }); dbError(snapshot.error);
  const result: Record<string,unknown> = { exportedAt: new Date().toISOString(), schemaVersion: 1, account: { id: req.user.id, email: req.user.email }, ...snapshot.data };
  for (const table of ['ai_requests','group_members','community_posts','post_comments','post_likes','challenge_members','content_reports','user_blocks']) {
    const rows: unknown[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await admin().from(table).select('*').eq('user_id', req.user.id).range(offset, offset+499); dbError(error);
      rows.push(...(data ?? [])); if ((data?.length ?? 0) < 500) break;
    }
    result[table] = rows;
  }
  res.setHeader('Content-Disposition', 'attachment; filename="food-coach-export.json"');
  res.json(result);
});
accountRouter.delete('/account', async (req, res) => {
  z.object({ confirmation: z.literal('DELETE') }).parse(req.body);
  // Auth deletion cascades through every owned table. Photos/audio are processed
  // transiently, so there are no retained media objects to orphan.
  const { error } = await admin().auth.admin.deleteUser(req.user.id); dbError(error);
  res.status(204).end();
});
accountRouter.get('/entitlements', (_req, res) => res.json({ tier: 'free', purchasesEnabled: false }));
accountRouter.get('/foods/barcode/:code', async (req, res) => {
  const code = z.string().regex(/^\d{8,14}$/).parse(req.params.code);
  let response: Response;
  try { response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,serving_size,nutriments`, { headers: { 'User-Agent': 'AdaptiveFoodCoach/1.0 (food lookup)' }, signal: AbortSignal.timeout(10000) }); }
  catch { throw new HttpError(502, 'CATALOG_UNAVAILABLE', 'Product lookup is unavailable. Please enter the label manually.'); }
  if (!response.ok) throw new HttpError(502, 'CATALOG_UNAVAILABLE', 'Product lookup is unavailable.');
  const body = await response.json() as any;
  if (body.status !== 1 || !body.product?.product_name) throw new HttpError(404, 'FOOD_NOT_FOUND', 'This barcode is not in the catalog. Scan the label or enter it manually.');
  const p = body.product, n = p.nutriments ?? {};
  const serving = p.serving_size && n['energy-kcal_serving'] != null;
  const suffix = serving ? '_serving' : '_100g';
  const missing: string[] = [];
  function nutrient(key: string, factor = 1) {
    const value = n[key + suffix];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) { missing.push(key); return 0; }
    return Math.min(100000, value * factor);
  }
  const food = { id: `barcode_${code}`, name: String(p.product_name).slice(0,300), ...(p.brands ? { brand: String(p.brands).slice(0,300) } : {}), servingSize: serving ? String(p.serving_size) : '100 g',
    calories: nutrient('energy-kcal'), protein: nutrient('proteins'), carbs: nutrient('carbohydrates'), fat: nutrient('fat'), fiber: nutrient('fiber'), sodium: nutrient('sodium',1000), source: 'barcode',
    warnings: [] as string[],
  };
  if (missing.length) food.warnings.push(`Missing label data (shown as 0): ${missing.join(', ')}. Please correct before logging.`);
  food.warnings.push('Open Food Facts is community maintained. Check the package label and allergens.');
  res.json({ food, attribution: 'Open Food Facts contributors (ODbL)', sourceUrl: `https://world.openfoodfacts.org/product/${code}` });
});
