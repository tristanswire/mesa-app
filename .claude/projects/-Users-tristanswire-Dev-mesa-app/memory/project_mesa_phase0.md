---
name: Mesa Phase 0–2 — Scaffold + Components + Navigation
description: Stack, design tokens, 16 components, navigation scaffold, and phase roadmap for the Mesa recipe app
type: project
---

Mesa is an iOS-only, distraction-free recipe app built UI-first across 12 phases.

**Stack:** Expo SDK 54, React Native, TypeScript (strict), iOS App Store target only.
**Bundle ID:** com.tristanswire.mesa
**Future data layer:** Supabase (cloud) + Expo SQLite + Drizzle (offline-first) — not yet installed.

**Phase 0 complete (2026-04-20):** Expo scaffold, design tokens, smoke-test screen.
- `src/theme/` — colors, typography, spacing, radii, shadows, barrel index
- `src/icons/index.ts` — Lucide re-exports; default strokeWidth=1.5 (FAB exception: strokeWidth=2)

**Phase 1 complete (2026-04-21):** 16 components in `src/components/`.
Text, SectionLabel, Button, IconButton, Input, RecipeCard, StepCard, IngredientChip, TimerToken,
PrepChecklistItem, ProgressBar, TabBar, FAB, FeatureCard, AffiliateCard, ClipboardBanner.
- New deps: expo-haptics, react-native-safe-area-context
- `creamMuted` color token added; `shadows.ts` added (card / fab)

**Phase 2.0 complete (2026-04-21):** Navigation scaffold wired.
- New deps: @react-navigation/native, /native-stack, /bottom-tabs, react-native-screens, react-native-gesture-handler
- `src/navigation/` — RootNavigator, MainNavigator, TabNavigator, OnboardingNavigator, MesaTabBar adapter, types, linking scaffold
- `src/screens/` — 12 placeholder screens (Home, Recipes, Profile, RecipeDetail, PrepMode, CookMode, CookModeLight, PostCook, Import, 3×Onboarding)
- `src/screens/Showcase/` — Phase 1 component showcase preserved here; accessible from Profile
- App.tsx replaced with NavigationContainer + GestureHandlerRootView
- Onboarding gated to Profile "Open Onboarding" button (Phase 3 adds first-launch gate)
- FAB on Home + Recipes only; navigates to Import modal

**Phases 2.1–2.10 complete:** All 10 content screens + onboarding built (Home, Recipes, RecipeDetail, PrepMode, CookMode dark/light, PostCook, Import, Profile, ValueProp, AhaMoment, Preferences). See git log for details.

**Phase 2.11 complete (2026-04-22):** Cross-screen consistency audit (polish pass).
- Token fix: `cookModeBody` color corrected from `white` → `cream`; compensating overrides removed from ShowcaseScreen
- Promoted to `/components/`: `Pill` (ex FilterPill/OnboardingPill), `SettingRow` (ex local SettingRow/OptionRow)
- `src/components/index.ts` exports Pill and SettingRow
- Empty states: Home + Recipes each have `showEmptyState = false` flag + full empty-state UI (ChefHat icon, headline, caption, CTA to Import)
- `ChefHat` added to `src/icons/index.ts`
- Phase 3 loading skeleton TODOs added to Home + Recipes
- ClipboardBanner title shortened: "Link detected — import this?" → "Link detected"
- AhaMomentScreen: afterTop container gets `borderTopWidth: 1, borderTopColor: colors.oat`; afterBottom gets `minHeight: 120`
- TypeScript: 0 errors
- expo-doctor: 2 pre-existing warnings (expo-font version mismatch/duplicate) — flagged for Phase 3

**Phase 3 next:** Functionality — local DB (Expo SQLite + Drizzle), real recipe import, auth (Supabase), motion polish, loading skeletons, onboarding gating.

**Why UI-first:** All 12 screens built against tokens before any data/auth wired.
**How to apply:** Do not add data layer or auth until their designated phases.
