/**
 * App-wide type definitions shared across the Adaptive Food Coach app.
 */

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type WorkoutFrequency =
  | 'never'
  | 'rarely'
  | '1_2_per_week'
  | '3_4_per_week'
  | '5_plus_per_week';

export type DietPattern =
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'mediterranean'
  | 'custom';

export type Goal =
  | 'lose_weight'
  | 'maintain_weight'
  | 'gain_muscle'
  | 'improve_health'
  | 'manage_condition';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ExerciseType =
  | 'walking'
  | 'running'
  | 'cycling'
  | 'strength'
  | 'yoga'
  | 'swimming'
  | 'hiit'
  | 'other';

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  gender: Gender;
  dateOfBirth: string; // ISO date
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  workoutFrequency: WorkoutFrequency;
  goals: Goal[];
  dietPattern: DietPattern;
  allergies: string[];
  dailyStepGoal: number;
  nutrientGoals: NutrientGoals;
  units: { weight: 'kg' | 'lb'; height: 'cm' | 'ft' };
  createdAt: string;
  updatedAt: string;
}

export interface NutrientGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  waterMl: number;
}

export interface OnboardingState {
  stepIndex: number;
  totalSteps: number;
  answers: Record<string, string | string[] | number>;
  generating: boolean;
  complete: boolean;
}

export interface FoodItem {
  source?: 'manual' | 'ai' | 'barcode' | 'catalog';
  analysisId?: string;
  confidence?: number;
  warnings?: string[];
  id: string;
  name: string;
  brand?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  image?: string;
}

export interface FoodLogEntry {
  id: string;
  date: string; // ISO date
  mealType: MealType;
  food: FoodItem;
  quantity: number;
  loggedAt: string;
}

export interface DailyFoodLog {
  date: string;
  entries: FoodLogEntry[];
  waterMl?: number;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
}

export interface SavedFood {
  id: string;
  name: string;
  notes?: string;
  ingredients: { foodId: string; quantity: number }[];
  calories: number;
  createdAt: string;
}

export interface MealRecipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  ingredients: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
}

export interface ExerciseLog {
  id: string;
  date: string;
  type: ExerciseType;
  durationMinutes: number;
  distanceKm?: number;
  pace?: string;
  caloriesBurned: number;
  notes?: string;
}

export interface RunSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  distanceKm: number;
  currentPaceSec: number;
  durationSec: number;
  caloriesBurned: number;
  active: boolean;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  note?: string;
}

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'streak' | 'nutrition' | 'exercise' | 'community';
  progress: number; // 0..1
  unlocked: boolean;
  unlockedAt?: string;
  iconKey: string;
  face?: {
    kind: 'streak' | 'number' | 'icon' | 'kg' | 'day';
    value: string;
    unit?: string;
  };
}

export interface GroupPost {
  authorId?: string;
  id: string;
  groupId: string;
  authorName: string;
  authorAvatar?: string;
  body: string;
  imageUrl?: string;
  createdAt: string;
  reactions: number;
  comments: number;
  liked?: boolean;
}

export interface AccountabilityGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  cover?: string;
  joined: boolean;
  category: 'weight_loss' | 'nutrition' | 'exercise' | 'general';
  unreadCount?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar?: string;
  score: number; // kcal, streak, etc.
  highlight?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  daysRemaining: number;
  reward: string;
  joined: boolean;
}

export interface HealthSignal {
  id: string;
  date: string;
  weightKg?: number;
  restingHeartRate?: number;
  sleepHours?: number;
  energyLevel?: number; // 1..10
}
