import type { Gender, Goal, NutrientGoals, WorkoutFrequency } from '@/types';

export type CustomPlan = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  healthScore: number;
  targetLabel: string;
  direction: 'lose' | 'gain';
  nutrients: Pick<NutrientGoals, 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sodium'>;
};

const FIGMA_SAMPLE: CustomPlan = {
  calories: 1148,
  protein: 135,
  carbs: 85,
  fat: 31,
  fiber: 7,
  sugar: 6.3,
  sodium: 207,
  healthScore: 7,
  direction: 'lose',
  targetLabel: 'Lose 10.5 Kg by April 9, 2026',
  nutrients: { calories: 1148, protein: 135, carbs: 85, fat: 31, fiber: 7, sodium: 207 },
};

function ageFromDob(iso: string): number {
  const born = new Date(iso);
  if (Number.isNaN(born.getTime())) return 30;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) age -= 1;
  return Math.max(18, Math.min(80, age));
}

function activityFactor(workout?: WorkoutFrequency): number {
  if (workout === '5_plus_per_week') return 1.725;
  if (workout === '3_4_per_week') return 1.55;
  return 1.375;
}

function hasPlanInputs(answers: Record<string, string | string[] | number>): boolean {
  return (
    typeof answers.weight === 'number' ||
    typeof answers.targetWeight === 'number' ||
    typeof answers.height === 'number' ||
    typeof answers.gender === 'string' ||
    typeof answers.dob === 'string' ||
    typeof answers.workout === 'string' ||
    answers.goals != null
  );
}

function formatKg(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildCustomPlan(answers: Record<string, string | string[] | number>): CustomPlan {
  if (!hasPlanInputs(answers)) return FIGMA_SAMPLE;

  const gender = (typeof answers.gender === 'string' ? answers.gender : 'male') as Gender;
  const height = typeof answers.height === 'number' ? answers.height : 168;
  const weight = typeof answers.weight === 'number' ? answers.weight : 69;
  const target = typeof answers.targetWeight === 'number' ? answers.targetWeight : weight;
  const dob = typeof answers.dob === 'string' ? answers.dob : '1995-06-19';
  const workout = (typeof answers.workout === 'string' ? answers.workout : '3_4_per_week') as WorkoutFrequency;
  const goal = (Array.isArray(answers.goals) ? answers.goals[0] : 'lose_weight') as Goal;
  const direction: 'lose' | 'gain' = goal === 'gain_muscle' || target > weight ? 'gain' : 'lose';

  const age = ageFromDob(dob);
  const sexOffset = gender === 'male' ? 5 : gender === 'female' ? -161 : -78;
  const bmr = 10 * weight + 6.25 * height - 5 * age + sexOffset;
  const tdee = bmr * activityFactor(workout);
  const calories = Math.max(1200, Math.round(direction === 'gain' ? tdee + 300 : tdee - 500));
  const protein = Math.round((direction === 'gain' ? 2 : 1.8) * weight);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  const scale = calories / FIGMA_SAMPLE.calories;
  const fiber = round1(FIGMA_SAMPLE.fiber * scale);
  const sugar = round1(FIGMA_SAMPLE.sugar * scale);
  const sodium = Math.round(FIGMA_SAMPLE.sodium * scale);
  const healthScore = Math.max(5, Math.min(10, Math.round(FIGMA_SAMPLE.healthScore)));

  const delta = Math.max(0.5, Math.round(Math.abs(weight - target) * 10) / 10);
  const weeks = Math.max(1, Math.round(delta / 0.5));
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  const when = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const verb = direction === 'gain' ? 'Gain' : 'Lose';

  return {
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodium,
    healthScore,
    direction,
    targetLabel: `${verb} ${formatKg(delta)} Kg by ${when}`,
    nutrients: { calories, protein, carbs, fat, fiber, sodium },
  };
}
