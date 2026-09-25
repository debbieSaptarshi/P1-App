import { dishById, matchCampusFood, scaleFromCatalog } from './match';
import { OUTLET_BY_ID } from './outlets';
import type { CampusDish, MatchMethod } from './types';

export const FOOD_CONTEXTS = ['home', 'restaurant', 'unknown', 'mess', 'canteen', 'hostel_room', 'delivery'] as const;
export type FoodContext = (typeof FOOD_CONTEXTS)[number];
export const MISSING_INPUTS = ['portion', 'oil', 'context', 'ingredients'] as const;
export type MissingInput = (typeof MISSING_INPUTS)[number];

const OIL_KCAL = 40;
const CATALOG_SCORE_MIN = 8;
const RESTAURANT_CONTEXTS: FoodContext[] = ['restaurant', 'delivery'];

export interface EstimateFood {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  confidence?: number;
  catalogId?: string;
  outletId?: string;
  portionGrams?: number;
  oilTsp?: number;
  matchMethod?: MatchMethod;
}

export interface MealCorrections {
  context?: FoodContext;
  /** Explicit extra oil, including 0. Omit when the user has not answered. */
  extraOilTsp?: number;
  /** 1 = detected portion. */
  portionScale?: number;
  portionConfirmed?: boolean;
}

export interface GroundedFood extends EstimateFood {
  caloriesLow: number;
  caloriesHigh: number;
  fiber: number;
  sodium: number;
  confidence: number;
  portionGrams: number;
  oilTsp: number;
  matchMethod: MatchMethod;
  assumptions: string[];
  missingInputs: MissingInput[];
}

