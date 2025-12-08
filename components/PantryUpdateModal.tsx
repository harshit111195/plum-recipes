
import React, { useState, useEffect } from 'react';
import { PantryItem } from '../types';
import { Check, Trash2 } from 'lucide-react';
import { hapticSuccess } from '../utils/hapticService';

interface Props {
  matchedItems: { ingredient: string, amount: string, pantryItem: PantryItem }[];
  onConfirm: (usage: { pantryId: string, usedAmount: string }[]) => void;
  onCancel: () => void;
}

export const PantryUpdateModal: React.FC<Props> = ({ matchedItems, onConfirm, onCancel }) => {
  // Select all by default (IDs)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds(matchedItems.map(m => m.pantryItem.id));
  }, [matchedItems]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    hapticSuccess();
    // Construct the usage objects for the selected items
    const usage = selectedIds.map(id => {
        const match = matchedItems.find(m => m.pantryItem.id === id);
        return {
            pantryId: id,
            usedAmount: match ? match.amount : '0'
        };
    });
    onConfirm(usage);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-brand-background w-full max-w-md rounded-t-[20px] sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 shadow-2xl border border-brand-divider max-h-[85vh] flex flex-col">
        
        {/* Header - compact */}
        <div className="p-4 bg-brand-surface flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary shrink-0">
                <Check size={20} strokeWidth={3} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-brand-text">Recipe Complete! 🎉</h2>
                <p className="text-brand-text-secondary text-xs">Update your inventory</p>
            </div>
        </div>

        {/* Items list - scrollable */}
        <div className="px-3 py-2 flex-1 overflow-y-auto">
            <p className="text-caption font-semibold text-brand-text-tertiary uppercase tracking-wider mb-2">Ingredients Used</p>
            <div className="bg-brand-surface rounded-2xl overflow-hidden border border-brand-divider">
                {matchedItems.length === 0 ? (
                    <div className="p-3 text-center text-brand-text-tertiary text-sm italic">
                        No pantry items matched.
                    </div>
                ) : (
                    matchedItems.map(({ pantryItem, ingredient, amount }, index) => (
                        <div 
                            key={pantryItem.id}
                            onClick={() => toggleItem(pantryItem.id)}
                            className={`flex items-center justify-between p-2.5 cursor-pointer active:bg-brand-surface-secondary transition ${
                                index !== matchedItems.length - 1 ? 'border-b border-brand-divider' : ''
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    selectedIds.includes(pantryItem.id) 
                                    ? 'bg-brand-primary border-brand-primary text-black' 
                                    : 'border-brand-text-tertiary bg-brand-surface-secondary'
                                }`}>
                                    {selectedIds.includes(pantryItem.id) && <Check size={12} strokeWidth={3} />}
                                </div>
                                <div>
                                    <div className="text-body text-brand-text leading-tight">{pantryItem.name}</div>
                                    <div className="text-caption text-brand-text-tertiary">{pantryItem.quantity} {pantryItem.unit}</div>
                                </div>
                            </div>
                            <div className="text-caption font-bold text-brand-secondary">-{amount}</div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Buttons - compact */}
        <div className="p-3 flex gap-2 bg-brand-background">
            <button 
                onClick={onCancel} 
                className="flex-1 py-2.5 bg-brand-surface border border-brand-divider text-brand-text-secondary font-semibold text-body rounded-2xl active:bg-brand-surface-secondary transition"
            >
                Skip
            </button>
            <button 
                onClick={handleConfirm} 
                className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-black font-semibold text-body rounded-2xl active:scale-[0.98] transition"
            >
                Update Pantry
            </button>
        </div>
      </div>
    </div>
  );
};

