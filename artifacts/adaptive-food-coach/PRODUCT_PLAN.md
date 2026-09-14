# Adaptive Food Coach — Mobile App Plan

## 1. Product direction

Build a practical nutrition and metabolic-health coach for people using, tapering, or coming off GLP-1 medication.

The app’s core promise:

> Eat well, preserve muscle, manage appetite, and maintain progress without obsessively tracking every calorie.

The first release should help a user answer one question quickly: **What should I eat next, given how I feel and what my day actually looks like?**

## 2. What the Figma contributes

The supplied Figma section is a large light-mode health app with:

- goal-based registration and desired-weight setup
- a personalized home experience
- food logging and food-detail flows
- progress charts and health metrics
- milestones and social sharing
- groups and community flows
- profile, personal details, measurement editors, and settings

The visual system is mobile-native and structured around:

- 402 × 874 phone frames
- light surfaces with dark, high-contrast primary actions
- compact headers and persistent bottom navigation
- rounded cards and sheets
- circular progress graphics and colorful health illustrations
- focused, single-purpose forms
- metric editors that use tactile controls rather than dense text fields

We should reuse this interaction language, but not reproduce the entire feature inventory. The MVP should exclude broad community, large food-database, course, and marketplace features.

## 3. MVP audience and boundaries

### Primary audience

Adults using or recently stopping GLP-1 medication who want to:

- preserve muscle
- manage reduced or inconsistent appetite
- reduce nausea or constipation triggers
- eat culturally familiar meals
- maintain weight progress without rigid calorie tracking

### Safety boundary

- Coaching is educational and supportive, not medical diagnosis.
- Medication changes remain under a clinician’s direction.
- Severe, persistent, or urgent symptoms direct users to appropriate medical care.
- Recommendations must respect declared allergies, dietary restrictions, and clinician guidance.

## 4. Navigation and screen map

Use five primary tabs:

1. **Today** — next meal, current priorities, symptom check-in, and the most useful action now.
2. **Log** — photo, voice, or text meal capture with confirmation and correction.
3. **Plan** — flexible meal ideas adapted to schedule, preferences, groceries, budget, and food tolerance.
4. **Progress** — trends for weight, protein/fiber consistency, hydration, symptoms, energy, and strength habits.
5. **Coach** — conversational support, weekly review, and one active behavior experiment.

Supporting flows:

- Welcome and onboarding
- Goal and medication-context setup
- Dietary preferences, culture, allergies, budget, schedule, and cooking-time setup
- Meal review and correction
- Side-effect check-in
- Recommendation detail and substitutions
- Weekly review
- Profile, personal details, goals, units, privacy, and notification settings
- Optional dietitian-review request

## 5. Core user journeys

### A. Onboarding

1. Explain the value and safety boundary.
2. Select current context: using, tapering, stopped, or not using GLP-1 medication.
3. Capture goals such as muscle preservation, weight maintenance, symptom management, or healthier routines.
4. Capture relevant baseline information and preferred units.
5. Capture dietary pattern, allergies, cultural foods, budget, cooking confidence, meal schedule, and available time.
6. Choose a small first-week focus.
7. Land on Today with the first contextual recommendation.

### B. Daily coaching

1. User opens Today.
2. App checks hunger, energy, and relevant symptoms with one-tap controls.
3. App presents one recommended next meal plus two alternatives.
4. User can swap based on time, budget, ingredients, restaurant context, or tolerance.
5. After eating, user logs the meal and confirms the AI interpretation.
6. The day’s protein, fiber, hydration, and meal consistency update.

### C. Meal capture

1. Start with photo, voice, or text.
2. Show the interpreted foods in plain language.
3. Ask, “Is this right?” and make corrections fast.
4. Estimate the useful nutrition signals without making calories the main score.
5. Give one short, actionable suggestion.

### D. Weekly review

1. Summarize what worked.
2. Identify where meals or symptoms broke down.
3. Connect outcomes to schedule and context rather than blame.
4. Recommend one experiment for the next seven days.
5. Let the user accept, edit, or replace it.

