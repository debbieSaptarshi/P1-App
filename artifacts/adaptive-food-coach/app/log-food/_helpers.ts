// Helpers used by the log-food screens to round, format, and lookup data
// from the global store. Kept colocated with the screens that need them.

import type { DailyFoodLog, FoodItem, MealRecipe, MealType, SavedFood } from '@/types';

/** Round a number to 1 decimal place, returning a number. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Round a number to the nearest integer. */
export function roundInt(n: number): number {
  return Math.round(n);
}

/**
 * Find the entry's owner day log by entryId across every DailyFoodLog
 * the user has ever written. Returns `null` if the entry can't be
 * located (e.g. AsyncStorage was cleared between sessions).
 */
export function findFoodLogEntry(
  foodLogs: DailyFoodLog[],
  entryId: string,
): { date: string; entryIndex: number; daily: DailyFoodLog } | null {
  for (const daily of foodLogs) {
    const idx = daily.entries.findIndex((e) => e.id === entryId);
    if (idx >= 0) {
      return { date: daily.date, entryIndex: idx, daily };
    }
  }
  return null;
}

/**
 * Heuristic bucket key for the categorize chips on the food search
 * home. Pure function — derived from the FoodItem so the user can
 * collapse results without us maintaining a separate taxonomy.
 */
export type FoodCategory = 'protein' | 'grain' | 'fruit' | 'dairy' | 'vegetable' | 'fat' | 'other';

export function foodCategory(food: FoodItem): FoodCategory {
  const n = food.name.toLowerCase();
  if (
    n.includes('chicken') ||
    n.includes('beef') ||
    n.includes('salmon') ||
    n.includes('tuna') ||
    n.includes('egg')
  ) {
    return 'protein';
  }
  if (n.includes('rice') || n.includes('oat') || n.includes('bread') || n.includes('pasta')) {
    return 'grain';
  }
  if (
    n.includes('berry') ||
    n.includes('berries') ||
    n.includes('banana') ||
    n.includes('apple') ||
    n.includes('fruit')
  ) {
    return 'fruit';
  }
  if (n.includes('yogurt') || n.includes('milk') || n.includes('cheese')) {
    return 'dairy';
  }
  if (n.includes('spinach') || n.includes('kale') || n.includes('broccoli') || n.includes('veg')) {
    return 'vegetable';
  }
  if (n.includes('oil') || n.includes('avocado') || n.includes('almond') || n.includes('nut')) {
    return 'fat';
  }
  return 'other';
}

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  protein: 'Protein',
  grain: 'Grains',
  fruit: 'Fruit',
  dairy: 'Dairy',
  vegetable: 'Vegetables',
  fat: 'Fats',
  other: 'Other',
};

/** Meal-type display metadata used across the food log flows. */
export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

interface CustomMacroPayload {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  servingSize?: string;
  brand?: string;
}

function parseSavedMacros(notes: string | undefined): CustomMacroPayload | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as CustomMacroPayload;
    if (typeof parsed.calories === 'number') return parsed;
  } catch {
    return null;
  }
  return null;
}

/** Flatten a bookmarked food into a catalog-shaped row for the Saved Foods tab. */
export function savedFoodToFoodItem(item: SavedFood): FoodItem {
  const macros = parseSavedMacros(item.notes);
  return {
    id: item.ingredients[0]?.foodId ?? item.id,
    name: item.name,
    servingSize: macros?.servingSize ?? '1 serving',
    calories: macros?.calories ?? item.calories,
    protein: macros?.protein ?? 0,
    carbs: macros?.carbs ?? 0,
    fat: macros?.fat ?? 0,
    fiber: macros?.fiber,
    sodium: macros?.sodium,
    brand: macros?.brand,
  };
}

export function recipeToFoodItem(recipe: MealRecipe): FoodItem {
  return {
    id: recipe.id,
    name: recipe.name,
    servingSize: `${recipe.servings} serving${recipe.servings === 1 ? '' : 's'}`,
    calories: recipe.totalCalories,
    protein: recipe.totalProtein,
    carbs: recipe.totalCarbs,
    fat: recipe.totalFat,
  };
}
