/**
 * Demo logs for Progress: a full month of meals/workouts and 90 days of
 * weigh-ins, aligned with the Figma Progress sample (start 70 kg → ~65.5 kg,
 * goal 60 kg, ~1,314 kcal days, weekly burn ~614).
 */

import type { DailyFoodLog, ExerciseLog, ExerciseType, FoodLogEntry, WeightEntry } from '@/types';
import { seedFoodDatabase } from './seedFoodDatabase';

function daysAgoIso(daysAgo: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

const foodById = (id: string) => {
  const found = seedFoodDatabase.find((f) => f.id === id);
  if (!found) throw new Error(`Missing seed food ${id}`);
  return found;
};

function totalsFor(entries: FoodLogEntry[]): DailyFoodLog['totals'] {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 };
  for (const entry of entries) {
    totals.calories += entry.food.calories * entry.quantity;
    totals.protein += entry.food.protein * entry.quantity;
    totals.carbs += entry.food.carbs * entry.quantity;
    totals.fat += entry.food.fat * entry.quantity;
    totals.fiber += (entry.food.fiber ?? 0) * entry.quantity;
    totals.sodium += (entry.food.sodium ?? 0) * entry.quantity;
  }
  return totals;
}

function mealDay(
  daysAgo: number,
  plates: { foodId: string; quantity: number; mealType: FoodLogEntry['mealType'] }[],
): DailyFoodLog {
  const date = daysAgoIso(daysAgo);
  const entries: FoodLogEntry[] = plates.map((plate, index) => ({
    id: `fdl_${date}_${index}`,
    date,
    mealType: plate.mealType,
    food: foodById(plate.foodId),
    quantity: plate.quantity,
    loggedAt: `${date}T${12 + index}:10:00.000Z`,
  }));
  return { date, entries, totals: totalsFor(entries) };
}

/** Same plate shape every day, with a small quantity multiplier for variety. */
const BASE_PLATE: { foodId: string; quantity: number; mealType: FoodLogEntry['mealType'] }[] = [
  { foodId: 'fd_greek_yogurt', quantity: 1, mealType: 'breakfast' },
  { foodId: 'fd_blueberries', quantity: 1, mealType: 'breakfast' },
  { foodId: 'fd_oats', quantity: 1, mealType: 'breakfast' },
  { foodId: 'fd_chicken_breast', quantity: 1.5, mealType: 'lunch' },
  { foodId: 'fd_brown_rice', quantity: 1.2, mealType: 'lunch' },
  { foodId: 'fd_spinach', quantity: 1, mealType: 'lunch' },
  { foodId: 'fd_salmon', quantity: 1, mealType: 'dinner' },
  { foodId: 'fd_avocado', quantity: 0.8, mealType: 'dinner' },
  { foodId: 'fd_banana', quantity: 1, mealType: 'snack' },
  { foodId: 'fd_almonds', quantity: 0.5, mealType: 'snack' },
];

const DAY_MULTIPLIERS = [
  0.92, 1.02, 1.08, 1.0, 0.96, 1.12, 0.98, // this week → ~1,314 kcal avg
  0.88, 0.94, 1.05, 0.9, 1.1, 0.97, 0.93,
  0.86, 1.0, 1.06, 0.91, 0.99, 1.08, 0.95,
  0.84, 0.97, 1.04, 0.89, 1.01, 1.07, 0.92,
];

export const seedFoodLogs: DailyFoodLog[] = DAY_MULTIPLIERS.map((multiplier, daysAgo) => {
  const day = mealDay(
    daysAgo,
    BASE_PLATE.map((plate) => ({
      ...plate,
      quantity: parseFloat((plate.quantity * multiplier).toFixed(2)),
    })),
  );
  if (daysAgo === 0) day.waterMl = 250;
  return day;
});

const WORKOUTS: { type: ExerciseType; minutes: number; km?: number; kcal: number }[] = [
  { type: 'running', minutes: 32, km: 5.2, kcal: 90 },
  { type: 'walking', minutes: 40, km: 3.1, kcal: 80 },
  { type: 'strength', minutes: 45, kcal: 110 },
  { type: 'yoga', minutes: 30, kcal: 70 },
  { type: 'cycling', minutes: 40, km: 12, kcal: 120 },
  { type: 'hiit', minutes: 22, kcal: 84 },
  { type: 'walking', minutes: 28, km: 2.4, kcal: 60 },
];

export const seedExerciseLogs: ExerciseLog[] = Array.from({ length: 28 }, (_, daysAgo) => {
  const workout = WORKOUTS[daysAgo % WORKOUTS.length]!;
  const date = daysAgoIso(daysAgo);
  return {
    id: `ex_${date}`,
    date,
    type: workout.type,
    durationMinutes: workout.minutes,
    distanceKm: workout.km,
    pace: workout.km ? "6'10\"/km" : undefined,
    caloriesBurned: workout.kcal,
  };
});

export const seedWeightHistory: WeightEntry[] = (() => {
  const entries: WeightEntry[] = [];
  const startKg = 70;
  const currentKg = 65.5;
  const span = 90;
  for (let i = span - 1; i >= 0; i--) {
    const t = (span - 1 - i) / (span - 1);
    const wobble = Math.sin(i / 4.5) * 0.18;
    const weightKg = parseFloat((startKg + (currentKg - startKg) * t + wobble).toFixed(2));
    entries.push({
      id: `wh_${i}`,
      date: daysAgoIso(i),
      weightKg,
    });
  }
  return entries;
})();
