
import React, { createContext, useContext, useEffect, useState } from 'react';
import { PantryItem, ShoppingItem } from '../types';
import { 
    loadInventoryData, 
    dbAddPantryItem, 
    dbUpdatePantryItem, 
    dbRemovePantryItem, 
    dbUpsertShoppingItems,
    dbRemoveShoppingItem,
    dbClearCheckedShoppingItems,
    dbClearAllShoppingItems
} from '../services/storageService';
import { calculateNewInventory, mergeQuantities } from '../services/quantityService';
import { generateId } from '../utils/helpers';
import toast from 'react-hot-toast';

interface InventoryContextType {
  pantry: PantryItem[];
  shoppingList: ShoppingItem[];
  recentEmptyItems: { id: string; name: string; category: string; removedAt: number }[];
  addPantryItem: (item: Omit<PantryItem, 'id' | 'addedAt'>) => void;
  removePantryItem: (id: string) => void;
  updatePantryItem: (id: string, updates: Partial<PantryItem>) => void;
  consumeIngredients: (usage: { pantryId: string, usedAmount: string }[]) => void;
  addToShoppingList: (names: string[]) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearShoppingList: () => void;
  clearCheckedItems: () => void;
  isLoading: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [recentEmptyItems, setRecentEmptyItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        const data = await loadInventoryData();
        setPantry(data.pantry);
        setShoppingList(data.shoppingList);
        setRecentEmptyItems(data.recentEmptyItems);
        setIsLoading(false);
    };
    init();
  }, []);

  const addPantryItem = async (item: Omit<PantryItem, 'id' | 'addedAt'>) => {
    // Check for existing item with same name (case-insensitive)
    const existingItem = pantry.find(p => 
      p.name.toLowerCase().trim() === item.name.toLowerCase().trim()
    );

    if (existingItem) {
      // Try to merge quantities if units are compatible
      const mergedQty = mergeQuantities(
        existingItem.quantity, existingItem.unit,
        item.quantity, item.unit
      );
      
      if (mergedQty !== null) {
        // Merge successful - update existing item
        const updates: Partial<PantryItem> = { quantity: mergedQty };
        
        // Use the earlier expiry date if both have one
        if (item.expiryDate && existingItem.expiryDate) {
          const newExpiry = new Date(item.expiryDate).getTime();
          const oldExpiry = new Date(existingItem.expiryDate).getTime();
          if (newExpiry < oldExpiry) {
            updates.expiryDate = item.expiryDate;
          }
        } else if (item.expiryDate && !existingItem.expiryDate) {
          // New item has expiry, existing doesn't - use new
          updates.expiryDate = item.expiryDate;
        }
        
        // Update existing item instead of creating new
        const original = existingItem;
        setPantry(prev => prev.map(i => i.id === existingItem.id ? { ...i, ...updates } : i));
        try { 
          await dbUpdatePantryItem(existingItem.id, updates);
          toast.success(`Updated ${item.name} quantity`);
        } catch (e) { 
          toast.error("Failed to update item"); 
          setPantry(prev => prev.map(i => i.id === existingItem.id ? original : i));
        }
        return;
      }
      // If units incompatible, fall through to create new entry
    }

    // No existing item or incompatible units - create new entry
    const newItem: PantryItem = { ...item, id: generateId(), addedAt: Date.now() };
    setPantry(prev => [...prev, newItem]);
    try { await dbAddPantryItem(newItem); } 
    catch (e) { 
        toast.error("Failed to save item"); 
        setPantry(prev => prev.filter(i => i.id !== newItem.id)); 
    }
  };

  const removePantryItem = async (id: string) => {
    const itemToRemove = pantry.find(i => i.id === id);
    if (!itemToRemove) return;
    
    // Optimistic: Add to recent empty, Remove from pantry
    setRecentEmptyItems(prev => [{ id: generateId(), name: itemToRemove.name, category: itemToRemove.category, removedAt: Date.now() }, ...prev].slice(0, 50));
    setPantry(prev => prev.filter(i => i.id !== id));

    try { await dbRemovePantryItem(id); }
    catch (e) {
        toast.error("Failed to delete item");
        setPantry(prev => [...prev, itemToRemove]);
    }
  };

  const updatePantryItem = async (id: string, updates: Partial<PantryItem>) => {
    const original = pantry.find(i => i.id === id);
    if (!original) return;
    setPantry(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    try { await dbUpdatePantryItem(id, updates); }
    catch (e) {
        toast.error("Failed to update item");
        setPantry(prev => prev.map(i => i.id === id ? original : i));
    }
  };

  const consumeIngredients = (usage: { pantryId: string, usedAmount: string }[]) => {
    usage.forEach(({ pantryId, usedAmount }) => {
      const item = pantry.find(p => p.id === pantryId);
      if (!item) return;
      const { newQuantity, shouldRemove } = calculateNewInventory(item.quantity, item.unit || 'pcs', usedAmount);
      if (shouldRemove) removePantryItem(pantryId); 
      else updatePantryItem(pantryId, { quantity: newQuantity }); 
    });
  };

  const addToShoppingList = async (names: string[]) => {
    const newItems = names.map(name => ({ id: generateId(), name, checked: false }));
    setShoppingList(prev => [...prev, ...newItems]);
    try { await dbUpsertShoppingItems(newItems); }
    catch (e) {
        toast.error("Failed to update list");
        const newIds = new Set(newItems.map(i => i.id));
        setShoppingList(prev => prev.filter(i => !newIds.has(i.id)));
    }
  };

  const toggleShoppingItem = async (id: string) => {
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    try { await dbUpsertShoppingItems([{ ...item, checked: !item.checked }]); }
    catch (e) {
        toast.error("Connection failed");
        setShoppingList(prev => prev.map(i => i.id === id ? item : i));
    }
  };

  const removeShoppingItem = async (id: string) => {
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;
    setShoppingList(prev => prev.filter(i => i.id !== id));
    try { await dbRemoveShoppingItem(id); }
    catch (e) {
        toast.error("Failed to remove item");
        setShoppingList(prev => [...prev, item]);
    }
  };

  const clearShoppingList = async () => {
    const old = shoppingList;
    setShoppingList([]);
    try { await dbClearAllShoppingItems(); }
    catch (e) { toast.error("Failed to clear"); setShoppingList(old); }
  };

  const clearCheckedItems = async () => {
    const old = shoppingList;
    setShoppingList(prev => prev.filter(i => !i.checked));
    try { await dbClearCheckedShoppingItems(); }
    catch (e) { toast.error("Failed to clear"); setShoppingList(old); }
  };

  return (
    <InventoryContext.Provider value={{ 
        pantry, shoppingList, recentEmptyItems, isLoading,
        addPantryItem, removePantryItem, updatePantryItem, consumeIngredients,
        addToShoppingList, toggleShoppingItem, removeShoppingItem, clearShoppingList, clearCheckedItems
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};
