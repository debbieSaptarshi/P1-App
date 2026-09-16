/**
 * Seed food database — common foods shown in the Figma sample data.
 */

import type { FoodItem } from '@/types';

export const seedFoodDatabase: FoodItem[] = [
  { id: 'fd_chicken_breast', name: 'Grilled Chicken Breast', servingSize: '100 g', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodium: 74 },
  { id: 'fd_brown_rice', name: 'Cooked Brown Rice', servingSize: '100 g', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sodium: 5 },
  { id: 'fd_avocado', name: 'Avocado', servingSize: '½ fruit', calories: 120, protein: 1.5, carbs: 6.4, fat: 11, fiber: 5, sodium: 5 },
  { id: 'fd_greek_yogurt', name: 'Greek Yogurt (plain, low-fat)', servingSize: '170 g', calories: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0, sodium: 61 },
  { id: 'fd_blueberries', name: 'Blueberries', servingSize: '100 g', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, sodium: 1 },
  { id: 'fd_almonds', name: 'Almonds', servingSize: '28 g', calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5, sodium: 0 },
  { id: 'fd_salmon', name: 'Atlantic Salmon', servingSize: '100 g', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sodium: 59 },
  { id: 'fd_olive_oil', name: 'Extra Virgin Olive Oil', servingSize: '1 tbsp (14 g)', calories: 119, protein: 0, carbs: 0, fat: 14, fiber: 0, sodium: 0 },
  { id: 'fd_spinach', name: 'Baby Spinach', servingSize: '85 g', calories: 20, protein: 2, carbs: 3, fat: 0, fiber: 2, sodium: 65 },
  { id: 'fd_eggs', name: 'Whole Egg', servingSize: '1 large', calories: 72, protein: 6, carbs: 0.4, fat: 5, fiber: 0, sodium: 71 },
  { id: 'fd_oats', name: 'Rolled Oats (cooked)', servingSize: '100 g', calories: 71, protein: 2.5, carbs: 12, fat: 1.5, fiber: 1.7, sodium: 0 },
  { id: 'fd_banana', name: 'Banana', servingSize: '1 medium', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sodium: 1 },
];
