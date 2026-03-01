export interface MealDbMeal {
  idMeal: string;
  strMeal: string;
  strInstructions: string;
  strMealThumb?: string;
  [key: string]: any;
}

export interface MealDbMealSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
}
