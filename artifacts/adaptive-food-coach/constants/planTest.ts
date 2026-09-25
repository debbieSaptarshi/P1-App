import type { HomeLayoutId } from '@/constants/homeLayouts';
import { DEFAULT_PROGRAM_ID, PROGRAMS, type ProgramId } from '@/constants/programs';

/**
 * "Find your plan" test.
 *
 * Seven single-choice questions. Each option adds points to one or more
 * programmes; the highest total wins. One question also picks the home
 * layout the user prefers, which overrides the programme default.
 */

export type PlanTestOption = {
  id: string;
  label: string;
  /** Points added to each programme when this option is chosen. */
  score?: Partial<Record<ProgramId, number>>;
  /** Preferred home layout, if this answer implies one. */
  layout?: HomeLayoutId;
};

export type PlanTestQuestion = {
  id: string;
  title: string;
  options: PlanTestOption[];
};

export type PlanTestResult = {
  programId: ProgramId;
  layout: HomeLayoutId;
  answers: Record<string, string>;
  completedAt: string;
};

export const PLAN_TEST_QUESTIONS: PlanTestQuestion[] = [
  {
    id: 'goal',
    title: 'What do you want most from a plan?',
    options: [
      { id: 'lose', label: 'Lose weight without feeling hungry', score: { general: 2, pcos: 1 } },
      { id: 'condition', label: 'Manage a health condition', score: { pcos: 1, diabetes: 1, thyroid: 1, gut: 1 } },
      { id: 'energy', label: 'Steadier energy through the day', score: { diabetes: 2, thyroid: 1 } },
      { id: 'habits', label: 'Just eat a little better every day', score: { general: 3 } },
    ],
  },
  {
    id: 'diagnosis',
    title: 'Has a doctor mentioned any of these?',
    options: [
      { id: 'none', label: 'None of these', score: { general: 2 } },
      { id: 'pcos', label: 'PCOS or irregular periods', score: { pcos: 4 } },
      { id: 'sugar', label: 'Diabetes or pre-diabetes', score: { diabetes: 4 } },
      { id: 'thyroid', label: 'Thyroid (hypo or hyper)', score: { thyroid: 4 } },
      { id: 'gut', label: 'IBS, acidity or frequent bloating', score: { gut: 4 } },
    ],
  },
  {
    id: 'energy',
    title: 'How does your energy usually feel after lunch?',
    options: [
      { id: 'fine', label: 'Fine — I barely notice', score: { general: 2 } },
      { id: 'dip', label: 'A dip, then I recover', score: { thyroid: 1, general: 1 } },
      { id: 'crash', label: 'A real crash — I need tea or a nap', score: { diabetes: 2, pcos: 1 } },
      { id: 'sleepy', label: 'Sleepy most of the day regardless', score: { thyroid: 2 } },
    ],
  },
  {
    id: 'digestion',
    title: 'How often do meals leave you bloated or uncomfortable?',
    options: [
      { id: 'rarely', label: 'Rarely', score: { general: 1 } },
      { id: 'sometimes', label: 'Sometimes, after heavy or oily food', score: { general: 1, gut: 1 } },
      { id: 'often', label: 'Often — a few times a week', score: { gut: 2 } },
      { id: 'daily', label: 'Almost every day', score: { gut: 3 } },
    ],
  },
  {
    id: 'cooking',
    title: 'Do you cook your own meals?',
    options: [
      { id: 'no', label: 'No', score: { general: 1 } },
      { id: 'sometimes', label: 'Sometimes', score: { general: 1 } },
      { id: 'haveto', label: 'Yes, because I have to', score: { thyroid: 1, diabetes: 1 } },
      { id: 'enjoy', label: 'Yes, and I enjoy it', score: { pcos: 1, gut: 1 } },
    ],
  },
  {
    id: 'structure',
    title: 'How much structure do you want on your home screen?',
    options: [
      { id: 'plan', label: 'Tell me what to eat next', layout: 'plan' },
      { id: 'journal', label: 'A journal of what I ate and how I felt', layout: 'journal' },
      { id: 'overview', label: 'Just my totals — I will decide', layout: 'overview' },
    ],
  },
  {
    id: 'logging',
    title: 'How do you want to log most meals?',
    options: [
      { id: 'photo', label: 'Snap a photo and move on', score: { diabetes: 1, general: 1 } },
      { id: 'chat', label: 'Type or say what I ate', score: { general: 1, pcos: 1 } },
      { id: 'detail', label: 'Search and pick exact portions', score: { thyroid: 1, gut: 1 } },
    ],
  },
];

export function scorePlanTest(answers: Record<string, string>): { programId: ProgramId; layout: HomeLayoutId } {
  const totals: Record<ProgramId, number> = { general: 0, pcos: 0, diabetes: 0, thyroid: 0, gut: 0 };
  let layout: HomeLayoutId | undefined;

  for (const question of PLAN_TEST_QUESTIONS) {
    const option = question.options.find((item) => item.id === answers[question.id]);
    if (!option) continue;
    if (option.layout) layout = option.layout;
    for (const [id, points] of Object.entries(option.score ?? {})) {
      totals[id as ProgramId] += points ?? 0;
    }
  }

  // A named diagnosis wins outright; otherwise the highest score, ties → general.
  const ranked = (Object.keys(totals) as ProgramId[]).sort((a, b) => totals[b] - totals[a]);
  const best = ranked[0];
  const runnerUp = ranked[1];
  const programId: ProgramId =
    totals[best] === 0 || (best !== 'general' && totals[best] === totals[runnerUp]) ? DEFAULT_PROGRAM_ID : best;

  const program = PROGRAMS.find((item) => item.id === programId)!;
  return { programId, layout: layout ?? program.defaultLayout };
}
