import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const screenPath = resolve(scriptDirectory, '../app/(tabs)/index.tsx');
const screenSource = await readFile(screenPath, 'utf8');

const mobileViewports = [320, 375, 400];
const pageCount = (screenSource.match(/testID="dashboard-page-/g) ?? []).length;
const sideInsetMatch = screenSource.match(
  /const DASHBOARD_CAROUSEL_SIDE_INSET = (\d+);/,
);
const healthScoreInsetMatch = screenSource.match(
  /const HEALTH_SCORE_PAGE_INSET = (\d+);/,
);
const dashboardPageIds = [
  'dashboard-page-calories',
  'dashboard-page-health-score',
  'dashboard-page-workout',
];

assert.equal(pageCount, 3, 'The dashboard pager must expose exactly three pages.');
assert.ok(
  healthScoreInsetMatch,
  'The dashboard must declare a Health Score page inset.',
);
assert.equal(
  Number(healthScoreInsetMatch[1]),
  2,
  'The Health Score card must remain inset by exactly 2px on both sides.',
);
for (const pageId of dashboardPageIds) {
  const pageIdOffset = screenSource.indexOf(`testID="${pageId}"`);
  const pageSource = screenSource.slice(Math.max(0, pageIdOffset - 320), pageIdOffset);

  assert.ok(pageIdOffset >= 0, `The dashboard must expose ${pageId}.`);
  assert.match(
    pageSource,
    /width:\s*PAGE_WIDTH/,
    `${pageId} must use the pager's bounded page width.`,
  );
}
assert.match(
  screenSource,
  /testID="dashboard-page-health-score"/,
  'The mobile check must include the Health Score page.',
);
assert.match(
  screenSource,
  /testID="health-score-card"/,
  'The Health Score card must remain addressable in the mobile check.',
);
assert.match(
  screenSource,
  /paddingLeft: HEALTH_SCORE_PAGE_INSET,\s*paddingRight: HEALTH_SCORE_PAGE_INSET/,
  'The Health Score page must keep equal horizontal insets.',
);
assert.match(
  screenSource,
  /<ScrollView\s+horizontal[\s\S]*?pagingEnabled[\s\S]*?style=\{\{ width: PAGE_WIDTH \}\}[\s\S]*?testID="dashboard-pager"/,
  'The dashboard pager must remain a horizontal, page-width-bounded ScrollView.',
);
assert.ok(sideInsetMatch, 'The dashboard pager must declare a stable side inset.');

const sideInset = Number(sideInsetMatch[1]);
for (const viewportWidth of mobileViewports) {
  const pageWidth = viewportWidth - sideInset * 2;

  assert.ok(
    pageWidth > 0,
    `The dashboard page width must be positive at ${viewportWidth}px.`,
  );
  assert.ok(
    pageWidth <= viewportWidth,
    `A dashboard page must fit within the ${viewportWidth}px viewport.`,
  );
  assert.equal(
    pageWidth + sideInset * 2,
    viewportWidth,
    `The dashboard page must preserve its ${sideInset}px outer inset at ${viewportWidth}px.`,
  );
}

console.log(
  `Dashboard carousel check passed at ${mobileViewports.join(', ')}px widths.`,
);