---
name: Mesa Phase 0–1 — Scaffold + Component Library
description: Stack, design tokens, 16 components, folder structure, and phase roadmap for the Mesa recipe app
type: project
---

Mesa is an iOS-only, distraction-free recipe app built UI-first across 12 phases.

**Stack:** Expo SDK 54, React Native, TypeScript (strict), iOS App Store target only.
**Bundle ID:** com.tristanswire.mesa
**Future data layer:** Supabase (cloud) + Expo SQLite + Drizzle (offline-first) — not yet installed.

**Phase 0 complete (2026-04-20):** Expo scaffold, design tokens, smoke-test screen.
- `src/theme/` — colors, typography, spacing, radii, shadows, barrel index
- `src/icons/index.ts` — Lucide re-exports; default strokeWidth=1.5 (FAB exception: strokeWidth=2)

**Phase 1 complete (2026-04-20):** 16 components in `src/components/`.
Text, SectionLabel, Button, IconButton, Input, RecipeCard, StepCard, IngredientChip, TimerToken,
PrepChecklistItem, ProgressBar, TabBar, FAB, FeatureCard, AffiliateCard, ClipboardBanner.
- New deps: expo-haptics, react-native-safe-area-context
- `creamMuted` color token added (tinted cream on pine for Cook Mode step number)
- `shadows.ts` added (none / card / fab)
- App.tsx = living component showcase (11 sections)

**Phase 2 next:** Screens + React Navigation (tabs + FAB + modals).

**Why UI-first:** All 12 screens built against tokens before any data/auth wired.
**How to apply:** Do not add navigation, data layer, or auth until their designated phases.
