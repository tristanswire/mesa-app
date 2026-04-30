-- Mesa — Supabase Postgres schema
-- Mirror of the local SQLite schema (src/db/schema.ts) with RLS enabled.
-- Paste into the Supabase SQL Editor and run once.
--
-- Notes:
--   * IDs are uuid. The local SQLite client stores UUIDs as text but Postgres uuid
--     accepts the same canonical string format — they round-trip cleanly.
--   * user_id references auth.users(id). Guest users (no auth.users row yet) cannot
--     write rows here — sync is gated on signup, which happens in Phase 3.10.
--   * RLS policies scope every row to its owner via auth.uid().

------------------------------------------------------------
-- recipes
------------------------------------------------------------
create table public.recipes (
  id              uuid primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  duration        text not null,
  servings        integer not null default 4,
  tag             text,
  tint_key        text,
  source_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  synced_at       timestamptz,
  is_deleted      boolean not null default false
);
create index recipes_user_id_idx on public.recipes(user_id);

alter table public.recipes enable row level security;

create policy "recipes select own" on public.recipes
  for select using (user_id = auth.uid());
create policy "recipes insert own" on public.recipes
  for insert with check (user_id = auth.uid());
create policy "recipes update own" on public.recipes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recipes delete own" on public.recipes
  for delete using (user_id = auth.uid());

------------------------------------------------------------
-- ingredients
------------------------------------------------------------
create table public.ingredients (
  id              uuid primary key,
  recipe_id       uuid not null references public.recipes(id) on delete cascade,
  amount          text not null,
  name            text not null,
  prep            text,
  order_index     integer not null
);
create index ingredients_recipe_id_idx on public.ingredients(recipe_id);

alter table public.ingredients enable row level security;

create policy "ingredients select via recipe" on public.ingredients
  for select using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "ingredients insert via recipe" on public.ingredients
  for insert with check (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "ingredients update via recipe" on public.ingredients
  for update using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "ingredients delete via recipe" on public.ingredients
  for delete using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );

------------------------------------------------------------
-- steps
------------------------------------------------------------
create table public.steps (
  id                uuid primary key,
  recipe_id         uuid not null references public.recipes(id) on delete cascade,
  order_index       integer not null,
  segments_json     text not null,
  ingredients_json  text not null,
  timers_json       text not null
);
create index steps_recipe_id_idx on public.steps(recipe_id);

alter table public.steps enable row level security;

create policy "steps select via recipe" on public.steps
  for select using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "steps insert via recipe" on public.steps
  for insert with check (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "steps update via recipe" on public.steps
  for update using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "steps delete via recipe" on public.steps
  for delete using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );

------------------------------------------------------------
-- prep_items
------------------------------------------------------------
create table public.prep_items (
  id                uuid primary key,
  recipe_id         uuid not null references public.recipes(id) on delete cascade,
  label             text not null,
  duration          text,
  default_checked   boolean not null default false,
  order_index       integer not null
);
create index prep_items_recipe_id_idx on public.prep_items(recipe_id);

alter table public.prep_items enable row level security;

create policy "prep_items select via recipe" on public.prep_items
  for select using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "prep_items insert via recipe" on public.prep_items
  for insert with check (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "prep_items update via recipe" on public.prep_items
  for update using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "prep_items delete via recipe" on public.prep_items
  for delete using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );

------------------------------------------------------------
-- tools
------------------------------------------------------------
create table public.tools (
  id              uuid primary key,
  recipe_id       uuid not null references public.recipes(id) on delete cascade,
  name            text not null,
  price           text not null,
  partner         text not null,
  affiliate_url   text,
  order_index     integer not null
);
create index tools_recipe_id_idx on public.tools(recipe_id);

alter table public.tools enable row level security;

create policy "tools select via recipe" on public.tools
  for select using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "tools insert via recipe" on public.tools
  for insert with check (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "tools update via recipe" on public.tools
  for update using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "tools delete via recipe" on public.tools
  for delete using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );

------------------------------------------------------------
-- cooks
------------------------------------------------------------
create table public.cooks (
  id              uuid primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  recipe_id       uuid not null references public.recipes(id) on delete cascade,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  rating          integer,
  notes           text,
  synced_at       timestamptz
);
create index cooks_user_id_idx on public.cooks(user_id);
create index cooks_recipe_id_idx on public.cooks(recipe_id);

alter table public.cooks enable row level security;

create policy "cooks select own" on public.cooks
  for select using (user_id = auth.uid());
create policy "cooks insert own" on public.cooks
  for insert with check (user_id = auth.uid());
create policy "cooks update own" on public.cooks
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cooks delete own" on public.cooks
  for delete using (user_id = auth.uid());

------------------------------------------------------------
-- cook_prep_state
------------------------------------------------------------
create table public.cook_prep_state (
  id              uuid primary key,
  cook_id         uuid not null references public.cooks(id) on delete cascade,
  prep_item_id    uuid not null references public.prep_items(id) on delete cascade,
  checked         boolean not null default false
);
create index cook_prep_state_cook_id_idx on public.cook_prep_state(cook_id);

alter table public.cook_prep_state enable row level security;

create policy "cook_prep_state select via cook" on public.cook_prep_state
  for select using (
    exists (select 1 from public.cooks c where c.id = cook_id and c.user_id = auth.uid())
  );
create policy "cook_prep_state insert via cook" on public.cook_prep_state
  for insert with check (
    exists (select 1 from public.cooks c where c.id = cook_id and c.user_id = auth.uid())
  );
create policy "cook_prep_state update via cook" on public.cook_prep_state
  for update using (
    exists (select 1 from public.cooks c where c.id = cook_id and c.user_id = auth.uid())
  );
create policy "cook_prep_state delete via cook" on public.cook_prep_state
  for delete using (
    exists (select 1 from public.cooks c where c.id = cook_id and c.user_id = auth.uid())
  );

------------------------------------------------------------
-- user_preferences
------------------------------------------------------------
create table public.user_preferences (
  user_id                   uuid primary key references auth.users(id) on delete cascade,
  cooking_frequency         text,
  dietary_preferences       text,
  skill_level               text,
  default_serving_size      integer default 4,
  has_completed_onboarding  boolean not null default false,
  synced_at                 timestamptz
);

alter table public.user_preferences enable row level security;

create policy "user_preferences select own" on public.user_preferences
  for select using (user_id = auth.uid());
create policy "user_preferences insert own" on public.user_preferences
  for insert with check (user_id = auth.uid());
create policy "user_preferences update own" on public.user_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_preferences delete own" on public.user_preferences
  for delete using (user_id = auth.uid());
