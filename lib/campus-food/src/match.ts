import { CAMPUS_DISHES } from './catalog';
import { OUTLET_BY_ID, outletsForHostel } from './outlets';
import type { CampusDish, CatalogMatch, CatalogMatchQuery } from './types';

function tokens(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((part) => part.length > 1);
}

function scoreDish(dish: CampusDish, needles: string[], outletId?: string, mealSlot?: string) {
  const hay = `${dish.name} ${dish.aliases.join(' ')} ${dish.outletId}`.toLowerCase();
  let score = 0;
  for (const needle of needles) {
    if (hay === needle) score += 12;
    else if (hay.includes(needle)) score += 6;
    else if (dish.aliases.some((alias) => alias.toLowerCase() === needle)) score += 8;
  }
  if (outletId && dish.outletId === outletId) score += 10;
  if (mealSlot && dish.mealSlots.includes(mealSlot as CampusDish['mealSlots'][number])) score += 2;
  const outlet = OUTLET_BY_ID.get(dish.outletId);
  if (outlet) score += 4 - outlet.priority;
  return score;
}

export function dishesForHostel(hostel?: string) {
  if (!hostel) {
    const seen = new Set<string>();
    return CAMPUS_DISHES.filter((dish) => {
      const key = dish.outletId.startsWith('mess-') ? `mess:${dish.name}` : dish.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  const allowed = new Set(outletsForHostel(hostel).map((outlet) => outlet.id));
  return CAMPUS_DISHES.filter((dish) => allowed.has(dish.outletId));
}

export function matchCampusFood(query: CatalogMatchQuery): CatalogMatch[] {
  const needles = tokens(`${query.text ?? ''} ${query.outletId ?? ''}`);
  const pool = query.outletId
    ? CAMPUS_DISHES.filter((dish) => dish.outletId === query.outletId)
    : dishesForHostel(query.hostel);
  const ranked = pool
    .map((dish) => ({
      ...dish,
      outletName: OUTLET_BY_ID.get(dish.outletId)?.name ?? dish.outletId,
      priority: OUTLET_BY_ID.get(dish.outletId)?.priority ?? 3,
      score: needles.length
        ? scoreDish(dish, needles, query.outletId, query.mealSlot)
        : (4 - (OUTLET_BY_ID.get(dish.outletId)?.priority ?? 3)) + (query.mealSlot && dish.mealSlots.includes(query.mealSlot) ? 2 : 0),
    }))
    .filter((row) => needles.length === 0 || row.score > 0)
    .sort((a, b) => b.score - a.score || a.priority - b.priority || a.name.localeCompare(b.name));
  const limit = query.limit ?? 24;
  if (needles.length > 0 || query.outletId) return ranked.slice(0, limit);
  return mixPriorities(ranked, limit);
}

/** Photo scans often have no caption — keep mess first but still send canteen and nearby rows. */
function mixPriorities(ranked: CatalogMatch[], limit: number) {
  const buckets: Record<1 | 2 | 3, CatalogMatch[]> = { 1: [], 2: [], 3: [] };
  for (const row of ranked) buckets[row.priority].push(row);
  const take = { 1: Math.min(12, buckets[1].length), 2: Math.min(8, buckets[2].length), 3: Math.min(4, buckets[3].length) };
  let used = take[1] + take[2] + take[3];
  for (const priority of [1, 2, 3] as const) {
    while (used < limit && take[priority] < buckets[priority].length) {
      take[priority] += 1;
      used += 1;
    }
  }
  return [...buckets[1].slice(0, take[1]), ...buckets[2].slice(0, take[2]), ...buckets[3].slice(0, take[3])].slice(0, limit);
}

export function dishById(id: string) {
  return CAMPUS_DISHES.find((dish) => dish.id === id);
}

export function scaleFromCatalog(dish: CampusDish, portionGrams?: number, extraOilTsp = 0) {
  const grams = portionGrams && portionGrams > 0 ? portionGrams : dish.servingGrams;
  const scale = grams / dish.servingGrams;
  const oilKcal = Math.max(0, extraOilTsp) * 40;
  const calories = Math.round(dish.calories * scale + oilKcal);
  const fat = Math.round((dish.fat * scale + extraOilTsp * 4.5) * 10) / 10;
  return {
    calories,
    protein: Math.round(dish.protein * scale * 10) / 10,
    carbs: Math.round(dish.carbs * scale * 10) / 10,
    fat,
    fiber: Math.round(dish.fiber * scale * 10) / 10,
    sodium: Math.round(dish.sodium * scale),
    servingSize: `${grams} g / ${dish.servingSize}`,
    scale,
  };
}

export function toFoodItem(dish: CampusDish) {
  const outlet = OUTLET_BY_ID.get(dish.outletId);
  return {
    id: dish.id,
    name: dish.name,
    brand: outlet?.name,
    servingSize: dish.servingSize,
    calories: dish.calories,
    protein: dish.protein,
    carbs: dish.carbs,
    fat: dish.fat,
    fiber: dish.fiber,
    sodium: dish.sodium,
    source: 'catalog' as const,
  };
}
