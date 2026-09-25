import { resolveHomeLayout, type HomeLayoutId } from '@/constants/homeLayouts';

export type ProgramId = 'general' | 'pcos' | 'diabetes' | 'thyroid' | 'gut';

export type HomeActionRow = 'scan-database' | 'track-composer';

export type RemainingMetricId = 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber';

export type RemainingMetricCard = {
  id: RemainingMetricId;
  label: string;
  emoji: string;
  unit: string;
};

export type ProgramCategoryId = 'everyday' | 'hormonal' | 'metabolic' | 'digestive';

export type ProgramCategory = { id: ProgramCategoryId; label: string };

export type ProgramCatalogue = {
  /** Section the programme is listed under on the Programs tab. */
  category: ProgramCategoryId;
  /** Small uppercase kicker shown on cards, e.g. "PROGRAMME" or "LIFESTYLE". */
  kicker: string;
  /** One-line hook under the title on cards and the detail hero. */
  tagline: string;
  /** Plate illustration used on cards and the detail hero. */
  image: number;
  /** Dark hero/card colour for this programme. */
  accent: string;
  /** Two or three short check-marked benefits. */
  benefits: string[];
  /** One-line summary shown above the macro split. */
  focusSummary: string;
  /** Percent split (sums to 100). */
  macroSplit: { carbs: number; protein: number; fat: number };
  dos: string[];
  donts: string[];
  /** Nutritionist-style quote for the recommendation result. */
  quote: { text: string; author: string; role: string };
};

export type ProgramDefinition = ProgramCatalogue & {
  id: ProgramId;
  title: string;
  shortTitle: string;
  description: string;
  defaultLayout: HomeLayoutId;
  actionRow: HomeActionRow;
  heroMetric: RemainingMetricCard;
  macroCards: RemainingMetricCard[];
  focusTitle: string;
  focusHint: string;
  composerPlaceholder: string;
};

export const PROGRAM_CATEGORIES: ProgramCategory[] = [
  { id: 'everyday', label: 'Everyday' },
  { id: 'hormonal', label: 'Hormonal health' },
  { id: 'metabolic', label: 'Blood sugar' },
  { id: 'digestive', label: 'Digestion' },
];

export type RemainingTotals = {
  caloriesLeft: number;
  calorieGoal: number;
  calorieProgress: number;
  proteinLeft: number;
  proteinGoal: number;
  proteinProgress: number;
  carbsLeft: number;
  carbGoal: number;
  carbProgress: number;
  fatLeft: number;
  fatGoal: number;
  fatProgress: number;
  fiberLeft: number;
  fiberGoal: number;
  fiberProgress: number;
};

