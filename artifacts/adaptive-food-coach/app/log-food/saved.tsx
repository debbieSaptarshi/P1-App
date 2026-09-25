import { Redirect } from 'expo-router';

/**
 * Saved Foods lives on the Log Food category tab row (Figma
 * “Log food / Saved Food”). Keep this route so older links still work.
 */
export default function SavedFoodsScreen() {
  return <Redirect href="/log-food?tab=saved" />;
}
