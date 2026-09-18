import type { ImageSourcePropType } from 'react-native';
import type { FoodItem } from '@/types';

export type MealVerification =
  | { status: 'pending'; label: string }
  | { status: 'verified'; label: string };

export interface DishIngredient {
  id: string;
  name: string;
  calories: number;
  grams: number;
}

export interface DishSegment {
  name: string;
  percent: number;
}

export interface LastMealDish {
  id: string;
  name: string;
  titleLine1: string;
  titleLine2?: string;
  image: ImageSourcePropType;
  heroImage: ImageSourcePropType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  healthScore: number;
  verification: MealVerification;
  addedBy?: string;
  ingredients: DishIngredient[];
  segments: DishSegment[];
}

const roastedChicken = require('@/assets/images/meals/roasted-chicken.png');
const andaCurry = require('@/assets/images/meals/anda-curry.png');
const besanCurry = require('@/assets/images/meals/besan-curry.png');
const dishHero = require('@/assets/images/meals/dish-hero.png');

export const LAST_MEALS: LastMealDish[] = [
  {
    id: 'roasted-chicken-dosa',
    name: 'Roasted Chicken with Dosa',
    titleLine1: 'Roasted Chicken',
    titleLine2: 'with Neer Dosa',
    image: roastedChicken,
    heroImage: dishHero,
    calories: 637,
    protein: 65,
    carbs: 45,
    fat: 18,
    fiber: 7.0,
    sugar: 6.3,
    sodium: 207,
    healthScore: 7,
    verification: { status: 'pending', label: 'Yet to be verified' },
    ingredients: [
      { id: 'chicken', name: 'Roasted Chicken', calories: 165, grams: 100 },
      { id: 'shrimp', name: 'Shrimp', calories: 70, grams: 75 },
      { id: 'broccoli', name: 'Broccoli', calories: 25, grams: 75 },
      { id: 'carrot', name: 'Carrot', calories: 20, grams: 50 },
      { id: 'potatoes', name: 'Potatoes', calories: 90, grams: 120 },
    ],
    segments: [
      { name: 'Chicken', percent: 40 },
      { name: 'Potatoes', percent: 20 },
      { name: 'Carrot', percent: 10 },
      { name: 'Broccoli', percent: 8 },
      { name: 'Shrimp', percent: 20 },
      { name: 'Peas', percent: 2 },
    ],
  },
  {
    id: 'anda-curry-rice',
    name: 'Anda Curry and rice',
    titleLine1: 'Anda Curry',
    titleLine2: 'and Rice',
    image: andaCurry,
    heroImage: andaCurry,
    calories: 637,
    protein: 65,
    carbs: 45,
    fat: 18,
    fiber: 4.2,
    sugar: 5.1,
    sodium: 480,
    healthScore: 6,
    verification: { status: 'verified', label: 'Verified by Dt. Ravi Jadhav' },
    ingredients: [
      { id: 'egg-curry', name: 'Anda Curry', calories: 280, grams: 180 },
      { id: 'rice', name: 'Steamed Rice', calories: 210, grams: 150 },
      { id: 'onion', name: 'Onion', calories: 40, grams: 60 },
      { id: 'tomato', name: 'Tomato', calories: 22, grams: 50 },
      { id: 'spice', name: 'Masala', calories: 35, grams: 12 },
    ],
    segments: [
      { name: 'Curry', percent: 38 },
      { name: 'Rice', percent: 32 },
      { name: 'Egg', percent: 18 },
      { name: 'Onion', percent: 6 },
      { name: 'Tomato', percent: 4 },
      { name: 'Spice', percent: 2 },
    ],
  },
  {
    id: 'besan-curry-roti',
    name: 'Besan ki curry with 3 Roti',
    titleLine1: 'Besan ki Curry',
    titleLine2: 'with 3 Roti',
    image: besanCurry,
    heroImage: besanCurry,
    calories: 637,
    protein: 65,
    carbs: 45,
    fat: 18,
    fiber: 8.4,
    sugar: 4.8,
    sodium: 390,
    healthScore: 7,
    verification: { status: 'verified', label: 'Verified by Dt. Ravi Jadhav' },
    addedBy: 'Added by your Son, 9:45 AM',
    ingredients: [
      { id: 'besan', name: 'Besan Curry', calories: 265, grams: 160 },
      { id: 'roti-1', name: 'Roti', calories: 90, grams: 40 },
      { id: 'roti-2', name: 'Roti', calories: 90, grams: 40 },
      { id: 'roti-3', name: 'Roti', calories: 90, grams: 40 },
      { id: 'ghee', name: 'Ghee', calories: 45, grams: 5 },
    ],
    segments: [
      { name: 'Curry', percent: 42 },
      { name: 'Roti', percent: 36 },
      { name: 'Onion', percent: 8 },
      { name: 'Tomato', percent: 6 },
      { name: 'Spice', percent: 5 },
      { name: 'Ghee', percent: 3 },
    ],
  },
];

export function getLastMealDish(id?: string | string[]): LastMealDish {
  const key = Array.isArray(id) ? id[0] : id;
  return LAST_MEALS.find((dish) => dish.id === key) ?? LAST_MEALS[0];
}

export function dishToFoodItem(dish: LastMealDish): FoodItem {
  return {
    id: `dish_${dish.id}`,
    name: dish.name,
    servingSize: '1 plate',
    calories: dish.calories,
    protein: dish.protein,
    carbs: dish.carbs,
    fat: dish.fat,
    fiber: dish.fiber,
    sodium: dish.sodium,
  };
}
