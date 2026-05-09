# Mesa Maestro Test Suite

Critical-path regression tests for Mesa's core user flows.

## Running

Install Maestro: `brew install maestro`

Run all tests: `maestro test .maestro/`

Run a single test: `maestro test .maestro/01-onboarding-completes.yaml`

The simulator must be running with Mesa installed before invoking `maestro test`.

## Tests

- `01-onboarding-completes.yaml` — Onboarding flow → Import modal → Home
- `02-recipes-list-renders.yaml` — Recipes tab loads with seeded data
- `03-recipe-detail-and-cook-mode.yaml` — Recipe Detail → Cook Mode
- `04-prep-mode.yaml` — Prep Mode → Begin Cooking
- `05-import-flow.yaml` — Real import via Edge Function (costs ~$0.014 per run)

## Adding tests

Reference: https://maestro.mobile.dev/api-reference/commands

Each YAML file is a sequence of commands. Tap, assert, navigate, input text, etc.

For elements Maestro can't find by visible text, add a `testID` to the
component and reference it via `id: "..."` in the YAML. Existing testIDs:

- `fab-import` — the FAB on Home and Recipes that opens the Import modal
