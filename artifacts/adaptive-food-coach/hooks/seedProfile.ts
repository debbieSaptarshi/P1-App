/**
 * In-memory seed data used by the global store before AsyncStorage hydrates.
 * Mirrors the Figma sample data for the Adaptive Food Coach app.
 */

import type {
  AccountabilityGroup,
  Challenge,
  DailyFoodLog,
  ExerciseLog,
  FoodItem,
  GroupPost,
  LeaderboardEntry,
  MealRecipe,
  MilestoneBadge,
  SavedFood,
  UserProfile,
  WeightEntry,
} from '@/types';

export const seedProfile: UserProfile = {
  id: 'usr_demo',
  name: 'Mike Wheeler',
  email: '[email protected]',
  avatar: undefined,
  gender: 'male',
  dateOfBirth: '1995-04-12',
  heightCm: 160,
  currentWeightKg: 65.5,
  targetWeightKg: 60,
  workoutFrequency: '3_4_per_week',
  goals: ['maintain_weight', 'improve_health'],
  dietPattern: 'omnivore',
  allergies: ['peanut'],
  dailyStepGoal: 8000,
  nutrientGoals: {
    calories: 2100,
    protein: 140,
    carbs: 220,
    fat: 70,
    fiber: 30,
    sodium: 2300,
    waterMl: 2500,
  },
  units: { weight: 'kg', height: 'cm' },
  createdAt: '2025-09-01T00:00:00.000Z',
  updatedAt: '2025-09-15T12:00:00.000Z',
};
