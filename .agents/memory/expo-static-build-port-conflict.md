---
name: Expo static build port conflict
description: The mobile static-build helper probes Metro on port 8081, which can collide with the mockup preview workflow.
---

The Expo static build helper assumes Metro is available on port 8081. In this workspace, the mockup preview can already occupy that port, causing the helper to stop before bundling.

**Why:** The normal Expo workflow uses its managed port and can remain healthy while the one-off static build fails during Metro startup.

**How to apply:** Treat a static-build failure at Metro startup as an environment port collision first; validate the focused checks and typecheck separately before changing app code.