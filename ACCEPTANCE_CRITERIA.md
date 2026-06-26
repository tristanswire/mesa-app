# Mesa — V1 Acceptance Criteria

**Purpose:** Single source of truth for what Mesa V1 *is*. Used to audit what's built vs. missing/regressed, and as the verification target for any automated build loop.

**How to read the confidence levels:**
- 🟢 **Structural** — verifiable by reading code/config. An audit can report these with high confidence.
- 🟡 **Behavioral** — requires the code path to actually work. An audit can only assess "looks implemented / partial / not found," NOT "confirmed working." These need manual runtime testing to truly close.

**Audit output convention:** For each criterion, report one of:
- `PASS` — built and correct
- `SUSPECT` — built but something looks off / can't be confirmed from code
- `MISSING` — not found / not implemented
- `REGRESSED` — was supposed to be there, evidence it broke
- `OUT-OF-SCOPE-LEAK` — V1.1+ feature that crept into V1

---

## 0. Scope Boundary

These define the edges of V1. Half of "what's needed" is confirming nothing out-of-scope leaked in.

### 0.1 In scope (V1)
- 🟢 Guest-only — no account required to use the app
- 🟢 Local-first: Expo SQLite + Drizzle ORM is the source of truth
- 🟢 Affiliate-only monetization (Amazon, tag `cookwithmesa-20`), surfaced ONLY in Prep Mode and Post-Cook
- 🟢 The 12 canonical screens (see §3)

### 0.2 Explicitly OUT of scope — flag as OUT-OF-SCOPE-LEAK if present and wired
- 🟢 No account/auth gating the core flow (Supabase auth deferred to V1.1)
- 🟢 No cross-device sync
- 🟢 No subscription / Plus tier / paywall
- 🟢 No Planner tab (V1.1)
- 🟢 No grocery list
- 🟢 No voice navigation
- 🟢 No Store tab anywhere in navigation

> Note: a "Manage subscription" row appears in the Profile mock (screen 06). Since V1 has no subscription, the audit should flag whether this row is present and whether it links to anything real. Expected: either absent, or present-but-inert pending a decision.

---

## 1. Navigation & Architecture (🟢 Structural)

| ID | Criterion | Status |
|----|-----------|--------|
| 1.1 | Bottom nav has exactly 3 tabs: Home / Recipes / Profile | |
| 1.2 | No Import tab and no Store tab in the tab bar | |
| 1.3 | Import is a Terracotta FAB, bottom-right, present on Home and Recipes | |
| 1.4 | FAB is 56×56pt | |
| 1.5 | Cook Mode is a full-screen sub-experience with NO tab bar | |
| 1.6 | Prep Mode is a full-screen sub-experience with NO tab bar | |
| 1.7 | Uses React Navigation (not Expo Router) | |
| 1.8 | Post-cook navigation uses `navigation.reset()` with nested state | |

---

## 2. Design System (🟢 Structural)

### 2.1 Active color tokens — must exist in theme
| Token | Hex | Use |
|-------|-----|-----|
| Cream | `#F7F2EA` | Primary background |
| Oat | `#E9DDCF` | Cards / secondary |
| Clay | `#C98F63` | Decorative ONLY — never text/functional icons |
| Terracotta | `#8A3A1E` | CTAs / logo (AA-compliant) |
| Olive | `#6F785B` | 18pt+ labels only |
| Olive Dark | `#4F5840` | Body text / captions |
| Pine | `#364032` | Cook Mode dark surface |
| Ink | `#1F1C19` | Primary text |

### 2.2 Retired tokens — must be ABSENT (flag as REGRESSED if found)
- 🟢 Plus Jakarta Sans
- 🟢 DM Sans
- 🟢 Old Terracotta `#b34519` (and `#A85D3B`)
- 🟢 Off-white `#fffbf4`

### 2.3 Typography & icons
- 🟢 2.3.1 — Inter is the only font family
- 🟢 2.3.2 — Lucide icons at 1.5px stroke; Pine on light surfaces
- 🟢 2.3.3 — Clay is NOT used for any functional icon or text (contrast fail) — grep for Clay used as text/icon color
- 🟢 2.3.4 — Ingredient amount tokens in Cook Mode use a tinted chip (Clay on Pine), 600 weight — not just underline

### 2.4 Contrast safety (🟢 Structural where checkable)
- 🟢 2.4.1 — No Terracotta CTA placed on a Pine surface (2.22:1 fail). Cook Mode CTAs use Cream/Oat fills.
- 🟢 2.4.2 — `SUPPORT_EMAIL` defined as a single constant in `src/lib/constants.ts`

---

## 3. The 12 Canonical Screens

Each screen: confirm it exists AND its defining elements are present. Structural where the element is static; behavioral where it implies a working data path.

### 3.1 Home (🟢 + 🟡)
- "Pick up where you left off" / last-cooked slot, leads the screen (library-first, not discovery-first)
- "In your Bank" row from the user's own library
- "Worth a try" discovery row appears AFTER library content
- 🟡 Last-cooked actually reflects real cook history

### 3.2 Recipes / Library (🟢 + 🟡)
- Search field
- Recipe cards in a grid
- 🟡 Search returns matches on both tags AND ingredients (report if search is title-only)

