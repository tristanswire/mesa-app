import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Main: undefined;
  Onboarding: undefined;
};

export type MainStackParamList = {
  // Nested params so callers can pop back to a specific tab —
  // e.g. RecipeDetail returning to the library after a delete.
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
  RecipeDetail: { recipeId: string };
  // `scale` is the session-only serving multiplier set on Recipe Detail. It
  // rides the navigation params through the cook flow and is never persisted;
  // leaving the recipe drops it. Absent means 1x.
  PrepMode: { recipeId: string; scale?: number };
  CookMode: { recipeId: string; stepIndex?: number; scale?: number };
  PostCook: { recipeId: string; cookId: string; scale?: number };
  Import: { prefilledUrl?: string } | undefined;
  ManualImport: undefined;
  Showcase: undefined;
  CookingFrequency: undefined;
  DietaryPreferences: undefined;
  SkillLevel: undefined;
  DefaultServingSize: undefined;
};

export type TabsParamList = {
  Home: undefined;
  Recipes: undefined;
  Profile: undefined;
};

export type OnboardingStackParamList = {
  ValueProp: undefined;
  AhaMoment: undefined;
  Preferences: undefined;
};

// Augment the global RootParamList so useNavigation() is typed throughout the app
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
