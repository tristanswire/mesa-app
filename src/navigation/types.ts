export type RootStackParamList = {
  Main: undefined;
  Onboarding: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  RecipeDetail: { recipeId: string };
  PrepMode: { recipeId: string };
  CookMode: { recipeId: string; stepIndex?: number };
  PostCook: { recipeId: string; cookId: string };
  Import: { prefilledUrl?: string } | undefined;
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
