/**
 * Seed content for saved foods, meal recipes, milestones, groups, and posts.
 */

import type {
  AccountabilityGroup,
  Challenge,
  GroupPost,
  LeaderboardEntry,
  MealRecipe,
  MilestoneBadge,
  SavedFood,
} from '@/types';

export const seedSavedFoods: SavedFood[] = [
  {
    id: 'sv_1',
    name: 'My Power Breakfast',
    notes: 'Greek yogurt + blueberries + almonds',
    ingredients: [
      { foodId: 'fd_greek_yogurt', quantity: 1 },
      { foodId: 'fd_blueberries', quantity: 1 },
      { foodId: 'fd_almonds', quantity: 1 },
    ],
    calories: 321,
    createdAt: '2025-09-10T09:00:00.000Z',
  },
  {
    id: 'sv_2',
    name: 'Lean Lunch Plate',
    notes: 'Chicken, brown rice, spinach',
    ingredients: [
      { foodId: 'fd_chicken_breast', quantity: 1.5 },
      { foodId: 'fd_brown_rice', quantity: 1 },
      { foodId: 'fd_spinach', quantity: 1 },
    ],
    calories: 296,
    createdAt: '2025-09-12T12:00:00.000Z',
  },
];

export const seedMealRecipes: MealRecipe[] = [
  {
    id: 'rcp_1',
    name: 'Mediterranean Salmon Plate',
    servings: 1,
    ingredients: [],
    totalCalories: 525,
    totalProtein: 40,
    totalCarbs: 24,
    totalFat: 28,
    createdAt: '2025-09-15T18:00:00.000Z',
  },
  {
    id: 'rcp_2',
    name: 'Power Oatmeal Bowl',
    servings: 1,
    ingredients: [],
    totalCalories: 380,
    totalProtein: 18,
    totalCarbs: 60,
    totalFat: 8,
    createdAt: '2025-09-15T07:00:00.000Z',
  },
];

export const seedMilestones: MilestoneBadge[] = [
  { id: 'ms_1', title: '7-Day Streak', description: 'Logged 7 days in a row.', tier: 'bronze', category: 'streak', progress: 1, unlocked: true, unlockedAt: '2025-09-10T00:00:00.000Z', iconKey: 'zap' },
  { id: 'ms_2', title: 'Protein Pro', description: 'Hit protein goal 14 times.', tier: 'silver', category: 'nutrition', progress: 1, unlocked: true, unlockedAt: '2025-09-13T00:00:00.000Z', iconKey: 'award' },
  { id: 'ms_3', title: 'Hydration Hero', description: 'Met daily water goal.', tier: 'gold', category: 'nutrition', progress: 0.6, unlocked: false, iconKey: 'droplet' },
  { id: 'ms_4', title: 'Run Streak', description: '5 runs logged.', tier: 'silver', category: 'exercise', progress: 1, unlocked: true, unlockedAt: '2025-09-14T00:00:00.000Z', iconKey: 'activity' },
  { id: 'ms_5', title: 'Group Leader', description: 'Top 3 in your group.', tier: 'gold', category: 'community', progress: 0.4, unlocked: false, iconKey: 'users' },
  { id: 'ms_6', title: 'Goal Crusher', description: 'Reached target weight.', tier: 'platinum', category: 'nutrition', progress: 0.45, unlocked: false, iconKey: 'target' },
];

export const seedGroups: AccountabilityGroup[] = [
  {
    id: 'grp_1',
    name: 'Debnath Parivar',
    description: 'Under Dietician Ravi Jadhav',
    members: 4,
    joined: true,
    category: 'general',
    unreadCount: 12,
  },
  {
    id: 'grp_2',
    name: 'Fitness @ Silchar',
    description: 'Share workouts that match your calorie goals',
    members: 113,
    joined: false,
    category: 'exercise',
  },
  {
    id: 'grp_3',
    name: 'Diabetes fighters',
    description: 'Share workouts that match your calorie goals',
    members: 113,
    joined: false,
    category: 'nutrition',
  },
  {
    id: 'grp_4',
    name: 'New year revolutions',
    description: 'Share workouts that match your calorie goals',
    members: 113,
    joined: false,
    category: 'general',
  },
  {
    id: 'grp_5',
    name: 'Muscle gain and Bulking',
    description: 'Share workouts that match your calorie goals',
    members: 113,
    joined: false,
    category: 'exercise',
  },
  {
    id: 'grp_6',
    name: 'Weight lost support',
    description: 'Share workouts that match your calorie goals',
    members: 113,
    joined: false,
    category: 'weight_loss',
  },
];

export const seedGroupPosts: GroupPost[] = [
  {
    id: 'pst_1',
    groupId: 'grp_1',
    authorName: 'Aisha Khan',
    body: 'Hit my protein goal for the 7th day in a row 💪',
    createdAt: '2025-09-15T08:00:00.000Z',
    reactions: 24,
    comments: 4,
  },
  {
    id: 'pst_2',
    groupId: 'grp_2',
    authorName: 'Carlos Rivera',
    body: '5K in 26:08 today — new PR!',
    createdAt: '2025-09-15T07:30:00.000Z',
    reactions: 41,
    comments: 9,
  },
  {
    id: 'pst_3',
    groupId: 'grp_1',
    authorName: 'Lin Chen',
    body: 'Loving the new high-fiber recipes — anyone tried the lentil bowl?',
    createdAt: '2025-09-14T19:14:00.000Z',
    reactions: 12,
    comments: 6,
  },
];

export const seedLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', displayName: 'Aisha Khan', score: 2410, highlight: true },
  { rank: 2, userId: 'u2', displayName: 'Lin Chen', score: 2280 },
  { rank: 3, userId: 'u3', displayName: 'Carlos Rivera', score: 2190 },
  { rank: 4, userId: 'u_demo', displayName: 'Mike Wheeler', score: 2050 },
  { rank: 5, userId: 'u5', displayName: 'Priya Shah', score: 1985 },
  { rank: 6, userId: 'u6', displayName: 'Diego Alvarez', score: 1882 },
  { rank: 7, userId: 'u7', displayName: 'Hana Park', score: 1755 },
];

export const seedChallenges: Challenge[] = [
  { id: 'ch_1', title: '7-Day Hydration Streak', description: 'Hit your water goal 7 days this week.', participants: 2134, daysRemaining: 3, reward: 'Gold “Hydration Hero” badge', joined: true },
  { id: 'ch_2', title: 'Run 25 km this week', description: 'Move at your own pace.', participants: 889, daysRemaining: 5, reward: 'Pro Run streak badge', joined: false },
  { id: 'ch_3', title: 'Veggie Variety', description: 'Log 10 different veggies this week.', participants: 612, daysRemaining: 6, reward: 'Rainbow Plate badge', joined: false },
];
