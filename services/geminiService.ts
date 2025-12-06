
import { UserPreferences, PantryItem, Recipe } from "../types";
import { logger } from "./loggerService";
import { CONFIG } from "../config";
import { api } from "./api";
import { generateId } from "../utils/helpers";
import { startSpanAsync } from "./monitoringService";

// Helper for Staples
export const isBasicStaple = (itemName: string): boolean => {
    const n = itemName.toLowerCase().trim();
    if (n.includes('water') && !n.includes('melon') && !n.includes('cress') && !n.includes('chestnut')) return true;
    if (n === 'ice' || n === 'ice cubes' || n === 'tap water') return true;
    if (['salt', 'sea salt', 'kosher salt', 'table salt', 'fine salt'].includes(n)) return true;
    if (['pepper', 'black pepper', 'ground black pepper', 'white pepper'].includes(n)) return true;
    if (['oil', 'cooking oil', 'vegetable oil', 'canola oil', 'olive oil'].includes(n)) return true;
    return false;
};

export const generateThumbnail = async (title: string, description: string): Promise<string | undefined> => {
  return startSpanAsync(
    { op: 'ai.generate', name: 'Generate Recipe Thumbnail', attributes: { recipeTitle: title } },
    async () => {
      try {
        const res = await api.post<{ image: string }>(CONFIG.api.endpoints.generateThumbnail, { title, description });
        if (res.image && !res.image.startsWith('data:')) {
          return `data:image/jpeg;base64,${res.image}`;
        }
        return res.image;
      } catch (e) {
        logger.error("Thumbnail generation failed", e);
        return undefined;
      }
    }
  );
};

export const identifyItemsFromImage = async (base64Image: string): Promise<any[]> => {
  return startSpanAsync(
    { op: 'ai.parse', name: 'Scan Pantry Image', attributes: { inputType: 'image' } },
    async () => {
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

      try {
        const res = await api.post<{ items: any[] }>(CONFIG.api.endpoints.parsePantry, { 
          type: 'image', 
          data: cleanBase64 
        });
        return res.items;
      } catch (e) {
        logger.error("Backend image parse failed", e);
        return [];
      }
    }
  );
};

export const parsePantryNaturalLanguage = async (text: string): Promise<any[]> => {
  return startSpanAsync(
    { op: 'ai.parse', name: 'Parse Voice Input', attributes: { inputType: 'voice', textLength: text.length } },
    async () => {
      try {
        const res = await api.post<{ items: any[] }>(CONFIG.api.endpoints.parsePantry, { type: 'text', data: text });
        return res.items;
      } catch (e) {
        logger.error("Voice parse failed", e);
        return [];
      }
    }
  );
};

export const generateRecipes = async (
  pantry: PantryItem[],
  preferences: UserPreferences,
  context: { 
    mealType: string; 
    timeAvailable: string; 
    cuisine?: string; 
    heroIngredient?: string; 
    prioritizeExpiring: boolean; 
    servings?: number; 
    homeStyle?: boolean; 
  },
  existingTitles: string[] = [],
  count: number = 4
): Promise<Recipe[]> => {
  return startSpanAsync(
    { 
      op: 'ai.generate', 
      name: 'Generate Recipes', 
      attributes: { 
        pantryItemCount: pantry.length,
        mealType: context.mealType,
        cuisine: context.cuisine || 'Any',
        recipeCount: count,
      } 
    },
    async () => {
  let recipes: Recipe[] = [];

  try {
    const res = await api.post<{ recipes: any[] }>(CONFIG.api.endpoints.generateRecipes, {
      pantry: pantry.map(p => ({ name: p.name, quantity: p.quantity, unit: p.unit })),
      preferences,
      context,
      existingTitles,
      count
    });
    
    // Check if response has recipes
    if (!res || !res.recipes || !Array.isArray(res.recipes)) {
      logger.error("Invalid response format from generate-recipes", res);
      throw new Error("Invalid response from server. Please try again.");
    }
    
    // Safety: Ensure we only use the requested number of recipes
    const limitedRecipes = res.recipes.slice(0, count);
    
    if (limitedRecipes.length === 0) {
      logger.warn("No recipes returned from API");
      throw new Error("No recipes generated. Try adjusting your filters or adding more items to your pantry.");
    }
    
    recipes = limitedRecipes.map((r: any) => ({
      ...r,
      id: generateId(),
      matchScore: 0 
    }));
  } catch (e: any) {
    logger.error("Backend generation failed", {
      error: e,
      message: e?.message,
      status: e?.status,
      code: e?.code
    });
    throw e;
  }

  // --- POST-PROCESSING ---
  recipes = recipes.map(r => {
      const ingredients = r.ingredients.map((i: any) => ({
          ...i,
          isAvailableInPantry: i.isAvailableInPantry || isBasicStaple(i.name)
      }));
      const total = ingredients.length;
      const available = ingredients.filter((i: any) => i.isAvailableInPantry).length;
      return {
          ...r,
          ingredients,
          matchScore: total > 0 ? Math.round((available / total) * 100) : 0
      };
  });

  recipes.sort((a, b) => {
      if (context.prioritizeExpiring) {
          if (a.usesExpiringIngredients && !b.usesExpiringIngredients) return -1;
          if (!a.usesExpiringIngredients && b.usesExpiringIngredients) return 1;
      }
      return b.matchScore - a.matchScore;
  });

  // --- IMAGE GENERATION (Parallel) ---
  // Generate all thumbnails in parallel for better performance
  // Promise.allSettled ensures one failure doesn't block others
  // Use imagePrompt (visual description) instead of description (witty text) for better images
  await Promise.allSettled(recipes.map(async (recipe) => {
      try {
          const imageDescription = recipe.imagePrompt || recipe.description;
          const rawImage = await generateThumbnail(recipe.title, imageDescription);
          if (rawImage) {
             recipe.generatedImage = rawImage; // Base64 WebP
          }
      } catch (error) {
          // Individual failures don't block other images
          logger.warn(`Failed to generate thumbnail for ${recipe.title}`, error);
      }
  }));

  return recipes;
    }
  );
};

export const askAiAboutStep = async (title: string, step: string, question?: string): Promise<string> => {
  return startSpanAsync(
    { op: 'ai.assist', name: 'Ask AI About Step', attributes: { recipeTitle: title, hasQuestion: !!question } },
    async () => {
      try {
        // Import cache service dynamically to avoid circular dependencies
        const { askStepCache } = await import('../utils/cacheService');
        
        // Check cache first
        const cachedAnswer = await askStepCache.getCachedAnswer(title, step, question);
        if (cachedAnswer) {
          logger.info("Ask step cache hit", { title, step });
          return cachedAnswer;
        }
        
        // If not cached, make API call
        const res = await api.post<{ answer: string }>(CONFIG.api.endpoints.askStep, { title, step, question });
        
        // Cache the answer for future use
        await askStepCache.setCachedAnswer(title, step, res.answer, question);
        
        return res.answer;
      } catch (e) {
        logger.error("Ask step failed", e);
        return "Chef is disconnected.";
      }
    }
  );
};
