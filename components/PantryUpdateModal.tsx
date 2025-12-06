
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
      <div className="bg-[#0D0D0D] w-full max-w-md rounded-t-[20px] sm:rounded-[20px] overflow-hidden animate-in slide-in-from-bottom-full duration-300 shadow-2xl border border-[#333333] max-h-[85vh] flex flex-col">
        
        {/* Header - compact */}
        <div className="p-4 bg-[#1A1A1A] flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFC244]/20 rounded-full flex items-center justify-center text-[#FFC244] shrink-0">
                <Check size={20} strokeWidth={3} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white">Recipe Complete! 🎉</h2>
                <p className="text-[#A0A0A0] text-xs">Update your inventory</p>
            </div>
        </div>

        {/* Items list - scrollable */}
        <div className="px-3 py-2 flex-1 overflow-y-auto">
            <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Ingredients Used</p>
            <div className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#333333]">
                {matchedItems.length === 0 ? (
                    <div className="p-3 text-center text-[#6B6B6B] text-sm italic">
                        No pantry items matched.
                    </div>
                ) : (
                    matchedItems.map(({ pantryItem, ingredient, amount }, index) => (
                        <div 
                            key={pantryItem.id}
                            onClick={() => toggleItem(pantryItem.id)}
                            className={`flex items-center justify-between p-2.5 cursor-pointer active:bg-[#2A2A2A] transition ${
                                index !== matchedItems.length - 1 ? 'border-b border-[#333333]' : ''
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    selectedIds.includes(pantryItem.id) 
                                    ? 'bg-[#FFC244] border-[#FFC244] text-black' 
                                    : 'border-[#6B6B6B] bg-[#2A2A2A]'
                                }`}>
                                    {selectedIds.includes(pantryItem.id) && <Check size={12} strokeWidth={3} />}
                                </div>
                                <div>
                                    <div className="text-[14px] text-white leading-tight">{pantryItem.name}</div>
                                    <div className="text-[11px] text-[#6B6B6B]">{pantryItem.quantity} {pantryItem.unit}</div>
                                </div>
                            </div>
                            <div className="text-[13px] font-bold text-[#E84142]">-{amount}</div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Buttons - compact */}
        <div className="p-3 flex gap-2 bg-[#0D0D0D]">
            <button 
                onClick={onCancel} 
                className="flex-1 py-2.5 bg-[#1A1A1A] border border-[#333333] text-[#A0A0A0] font-semibold text-[14px] rounded-xl active:bg-[#2A2A2A] transition"
            >
                Skip
            </button>
            <button 
                onClick={handleConfirm} 
                className="flex-1 py-2.5 bg-[#FFC244] hover:bg-[#E5AD3D] text-black font-semibold text-[14px] rounded-xl active:scale-[0.98] transition"
            >
                Update Pantry
            </button>
        </div>
      </div>
    </div>
  );
};

