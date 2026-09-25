import { CAMPUS_DISHES, CAMPUS_OUTLETS } from '@workspace/campus-food';
import { admin, dbError } from '../lib/supabase';

export async function syncCampusCatalog() {
  const outlets = CAMPUS_OUTLETS.map((outlet) => ({
    id: outlet.id,
    name: outlet.name,
    kind: outlet.kind,
    priority: outlet.priority,
    hostel_codes: outlet.hostelCodes,
    area: outlet.area,
    veg_only: outlet.vegOnly,
    source_url: outlet.sourceUrl ?? null,
    notes: outlet.notes ?? null,
    updated_at: new Date().toISOString(),
  }));
  const dishes = CAMPUS_DISHES.map((dish) => ({
    id: dish.id,
    outlet_id: dish.outletId,
    name: dish.name,
    aliases: dish.aliases,
    meal_slots: dish.mealSlots,
    serving_size: dish.servingSize,
    serving_grams: dish.servingGrams,
    calories: dish.calories,
    protein: dish.protein,
    carbs: dish.carbs,
    fat: dish.fat,
    fiber: dish.fiber,
    sodium: dish.sodium,
    diet: dish.diet,
    oil_tsp: dish.oilTsp,
    price_inr: dish.priceInr ?? null,
    weekday: dish.weekday ?? null,
    source: dish.source,
    source_url: dish.sourceUrl ?? null,
  }));
  const { error: outletError } = await admin().from('campus_outlets').upsert(outlets, { onConflict: 'id' });
  dbError(outletError);
  for (let offset = 0; offset < dishes.length; offset += 200) {
    const { error } = await admin().from('campus_dishes').upsert(dishes.slice(offset, offset + 200), { onConflict: 'id' });
    dbError(error);
  }
  return { outlets: outlets.length, dishes: dishes.length };
}
