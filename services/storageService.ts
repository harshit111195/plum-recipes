
import { Diet, UserPreferences, Recipe, PantryItem, ShoppingItem } from '../types';
import { supabase } from './supabase';
import { logger } from './loggerService';

const DEFAULT_PREFERENCES: UserPreferences = {
  diet: Diet.Omnivore,
  allergies: [],
  dislikedIngredients: [],
  householdSize: 2,
  appliances: ['Stove', 'Oven', 'Microwave'],
  cookingSkill: 'Intermediate',
  maxCaloriesPerMeal: 800,
  measurementUnit: 'Metric',
  favoriteCuisines: [],
  nutritionalGoal: 'Balanced',
  isPro: false,
  hasCompletedOnboarding: false,
  theme: 'light'
};

// --- LOADERS ---

export const loadUserPreferences = async (): Promise<UserPreferences> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return DEFAULT_PREFERENCES;
        
        const prefsRes = await supabase.from('user_preferences').select('data').eq('user_id', session.user.id).single();
        
        if (prefsRes.data && prefsRes.data.data) {
            const stored = prefsRes.data.data;
            // Legacy Migration: If user has data (is an old user) but hasCompletedOnboarding is missing, 
            // assume they are an existing user who shouldn't see the tour (default to true).
            const hasCompletedOnboarding = typeof stored.hasCompletedOnboarding === 'boolean' 
                ? stored.hasCompletedOnboarding 
                : true;

            return {
                ...DEFAULT_PREFERENCES,
                ...stored,
                hasCompletedOnboarding
            };
        }
        
        // No preferences row exists. 
        // Check if they are a legacy user (have pantry items) before treating as brand new.
        const { count } = await supabase
            .from('pantry_items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id);
            
        const isLegacyUser = count !== null && count > 0;

        return {
            ...DEFAULT_PREFERENCES,
            hasCompletedOnboarding: isLegacyUser // True (skip tour) if they have items, False if empty
        };
    } catch (e) {
        return DEFAULT_PREFERENCES;
    }
};

export const loadInventoryData = async (): Promise<{ pantry: PantryItem[], shoppingList: ShoppingItem[], recentEmptyItems: any[] }> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return { pantry: [], shoppingList: [], recentEmptyItems: [] };
        
        const userId = session.user.id;
        const trashDaysAgo = new Date();
        trashDaysAgo.setDate(trashDaysAgo.getDate() - 30);

        const [pantryRes, deletedRes, shoppingRes] = await Promise.all([
            supabase.from('pantry_items').select('*').eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: true }),
            supabase.from('pantry_items').select('*').eq('user_id', userId).not('deleted_at', 'is', null).gt('deleted_at', trashDaysAgo.toISOString()).order('deleted_at', { ascending: false }).limit(50),
            supabase.from('shopping_items').select('*').eq('user_id', userId).order('created_at', { ascending: true })
        ]);

        const pantry: PantryItem[] = (pantryRes.data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            quantity: row.quantity,
            unit: row.unit,
            category: row.category,
            expiryDate: row.expiry_date,
            addedAt: row.added_at
        }));

        const shoppingList: ShoppingItem[] = (shoppingRes.data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            checked: row.checked
        }));

        const recentEmptyItems = (deletedRes.data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            category: row.category,
            removedAt: new Date(row.deleted_at).getTime()
        }));

        // Cleanup old deleted items in background (fire-and-forget with error logging)
        supabase.from('pantry_items')
            .delete()
            .eq('user_id', userId)
            .lt('deleted_at', trashDaysAgo.toISOString())
            .then()
            .catch(e => logger.warn('Background pantry cleanup failed', e));

        return { pantry, shoppingList, recentEmptyItems };
    } catch (e) {
        return { pantry: [], shoppingList: [], recentEmptyItems: [] };
    }
};

