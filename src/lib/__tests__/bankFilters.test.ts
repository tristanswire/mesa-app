import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import {
  BANK_FILTER_CATEGORY,
  BANK_FILTER_LABELS,
  BANK_SHORTCUT_FILTERS,
  matchesBankFilter,
  parseDurationMinutes,
  type BankFilterKey,
} from '../bankFilters.ts';

// Home's chip/tile counts and the Recipes filter share these predicates, so a
// count on Home is exactly what the user sees after tapping it.

Deno.test('durations in import formats parse to minutes', () => {
  assertEquals(parseDurationMinutes('30 min'), 30);
  assertEquals(parseDurationMinutes('1 hr 20 min'), 80);
  assertEquals(parseDurationMinutes('1 hour'), 60);
  assertEquals(parseDurationMinutes('45 minutes'), 45);
  assertEquals(parseDurationMinutes('1.5 hrs'), 90);
});

Deno.test('an unparseable duration is unknown, not zero', () => {
  assertEquals(parseDurationMinutes(''), null);
  assertEquals(parseDurationMinutes('overnight'), null);
  assertEquals(parseDurationMinutes(null), null);
});

const base = { id: 'r1', duration: '25 min', tag: null, category: null };
const ctx = { tags: [] as string[], cookedIds: new Set<string>() };

Deno.test('under 30 includes 30 exactly and excludes unknown times', () => {
  assertEquals(matchesBankFilter('under30', { ...base, duration: '30 min' }, ctx), true);
  assertEquals(matchesBankFilter('under30', { ...base, duration: '31 min' }, ctx), false);
  assertEquals(matchesBankFilter('under30', { ...base, duration: '' }, ctx), false);
});

Deno.test('meal filters read category; sides maps to side', () => {
  assertEquals(matchesBankFilter('sides', { ...base, category: 'side' }, ctx), true);
  assertEquals(matchesBankFilter('breakfast', { ...base, category: 'dinner' }, ctx), false);
});

Deno.test('weeknight matches the legacy tag or an auto-tag', () => {
  assertEquals(matchesBankFilter('weeknight', { ...base, tag: 'Weeknight' }, ctx), true);
  assertEquals(matchesBankFilter('weeknight', base, { ...ctx, tags: ['weeknight'] }), true);
  assertEquals(matchesBankFilter('weeknight', base, ctx), false);
});

Deno.test('never cooked excludes recipes with a completed cook', () => {
  assertEquals(matchesBankFilter('neverCooked', base, ctx), true);
  assertEquals(matchesBankFilter('neverCooked', base, { ...ctx, cookedIds: new Set(['r1']) }), false);
});

// Recipes shows shortcuts as pills beside the categories; a key in both lists
// would get two pills for one filter.
Deno.test('shortcut pills are exactly the keys without a category', () => {
  const keys = Object.keys(BANK_FILTER_LABELS) as BankFilterKey[];
  assertEquals(
    [...BANK_SHORTCUT_FILTERS].sort(),
    keys.filter((k) => !BANK_FILTER_CATEGORY[k]).sort(),
  );
});
