import { HOSTEL_CODES, type CampusDish, type DietFlag, type DishSource, type MealSlot } from './types';

type Spec = [
  id: string,
  name: string,
  outletId: string,
  slots: MealSlot[],
  serving: string,
  grams: number,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number,
  sodium: number,
  diet: DietFlag,
  oilTsp: number,
  source: DishSource,
  aliases?: string[],
  extra?: { priceInr?: number; weekday?: number; sourceUrl?: string },
];

export function dish(spec: Spec): CampusDish {
  const [id, name, outletId, mealSlots, servingSize, servingGrams, calories, protein, carbs, fat, fiber, sodium, diet, oilTsp, source, aliases, extra] = spec;
  return {
    id, name, outletId, mealSlots, servingSize, servingGrams, calories, protein, carbs, fat, fiber, sodium, diet, oilTsp, source,
    aliases: aliases ?? [],
    priceInr: extra?.priceInr,
    weekday: extra?.weekday,
    sourceUrl: extra?.sourceUrl,
  };
}

export const MESS_OUTLET_IDS = HOSTEL_CODES.map((code) => `mess-${code.toLowerCase()}`);

/** Clone a canonical mess dish onto every hostel mess outlet. */
export function forEveryMess(base: Omit<CampusDish, 'id' | 'outletId'> & { id: string }): CampusDish[] {
  return MESS_OUTLET_IDS.map((outletId) => ({
    ...base,
    id: `${base.id}-${outletId.replace('mess-', '')}`,
    outletId,
  }));
}
