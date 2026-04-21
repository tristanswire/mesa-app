export type RootStackParamList = {
  Main: undefined;
  Onboarding: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  RecipeDetail: { recipeId: string };
  PrepMode: { recipeId: string };
  CookMode: { recipeId: string; stepIndex?: number };
  CookModeLight: { recipeId: string; stepIndex?: number };
  PostCook: { recipeId: string };
  Import: undefined;
  Showcase: undefined;
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
