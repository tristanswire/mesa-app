import { relations } from 'drizzle-orm';
import {
  clicks,
  cookPrepState,
  cooks,
  ingredients,
  prepItems,
  recipes,
  recipeTags,
  steps,
  tools,
  userPreferences,
  users,
} from './schema';

export const usersRelations = relations(users, ({ many, one }) => ({
  recipes: many(recipes),
  cooks: many(cooks),
  clicks: many(clicks),
  preferences: one(userPreferences),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, { fields: [recipes.userId], references: [users.id] }),
  ingredients: many(ingredients),
  steps: many(steps),
  prepItems: many(prepItems),
  recipeTags: many(recipeTags),
  tools: many(tools),
  cooks: many(cooks),
  clicks: many(clicks),
}));

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeTags.recipeId], references: [recipes.id] }),
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

export const toolsRelations = relations(tools, ({ one, many }) => ({
  recipe: one(recipes, { fields: [tools.recipeId], references: [recipes.id] }),
  clicks: many(clicks),
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
  user: one(users, { fields: [clicks.userId], references: [users.id] }),
  tool: one(tools, { fields: [clicks.toolId], references: [tools.id] }),
  recipe: one(recipes, { fields: [clicks.recipeId], references: [recipes.id] }),
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
