/**
 * Seed logs: today's food log, exercise logs, weight history.
 */

import type { DailyFoodLog, ExerciseLog, WeightEntry } from '@/types';
import { seedFoodDatabase } from './seedFoodDatabase';

const todayIso = new Date().toISOString().slice(0, 10);
const foodById = (id: string) => {
  const found = seedFoodDatabase.find((f) => f.id === id);
  if (!found) throw new Error(`Missing seed food ${id}`);
  return found;
};

export const seedFoodLogs: DailyFoodLog[] = [
  {
    date: todayIso,
    entries: [
      {
        id: 'fdl_1',
        date: todayIso,
        mealType: 'breakfast',
        food: foodById('fd_greek_yogurt'),
        quantity: 1,
        loggedAt: `${todayIso}T08:30:00.000Z`,
      },
      {
        id: 'fdl_2',
        date: todayIso,
        mealType: 'breakfast',
        food: foodById('fd_blueberries'),
        quantity: 1,
        loggedAt: `${todayIso}T08:31:00.000Z`,
      },
      {
        id: 'fdl_3',
        date: todayIso,
        mealType: 'lunch',
        food: foodById('fd_chicken_breast'),
        quantity: 1.5,
        loggedAt: `${todayIso}T12:45:00.000Z`,
      },
      {
        id: 'fdl_4',
        date: todayIso,
        mealType: 'lunch',
        food: foodById('fd_brown_rice'),
        quantity: 1,
        loggedAt: `${todayIso}T12:46:00.000Z`,
      },
    ],
    totals: {
      calories: 100 + 57 + 165 * 1.5 + 111,
      protein: 17 + 0.7 + 31 * 1.5 + 2.6,
      carbs: 6 + 14 + 0 * 1.5 + 23,
      fat: 0.7 + 0.3 + 3.6 * 1.5 + 0.9,
      fiber: 0 + 2.4 + 0 + 1.8,
      sodium: 61 + 1 + 74 * 1.5 + 5,
    },
  },
];

export const seedExerciseLogs: ExerciseLog[] = [
  { id: 'ex_1', date: todayIso, type: 'running', durationMinutes: 32, distanceKm: 5.2, pace: "6'10\"/km", caloriesBurned: 410 },
  { id: 'ex_2', date: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10), type: 'strength', durationMinutes: 45, caloriesBurned: 320 },
  { id: 'ex_3', date: new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10), type: 'cycling', durationMinutes: 55, distanceKm: 18, caloriesBurned: 480 },
];

export const seedWeightHistory: WeightEntry[] = (() => {
  const entries: WeightEntry[] = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const weight = 78.4 - i * 0.08;
    entries.push({ id: `wh_${i}`, date, weightKg: parseFloat(weight.toFixed(1)) });
  }
  return entries;
})();
