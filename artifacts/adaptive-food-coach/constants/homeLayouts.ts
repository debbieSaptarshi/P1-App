import type { MealType } from '@/types';
import type { Feather } from '@expo/vector-icons';

export type HomeLayoutId = 'overview' | 'journal' | 'plan';

export type HomeLayoutOption = {
  id: HomeLayoutId;
  title: string;
  tagline: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
};

export const HOME_LAYOUTS: HomeLayoutOption[] = [
  {
    id: 'overview',
    title: 'Health overview',
    tagline: 'Calories, macros & last meals',
    description: 'Remaining calories and macros first, then swipe for fiber, steps and water.',
    icon: 'activity',
  },
  {
    id: 'journal',
    title: 'Food journal',
    tagline: 'What you ate, by meal',
    description: 'A plate-first log from breakfast through dinner, with empty slots ready to fill.',
    icon: 'book-open',
  },
  {
    id: 'plan',
    title: "Today's plan",
    tagline: 'What to eat next',
    description: 'Protein and fiber still needed, plus a suggested next meal you can log or swap.',
    icon: 'sun',
  },
];

export const DEFAULT_HOME_LAYOUT: HomeLayoutId = 'overview';

export const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: '🥣',
  lunch: '🍛',
  dinner: '🍽️',
  snack: '🍎',
};

export function resolveHomeLayout(value?: string | null): HomeLayoutId {
  if (value === 'journal' || value === 'plan' || value === 'overview') return value;
  return DEFAULT_HOME_LAYOUT;
}

export function homeLayoutLabel(id: HomeLayoutId): string {
  return HOME_LAYOUTS.find((layout) => layout.id === id)?.title ?? 'Health overview';
}

export function nextMealType(now = new Date()): MealType {
  const hour = now.getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}

export function suggestedMealType(logged: Iterable<MealType>, now = new Date()): MealType {
  const filled = new Set(logged);
  const start = nextMealType(now);
  const startIndex = MEAL_ORDER.indexOf(start);
  for (let i = 0; i < MEAL_ORDER.length; i++) {
    const type = MEAL_ORDER[(startIndex + i) % MEAL_ORDER.length]!;
    if (!filled.has(type)) return type;
  }
  return start;
}
