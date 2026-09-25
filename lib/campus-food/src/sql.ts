import { CAMPUS_DISHES } from './catalog';
import { CAMPUS_OUTLETS } from './outlets';

function lit(value: string | undefined) {
  if (value == null) return 'null';
  return `'${value.replace(/'/g, "''")}'`;
}

function nums(values: number[]) {
  return values.join(', ');
}

export function outletSqlRows() {
  return CAMPUS_OUTLETS.map((outlet) =>
    `(${lit(outlet.id)}, ${lit(outlet.name)}, ${lit(outlet.kind)}, ${outlet.priority}, ARRAY[${outlet.hostelCodes.map(lit).join(',')}]::text[], ${lit(outlet.area)}, ${outlet.vegOnly}, ${lit(outlet.sourceUrl)}, ${lit(outlet.notes)})`,
  ).join(',\n');
}

export function dishSqlRows() {
  return CAMPUS_DISHES.map((dish) =>
    `(${lit(dish.id)}, ${lit(dish.outletId)}, ${lit(dish.name)}, ARRAY[${dish.aliases.map(lit).join(',')}]::text[], ARRAY[${dish.mealSlots.map(lit).join(',')}]::text[], ${lit(dish.servingSize)}, ${nums([dish.servingGrams, dish.calories, dish.protein, dish.carbs, dish.fat, dish.fiber, dish.sodium])}, ${lit(dish.diet)}, ${dish.oilTsp}, ${dish.priceInr ?? 'null'}, ${dish.weekday ?? 'null'}, ${lit(dish.source)}, ${lit(dish.sourceUrl)})`,
  ).join(',\n');
}
