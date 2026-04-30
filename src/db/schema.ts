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
  tintKey: text('tint_key'),
  sourceUrl: text('source_url'),
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
  syncedAt: text('synced_at'),
});