export const PROGRAMS: ProgramDefinition[] = [
  {
    id: 'general',
    title: 'Everyday nutrition',
    shortTitle: 'General',
    description: 'Calories, protein, carbs and fat for everyday logging.',
    defaultLayout: 'overview',
    actionRow: 'scan-database',
    heroMetric: { id: 'calories', label: 'Calories Left', emoji: '🔥', unit: '' },
    macroCards: [
      { id: 'protein', label: 'Protein Left', emoji: '🥚', unit: 'g' },
      { id: 'carbs', label: 'Carbs Left', emoji: '🍞', unit: 'g' },
      { id: 'fat', label: 'Fat Left', emoji: '🥑', unit: 'g' },
    ],
    focusTitle: 'Log the next meal',
    focusHint: 'Photo, search or voice — whichever is easiest right now.',
    composerPlaceholder: 'What do you want to track....',
    category: 'everyday',
    kicker: 'Balanced',
    tagline: 'Simple totals, no rules',
    image: require('@/assets/images/meals/dish-hero.png'),
    accent: '#0A0A0A',
    benefits: ['Calories and macros at a glance', 'Works with any cuisine'],
    focusSummary: 'A balanced plate with room for the food you already eat.',
    macroSplit: { carbs: 50, protein: 20, fat: 30 },
    dos: [
      'Aim for a source of protein at every meal.',
      'Fill half the plate with vegetables, dal or salad.',
      'Log the meal while you are still at the table.',
    ],
    donts: [
      "Don't skip meals to \"save\" calories.",
      "Don't treat the estimate as a lab measurement.",
    ],
    quote: {
      text: 'Consistency beats precision. Logging most meals, most days, is what moves the needle.',
      author: 'Ananya',
      role: 'Nutritionist',
    },
  },
  {
    id: 'pcos',
    title: 'PCOS programme',
    shortTitle: 'PCOS',
    description: 'Protein, fibre and familiar meals, with a next-meal plan on home.',
    defaultLayout: 'plan',
    actionRow: 'track-composer',
    heroMetric: { id: 'protein', label: 'Protein Left', emoji: '🥚', unit: 'g' },
    macroCards: [
      { id: 'fiber', label: 'Fiber Left', emoji: '🍎', unit: 'g' },
      { id: 'carbs', label: 'Carbs Left', emoji: '🍞', unit: 'g' },
      { id: 'fat', label: 'Fat Left', emoji: '🥑', unit: 'g' },
    ],
    focusTitle: 'PCOS focus this week',
    focusHint: 'Protein and fibre first. Prefer home-cooked food and go easy on oily plates.',
    composerPlaceholder: 'Log a meal, symptom or craving....',
    category: 'hormonal',
    kicker: 'Programme',
    tagline: 'Protein and fibre first',
    image: require('@/assets/images/meals/besan-curry.png'),
    accent: '#3B2A4A',
    benefits: ['Steadier energy across the day', 'Fewer cravings between meals'],
    focusSummary: 'Lean on protein and fibre so blood sugar and cravings stay level.',
    macroSplit: { carbs: 40, protein: 30, fat: 30 },
    dos: [
      'Start each meal with dal, paneer, eggs, curd or chicken.',
      'Add a fibre source — sabzi, salad, whole grains — to every plate.',
      'Keep meal times regular; a long gap makes the next meal heavier.',
    ],
    donts: [
      "Don't rely on refined maida snacks when you are hungry.",
      "Don't cut carbs to zero — swap white rice for millets or roti instead.",
      "Don't skip breakfast.",
    ],
    quote: {
      text: 'With PCOS the goal is not less food — it is the right order: protein, fibre, then carbs.',
      author: 'Ananya',
      role: 'Nutritionist',
    },
  },
  {
    id: 'diabetes',
    title: 'Diabetes programme',
    shortTitle: 'Diabetes',
    description: 'Carb quality, fibre and a meal journal so portions stay visible.',
    defaultLayout: 'journal',
    actionRow: 'track-composer',
    heroMetric: { id: 'carbs', label: 'Carbs Left', emoji: '🍞', unit: 'g' },
    macroCards: [
      { id: 'fiber', label: 'Fiber Left', emoji: '🍎', unit: 'g' },
      { id: 'protein', label: 'Protein Left', emoji: '🥚', unit: 'g' },
      { id: 'calories', label: 'Calories Left', emoji: '🔥', unit: '' },
    ],
    focusTitle: 'Steady carbs today',
    focusHint: 'Log meals with a photo when you can. Fibre and protein help blunt spikes.',
    composerPlaceholder: 'What did you eat, or how do you feel?....',
    category: 'metabolic',
    kicker: 'Programme',
    tagline: 'Keep carbs steady',
    image: require('@/assets/images/meals/anda-curry.png'),
    accent: '#1E3A5F',
    benefits: ['Portions stay visible in a journal', 'Fibre and protein blunt spikes'],
    focusSummary: 'Spread carbs evenly through the day and pair them with fibre and protein.',
    macroSplit: { carbs: 40, protein: 25, fat: 35 },
    dos: [
      'Pair rice or roti with dal, curd or a protein every time.',
      'Eat vegetables first, carbs last.',
      'Log meals with a photo so portion size is honest.',
    ],
    donts: [
      "Don't drink sugar — juices, sweetened chai and soft drinks spike fastest.",
      "Don't have a carb-only snack (biscuits, plain toast) on its own.",
      "Don't change medication based on app estimates — talk to your doctor.",
    ],
    quote: {
      text: 'The same carbs, spread across the day and eaten after fibre, behave very differently.',
      author: 'Ananya',
      role: 'Nutritionist',
    },
  },
  {
    id: 'thyroid',
    title: 'Thyroid programme',
    shortTitle: 'Thyroid',
    description: 'Consistent meals and protein, with a plan for what to eat next.',
    defaultLayout: 'plan',
    actionRow: 'scan-database',
    heroMetric: { id: 'protein', label: 'Protein Left', emoji: '🥚', unit: 'g' },
    macroCards: [
      { id: 'calories', label: 'Calories Left', emoji: '🔥', unit: '' },
      { id: 'carbs', label: 'Carbs Left', emoji: '🍞', unit: 'g' },
      { id: 'fiber', label: 'Fiber Left', emoji: '🍎', unit: 'g' },
    ],
    focusTitle: 'Keep meals consistent',
    focusHint: 'Eat on a regular rhythm. Protein at each meal supports energy.',
    composerPlaceholder: 'What do you want to track....',
    category: 'hormonal',
    kicker: 'Programme',
    tagline: 'A steady rhythm of meals',
    image: require('@/assets/images/meals/hatkora-chicken.png'),
    accent: '#2F3E2E',
    benefits: ['Regular meals support energy', "A plan for what's next"],
    focusSummary: 'Protein at every meal and a predictable eating rhythm.',
    macroSplit: { carbs: 45, protein: 25, fat: 30 },
    dos: [
      'Eat at roughly the same times every day.',
      'Include a protein at each meal — eggs, dal, fish, paneer.',
      'Keep iodine and selenium sources (fish, eggs, nuts) in rotation.',
    ],
    donts: [
      "Don't take thyroid medication with food or coffee — wait 30–60 minutes.",
      "Don't over-restrict calories; it slows you down further.",
    ],
    quote: {
      text: 'A thyroid-friendly plan is boring on purpose: same rhythm, steady protein, no crash diets.',
      author: 'Ananya',
      role: 'Nutritionist',
    },
  },
  {
    id: 'gut',
    title: 'Gut health programme',
    shortTitle: 'Gut',
    description: 'Fibre, familiar food and a journal of what agreed with you.',
    defaultLayout: 'journal',
    actionRow: 'track-composer',
    heroMetric: { id: 'fiber', label: 'Fiber Left', emoji: '🍎', unit: 'g' },
    macroCards: [
      { id: 'protein', label: 'Protein Left', emoji: '🥚', unit: 'g' },
      { id: 'fat', label: 'Fat Left', emoji: '🥑', unit: 'g' },
      { id: 'carbs', label: 'Carbs Left', emoji: '🍞', unit: 'g' },
    ],
    focusTitle: 'Notice what sits well',
    focusHint: 'Log home-cooked meals and flag anything that triggered bloating.',
    composerPlaceholder: 'Meal, symptom or note....',
    category: 'digestive',
    kicker: 'Programme',
    tagline: 'Learn what agrees with you',
    image: require('@/assets/images/meals/shutki-bhorta.png'),
    accent: '#4A3728',
    benefits: ['A journal of what sat well', 'Fibre without the bloat'],
    focusSummary: 'Gentle fibre, familiar food, and notes on how each meal felt.',
    macroSplit: { carbs: 50, protein: 20, fat: 30 },
    dos: [
      'Add fibre gradually — one new source at a time.',
      'Note bloating, cramps or energy after each meal.',
      'Include curd, buttermilk or fermented food daily.',
    ],
    donts: [
      "Don't eliminate whole food groups without a doctor or dietitian.",
      "Don't eat in a rush — chewing well matters more than you think.",
    ],
    quote: {
      text: 'Your gut is an experiment of one. The journal is the data; we just help you read it.',
      author: 'Ananya',
      role: 'Nutritionist',
    },
  },
];

