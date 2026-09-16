/**
 * Global app store backed by React state and persisted via AsyncStorage.
 * Mirrors the Figma "Light Mode" sample data and exposes typed actions for
 * the screens implemented by the four parallel child agents.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccountabilityGroup,
  Challenge,
  DailyFoodLog,
  ExerciseLog,
  ExerciseType,
  FoodItem,
  FoodLogEntry,
  GroupPost,
  LeaderboardEntry,
  MealRecipe,
  MealType,
  MilestoneBadge,
  OnboardingState,
  RunSession,
  SavedFood,
  UserProfile,
  WeightEntry,
} from '@/types';
import { seedProfile } from './seedProfile';
import { seedFoodDatabase } from './seedFoodDatabase';
import { seedFoodLogs, seedExerciseLogs, seedWeightHistory } from './seedLogs';
import {
  seedChallenges,
  seedGroups,
  seedGroupPosts,
  seedLeaderboard,
  seedMealRecipes,
  seedMilestones,
  seedSavedFoods,
} from './seedContent';

const STORAGE_KEY = '@adaptive_food_coach/v1';

interface PersistedState {
  profile: UserProfile;
  onboarding: OnboardingState;
  foodDatabase: FoodItem[];
  foodLogs: DailyFoodLog[];
  savedFoods: SavedFood[];
  mealRecipes: MealRecipe[];
  exerciseLogs: ExerciseLog[];
  weightHistory: WeightEntry[];
  milestones: MilestoneBadge[];
  groups: AccountabilityGroup[];
  groupPosts: GroupPost[];
  leaderboard: LeaderboardEntry[];
  challenges: Challenge[];
}

const initialState: PersistedState = {
  profile: seedProfile,
  onboarding: {
    stepIndex: 0,
    totalSteps: 10,
    answers: {},
    generating: false,
    complete: false,
  },
  foodDatabase: seedFoodDatabase,
  foodLogs: seedFoodLogs,
  savedFoods: seedSavedFoods,
  mealRecipes: seedMealRecipes,
  exerciseLogs: seedExerciseLogs,
  weightHistory: seedWeightHistory,
  milestones: seedMilestones,
  groups: seedGroups,
  groupPosts: seedGroupPosts,
  leaderboard: seedLeaderboard,
  challenges: seedChallenges,
};

let singletonState: PersistedState = initialState;
const subscribers = new Set<() => void>();
let hydrated = false;

function notify() {
  for (const cb of subscribers) cb();
}

async function hydrate() {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      singletonState = { ...initialState, ...parsed };
    } else {
      singletonState = initialState;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(singletonState));
    }
  } catch (err) {
    if (__DEV__) {
      console.warn('Failed to hydrate store', err);
    }
    singletonState = initialState;
  } finally {
    hydrated = true;
    notify();
  }
}

async function persist(next: PersistedState) {
  singletonState = next;
  notify();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    if (__DEV__) {
      console.warn('Failed to persist store', err);
    }
  }
}

void hydrate();

function update(patch: Partial<PersistedState>) {
  return persist({ ...singletonState, ...patch });
}

// ---- Public actions ----

export const appStoreActions = {
  reset() {
    return persist(initialState);
  },
  setProfile(profile: UserProfile) {
    return update({ profile });
  },
  updateProfile(patch: Partial<UserProfile>) {
    return update({ profile: { ...singletonState.profile, ...patch } });
  },
  startOnboarding() {
    return update({
      onboarding: { ...initialState.onboarding, stepIndex: 0 },
    });
  },
  advanceOnboarding(step: number, answers: OnboardingState['answers']) {
    return update({
      onboarding: {
        ...singletonState.onboarding,
        stepIndex: step,
        answers: { ...singletonState.onboarding.answers, ...answers },
      },
    });
  },
  completeOnboarding(answers: OnboardingState['answers']) {
    const profile: UserProfile = {
      ...singletonState.profile,
      updatedAt: new Date().toISOString(),
    };
    if (typeof answers.gender === 'string') profile.gender = answers.gender as UserProfile['gender'];
    if (typeof answers.workout === 'string') profile.workoutFrequency = answers.workout as UserProfile['workoutFrequency'];
    if (typeof answers.height === 'number') profile.heightCm = answers.height;
    if (typeof answers.weight === 'number') profile.currentWeightKg = answers.weight;
    if (typeof answers.targetWeight === 'number') profile.targetWeightKg = answers.targetWeight;
    if (typeof answers.dob === 'string') profile.dateOfBirth = answers.dob;
    if (Array.isArray(answers.goals)) profile.goals = answers.goals as UserProfile['goals'];
    if (typeof answers.diet === 'string') profile.dietPattern = answers.diet as UserProfile['dietPattern'];
    return update({
      onboarding: { ...singletonState.onboarding, complete: true, generating: false, answers },
      profile,
    });
  },
  logFood(entry: Omit<FoodLogEntry, 'id' | 'loggedAt'>) {
    const id = `fdl_${Date.now()}`;
    const loggedAt = new Date().toISOString();
    const newEntry: FoodLogEntry = { id, loggedAt, ...entry };
    const dayLogs = singletonState.foodLogs.filter((d) => d.date !== entry.date);
    const today = singletonState.foodLogs.find((d) => d.date === entry.date);
    const entries = today ? [...today.entries, newEntry] : [newEntry];
    const totals = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0,
    };
    for (const e of entries) {
      totals.calories += e.food.calories * e.quantity;
      totals.protein += e.food.protein * e.quantity;
      totals.carbs += e.food.carbs * e.quantity;
      totals.fat += e.food.fat * e.quantity;
      totals.fiber += (e.food.fiber ?? 0) * e.quantity;
      totals.sodium += (e.food.sodium ?? 0) * e.quantity;
    }
    const next = { date: entry.date, entries, totals };
    const others = singletonState.foodLogs.filter((d) => d.date !== entry.date);
    return update({ foodLogs: [...others, next] });
  },
  deleteFoodLog(date: string, entryId: string) {
    const others = singletonState.foodLogs.filter((d) => d.date !== date);
    const today = singletonState.foodLogs.find((d) => d.date === date);
    if (!today) return update({ foodLogs: others });
    const entries = today.entries.filter((e) => e.id !== entryId);
    const totals = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0,
    };
    for (const e of entries) {
      totals.calories += e.food.calories * e.quantity;
      totals.protein += e.food.protein * e.quantity;
      totals.carbs += e.food.carbs * e.quantity;
      totals.fat += e.food.fat * e.quantity;
      totals.fiber += (e.food.fiber ?? 0) * e.quantity;
      totals.sodium += (e.food.sodium ?? 0) * e.quantity;
    }
    return update({ foodLogs: [...others, { date, entries, totals }] });
  },
  saveFood(saved: SavedFood) {
    return update({ savedFoods: [saved, ...singletonState.savedFoods] });
  },
  deleteSavedFood(id: string) {
    return update({ savedFoods: singletonState.savedFoods.filter((f) => f.id !== id) });
  },
  saveMealRecipe(recipe: MealRecipe) {
    return update({ mealRecipes: [recipe, ...singletonState.mealRecipes] });
  },
  logExercise(entry: Omit<ExerciseLog, 'id'>) {
    return update({
      exerciseLogs: [
        { id: `ex_${Date.now()}`, ...entry },
        ...singletonState.exerciseLogs,
      ],
    });
  },
  addWeight(entry: Omit<WeightEntry, 'id'>) {
    return update({
      weightHistory: [
        { id: `wh_${Date.now()}`, ...entry },
        ...singletonState.weightHistory,
      ],
      profile: { ...singletonState.profile, currentWeightKg: entry.weightKg, updatedAt: new Date().toISOString() },
    });
  },
  unlockMilestone(id: string) {
    return update({
      milestones: singletonState.milestones.map((m) =>
        m.id === id ? { ...m, unlocked: true, progress: 1, unlockedAt: new Date().toISOString() } : m,
      ),
    });
  },
  joinGroup(id: string) {
    return update({
      groups: singletonState.groups.map((g) => (g.id === id ? { ...g, joined: true, members: g.members + 1 } : g)),
    });
  },
  leaveGroup(id: string) {
    return update({
      groups: singletonState.groups.map((g) => (g.id === id ? { ...g, joined: false, members: Math.max(0, g.members - 1) } : g)),
    });
  },
  likePost(id: string) {
    return update({
      groupPosts: singletonState.groupPosts.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, reactions: p.reactions + (p.liked ? -1 : 1) } : p,
      ),
    });
  },
  joinChallenge(id: string) {
    return update({
      challenges: singletonState.challenges.map((c) => (c.id === id ? { ...c, joined: true, participants: c.participants + 1 } : c)),
    });
  },
  setRunSession(session: RunSession | null) {
    return update({
      exerciseLogs: session
        ? [
            { id: session.id, date: session.startedAt.slice(0, 10), type: 'running', durationMinutes: Math.round(session.durationSec / 60), distanceKm: session.distanceKm, caloriesBurned: session.caloriesBurned, pace: paceString(session.currentPaceSec) },
            ...singletonState.exerciseLogs,
          ]
        : singletonState.exerciseLogs,
    });
  },
};

// ---- Hook ----

function paceString(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}'${String(s).padStart(2, '0')}"/km`;
}

export function useAppStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const cb = () => setTick((t) => t + 1);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  const state = useMemo(() => singletonState, [singletonState]);

  const todaysFoodLog = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return state.foodLogs.find((d) => d.date === today) ?? { date: today, entries: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 } };
  }, [state.foodLogs]);

  const streakDays = useMemo(() => {
    const sorted = [...state.foodLogs]
      .filter((d) => d.entries.length > 0)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    let streak = 0;
    let cursor = new Date();
    for (let i = 0; i < 30; i++) {
      const iso = cursor.toISOString().slice(0, 10);
      if (sorted.some((d) => d.date === iso)) streak += 1;
      cursor = new Date(cursor.getTime() - 86_400_000);
    }
    return streak;
  }, [state.foodLogs]);

  const searchFood = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return state.foodDatabase;
      return state.foodDatabase.filter((f) => f.name.toLowerCase().includes(q));
    },
    [state.foodDatabase],
  );

  return {
    hydrated,
    state,
    todaysFoodLog,
    streakDays,
    searchFood,
    actions: appStoreActions,
  };
}

export type { PersistedState };
