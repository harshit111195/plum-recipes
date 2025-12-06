
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Recipe } from '../types';
import { loadRecipeData, dbUpsertRecipe, dbDeleteRecipe, dbUpdateRecipeFlags } from '../services/storageService';
import { uploadRecipeImage } from '../services/supabase';
import { useUser } from './UserContext';
import toast from 'react-hot-toast';

interface RecipeContextType {
  history: Recipe[];
  bookmarkedRecipes: Recipe[];
  generatedRecipes: Recipe[];
  setGeneratedRecipes: (recipes: Recipe[]) => void;
  addRecipeToHistory: (recipe: Recipe) => void;
  toggleBookmark: (recipe: Recipe) => void;
  isBookmarked: (id: string) => boolean;
  isLoading: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, isLoading: isUserLoading } = useUser();
  const [history, setHistory] = useState<Recipe[]>([]);
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState<Recipe[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recipes once user prefs (isPro status) are known
  useEffect(() => {
    if (isUserLoading) return;
    const init = async () => {
        const data = await loadRecipeData(preferences?.isPro || false);
        setHistory(data.history);
        setBookmarkedRecipes(data.bookmarkedRecipes);
        setIsLoading(false);
    };
    init();
  }, [isUserLoading, preferences?.isPro]);

  // Helper: Persist Base64 image to Storage if needed
  const handleImagePersist = async (recipe: Recipe): Promise<Recipe> => {
      // Check if generatedImage is a Base64 string (starts with data:)
      if (recipe.generatedImage && recipe.generatedImage.startsWith('data:')) {
          try {
              const publicUrl = await uploadRecipeImage(recipe.id, recipe.generatedImage);
              if (publicUrl) {
                  return { ...recipe, generatedImage: publicUrl };
              }
          } catch (error) {
              console.error("Background image upload failed", error);
              // Fallback to saving recipe with Base64 if upload fails (less ideal for DB size but preserves data)
              // Or return original recipe
          }
      }
      return recipe;
  };

  const addRecipeToHistory = async (recipe: Recipe) => {
    const isAlreadyBookmarked = bookmarkedRecipes.some(r => r.id === recipe.id);
    const updatedRecipe = { ...recipe, lastCooked: new Date().toISOString() };
    const prevHistory = history;
    
    // Optimistic Update (shows instantly with Base64 if present)
    setHistory(prev => [updatedRecipe, ...prev.filter(r => r.id !== recipe.id)]);
    
    try { 
        // 1. Upload Image to Storage (if Base64)
        const persistedRecipe = await handleImagePersist(updatedRecipe);

        // 2. Update local state with new URL if it changed (replaces Base64 to free memory)
        if (persistedRecipe.generatedImage !== updatedRecipe.generatedImage) {
             setHistory(prev => prev.map(r => r.id === recipe.id ? persistedRecipe : r));
             setGeneratedRecipes(prev => prev.map(r => r.id === recipe.id ? persistedRecipe : r));
             if (isAlreadyBookmarked) {
                 setBookmarkedRecipes(prev => prev.map(r => r.id === recipe.id ? persistedRecipe : r));
             }
        }

        // 3. Save to DB (URL is now short string)
        await dbUpsertRecipe(persistedRecipe, true, isAlreadyBookmarked); 
    }
    catch (e) {
        toast.error("Failed to save history");
        setHistory(prevHistory);
    }
  };

  const toggleBookmark = async (recipe: Recipe) => {
    const isCurrentlyBookmarked = bookmarkedRecipes.some(r => r.id === recipe.id);
    const isCurrentlyInHistory = history.some(r => r.id === recipe.id);

    // Optimistic
    if (isCurrentlyBookmarked) {
        setBookmarkedRecipes(prev => prev.filter(r => r.id !== recipe.id));
    } else {
        setBookmarkedRecipes(prev => [recipe, ...prev]);
    }

    try {
        if (isCurrentlyBookmarked) {
             // REMOVING
             if (!isCurrentlyInHistory) await dbDeleteRecipe(recipe.id);
             else await dbUpdateRecipeFlags(recipe.id, { is_bookmarked: false });
        } else {
             // ADDING
             // 1. Upload Image if needed
             const persistedRecipe = await handleImagePersist(recipe);

             // 2. Update local state if URL changed
             if (persistedRecipe.generatedImage !== recipe.generatedImage) {
                 setBookmarkedRecipes(prev => prev.map(r => r.id === recipe.id ? persistedRecipe : r));
                 setGeneratedRecipes(prev => prev.map(r => r.id === recipe.id ? persistedRecipe : r));
                 if (isCurrentlyInHistory) {
                     setHistory(prev => prev.map(r => r.id === recipe.id ? persistedRecipe : r));
                 }
             }

             // 3. Save
             await dbUpsertRecipe(persistedRecipe, isCurrentlyInHistory, true);
        }
    } catch (e) {
        toast.error("Failed to update bookmark");
        // Rollback
        if (isCurrentlyBookmarked) setBookmarkedRecipes(prev => [recipe, ...prev]);
        else setBookmarkedRecipes(prev => prev.filter(r => r.id !== recipe.id));
    }
  };

  const isBookmarked = (id: string) => bookmarkedRecipes.some(r => r.id === id);

  return (
    <RecipeContext.Provider value={{ 
        history, bookmarkedRecipes, generatedRecipes, 
        setGeneratedRecipes, addRecipeToHistory, toggleBookmark, isBookmarked, 
        isLoading 
    }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) throw new Error('useRecipes must be used within RecipeProvider');
  return context;
};
