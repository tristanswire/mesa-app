import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  isGuest: integer('is_guest', { mode: 'boolean' }).notNull().default(true),
  email: text('email'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  syncedAt: text('synced_at'),
});

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  duration: text('duration').notNull(),
  servings: integer('servings').notNull().default(4),
  tag: text('tag'),
  // User-assigned meal category. Nullable; values validated in app, not DB.
  // See RecipeCategory in data/recipes.ts for the allowed set.
  category: text('category'),
  tintKey: text('tint_key'),
  sourceUrl: text('source_url'),
  imageUrl: text('image_url'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  syncedAt: text('synced_at'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
});

export const ingredients = sqliteTable('ingredients', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull(),
  name: text('name').notNull(),
  prep: text('prep'),
  orderIndex: integer('order_index').notNull(),
});

/**
 * Auto-generated tags from import: cuisine, descriptive attributes, and a
 * computed time bucket. A separate table rather than a JSON column on
 * `recipes` so search and filtering can join and index it, matching how
 * ingredients and tools are already stored.
 *
 * Meal type is deliberately absent — that lives on `recipes.category`, which
 * the user can edit. Recipes imported before this table existed simply have no
 * rows here and show no tags; there is no backfill.
 */
export const recipeTags = sqliteTable('recipe_tags', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  orderIndex: integer('order_index').notNull(),
});

export const steps = sqliteTable('steps', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  segmentsJson: text('segments_json').notNull(),
  ingredientsJson: text('ingredients_json').notNull(),
  timersJson: text('timers_json').notNull(),
});

export const prepItems = sqliteTable('prep_items', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  duration: text('duration'),
  defaultChecked: integer('default_checked', { mode: 'boolean' }).notNull().default(false),
  orderIndex: integer('order_index').notNull(),
});

export const tools = sqliteTable('tools', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: text('price').notNull(),
  partner: text('partner').notNull(),
  affiliateUrl: text('affiliate_url'),
  orderIndex: integer('order_index').notNull(),
});

export const cooks = sqliteTable('cooks', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  startedAt: text('started_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text('completed_at'),
  rating: integer('rating'),
  notes: text('notes'),
  syncedAt: text('synced_at'),
});

export const cookPrepState = sqliteTable('cook_prep_state', {
  id: text('id').primaryKey(),
  cookId: text('cook_id')
    .notNull()
    .references(() => cooks.id, { onDelete: 'cascade' }),
  prepItemId: text('prep_item_id')
    .notNull()
    .references(() => prepItems.id, { onDelete: 'cascade' }),
  checked: integer('checked', { mode: 'boolean' }).notNull().default(false),
});

export const clicks = sqliteTable('clicks', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  toolId: text('tool_id')
    .notNull()
    .references(() => tools.id, { onDelete: 'cascade' }),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  partner: text('partner').notNull(),
  source: text('source').notNull(),
  clickedAt: text('clicked_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  syncedAt: text('synced_at'),
});

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  cookingFrequency: text('cooking_frequency'),
  dietaryPreferences: text('dietary_preferences'),
  skillLevel: text('skill_level'),
  defaultServingSize: integer('default_serving_size').default(4),
  hasCompletedOnboarding: integer('has_completed_onboarding', { mode: 'boolean' })
    .notNull()
    .default(false),
  timerSoundEnabled: integer('timer_sound_enabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  showRatingPrompt: integer('show_rating_prompt', { mode: 'boolean' })
    .notNull()
    .default(true),
  measurementSystem: text('measurement_system').notNull().default('imperial'),
  syncedAt: text('synced_at'),
});