export const loadRecipeData = async (isPro: boolean): Promise<{ history: Recipe[], bookmarkedRecipes: Recipe[] }> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return { history: [], bookmarkedRecipes: [] };

        const userId = session.user.id;
        const historyDays = isPro ? 30 : 15;
        const historyCutoff = new Date();
        historyCutoff.setDate(historyCutoff.getDate() - historyDays);

        const [bookmarksRes, historyRes] = await Promise.all([
             supabase.from('recipes').select('*').eq('user_id', userId).eq('is_bookmarked', true).order('created_at', { ascending: false }),
             supabase.from('recipes').select('*').eq('user_id', userId).eq('is_history', true).filter('data->>lastCooked', 'gt', historyCutoff.toISOString()).order('created_at', { ascending: false })
        ]);

        const bookmarkedRecipes: Recipe[] = (bookmarksRes.data || []).map((row: any) => ({ ...row.data }));
        const history: Recipe[] = (historyRes.data || []).map((row: any) => ({ ...row.data }));

        history.sort((a, b) => new Date(b.lastCooked || 0).getTime() - new Date(a.lastCooked || 0).getTime());

        return { history, bookmarkedRecipes };
    } catch (e) {
        return { history: [], bookmarkedRecipes: [] };
    }
};

// --- HELPERS & ACTIONS ---

// Helper: Map to Row
const mapRecipeToRow = (r: Recipe, userId: string, isHistory: boolean, isBookmarked: boolean) => ({
    id: r.id,
    user_id: userId,
    title: r.title,
    data: r,
    is_history: isHistory,
    is_bookmarked: isBookmarked
});

// 1. PANTRY
export const dbAddPantryItem = async (item: PantryItem) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('pantry_items').insert({
        id: item.id,
        user_id: session.user.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        expiry_date: item.expiryDate,
        added_at: item.addedAt,
        deleted_at: null
    });
};

export const dbUpdatePantryItem = async (id: string, updates: Partial<PantryItem>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    const rowUpdates: any = {};
    if (updates.name !== undefined) rowUpdates.name = updates.name;
    if (updates.quantity !== undefined) rowUpdates.quantity = updates.quantity;
    if (updates.unit !== undefined) rowUpdates.unit = updates.unit;
    if (updates.category !== undefined) rowUpdates.category = updates.category;
    if (updates.expiryDate !== undefined) rowUpdates.expiry_date = updates.expiryDate;

    await supabase.from('pantry_items').update(rowUpdates).eq('id', id).eq('user_id', session.user.id);
};

export const dbRemovePantryItem = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase
        .from('pantry_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', session.user.id);
};

// 2. SHOPPING LIST
export const dbUpsertShoppingItems = async (items: ShoppingItem[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const rows = items.map(s => ({ id: s.id, user_id: session.user.id, name: s.name, checked: s.checked }));
    await supabase.from('shopping_items').upsert(rows);
};

export const dbRemoveShoppingItem = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('shopping_items').delete().eq('id', id).eq('user_id', session.user.id);
};

export const dbClearCheckedShoppingItems = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('shopping_items').delete().eq('checked', true).eq('user_id', session.user.id);
};

export const dbClearAllShoppingItems = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('shopping_items').delete().neq('id', '0').eq('user_id', session.user.id);
};

// 3. RECIPES
export const dbUpsertRecipe = async (recipe: Recipe, isHistory: boolean, isBookmarked: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    const row = mapRecipeToRow(recipe, session.user.id, isHistory, isBookmarked);
    await supabase.from('recipes').upsert(row);
};

export const dbUpdateRecipeFlags = async (recipeId: string, flags: { is_history?: boolean, is_bookmarked?: boolean }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('recipes').update(flags).eq('id', recipeId).eq('user_id', session.user.id);
};

export const dbDeleteRecipe = async (recipeId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('recipes').delete().eq('id', recipeId).eq('user_id', session.user.id);
};

// 4. PREFERENCES
export const dbSavePreferences = async (prefs: UserPreferences) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('user_preferences').upsert({ 
        user_id: session.user.id, 
        data: prefs,
        updated_at: new Date().toISOString()
    });
};
