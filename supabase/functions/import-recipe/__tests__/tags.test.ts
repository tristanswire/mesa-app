import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { durationToMinutes, normalizeTags, timeBucket } from '../tags.ts';

// Tags carry cuisine and descriptive attributes. Meal type is deliberately NOT
// among them — that's the `category` column's job — and the time bucket is
// computed here rather than asked of the model.

// ── Duration parsing ────────────────────────────────────────────────────────

Deno.test('minutes parse from the common duration spellings', () => {
  assertEquals(durationToMinutes('30 min'), 30);
  assertEquals(durationToMinutes('45 minutes'), 45);
  assertEquals(durationToMinutes('About 20 mins'), 20);
});

Deno.test('hours and combined durations parse', () => {
  assertEquals(durationToMinutes('1 hr'), 60);
  assertEquals(durationToMinutes('1 hour'), 60);
  assertEquals(durationToMinutes('1 hr 20 min'), 80);
  assertEquals(durationToMinutes('2 hours 30 minutes'), 150);
});

Deno.test('a bare number reads as minutes', () => {
  assertEquals(durationToMinutes('45'), 45);
});

Deno.test('an unreadable duration yields null, never a guess', () => {
  assertEquals(durationToMinutes('overnight'), null);
  assertEquals(durationToMinutes(''), null);
  assertEquals(durationToMinutes('0 min'), null);
});

// ── Time buckets ────────────────────────────────────────────────────────────

Deno.test('durations land in the right bucket', () => {
  assertEquals(timeBucket('20 min'), 'under 30 min');
  assertEquals(timeBucket('30 min'), '30-60 min');
  assertEquals(timeBucket('1 hr'), '30-60 min');
  assertEquals(timeBucket('1 hr 20 min'), 'over 1 hr');
});

Deno.test('an unreadable duration gets no bucket', () => {
  assertEquals(timeBucket('overnight'), null);
});

// ── Tag normalization ───────────────────────────────────────────────────────

Deno.test('model tags are lowercased and the time bucket appended', () => {
  assertEquals(normalizeTags(['Italian', 'One-Pan'], '25 min'), [
    'italian',
    'one-pan',
    'under 30 min',
  ]);
});

// The reconciliation rule: `category` already carries meal type, so a tag
// repeating it would show the same fact twice.
Deno.test('meal-type tags are dropped as category duplicates', () => {
  assertEquals(normalizeTags(['dinner', 'thai', 'dessert'], '40 min'), ['thai', '30-60 min']);
});

Deno.test('duplicates and blanks are dropped', () => {
  assertEquals(normalizeTags(['Thai', 'thai', '  ', 'THAI'], '40 min'), ['thai', '30-60 min']);
});

Deno.test('model tags are capped at four, bucket still added', () => {
  assertEquals(normalizeTags(['a', 'b', 'c', 'd', 'e'], '10 min'), [
    'a', 'b', 'c', 'd', 'under 30 min',
  ]);
});

Deno.test('over-long tags and non-strings are skipped', () => {
  assertEquals(
    normalizeTags(['italian', 'a'.repeat(25), 42, null, { name: 'x' }], '10 min'),
    ['italian', 'under 30 min'],
  );
});

Deno.test('a missing tags field still yields the computed bucket', () => {
  assertEquals(normalizeTags(undefined, '90 min'), ['over 1 hr']);
  assertEquals(normalizeTags(null, '15 min'), ['under 30 min']);
});

Deno.test('an unreadable duration yields tags with no bucket', () => {
  assertEquals(normalizeTags(['italian'], 'overnight'), ['italian']);
  assertEquals(normalizeTags(undefined, 'overnight'), []);
});

Deno.test('a model-emitted bucket is not duplicated', () => {
  assertEquals(normalizeTags(['under 30 min', 'thai'], '20 min'), ['under 30 min', 'thai']);
});
