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

function badge(
  id: string,
  title: string,
  description: string,
  category: MilestoneBadge['category'],
  face: NonNullable<MilestoneBadge['face']>,
  extra: Partial<MilestoneBadge> = {},
): MilestoneBadge {
  return {
    id,
    title,
    description,
    category,
    face,
    iconKey: extra.iconKey ?? 'award',
    tier: extra.tier ?? 'bronze',
    progress: extra.progress ?? 0,
    unlocked: extra.unlocked ?? false,
    unlockedAt: extra.unlockedAt,
  };
}

export const seedMilestones: MilestoneBadge[] = [
  badge('ms_1', 'Rookie', '3 day streak', 'streak', { kind: 'streak', value: '3', unit: 'STREAK' }, { unlocked: true, progress: 1, unlockedAt: '2026-01-23T00:00:00.000Z', tier: 'bronze', iconKey: 'zap' }),
  badge('ms_2', 'Getting Serious', '10 day streak', 'streak', { kind: 'streak', value: '10', unit: 'STREAK' }, { tier: 'silver', iconKey: 'zap' }),
  badge('ms_3', 'Locked In', '50 day streak', 'streak', { kind: 'streak', value: '50', unit: 'STREAK' }, { tier: 'gold', iconKey: 'zap' }),
  badge('ms_4', 'Triple Threat', '100 day streak', 'streak', { kind: 'streak', value: '100', unit: 'STREAK' }, { tier: 'gold', iconKey: 'zap' }),
  badge('ms_5', 'No Days Off', '365 day streak', 'streak', { kind: 'streak', value: '365', unit: 'STREAK' }, { tier: 'platinum', iconKey: 'zap' }),
  badge('ms_6', 'Immortal', '1000 day streak', 'streak', { kind: 'streak', value: '1000', unit: 'STREAK' }, { tier: 'platinum', iconKey: 'zap' }),
  badge('ms_7', 'Meals', 'Logged 5 meals', 'nutrition', { kind: 'number', value: '5' }, { unlocked: true, progress: 1, unlockedAt: '2026-01-24T00:00:00.000Z', tier: 'gold', iconKey: 'award' }),
  badge('ms_8', 'Nutrition', 'Logged 50 meals', 'nutrition', { kind: 'number', value: '50' }, { unlocked: true, progress: 1, unlockedAt: '2026-01-25T00:00:00.000Z', tier: 'gold', iconKey: 'award' }),
  badge('ms_9', 'Logfather', 'Logged 500 meals', 'nutrition', { kind: 'number', value: '500' }, { tier: 'platinum', iconKey: 'award' }),
  badge('ms_10', 'One Hit', 'Hit daily calories', 'nutrition', { kind: 'number', value: '1' }, { iconKey: 'target' }),
  badge('ms_11', 'Loyalty III', 'Hit 7 days', 'nutrition', { kind: 'number', value: '7X' }, { iconKey: 'target' }),
  badge('ms_12', 'Bulleye', 'Hit 30 days', 'nutrition', { kind: 'day', value: '30', unit: 'DAY' }, { iconKey: 'target' }),
  badge('ms_13', 'Helping', 'Invited 1 Friend', 'community', { kind: 'icon', value: 'user-plus' }, { iconKey: 'user-plus' }),
  badge('ms_14', 'Group', 'Invited 3 Friend', 'community', { kind: 'icon', value: 'users' }, { iconKey: 'users' }),
  badge('ms_15', 'Leader', 'Invited 10 Friend', 'community', { kind: 'icon', value: 'award' }, { iconKey: 'award' }),
  badge('ms_16', 'Hydrate', 'Water Intake', 'nutrition', { kind: 'icon', value: 'droplet' }, { iconKey: 'droplet' }),
  badge('ms_17', 'Sippin', 'Water 3 days', 'nutrition', { kind: 'icon', value: 'droplet' }, { iconKey: 'droplet' }),
  badge('ms_18', 'Aquaholic', 'Water 10 days', 'nutrition', { kind: 'icon', value: 'droplet' }, { iconKey: 'droplet' }),
  badge('ms_19', 'Clean Sweep', '3 Meals in a day', 'nutrition', { kind: 'icon', value: 'check-circle' }, { iconKey: 'check-circle' }),
  badge('ms_20', 'Sweat Equity', '5 Workout', 'exercise', { kind: 'icon', value: 'activity' }, { iconKey: 'activity' }),
  badge('ms_21', 'Speed Logger', 'Save 10 meals', 'nutrition', { kind: 'icon', value: 'zap' }, { iconKey: 'zap' }),
  badge('ms_22', 'Vegetable', 'Eat vegetable', 'nutrition', { kind: 'icon', value: 'feather' }, { iconKey: 'feather' }),
  badge('ms_23', 'Nut Case', 'Eat nuts', 'nutrition', { kind: 'icon', value: 'circle' }, { iconKey: 'circle' }),
  badge('ms_24', 'Berry', 'Eat Berries', 'nutrition', { kind: 'icon', value: 'heart' }, { iconKey: 'heart' }),
  badge('ms_25', 'First Drop', 'Lose 1 Kg', 'nutrition', { kind: 'kg', value: '1', unit: 'KG' }, { iconKey: 'trending-down' }),
  badge('ms_26', 'Bye Burrito', 'Lose 5 Kg', 'nutrition', { kind: 'kg', value: '5', unit: 'KG' }, { iconKey: 'trending-down' }),
  badge('ms_27', 'Scale Tipper', 'Lose 10 Kg', 'nutrition', { kind: 'kg', value: '10', unit: 'KG' }, { iconKey: 'trending-down' }),
  badge('ms_28', 'Heavy Exit', 'Lose 25 Kg', 'nutrition', { kind: 'kg', value: '25', unit: 'KG' }, { iconKey: 'trending-down' }),
  badge('ms_29', 'Who Dis?', 'Lose 50 Kg', 'nutrition', { kind: 'kg', value: '50', unit: 'KG' }, { iconKey: 'trending-down' }),
  badge('ms_30', 'Final Form', 'Lose 100 Kg', 'nutrition', { kind: 'kg', value: '100', unit: 'KG' }, { iconKey: 'trending-down' }),
  badge('ms_31', 'Time Traveller', 'Longest Streak', 'streak', { kind: 'icon', value: 'clock' }, { iconKey: 'clock' }),
  badge('ms_32', 'Gremlin', 'Longest Streak', 'streak', { kind: 'icon', value: 'smile' }, { iconKey: 'smile' }),
  badge('ms_33', 'Health Nut', 'Longest Streak', 'streak', { kind: 'day', value: '1' }, { iconKey: 'heart' }),
  badge('ms_34', 'Dumpster', 'Longest Streak', 'streak', { kind: 'day', value: '10' }, { iconKey: 'trash-2' }),
  badge('ms_35', 'Doppleganger', 'Longest Streak', 'community', { kind: 'icon', value: 'copy' }, { iconKey: 'copy' }),
  badge('ms_36', 'Omega Log', 'Longest Streak', 'nutrition', { kind: 'icon', value: 'book' }, { iconKey: 'book' }),
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
    authorId: 'u1',
    authorName: 'Aisha Khan',
    body: 'Hit my protein goal for the 7th day in a row 💪',
    createdAt: '2025-09-15T08:00:00.000Z',
    reactions: 24,
    comments: 4,
  },
  {
    id: 'pst_2',
    groupId: 'grp_2',
    authorId: 'u3',
    authorName: 'Carlos Rivera',
    body: '5K in 26:08 today — new PR!',
    createdAt: '2025-09-15T07:30:00.000Z',
    reactions: 41,
    comments: 9,
  },
  {
    id: 'pst_3',
    groupId: 'grp_1',
    authorId: 'u2',
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
