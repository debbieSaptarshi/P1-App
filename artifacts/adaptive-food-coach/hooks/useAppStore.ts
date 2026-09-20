import { localDate } from '@/services/dates';
/**
 * Global app store backed by React state and persisted via AsyncStorage.
 * Mirrors the Figma "Light Mode" sample data and exposes typed actions for
 * the screens implemented by the four parallel child agents.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AppState } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { User } from '@supabase/supabase-js';
import { demoMode, supabase } from '@/services/supabase';
import { CloudSync, type SyncStatus } from '@/services/cloud-sync';
import { fromRecords, toRecords } from '@/services/records';
import { clearReminders } from '@/services/notifications';
import { api, errorMessage } from '@/services/api';
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
import { mergeFoodCatalog } from '@/constants/logFoodCatalog';
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

const STORAGE_KEY = '@adaptive_food_coach/v2';

interface PersistedState {
  steps: { date: string; count: number; source: 'manual'|'device' }[];
  profile: UserProfile;
  preferences: { reminders?: {daily?:boolean;weekly?:boolean;sound?:boolean}; aiConsent?: boolean; theme?: 'light'|'dark'|'system'; notifications?: boolean };
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
  steps: [],
  preferences: {},
  profile: seedProfile,
  onboarding: {
    stepIndex: 0,
    totalSteps: 10,
    answers: {},
    generating: false,
    complete: false,
  },
  foodDatabase: mergeFoodCatalog(seedFoodDatabase),
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

function emptyState(user?: User): PersistedState {
  const now = new Date().toISOString();
  return { ...initialState,
    profile: { ...seedProfile, id: user?.id ?? '', name: user?.user_metadata?.name ?? '', email: user?.email ?? '', avatar: undefined,
      gender: 'prefer_not_to_say', dateOfBirth: '', heightCm: 0, currentWeightKg: 0, targetWeightKg: 0,
      workoutFrequency: 'never', goals: [], allergies: [], createdAt: now, updatedAt: now },
    onboarding: { ...initialState.onboarding, answers: {} }, preferences: {},
    foodLogs: [], savedFoods: [], mealRecipes: [], exerciseLogs: [], weightHistory: [],
    milestones: seedMilestones.map(m => ({ ...m, unlocked: false, progress: 0, unlockedAt: undefined })),
    groups: [], groupPosts: [], leaderboard: [], challenges: [],
  };
}
let singletonState: PersistedState = demoMode ? initialState : emptyState();
let cloud: CloudSync | null = null;
let activeUser: User | undefined;
let accountGeneration = 0;
let syncStatus: SyncStatus = 'loading';
let syncMessage = '';
let initializing: Promise<void> | null = null;
const subscribers = new Set<() => void>();
let hydrated = false;

function notify() {
  for (const cb of subscribers) cb();
}

async function hydrate() {
  if (!demoMode || hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      singletonState = { ...initialState, ...parsed };
      singletonState.foodDatabase = mergeFoodCatalog(singletonState.foodDatabase);
    } else {
      singletonState = {
        ...initialState,
        foodDatabase: mergeFoodCatalog(initialState.foodDatabase),
      };
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
  if (!demoMode && !cloud) throw new Error('Sign in before saving changes.');
  singletonState = next;
  notify();
  try {
    if (demoMode) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else await cloud!.commit(toRecords(next));
  } catch (err) {
    syncStatus = 'error'; syncMessage = errorMessage(err); notify();
  }
}

void hydrate();

export async function initializeAccount(user: User | null) {
  if (!user) void clearReminders();
  if (activeUser?.id === user?.id && hydrated && cloud) return;
  if (activeUser?.id === user?.id && initializing) return initializing;
  const generation = ++accountGeneration;
  cloud?.close(); cloud = null; activeUser = user ?? undefined;
  singletonState = demoMode ? initialState : emptyState(user ?? undefined);
  hydrated = demoMode || !user; syncStatus = user ? 'loading' : 'synced'; syncMessage = ''; notify();
  if (!user || demoMode) return;
  const instance = new CloudSync(user.id, (records, status, message) => {
    if (generation !== accountGeneration) return;
    syncStatus = status; syncMessage = message;
    if (status !== 'loading' && !(status === 'error' && !hydrated)) {
      const community = { groups: singletonState.groups, groupPosts: singletonState.groupPosts, challenges: singletonState.challenges, leaderboard: singletonState.leaderboard };
      singletonState = { ...fromRecords(records, emptyState(user)), ...community };
      hydrated = true;
    }
    notify();
  }, { storage: AsyncStorage, request: api, uuid: Crypto.randomUUID });
  cloud = instance;
  initializing = instance.initialize().then(async () => {
    if (generation === accountGeneration) { hydrated = true; notify(); await refreshCommunity(); }
  }).finally(() => { if (generation === accountGeneration) initializing = null; });
  return initializing;
}
export async function refreshCommunity() {
  if (demoMode || !activeUser) return;
  const generation = accountGeneration;
  try {
    const result = await api<Pick<PersistedState,'groups'|'groupPosts'|'challenges'|'leaderboard'>>('/community');
    if (generation !== accountGeneration) return;
    singletonState = { ...singletonState, ...result }; notify();
  } catch (error) { if (generation === accountGeneration) { syncMessage = errorMessage(error); notify(); } }
}
async function communityAction(path: string, body: unknown, method = 'PUT') {
  try { await api(`/community${path}`, { method, body }); await refreshCommunity(); }
  catch (error) { Alert.alert('Could not update community', errorMessage(error)); }
}
export async function clearAccountCache() { cloud?.close(); await cloud?.clearCache(); await clearReminders(); }
export const retrySync = () => cloud?.flush();
export const resolveSyncConflict = (keepLocal: boolean) => cloud?.resolveConflict(keepLocal);
export async function signOutAccount() {
  if (cloud && (syncStatus !== 'synced')) throw new Error('Sync or resolve your pending changes before signing out.');
  const instance = cloud;
  const { error } = await supabase!.auth.signOut(); if (error) throw error;
  await instance?.clearCache(); await clearReminders(); await initializeAccount(null);
}
AppState.addEventListener('change', state => { if (state === 'active' && cloud) { void cloud.flush(); void refreshCommunity(); } });

function update(patch: Partial<PersistedState>) {
  return persist({ ...singletonState, ...patch });
}

const EMPTY_TOTALS: DailyFoodLog['totals'] = {
  calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0,
};

function emptyDay(date: string): DailyFoodLog {
  return { date, entries: [], waterMl: 0, totals: { ...EMPTY_TOTALS } };
}

function totalsFor(entries: FoodLogEntry[]): DailyFoodLog['totals'] {
  const totals = { ...EMPTY_TOTALS };
  for (const e of entries) {
    totals.calories += e.food.calories * e.quantity;
    totals.protein += e.food.protein * e.quantity;
    totals.carbs += e.food.carbs * e.quantity;
    totals.fat += e.food.fat * e.quantity;
    totals.fiber += (e.food.fiber ?? 0) * e.quantity;
    totals.sodium += (e.food.sodium ?? 0) * e.quantity;
  }
  return totals;
}

function dayLog(date: string): DailyFoodLog {
  return singletonState.foodLogs.find((d) => d.date === date) ?? emptyDay(date);
}

// ---- Public actions ----

export const appStoreActions = {
  reset() {
    return demoMode ? persist(initialState) : signOutAccount();
  },
  setSteps(date: string, count: number) { return update({ steps: [...singletonState.steps.filter(s => s.date !== date), { date, count, source: 'manual' }] }); },
  updatePreferences(patch: Partial<PersistedState['preferences']>) { return update({ preferences: { ...singletonState.preferences, ...patch } }); },
  setAiConsent(consent: boolean) { return update({ preferences: { ...singletonState.preferences, aiConsent: consent } }); },
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
  logFoods(foods: { food: FoodItem; quantity: number }[], mealType: MealType, date: string) {
    const today = dayLog(date);
    const entries = [...today.entries, ...foods.map(({ food, quantity }) => ({ id: Crypto.randomUUID(), loggedAt: new Date().toISOString(), date, mealType, food, quantity }))];
    return update({ foodLogs: [...singletonState.foodLogs.filter(d => d.date !== date), { ...today, entries, totals: totalsFor(entries) }], foodDatabase: [...singletonState.foodDatabase.filter(f => !foods.some(x => x.food.id === f.id)), ...foods.map(x => x.food)] });
  },
  logFood(entry: Omit<FoodLogEntry, 'id' | 'loggedAt'>) {
    const id = Crypto.randomUUID();
    const loggedAt = new Date().toISOString();
    const newEntry: FoodLogEntry = { id, loggedAt, ...entry };
    const today = dayLog(entry.date);
    const entries = [...today.entries, newEntry];
    const others = singletonState.foodLogs.filter((d) => d.date !== entry.date);
    return update({
      foodLogs: [...others, { ...today, date: entry.date, entries, totals: totalsFor(entries) }],
    });
  },
  updateFoodLog(date: string, entryId: string, patch: Partial<Pick<FoodLogEntry, 'quantity'|'mealType'|'food'>>) {
    const day = dayLog(date); const entries = day.entries.map(e => e.id === entryId ? { ...e, ...patch } : e);
    return update({ foodLogs: [...singletonState.foodLogs.filter(d => d.date !== date), { ...day, entries, totals: totalsFor(entries) }] });
  },
  deleteFoodLog(date: string, entryId: string) {
    const others = singletonState.foodLogs.filter((d) => d.date !== date);
    const today = singletonState.foodLogs.find((d) => d.date === date);
    if (!today) return update({ foodLogs: others });
    const entries = today.entries.filter((e) => e.id !== entryId);
    return update({ foodLogs: [...others, { ...today, date, entries, totals: totalsFor(entries) }] });
  },
  setWaterIntake(date: string, ml: number) {
    const today = dayLog(date);
    const others = singletonState.foodLogs.filter((d) => d.date !== date);
    const waterMl = Math.max(0, Math.round(ml));
    return update({ foodLogs: [...others, { ...today, date, waterMl }] });
  },
  upsertFood(food: FoodItem) {
    const exists = singletonState.foodDatabase.some((f) => f.id === food.id);
    const foodDatabase = exists
      ? singletonState.foodDatabase.map((f) => (f.id === food.id ? food : f))
      : [food, ...singletonState.foodDatabase];
    return update({ foodDatabase });
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
        { id: Crypto.randomUUID(), ...entry },
        ...singletonState.exerciseLogs,
      ],
    });
  },
  addWeight(entry: Omit<WeightEntry, 'id'>) {
    return update({
      weightHistory: [
        { id: Crypto.randomUUID(), ...entry },
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
    if (!demoMode) return communityAction(`/groups/${id}/membership`, { joined: true });
    return update({
      groups: singletonState.groups.map((g) => (g.id === id ? { ...g, joined: true, members: g.members + 1 } : g)),
    });
  },
  leaveGroup(id: string) {
    if (!demoMode) return communityAction(`/groups/${id}/membership`, { joined: false });
    return update({
      groups: singletonState.groups.map((g) => (g.id === id ? { ...g, joined: false, members: Math.max(0, g.members - 1) } : g)),
    });
  },
  likePost(id: string) {
    if (!demoMode) return communityAction(`/posts/${id}/like`, { liked: !singletonState.groupPosts.find(p => p.id === id)?.liked });
    return update({
      groupPosts: singletonState.groupPosts.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, reactions: p.reactions + (p.liked ? -1 : 1) } : p,
      ),
    });
  },
  joinChallenge(id: string) {
    if (!demoMode) return communityAction(`/challenges/${id}/membership`, { joined: true });
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

  const state = singletonState;

  const todaysFoodLog = useMemo(() => {
    const today = localDate();
    return state.foodLogs.find((d) => d.date === today) ?? emptyDay(today);
  }, [state.foodLogs]);

  const foodLogForDate = useCallback(
    (date: string) => state.foodLogs.find((d) => d.date === date) ?? emptyDay(date),
    [state.foodLogs],
  );

  const streakDays = useMemo(() => {
    const sorted = [...state.foodLogs]
      .filter((d) => d.entries.length > 0)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    let streak = 0;
    let cursor = new Date();
    for (let i = 0; i < 30; i++) {
      const iso = localDate(cursor);
      if (sorted.some((d) => d.date === iso)) streak += 1;
      else if (i > 0) break;
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
    syncStatus,
    syncMessage,
    state,
    todaysFoodLog,
    foodLogForDate,
    streakDays,
    searchFood,
    actions: appStoreActions,
  };
}

export type { PersistedState };
