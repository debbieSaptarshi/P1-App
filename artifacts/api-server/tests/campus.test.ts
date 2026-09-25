import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAMPUS_DISHES, CAMPUS_OUTLETS, dishById, matchCampusFood, scaleFromCatalog, groundMeal, parseCorrectionToken } from '@workspace/campus-food';

test('every hostel has a mess outlet and dishes are cloned onto each mess', () => {
  const messes = CAMPUS_OUTLETS.filter((outlet) => outlet.kind === 'mess');
  assert.equal(messes.length, 19);
  assert.ok(CAMPUS_DISHES.some((dish) => dish.id === 'poha-h14'));
  assert.ok(CAMPUS_DISHES.some((dish) => dish.outletId === 'canteen-h2' && dish.source === 'scraped'));
  assert.ok(CAMPUS_DISHES.some((dish) => dish.outletId === 'canteen-aroma' && dish.name.includes('Paneer cheese')));
  assert.ok(CAMPUS_DISHES.some((dish) => dish.outletId === 'canteen-amul-h14'));
  assert.ok(CAMPUS_OUTLETS.some((outlet) => outlet.id === 'rest-laxmi' && outlet.priority === 3));
});

test('matching prefers H2 canteen franky over a generic name when the query is local', () => {
  const rows = matchCampusFood({ text: 'veg cheese franky', hostel: 'H2', limit: 5 });
  assert.ok(rows[0]?.outletId === 'canteen-h2');
  const poha = matchCampusFood({ text: 'kanda poha', hostel: 'H7', mealSlot: 'breakfast', limit: 3 });
  assert.equal(poha[0]?.outletId, 'mess-h7');
});

test('photo matching without a caption still includes canteen and nearby dishes', () => {
  const rows = matchCampusFood({ mealSlot: 'snack', limit: 24 });
  const kinds = new Set(rows.map((row) => row.priority));
  assert.ok(kinds.has(1));
  assert.ok(kinds.has(2));
  assert.ok(kinds.has(3));
  assert.ok(rows.some((row) => row.outletId === 'canteen-h2' || row.outletId === 'canteen-aroma'));
  assert.ok(rows.some((row) => row.priority === 3));
});

test('catalog scaling uses portion grams and extra oil instead of the model calorie guess', () => {
  const dish = dishById('poha-h7');
  assert.ok(dish);
  const scaled = scaleFromCatalog(dish, dish.servingGrams * 2, 1);
  assert.equal(scaled.calories, dish.calories * 2 + 40);
  assert.ok(scaled.protein > dish.protein);
});

test('grounding replaces model calories with catalog values and a range', () => {
  const dish = dishById('poha-h7');
  assert.ok(dish);
  const meal = groundMeal([{
    name: 'mystery poha', servingSize: '1 plate', calories: 9999, protein: 1, carbs: 1, fat: 1, fiber: 0, sodium: 0,
    confidence: 0.9, catalogId: 'poha-h7', portionGrams: dish.servingGrams, oilTsp: 0, matchMethod: 'catalog',
  }]);
  assert.equal(meal.foods[0]?.calories, dish.calories);
  assert.equal(meal.foods[0]?.matchMethod, 'catalog');
  assert.ok(meal.caloriesLow < meal.calories);
  assert.ok(meal.caloriesHigh > meal.calories);
  assert.ok(meal.missingInputs.includes('oil'));
  assert.ok(meal.missingInputs.includes('context'));
});

test('restaurant context widens the high end until oil is confirmed', () => {
  const base = {
    name: 'Dal tadka', servingSize: '1 katori', calories: 200, protein: 8, carbs: 18, fat: 5, fiber: 4, sodium: 480,
    confidence: 0.8, portionGrams: 150,
  };
  const open = groundMeal([base], { context: 'restaurant' });
  const confirmed = groundMeal([base], { context: 'restaurant', extraOilTsp: 0, portionConfirmed: true });
  assert.ok(open.caloriesHigh - open.calories > confirmed.caloriesHigh - confirmed.calories);
  assert.equal(confirmed.foods[0]?.matchMethod, 'catalog');
});

test('confirmed extra oil adds 40 kcal per teaspoon on the fattiest item', () => {
  const rice = dishById('plain-rice-h7');
  const chicken = dishById('chicken-curry-h7');
  assert.ok(rice && chicken);
  const none = groundMeal([
    { name: rice.name, servingSize: rice.servingSize, ...rice, confidence: 0.8, catalogId: rice.id, portionGrams: rice.servingGrams, oilTsp: 0, matchMethod: 'catalog' },
    { name: chicken.name, servingSize: chicken.servingSize, ...chicken, confidence: 0.8, catalogId: chicken.id, portionGrams: chicken.servingGrams, oilTsp: 0, matchMethod: 'catalog' },
  ], { context: 'mess', extraOilTsp: 0 });
  const extra = groundMeal([
    { name: rice.name, servingSize: rice.servingSize, ...rice, confidence: 0.8, catalogId: rice.id, portionGrams: rice.servingGrams, oilTsp: 0, matchMethod: 'catalog' },
    { name: chicken.name, servingSize: chicken.servingSize, ...chicken, confidence: 0.8, catalogId: chicken.id, portionGrams: chicken.servingGrams, oilTsp: 0, matchMethod: 'catalog' },
  ], { context: 'mess', extraOilTsp: 2 });
  assert.equal(extra.calories, none.calories + 80);
});

test('correction tokens parse WhatsApp button ids', () => {
  assert.deepEqual(parseCorrectionToken('ctx:home'), { context: 'home' });
  assert.deepEqual(parseCorrectionToken('oil:2'), { extraOilTsp: 2 });
  assert.equal(parseCorrectionToken('who:alice'), null);
});
