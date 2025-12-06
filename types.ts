

export enum Diet {
  Omnivore = 'Omnivore',
  Vegetarian = 'Vegetarian',
  Vegan = 'Vegan',
  Pescatarian = 'Pescatarian',
  Paleo = 'Paleo',
  Keto = 'Keto'
}

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard'
}

export const UNITS = ['pcs', 'g', 'kg', 'ml', 'L', 'oz', 'lb', 'cups', 'tbsp', 'tsp'];

export const CUISINES = ["Italian", "Spanish", "Mexican", "Chinese", "Indian", "Thai", "Japanese", "Mediterranean", "American", "French", "Korean", "Vietnamese", "Greek"];

export const PANTRY_CATEGORIES = [
  "Produce", 
  "Dairy", 
  "Meat", 
  "Grains", 
  "Bakery", 
  "Spices", 
  "Beverages", 
  "Frozen", 
  "Snacks", 
  "General"
];

export interface UserPreferences {
  diet: Diet;
  allergies: string[];
  dislikedIngredients: string[];
  householdSize: number;
  appliances: string[];
  cookingSkill: 'Beginner' | 'Intermediate' | 'Advanced';
  maxCaloriesPerMeal?: number;
  measurementUnit: 'Metric' | 'Imperial';
  favoriteCuisines: string[];
  nutritionalGoal: 'Balanced' | 'High Protein' | 'Low Carb' | 'Low Fat';
  isPro: boolean; 
  hasCompletedOnboarding: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  unit?: string;
  category: string;
  expiryDate?: string;
  addedAt: number;
}

export interface Ingredient {
  name: string;
  amount: string;
  isAvailableInPantry: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imagePrompt?: string; // Visual description optimized for image generation
  totalTimeMinutes: number;
  difficulty: Difficulty;
  caloriesApprox: number;
  ingredients: Ingredient[];
  instructions: string[];
  matchScore: number;
  tags: string[];
  generatedImage?: string;
  macros?: {
    name: string;
    value: number;
  }[];
  usesExpiringIngredients?: boolean;
  nutrition?: {
    fiber?: string;
    sugar?: string;
    sodium?: string;
    servingWeight?: string;
  };
  lastCooked?: string; // ISO Date String
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}
