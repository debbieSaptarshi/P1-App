export const HOSTEL_CODES = [
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10',
  'H11', 'H12', 'H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'Tansa',
] as const;

export type HostelCode = (typeof HOSTEL_CODES)[number];
export type OutletKind = 'mess' | 'canteen' | 'restaurant';
export type CatalogPriority = 1 | 2 | 3;
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DietFlag = 'veg' | 'egg' | 'nonveg' | 'jain';
export type DishSource = 'scraped' | 'mess_menu' | 'tender' | 'field_typical';
export type MatchMethod = 'catalog' | 'visual' | 'label' | 'text';

export interface CampusOutlet {
  id: string;
  name: string;
  kind: OutletKind;
  priority: CatalogPriority;
  hostelCodes: HostelCode[];
  area: string;
  vegOnly: boolean;
  sourceUrl?: string;
  notes?: string;
}

export interface CampusDish {
  id: string;
  outletId: string;
  name: string;
  aliases: string[];
  mealSlots: MealSlot[];
  servingSize: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  diet: DietFlag;
  oilTsp: number;
  priceInr?: number;
  weekday?: number;
  source: DishSource;
  sourceUrl?: string;
}

export interface CatalogMatchQuery {
  text?: string;
  hostel?: string;
  outletId?: string;
  mealSlot?: MealSlot;
  limit?: number;
}

export interface CatalogMatch extends CampusDish {
  outletName: string;
  priority: CatalogPriority;
  score: number;
}