### 3.3 Import (🟡 — this is a hot zone for bugs)
- URL paste field
- Photo and Manual options present
- 🟡 3.3.1 — Clipboard auto-detect banner ("Link detected — import this?") appears when a recipe URL is on the clipboard
- 🟡 3.3.2 — URL import actually parses a real recipe end-to-end (hits the Edge Function / Claude Haiku)
- 🟡 3.3.3 — Import error handling: malformed URL / unparseable page degrades gracefully (no crash, user-facing message)

### 3.4 Cook Mode (🟡 — Mesa's core wedge, audit carefully)
- Pine dark surface by default
- 🟡 3.4.1 — Inline ingredients render INSIDE the step sentence with amount chips (the defining feature)
- 🟡 3.4.2 — Timer token renders inline; idle = Oat/Clay on Pine, active = Terracotta countdown
- 🟡 3.4.3 — Tapping a timer token starts a named countdown
- 🟡 3.4.4 — Swipe left/right navigates steps; tap screen edges as backup
- 🟡 3.4.5 — Screen wake lock is active while Cook Mode is open
- 🟡 3.4.6 — Auto light/dark follows system appearance; manual toggle in overflow
- 🟢 3.4.7 — Step number is large (40–56pt) as visual anchor
- Note: timer pill uses the flex-wrap segment approach, not inline View-in-Text

### 3.5 Prep Mode (🟡)
- Auto-generated checklist from the recipe
- Progress indicator ("2 of 5 complete")
- 🟡 3.5.1 — Haptic feedback fires on check (UINotificationFeedbackType.success)
- 🟡 3.5.2 — Inline quantity previews next to each prep item
- 🟡 3.5.3 — Affiliate product card(s) appear here, max 2 per surface
- 🟡 3.5.4 — "Finish Prep → Start Cook" carries state without forcing re-navigation

### 3.6 Profile (🟢)
- Stats (recipes / collections / this week)
- Dietary preferences, default serving size rows
- See §0.2 note re: "Manage subscription"

### 3.7 Recipe Detail (🟢 + 🟡)
- Time / servings / tag metadata
- "Start Prep" and "Start Cooking" CTAs
- Ingredients list with "Show all N" expansion

### 3.8 Onboarding — Value Prop (🟢)
- One-sentence value prop + single "Try it" CTA, no account required

### 3.9 Onboarding — Aha Moment (🟡)
- Before/After transform of a real cluttered recipe
- "Use our sample recipe instead" fallback
- 🟡 The transform actually runs (this is the activation moment)

### 3.10 Onboarding — Preferences (🟢)
- Max 3 questions (cook frequency / dietary / skill)
- No paywall, no forced account

### 3.11 Post-Cook (🟢 + 🟡)
- "How did it turn out?" rating + notes field
- 🟡 3.11.1 — Affiliate cards ("Used in this recipe"), max 2, with "via Amazon" attribution
- 🟢 3.11.2 — Disclosure line: "Affiliate links help keep Mesa ad-free"

### 3.12 Cook Mode — Light (🟢)
- Light variant passes contrast; reachable via system appearance / toggle

---

## 4. Affiliate Implementation (🟢 + 🟡)

- 🟢 4.1 — Amazon tag `cookwithmesa-20` present in affiliate link construction
- 🟢 4.2 — Affiliate cards appear ONLY in Prep Mode and Post-Cook (and recipe detail "Tools" if built) — never in tab bar, never as interstitial
- 🟢 4.3 — Max 2–4 items per surface
- 🟢 4.4 — Card pattern: photo + name + price + "via Amazon"; NO star ratings
- 🟡 4.5 — Tap opens the partner link in a system web view / share sheet, not an invisible in-app webview

---

## 5. Known Gaps From the Validation Report

These were flagged "Missing" in the April report. The audit must explicitly confirm whether each was built. (Duplicates of §3 criteria, consolidated here so none slip.)

- 🟡 5.1 — Screen wake lock (Cook Mode) — was MISSING
- 🟡 5.2 — Inline per-step timers — was MISSING
- 🟡 5.3 — iOS Share Extension (`expo-share-extension`) — was MISSING. Confirm "Share to Mesa" works from Safari/Pinterest/etc.
- 🟡 5.4 — Clipboard auto-detect on Import — was MISSING
- 🟡 5.5 — Haptic feedback on Prep checks + Cook step advance — was MISSING
- 🟡 5.6 — Swipe-to-advance in Cook Mode — was MISSING
- 🟡 5.7 — Auto light/dark in Cook Mode — was MISSING
- 🟢 5.8 — Dynamic Type support + Cook Mode text-size slider (M/L/XL)

---

## 6. Backend / Infra (🟢)

- 🟢 6.1 — Supabase project Active (note: free tier auto-pauses ~7 days idle; known dev-friction issue)
- 🟢 6.2 — `verify_jwt` status — currently `false` as a temporary unblock. **MUST revert to legacy JWT keys before external beta.** Flag current state.
- 🟢 6.3 — Recipe parsing/enrichment runs via Supabase Edge Functions (Claude Haiku)
- 🟢 6.4 — EAS build config: `autoIncrement` on, auto-submit to TestFlight

---

## 7. Launch-Blocking Checklist (the "can we expand beta" gate)

- 🟡 7.1 — JWT reverted to legacy keys and validated clean (gates external TestFlight)
- 🟡 7.2 — No crash in the core flow: Import → Recipe Detail → Prep → Cook → Post-Cook
- 🟢 7.3 — Footer privacy policy link present (App Store submission requirement)

---

*Confidence reminder: 🟡 items cannot be closed by code-reading alone. An audit reporting 🟡 as PASS means "the code appears to implement this" — final closure requires running the flow on-device.*