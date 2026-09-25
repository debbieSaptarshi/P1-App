# IIT Bombay campus calorie accuracy

AI identification is only step 1. The server then **replaces model calories** with `catalog kcal × (portionGrams / servingGrams) + extra oil`, and returns a **range** until the user confirms place, portion, and oil.

## What the model actually does now

1. Take hostel, outlet, caption, and meal slot from the request.
2. Retrieve ~24 campus dishes. With a caption, rank by text. With only a photo, mix about 12 mess + 8 canteen + 4 nearby so Aroma / H2 / Laxmi can still match. The app also sends meal slot from local time.
3. Ask vision only to **identify which catalog rows are on the plate** and **how large they are**.
4. Replace LLM calories with `catalog kcal × (portionGrams / servingGrams) + extra oil`.
5. Show a calorie range on the review screen. Recalculate locally when the user sets **mess/home/restaurant**, **portion scale**, and **extra oil**.
6. WhatsApp follows the same two taps (place, then oil) and stores them on the meal for the nutritionist.

## System prompt (food / label / text)

The live prompt is `CAMPUS_FOOD_SYSTEM` in `src/prompts.ts`. Keep these rules if you edit it:

- Rank mess > campus canteen > off-campus restaurant.
- Prefer `catalogId` over a free-text recipe.
- Require grams on `servingSize`.
- Count rotis, katori fill, and visible oil.
- Never claim exact nutrition; never invent unread labels.

User message should stay JSON: `{ task, description, hostel, outletId, mealSlot, campusCatalog, preferences, estimateVisiblePortion }`. Do not put the catalog in the system prompt — it changes per request and would bust the prompt cache poorly. The system prompt stays stable.

## Photo protocol for the IITB pilot

Ask people to:

1. Photograph **before mixing** dal into rice if they can.
2. Include a **roti, spoon, or steel katori** in frame for scale.
3. Shoot from ~45°, whole plate, one photo.
4. Caption: `lunch | H14 mess | 2 roti + dal + rice | extra oil? no`.

A second photo of leftovers is optional and more valuable than a prettier first shot.

## What still needs humans

| Error source | Fix |
|---|---|
| Mess oil and gravy vary by day | Nutritionist notes on `food_events`; weekly median oilTsp per dish |
| AI names the dish but guesses grams | User confirms roti count / katori fill with the portion stepper on review |
| Hidden oil, ghee, restaurant gravy | Extra oil chips (none / 1 tsp / 2 tsp); restaurant context widens the high end until oil is confirmed |
| Catalog stale vs this week’s menu | Re-scrape Aroma/H2; mess council menu photo every Sunday |
| Mixed thali | Return **multiple foods**, not one “veg meal” calorie |

Do not use raw AI calories as a study outcome. Use catalog-scaled values after user confirm, then RD review on a sample.

## Later upgrades (not in this slice)

- High image detail is already on for food photos; keep plate crops tight.
- Fine-tune or few-shot only after ~200 RD-labelled plates.
- Reference-object detection (katori diameter) if photo quality is consistently poor.
- Mess-menu-of-the-day override so Monday poha beats a stale alias.
