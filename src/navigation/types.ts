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
  PrepMode: { recipeId: string };
  CookMode: { recipeId: string; stepIndex?: number };
  PostCook: { recipeId: string; cookId: string };
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
