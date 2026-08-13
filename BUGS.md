# Mesa — Bug Log

Running log for the pre-launch bug-hunting stage. One row per bug. Keep it terse — this is a tracker, not a writeup.

**Workflow:** New bugs go in the table at the top. When fixed, move the row to the Resolved log at the bottom (don't delete — the history is useful for spotting regressions). The audit's "bugs noticed in passing" section lands here.

**ID convention:** `MESA-NNN`, incrementing. Don't reuse numbers.

---

## How to triage

**Severity:**
- `S1` — Crash, data loss, or core flow blocked (Import → Prep → Cook → Post-Cook). Fix before next build.
- `S2` — Feature broken or wrong, but flow continues / has a workaround.
- `S3` — Cosmetic, polish, theming drift, minor copy.

**Status:** `OPEN` → `IN PROGRESS` → `FIXED` (verified on-device) → moved to Resolved.
Also: `WONTFIX` (with a reason) and `CANT-REPRO`.

**Area** (keep consistent for filtering): `Import` · `CookMode` · `PrepMode` · `Home` · `Recipes` · `RecipeDetail` · `Profile` · `Onboarding` · `PostCook` · `Affiliate` · `Nav` · `Theme` · `Backend` · `Build`

---

## Open Bugs

> **Status note:** The `IN PROGRESS` rows below have a fix written in the working tree (post-audit fix Rounds 1–2) but are **not yet on-device-verified** and **not yet committed/built** — per this log's own rule, they only move to Resolved after on-device verification. Treat them as a verification checklist for the next build. The fix work is uncommitted; commit it before it's lost.

| ID | Sev | Area | Summary | Repro / Trigger | Suspected cause | Criterion | Status |
|----|-----|------|---------|-----------------|-----------------|-----------|--------|
| MESA-011 | S3 | Home | Greeting recomputes `new Date()` on every render (won't tick over without a re-render) | n/a — cosmetic | inline `getTimeGreeting()` per render (`HomeScreen.tsx`) | — | OPEN |
| MESA-003 | S2 | Home | Hero "Last Cooked" also shows as the first "In your Bank" card (duplicate) | Home with ≥1 cooked recipe | hero `all[0]` + bank `slice(0,2)` overlap; hero wasn't from cook history | 3.1 | IN PROGRESS (R1 — verify) |
| MESA-004 | S3 | Home | "Worth a try" row implied discovery but showed the user's own library | Home with ≥3 recipes | mislabeled own-library slice; relabeled "More from your bank" | 3.1 | IN PROGRESS (R1 — verify) |
| MESA-005 | S2 | Onboarding | Aha-moment CTA labels swapped vs. behavior (primary loaded the sample; "Use our sample…" link skipped) | Onboarding → Aha screen | label/behavior mismatch | 3.9 | IN PROGRESS (R1 — verify) |
| MESA-006 | S3 | Recipes | Empty-state copy promised "take a photo / enter manually" — neither is built | Recipes with 0 recipes | stale copy | 3.3 | IN PROGRESS (R1 — verify) |
| MESA-007 | S2 | Affiliate | More than 2 affiliate cards render in Prep Mode + Recipe Detail | recipe with ≥3 tools | no `.slice(0,2)` cap (only PostCook capped) | 4.3 | IN PROGRESS (R1 — verify) |
| MESA-008 | S3 | Theme | Clay used as section-label text (app-wide) + Sun icon — fails WCAG AA (2.48:1 on Cream) | most screens (labels); Cook Mode light (Sun icon) | `SectionLabel`/`typography.sectionLabel` defaulted to `clay`; Sun used `colors.clay` | 2.3.3 | IN PROGRESS (R2 — verify) |
| MESA-009 | S2 | Theme | Terracotta primary CTA on Pine surface (2.22:1 fail) | Cook Mode Next/Finish btn; PostCook Save btn | global `primary` variant (Terracotta) on a Pine bg | 2.4.1 | IN PROGRESS (R2 — `cookPrimary` variant — verify) |
| MESA-010 | S3 | CookMode | Light-mode step number rendered in Clay (fails AA) | Cook Mode in light appearance | `stepNumberColor: 'clay'` in light theme | 3.12 | IN PROGRESS (R2 — Terracotta — verify) |

> **Launch-blocking gates: both clear.** MESA-012 (JWT verification) and MESA-013 (privacy policy) are resolved — see the Resolved Log. No launch-blocking gates remain open.
> **Criterion** = the ACCEPTANCE_CRITERIA.md ID if the bug maps to one, else `—`.
> Still-MISSING features (not bugs, tracked in ACCEPTANCE_CRITERIA, not duplicated here): library search is title-only (3.2); Photo/Manual import (3.3) — deferred to a later round.

---

## Quick-add template

Copy this when logging a bug away from the table:

```
ID:        MESA-
Severity:  S1 / S2 / S3
Area:      
Summary:   (one line — what's wrong)
Repro:     1. … 2. … 3. → observed vs expected
Device:    (simulator / which iPhone + iOS version)
Build:     (e.g. Build 7, v1.0.0)
Criterion: (ACCEPTANCE_CRITERIA id or —)
Notes:     
```

The two fields people skip and then regret: **Repro** (exact steps + what you expected vs. saw) and **Build** (which build it appeared on — essential for confirming a fix and catching regressions).

---

## Watch list — known-fragile areas

Not bugs yet, but the spots most likely to break based on the build history and validation report. Re-check these after any change touching them:

- **Cook Mode timer pill rendering** — uses flex-wrap segments, not inline View-in-Text. Wrapping/layout regresses easily on long step sentences.
- **Inline ingredient chips** — Clay-on-Pine token rendering inside step text. Verify chips don't break sentence flow or clip. Note: the M/L/XL slider scales step text but NOT chips, so at L/XL chips read smaller than surrounding words (intended) — confirm they still align and don't clip.
- **Cook Mode swipe + M/L/XL text size (Round 3a)** — swipe-to-navigate is **`react-native-gesture-handler` only — NO Reanimated**, and the step transition is an **instant change, not a slide**. Fragile spots: horizontal-swipe vs. vertical-scroll inside the step `ScrollView` (disambiguated by `activeOffsetX`/`failOffsetY`; if they fight, swap to RNGH's `ScrollView` or add `simultaneousWithExternalGesture`); timer-chip taps being eaten by the pan; the big step number lagging the swipe; an over-swipe on the last step must NOT finish the cook (guarded — finishing stays the button). Slider scales step text only, caps Dynamic-Type compounding at 1.4×, and persists via AsyncStorage (`mesa.cookmode.textSize`). Needs a native dev build to run (gesture-handler native module) — Metro reload won't exercise it. NOTE: this stack does **not** use Reanimated; if anyone adds it later, its Babel plugin must be LAST in `babel.config.js` (currently no such plugin, correctly).
- **Post-cook navigation** — `navigation.reset()` with nested state. Easy to land on the wrong screen or lose the back stack.
- **Import → Edge Function path** — Claude Haiku parse. Fails silently if Supabase is paused (free tier) or the page is unparseable. Check error states, not just happy path.
- **Supabase auto-pause** — free tier pauses ~7 days idle; silently breaks image loads + imports. If "images won't load" appears, check project status FIRST before chasing a code bug.
- **Theme drift** — retired tokens (`#A85D3B`, `#b34519`, `#fffbf4`, Plus Jakarta Sans, DM Sans) sneaking back in via copy-paste.
- **`verify_jwt = true`** (re-enabled, MESA-012) — the import path now depends on the client shipping the **legacy JWT anon key** (`eyJ...`). If a build is ever cut with a publishable key (`sb_publishable_*`), the gateway rejects it as `UNAUTHORIZED_INVALID_JWT_FORMAT` and imports break with no app-side code change. Check `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the EAS env first if imports start 401ing.

---

## Resolved Log

Move fixed rows here. Keep newest at top.

| ID | Sev | Area | Summary | Fixed in build | Fix note |
|----|-----|------|---------|----------------|----------|
| MESA-014 | S2 | CookMode | Light-mode "Next Step" button invisible — Cream fill on the Cream background (1:1 contrast) | Build 9 | **Regression introduced by the MESA-009 fix**: `cookPrimary` (Cream fill / Pine text, built for the Pine surface) was hardcoded at the call site instead of branching per appearance, so light mode rendered background-on-background. Added `primaryButtonVariant` to the Cook Mode theme table (`CookModeView.tsx`) — light → `primary` (Terracotta `#8A3A1E` fill), dark → `cookPrimary` (unchanged). "← Previous" already correct (Oat/Ink) in both modes. `tsc` clean. Commit `43f5bd4`. **Verified on-device on Build 9 — Terracotta on Cream, fully visible.** |
| MESA-013 | S1 | Profile | No privacy policy link in-app — App Store submission requirement | Build 9 | Privacy policy live at <https://mesa-marketing-one.vercel.app/privacy> with footer link. Fixed in the **marketing repo** (commit `7546d49`), not this repo — no app-side code change. Closes launch-blocking gate 7.3. |
| MESA-012 | S1 | Backend | `verify_jwt = false` in `supabase/config.toml` — must revert to legacy JWT keys before external beta | Build 8 | Root cause was the client env, not the function: EAS production carried a publishable key (`sb_publishable_*`) the gateway rejects as `UNAUTHORIZED_INVALID_JWT_FORMAT`. With the legacy JWT anon key (`eyJ...`) restored and baked into Build 8, set `verify_jwt = true` (`supabase/config.toml`) and redeployed `import-recipe`. Verified: `curl` with **no** auth header → `401 UNAUTHORIZED_NO_AUTH_HEADER`; same call with the anon key → `200`; live import from Build 8 on TestFlight succeeds. Client path audited unchanged — `supabase.functions.invoke` attaches `Authorization` automatically. Anthropic API cost exposure re-gated. |
| MESA-002 | S2 | Nav | Component Showcase (dev gallery) reachable in shipping build | Build 8 | Gated the Profile entry point behind `__DEV__` so it renders in dev builds only. Route left registered in `MainNavigator` (unreachable with no entry point and no deep link). `tsc` clean. **Verified on the Build 8 release/TestFlight build — the Showcase link is absent.** |
| MESA-001 | S2 | Build | Watch-list claimed a "Round 3a-anim" added Reanimated for a swipe **slide** transition + a "Babel plugin must stay LAST" requirement — none of that exists | doc (this edit) | Verified: no `react-native-reanimated` in `package.json`, `node_modules`, or `babel.config.js`; no such commit. Round 3a swipe is gesture-handler-only with an **instant** (not slide) transition. Corrected the watch-list entry. Risk if left: someone "restores" a Reanimated Babel plugin with no Reanimated installed → broken build (would've been S1), or wastes time chasing a slide-transition bug that can't exist. |
