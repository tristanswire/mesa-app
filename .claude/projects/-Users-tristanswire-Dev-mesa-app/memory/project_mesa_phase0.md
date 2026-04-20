---
name: Mesa Phase 0 — Project Scaffold
description: Stack, design tokens, folder structure, and phase roadmap for the Mesa recipe app
type: project
---

Mesa is an iOS-only, distraction-free recipe app built UI-first across 12 phases.

**Stack:** Expo SDK 54, React Native, TypeScript (strict), iOS App Store target only.
**Bundle ID:** com.tristanswire.mesa
**Future data layer:** Supabase (cloud) + Expo SQLite + Drizzle (offline-first) — NOT in Phase 0.

**Phase 0 complete (2026-04-20):** Expo project initialized, design tokens wired, smoke-test screen.
- `src/theme/` — colors, typography, spacing, radii, barrel index
- `src/icons/index.ts` — Lucide re-exports; default strokeWidth=1.5
- `App.tsx` — smoke-test screen (color swatches, type scale, spacing bars)

**Phase 1 next:** Build the 15 reusable components in `src/components/` against the token system.
**Phase 2:** Screens + React Navigation (tabs + FAB + modals).

**Why UI-first:** All 12 screens built against tokens before any data/auth wired.
**How to apply:** Do not add navigation, data layer, or auth until their designated phases.