## 6. Recommendation model

Each meal recommendation should consider:

- time of day and recent meals
- hunger and appetite level
- protein and fiber remaining for the day
- hydration
- nausea, constipation, reflux, fatigue, and food tolerance
- medication timing only as user-provided context
- dietary pattern, culture, allergies, and disliked foods
- available ingredients
- cooking time and skill
- budget
- restaurant or travel context
- strength-training day versus rest day

Every recommendation should include:

- a practical meal or snack
- why it fits right now
- estimated protein and fiber
- portion/tolerance guidance where relevant
- quick swaps
- an option to report “not appealing,” “not available,” or “doesn’t feel tolerable”

## 7. Data model

### User profile

- display name
- units
- age range
- height and weight history
- goals
- GLP-1 status
- dietary pattern
- allergies and exclusions
- cultural food preferences
- budget, schedule, cooking time, and cooking confidence

### Daily check-in

- hunger
- appetite
- energy
- hydration
- nausea
- constipation
- reflux
- food tolerance notes

### Meal log

- capture method
- timestamp and meal type
- image or original text
- interpreted food items
- user corrections
- estimated protein, fiber, vegetables, hydration contribution, and optional calories
- satisfaction and tolerance

### Recommendation

- meal suggestion
- rationale
- estimated nutrition signals
- substitutions
- contextual inputs used
- accepted, swapped, dismissed, or completed state

### Weekly experiment

- behavior
- target frequency
- reason
- completion history
- reflection

## 8. Delivery phases

### Phase 1 — Clickable product foundation

- Apply the Figma-derived visual language.
- Build onboarding and the five-tab app shell.
- Implement Today with sample personalized recommendations.
- Implement text meal logging and correction.
- Persist profile, check-ins, logs, and experiments locally.

### Phase 2 — Complete MVP loops

- Add native photo meal capture.
- Add voice-to-text capture.
- Add symptom-aware meal substitutions.
- Build Plan, Progress, and Weekly Review.
- Add profile and measurement editors based on the Figma patterns.

### Phase 3 — Adaptive intelligence

- Add AI-assisted meal interpretation and coaching.
- Create a transparent recommendation policy and confidence handling.
- Add culturally relevant substitutions.
- Add safety classification and escalation messaging.
- Measure recommendation acceptance and useful outcomes.

### Phase 4 — Production readiness

- Add account authentication and cloud sync.
- Add consent, privacy controls, export, and deletion.
- Add clinician-reviewed health content and safety review.
- Add analytics, accessibility verification, reliability checks, and App Store preparation.
- Pilot optional dietitian review before building a broader care marketplace.

## 9. MVP success measures

Track:

- onboarding completion
- percentage of days with a check-in
- recommendation acceptance or successful swap rate
- meal logs completed after starting capture
- correction rate and AI confidence
- weekly experiment acceptance and completion
- protein/fiber consistency trend
- symptom trend
- strength-habit consistency
- week-1 and week-4 retention

Avoid using weight loss alone as the product’s success measure.

## 10. Decisions to validate with users

Before production development, test these assumptions:

1. Users want “what to eat next” more than another daily score.
2. Protein, fiber, hydration, symptoms, and consistency are understandable without calorie-first framing.
3. Three contextual options are more useful than a rigid meal plan.
4. A short weekly experiment is more engaging than daily educational lessons.
5. Users are comfortable providing medication context when the safety boundary is explicit.
6. Cultural and schedule-based adaptation materially improves recommendation acceptance.

## 11. Recommended first implementation slice

Build one polished end-to-end loop:

1. lightweight onboarding
2. Today recommendation
3. symptom check-in
4. text meal capture
5. interpretation confirmation/correction
6. updated daily protein/fiber guidance
7. one weekly experiment

This slice proves the distinct product value before investing in a large food database, social features, detailed courses, or clinical operations.