export interface GroundedMeal {
  foods: GroundedFood[];
  calories: number;
  caloriesLow: number;
  caloriesHigh: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  assumptions: string[];
  missingInputs: MissingInput[];
  warnings: string[];
  contextGuess?: FoodContext;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundKcal(value: number) {
  return Math.max(0, Math.round(value));
}

function roundMacro(value: number) {
  return Math.max(0, Math.round(value * 10) / 10);
}

function isContext(value: string): value is FoodContext {
  return (FOOD_CONTEXTS as readonly string[]).includes(value);
}

export function parseCorrectionToken(id: string): Pick<MealCorrections, 'context' | 'extraOilTsp'> | null {
  if (id.startsWith('ctx:')) {
    const context = id.slice(4);
    if (isContext(context) && context !== 'unknown') return { context };
    return null;
  }
  if (id.startsWith('oil:')) {
    const extraOilTsp = Number(id.slice(4));
    if (extraOilTsp === 0 || extraOilTsp === 1 || extraOilTsp === 2) return { extraOilTsp };
  }
  return null;
}

export function resolveCatalogDish(food: EstimateFood): CampusDish | undefined {
  if (food.catalogId) {
    const dish = dishById(food.catalogId);
    if (dish) return dish;
  }
  const rows = matchCampusFood({ text: food.name, outletId: food.outletId, limit: 3 });
  if ((rows[0]?.score ?? 0) >= CATALOG_SCORE_MIN) return rows[0];
  return undefined;
}

function contextFromOutlet(outletId?: string): FoodContext | undefined {
  const kind = outletId ? OUTLET_BY_ID.get(outletId)?.kind : undefined;
  if (kind === 'mess') return 'mess';
  if (kind === 'canteen') return 'canteen';
  if (kind === 'restaurant') return 'restaurant';
  return undefined;
}

function bandFor(method: MatchMethod, portionKnown: boolean, portionConfirmed: boolean) {
  if (method === 'label') return 0.08;
  if (method === 'catalog') {
    if (portionConfirmed) return 0.1;
    if (portionKnown) return 0.18;
    return 0.28;
  }
  return 0.32;
}

function hiddenOilTsp(context: FoodContext | undefined, extraOilTsp: number | undefined) {
  if (extraOilTsp !== undefined) return 0;
  if (context && RESTAURANT_CONTEXTS.includes(context)) return 2;
  if (context === 'home' || context === 'hostel_room') return 1;
  return 0;
}

export function groundFood(food: EstimateFood, corrections: MealCorrections = {}): GroundedFood {
  const scale = corrections.portionScale && corrections.portionScale > 0 ? corrections.portionScale : 1;
  const dish = food.matchMethod === 'label' ? undefined : resolveCatalogDish(food);
  const method: MatchMethod = dish ? 'catalog' : food.matchMethod === 'label' ? 'label' : food.matchMethod === 'text' ? 'text' : 'visual';
  const assumptions: string[] = [];
  const missing: MissingInput[] = [];
  const detectedGrams = food.portionGrams && food.portionGrams > 0 ? food.portionGrams : dish?.servingGrams;
  const portionGrams = Math.max(1, Math.round((detectedGrams ?? dish?.servingGrams ?? 150) * scale));
  const detectedOil = Math.max(0, food.oilTsp ?? 0);
  const extraOil = Math.max(0, corrections.extraOilTsp ?? 0);
  const oilTsp = detectedOil + extraOil;

  let calories: number;
  let protein: number;
  let carbs: number;
  let fat: number;
  let fiber: number;
  let sodium: number;
  let servingSize: string;
  let catalogId = food.catalogId;
  let outletId = food.outletId;
  let confidence = clamp(food.confidence || 0.5, 0, 1);

  if (dish) {
    const scaled = scaleFromCatalog(dish, portionGrams, oilTsp);
    calories = scaled.calories;
    protein = scaled.protein;
    carbs = scaled.carbs;
    fat = scaled.fat;
    fiber = scaled.fiber;
    sodium = scaled.sodium;
    servingSize = scaled.servingSize;
    catalogId = dish.id;
    outletId = dish.outletId;
    confidence = clamp(Math.min(confidence || 0.7, corrections.portionConfirmed ? 0.9 : detectedGrams ? 0.85 : 0.6), 0, 1);
    assumptions.push(`Calories scaled from campus catalog (${dish.name}), not guessed from the photo.`);
    if (!food.portionGrams) {
      missing.push('portion');
      assumptions.push(`Portion defaulted to catalog serving (${dish.servingSize}).`);
    }
  } else {
    const visualScale = food.portionGrams && food.portionGrams > 0 ? portionGrams / food.portionGrams : scale;
    calories = roundKcal(food.calories * visualScale + extraOil * OIL_KCAL);
    protein = roundMacro(food.protein * visualScale);
    carbs = roundMacro(food.carbs * visualScale);
    fat = roundMacro(food.fat * visualScale + extraOil * 4.5);
    fiber = roundMacro((food.fiber ?? 0) * visualScale);
    sodium = roundKcal((food.sodium ?? 0) * visualScale);
    servingSize = `${portionGrams} g / ${food.servingSize}`;
    confidence = clamp(Math.min(confidence, 0.5), 0, 1);
    missing.push('ingredients');
    if (!food.portionGrams) missing.push('portion');
    assumptions.push('No campus catalog row matched. Macros are a visual estimate — confirm ingredients if you can.');
  }

  if (!corrections.context) missing.push('context');
  if (corrections.extraOilTsp === undefined) missing.push('oil');

  const band = bandFor(method, Boolean(food.portionGrams), Boolean(corrections.portionConfirmed));
  const hidden = hiddenOilTsp(corrections.context, corrections.extraOilTsp);
  const caloriesLow = roundKcal(calories * (1 - band));
  const caloriesHigh = roundKcal(calories * (1 + band) + hidden * OIL_KCAL);
  if (hidden) assumptions.push('Upper range includes likely hidden oil or ghee until you confirm.');
  if (corrections.extraOilTsp) assumptions.push(`Added ${corrections.extraOilTsp} tsp extra oil/ghee (${corrections.extraOilTsp * OIL_KCAL} kcal).`);

  return {
    name: dish?.name ?? food.name,
    servingSize,
    calories,
    caloriesLow: Math.min(caloriesLow, calories),
    caloriesHigh: Math.max(caloriesHigh, calories),
    protein,
    carbs,
    fat,
    fiber,
    sodium,
    confidence,
    catalogId,
    outletId,
    portionGrams,
    oilTsp,
    matchMethod: method,
    assumptions,
    missingInputs: [...new Set(missing)],
  };
}

export function groundMeal(foods: EstimateFood[], corrections: MealCorrections = {}): GroundedMeal {
  const oiliest = foods.reduce((best, row, index) => (row.fat > (foods[best]?.fat ?? -1) ? index : best), 0);
  const grounded = foods.map((food, index) =>
    groundFood(food, {
      ...corrections,
      extraOilTsp: corrections.extraOilTsp === undefined ? undefined : index === oiliest ? corrections.extraOilTsp : 0,
    }),
  );
  const cataloged = grounded.find((food) => food.matchMethod === 'catalog');
  const contextGuess = corrections.context ?? contextFromOutlet(cataloged?.outletId);
  const warnings: string[] = [];
  if (grounded.some((food) => food.matchMethod === 'catalog')) {
    warnings.push('Calories are scaled from the IIT Bombay campus catalog. They are still estimates — confirm portion and oil.');
  }
  if (grounded.some((food) => food.matchMethod === 'visual' || food.matchMethod === 'text')) {
    warnings.push('At least one item is a visual estimate, not a catalog row. Treat the range as the honest number.');
  }
  return {
    foods: grounded,
    calories: roundKcal(grounded.reduce((sum, food) => sum + food.calories, 0)),
    caloriesLow: roundKcal(grounded.reduce((sum, food) => sum + food.caloriesLow, 0)),
    caloriesHigh: roundKcal(grounded.reduce((sum, food) => sum + food.caloriesHigh, 0)),
    protein: roundMacro(grounded.reduce((sum, food) => sum + food.protein, 0)),
    carbs: roundMacro(grounded.reduce((sum, food) => sum + food.carbs, 0)),
    fat: roundMacro(grounded.reduce((sum, food) => sum + food.fat, 0)),
    fiber: roundMacro(grounded.reduce((sum, food) => sum + food.fiber, 0)),
    sodium: roundKcal(grounded.reduce((sum, food) => sum + food.sodium, 0)),
    assumptions: [...new Set(grounded.flatMap((food) => food.assumptions))].slice(0, 20),
    missingInputs: [...new Set(grounded.flatMap((food) => food.missingInputs))].slice(0, 10),
    warnings: warnings.slice(0, 8),
    contextGuess,
  };
}
