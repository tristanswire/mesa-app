import { relations } from 'drizzle-orm';
import {
  cookPrepState,
  cooks,
  ingredients,
  prepItems,
  recipes,
  steps,
  tools,
  userPreferences,
  users,
} from './schema';

export const usersRelations = relations(users, ({ many, one }) => ({
  recipes: many(recipes),
  cooks: many(cooks),
  preferences: one(userPreferences),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, { fields: [recipes.userId], references: [users.id] }),
  ingredients: many(ingredients),
  steps: many(steps),
  prepItems: many(prepItems),
  tools: many(tools),
  cooks: many(cooks),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  recipe: one(recipes, { fields: [ingredients.recipeId], references: [recipes.id] }),
}));

export const stepsRelations = relations(steps, ({ one }) => ({
  recipe: one(recipes, { fields: [steps.recipeId], references: [recipes.id] }),
}));

export const prepItemsRelations = relations(prepItems, ({ one }) => ({
  recipe: one(recipes, { fields: [prepItems.recipeId], references: [recipes.id] }),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  recipe: one(recipes, { fields: [tools.recipeId], references: [recipes.id] }),
}));

export const cooksRelations = relations(cooks, ({ one, many }) => ({
  user: one(users, { fields: [cooks.userId], references: [users.id] }),
  recipe: one(recipes, { fields: [cooks.recipeId], references: [recipes.id] }),
  prepState: many(cookPrepState),
}));

export const cookPrepStateRelations = relations(cookPrepState, ({ one }) => ({
  cook: one(cooks, { fields: [cookPrepState.cookId], references: [cooks.id] }),
  prepItem: one(prepItems, { fields: [cookPrepState.prepItemId], references: [prepItems.id] }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));
