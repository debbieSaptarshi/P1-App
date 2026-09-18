export const SCAN_FOOD_FALLBACK_ID = 'fd_chicken_breast';
export const SCAN_LABEL_FALLBACK_ID = 'fd_greek_yogurt';
export const SCAN_BARCODE_FALLBACK_ID = 'fd_blueberries';

/** Demo UPCs mapped onto seed foods so a live scan can resolve a product. */
const BARCODE_TO_FOOD_ID: Record<string, string> = {
  '041196910076': 'fd_greek_yogurt',
  '036632014047': 'fd_greek_yogurt',
  '071464017506': 'fd_blueberries',
  '041570055502': 'fd_almonds',
  '024000163005': 'fd_banana',
  '021200004226': 'fd_olive_oil',
};

export function normalizeBarcode(value: string): string {
  return value.replace(/\D/g, '');
}

export function resolveBarcodeFoodId(value: string): string | null {
  const trimmed = value.trim();
  const digits = normalizeBarcode(trimmed);
  return BARCODE_TO_FOOD_ID[digits] ?? BARCODE_TO_FOOD_ID[trimmed] ?? null;
}

export function resolveQueryFoodId(
  query: string,
  foods: { id: string; name: string; brand?: string }[],
): string | null {
  const barcodeMatch = resolveBarcodeFoodId(query);
  if (barcodeMatch) return barcodeMatch;

  const needle = query.trim().toLowerCase();
  if (!needle) return null;

  const exact = foods.find((food) => food.name.toLowerCase() === needle);
  if (exact) return exact.id;

  const partial = foods.find(
    (food) =>
      food.name.toLowerCase().includes(needle) ||
      food.brand?.toLowerCase().includes(needle),
  );
  return partial?.id ?? null;
}