export function programsByCategory(): { category: ProgramCategory; programs: ProgramDefinition[] }[] {
  return PROGRAM_CATEGORIES.map((category) => ({
    category,
    programs: PROGRAMS.filter((program) => program.category === category.id),
  })).filter((group) => group.programs.length > 0);
}

export function isProgramId(value: unknown): value is ProgramId {
  return value === 'pcos' || value === 'diabetes' || value === 'thyroid' || value === 'gut' || value === 'general';
}

export const DEFAULT_PROGRAM_ID: ProgramId = 'general';

const PROGRAM_BY_ID: Record<ProgramId, ProgramDefinition> = PROGRAMS.reduce(
  (acc, program) => {
    acc[program.id] = program;
    return acc;
  },
  {} as Record<ProgramId, ProgramDefinition>,
);

export function resolveProgram(id?: string | null): ProgramDefinition {
  if (id === 'pcos' || id === 'diabetes' || id === 'thyroid' || id === 'gut' || id === 'general') {
    return PROGRAM_BY_ID[id];
  }
  return PROGRAM_BY_ID.general;
}

export function resolveProgramHome(options: {
  programId?: string | null;
  layoutOverride?: string | null;
}): { program: ProgramDefinition; layout: HomeLayoutId } {
  const program = resolveProgram(options.programId);
  const layout = options.layoutOverride
    ? resolveHomeLayout(options.layoutOverride)
    : program.defaultLayout;
  return { program, layout };
}

export function remainingFor(
  metric: RemainingMetricCard,
  totals: RemainingTotals,
): { left: number; goal: number; progress: number; label: string; emoji: string; unit: string } {
  const value = {
    calories: {
      left: totals.caloriesLeft,
      goal: totals.calorieGoal,
      progress: totals.calorieProgress,
    },
    protein: {
      left: totals.proteinLeft,
      goal: totals.proteinGoal,
      progress: totals.proteinProgress,
    },
    carbs: {
      left: totals.carbsLeft,
      goal: totals.carbGoal,
      progress: totals.carbProgress,
    },
    fat: {
      left: totals.fatLeft,
      goal: totals.fatGoal,
      progress: totals.fatProgress,
    },
    fiber: {
      left: totals.fiberLeft,
      goal: totals.fiberGoal,
      progress: totals.fiberProgress,
    },
  }[metric.id];
  return { ...value, label: metric.label, emoji: metric.emoji, unit: metric.unit };
}

export function formatRemaining(left: number, goal: number, unit: string): string {
  const pair = `${Math.round(left)}/${Math.round(goal)}`;
  return unit ? `${pair} ${unit}` : pair;
}
