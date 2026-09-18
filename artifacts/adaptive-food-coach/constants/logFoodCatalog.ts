import type { FoodItem } from '@/types';

/**
 * Log Food lists by source tab.
 *
 * All-tab cards use Figma sample numbers (tbsp servings). Seed avocado/egg
 * keep their original serving sizes; All still displays the Figma figures.
 */
export const ALL_SAMPLE_FOODS: FoodItem[] = [
  { id: 'fd_peanut_butter', name: 'Peanut Butter', servingSize: 'tbsp', calories: 94, protein: 4, carbs: 3.5, fat: 8, fiber: 1, sodium: 70 },
  { id: 'fd_avocado', name: 'Avocado', servingSize: 'tbsp', calories: 130, protein: 1.5, carbs: 6.4, fat: 11, fiber: 5, sodium: 5 },
  { id: 'fd_eggs', name: 'Egg', servingSize: 'tbsp', calories: 74, protein: 6, carbs: 0.4, fat: 5, fiber: 0, sodium: 71 },
  { id: 'fd_apples', name: 'Apples', servingSize: 'tbsp', calories: 72, protein: 0.3, carbs: 19, fat: 0.2, fiber: 3.3, sodium: 1 },
  { id: 'fd_banana', name: 'Bananas', servingSize: 'tbsp', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sodium: 1 },
];

/** Sylheti / home kitchen dishes for the At Home tab. */
export const AT_HOME_FOODS: FoodItem[] = [
  { id: 'fd_shutki_bhorta', name: 'Shutki Bhorta', servingSize: 'katori', calories: 185, protein: 18, carbs: 6, fat: 10, fiber: 2, sodium: 620 },
  { id: 'fd_hatkora_chicken', name: 'Hatkora Chicken', servingSize: 'plate', calories: 320, protein: 28, carbs: 8, fat: 18, fiber: 2, sodium: 480 },
  { id: 'fd_shorshe_ilish', name: 'Shorshe Ilish', servingSize: 'piece', calories: 280, protein: 22, carbs: 4, fat: 20, fiber: 1, sodium: 410 },
  { id: 'fd_bashkorol_curry', name: 'Bashkorol Curry', servingSize: 'katori', calories: 160, protein: 4, carbs: 14, fat: 9, fiber: 4, sodium: 390 },
  { id: 'fd_duck_dried_chilli', name: 'Duck with Dried Chilli', servingSize: 'plate', calories: 380, protein: 32, carbs: 6, fat: 24, fiber: 1, sodium: 520 },
  { id: 'fd_chunga_pitha', name: 'Chunga Pitha', servingSize: 'piece', calories: 220, protein: 4, carbs: 42, fat: 4, fiber: 2, sodium: 80 },
  { id: 'fd_morich_bhorta', name: 'Morich Bhorta', servingSize: 'tbsp', calories: 45, protein: 1, carbs: 3, fat: 3.5, fiber: 1, sodium: 210 },
  { id: 'fd_panta_bhat', name: 'Panta Bhat', servingSize: 'plate', calories: 210, protein: 4, carbs: 44, fat: 1, fiber: 1, sodium: 15 },
  { id: 'fd_beef_shatkora', name: 'Beef with Shatkora', servingSize: 'plate', calories: 350, protein: 30, carbs: 7, fat: 22, fiber: 2, sodium: 510 },
  { id: 'fd_aloo_bhorta', name: 'Aloo Bhorta', servingSize: 'katori', calories: 140, protein: 3, carbs: 18, fat: 6, fiber: 2, sodium: 280 },
];

export const OFFICE_CANTEEN_FOODS: FoodItem[] = [
  { id: 'fd_canteen_veg_thali', name: 'Veg Thali', servingSize: 'plate', calories: 520, protein: 16, carbs: 72, fat: 16, fiber: 9, sodium: 740 },
  { id: 'fd_canteen_chicken_rice', name: 'Chicken Curry + Rice', servingSize: 'plate', calories: 610, protein: 32, carbs: 68, fat: 22, fiber: 4, sodium: 820 },
  { id: 'fd_canteen_dal_roti', name: 'Dal + Roti', servingSize: 'plate', calories: 380, protein: 14, carbs: 58, fat: 9, fiber: 8, sodium: 540 },
  { id: 'fd_canteen_egg_curry', name: 'Egg Curry Meal', servingSize: 'plate', calories: 450, protein: 20, carbs: 48, fat: 18, fiber: 4, sodium: 610 },
];

export const ZOMATO_FOODS: FoodItem[] = [
  { id: 'fd_zomato_butter_chicken', name: 'Butter Chicken Bowl', servingSize: 'bowl', calories: 720, protein: 34, carbs: 62, fat: 36, fiber: 4, sodium: 980 },
  { id: 'fd_zomato_biryani', name: 'Chicken Biryani', servingSize: 'plate', calories: 680, protein: 28, carbs: 78, fat: 26, fiber: 3, sodium: 890 },
  { id: 'fd_zomato_masala_dosa', name: 'Masala Dosa', servingSize: 'plate', calories: 350, protein: 8, carbs: 52, fat: 12, fiber: 4, sodium: 620 },
  { id: 'fd_zomato_paneer_wrap', name: 'Paneer Tikka Wrap', servingSize: 'wrap', calories: 480, protein: 18, carbs: 46, fat: 24, fiber: 4, sodium: 710 },
];

export const LOG_FOOD_CATALOG: FoodItem[] = [
  ...ALL_SAMPLE_FOODS,
  ...AT_HOME_FOODS,
  ...OFFICE_CANTEEN_FOODS,
  ...ZOMATO_FOODS,
];

export function mergeFoodCatalog(base: FoodItem[]): FoodItem[] {
  const ids = new Set(base.map((f) => f.id));
  return [...base, ...LOG_FOOD_CATALOG.filter((f) => !ids.has(f.id))];
}
