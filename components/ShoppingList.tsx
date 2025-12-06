
import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Trash2, Circle, CheckCircle2, X, ShoppingBag, ChevronDown, ChevronRight, Share, Plus, RefreshCw } from 'lucide-react';
import { UNITS, PANTRY_CATEGORIES } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { hapticSuccess } from '../utils/hapticService';
import { Share as CapacitorShare } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * 🎨 SHOPPING LIST COLOR REFERENCE (Dark Mode)
 * =============================================
 * Background:     #0D0D0D (near black - page bg)
 * Surface:        #1A1A1A (cards, inputs, items)
 * Surface Alt:    #2A2A2A (secondary surfaces)
 * 
 * Text Primary:   #FFFFFF (white)
 * Text Secondary: #A0A0A0 (muted - subtitles, placeholders)
 * Text Tertiary:  #6B6B6B (very muted - icons)
 * 
 * Brand Yellow:   #FFC244 (header bg, accents, progress)
 * Brand Purple:   #7C3AED (smart restock section)
 * Tomato Red:     #E84142 (header stripes)
 * Button Green:   #10B981 (add button)
 * Error Red:      #F87171 (delete, cancel)
 * 
 * Divider:        #333333
 */

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

export const ShoppingList: React.FC = () => {
  const { shoppingList, addToShoppingList, toggleShoppingItem, removeShoppingItem, clearCheckedItems, addPantryItem, pantry, recentEmptyItems } = useInventory();
  const [newItem, setNewItem] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [confirmingItem, setConfirmingItem] = useState<{id: string, name: string} | null>(null);
  const [buyQty, setBuyQty] = useState('1');
  const [buyUnit, setBuyUnit] = useState('pcs');
  const [buyCategory, setBuyCategory] = useState('General');
  const [buyExpiry, setBuyExpiry] = useState('');
  const [showRestock, setShowRestock] = useState(false);

  const activeItems = shoppingList.filter(i => !i.checked);
  const completedItems = shoppingList.filter(i => i.checked);

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (newItem.trim()) { 
        const items = newItem.split(',').map(i => i.trim()).filter(i => i.length > 0);
        addToShoppingList(items); 
        setNewItem(''); 
      }
  };

  const handleItemClick = (item: any) => {
      setConfirmingItem(item);
      setBuyQty('1'); setBuyUnit('pcs'); setBuyCategory('General'); setBuyExpiry('');
  };

  const confirmPurchase = (addToPantry: boolean) => {
      if (!confirmingItem) return;
      hapticSuccess();
      if (addToPantry) {
          addPantryItem({
              name: confirmingItem.name,
              quantity: buyQty,
              unit: buyUnit,
              category: buyCategory,
              expiryDate: buyExpiry || undefined
          });
      }
      toggleShoppingItem(confirmingItem.id);
      setConfirmingItem(null);
  };

  const handleShare = async () => {
      if (activeItems.length === 0) {
          toast.error('No items to share');
          return;
      }
      
      const text = `🛒 The Haul (${new Date().toLocaleDateString()}):\n\n` + activeItems.map(i => `☐ ${i.name}`).join('\n');
      
      const doCopy = async () => {
          try { 
              if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(text); 
                  toast.success('List copied to clipboard!');
              } else {
                  const textArea = document.createElement('textarea');
                  textArea.value = text;
                  textArea.style.position = 'fixed';
                  textArea.style.opacity = '0';
                  document.body.appendChild(textArea);
                  textArea.select();
                  try {
                      document.execCommand('copy');
                      toast.success('List copied to clipboard!');
                  } catch (err) {
                      toast.error('Could not copy to clipboard.');
                  }
                  document.body.removeChild(textArea);
              }
          } catch(e) { 
              console.error('Share error:', e);
              toast.error('Could not copy to clipboard.'); 
          }
      };

      if (Capacitor.isNativePlatform()) {
          try {
              await CapacitorShare.share({
                  title: 'Shopping List',
                  text: text,
                  dialogTitle: 'Share Shopping List'
              });
              hapticSuccess();
          } catch (e: any) {
              if (e.message !== 'User canceled') {
                  console.error('Share error:', e);
                  await doCopy();
              }
          }
      } else {
          if (navigator.share && typeof navigator.share === 'function') {
              try { 
                  await navigator.share({ 
                      title: 'Shopping List', 
                      text: text 
                  });
                  toast.success('List shared!');
              } catch(e: any) { 
                  if (e.name !== 'AbortError') {
                      console.error('Share error:', e);
                      await doCopy();
                  }
              }
          } else {
              await doCopy();
          }
      }
  };

  const restockSuggestions = useMemo(() => {
      const candidates = recentEmptyItems || [];
      const existing = new Set([...pantry.map(i => i.name.toLowerCase()), ...shoppingList.map(i => i.name.toLowerCase())]);
      const unique = new Set();
      const suggestions = [];
      for (const item of candidates) {
          const name = item.name.toLowerCase();
          if (!existing.has(name) && !unique.has(name)) { unique.add(name); suggestions.push(item); }
      }
      return suggestions.slice(0, 3);
  }, [recentEmptyItems, pantry, shoppingList]);

  return (
    /* Page container - #0D0D0D near black background */
    <div className="min-h-screen bg-[#0D0D0D] pb-28">
      
      {/* ========== YELLOW HEADER WITH TOMATO RED STRIPES ========== */}
      <div className="relative bg-[#FFC244] overflow-hidden">
        {/* Tomato red slanting stripes */}
        <div className="absolute -right-16 -top-20 w-[200px] h-[350px] bg-[#E84142] rotate-[20deg] opacity-90" />
        <div className="absolute -right-20 -top-10 w-[80px] h-[320px] bg-[#FF6B6B] rotate-[20deg] opacity-70" />
        <div className="absolute -right-24 top-0 w-[50px] h-[300px] bg-[#FF8A8A] rotate-[20deg] opacity-50" />
        
        {/* Decorative circles */}
        <div className="absolute right-6 top-16 w-3 h-3 bg-[#E84142] rounded-full opacity-60" />
        <div className="absolute right-14 top-24 w-2 h-2 bg-white rounded-full opacity-40" />
        
        {/* Header content - safe area + design padding */}
        <div className="relative z-10 px-5 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)' }}>
          {/* Title row with share button */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">🛒</span>
                <h1 className="text-[28px] font-bold text-black tracking-tight">The Haul</h1>
              </div>
              <p className="text-black/70 text-[15px] font-medium">
                {activeItems.length} to buy • {completedItems.length} done
              </p>
            </div>
            {/* Share button - black bg on yellow header */}
            {activeItems.length > 0 && (
              <button 
                onClick={handleShare} 
                aria-label="Share shopping list" 
                className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-black active:scale-90 transition"
              >
                <Share size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>
          
          {/* Add item input in header - white bg */}
          <div 
            id="tour-shop-input" 
            className="relative bg-white rounded-xl shadow-sm flex items-center p-1.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-black/10 mb-4"
          >
            <ShoppingBag size={18} className="absolute left-4 text-black/40" />
            <form onSubmit={handleAdd} className="flex-1">
              <input 
                type="text" 
                className="w-full text-[16px] outline-none placeholder-black/40 bg-transparent font-medium text-black pl-10 pr-4 py-2" 
                placeholder="Add item..." 
                value={newItem} 
                onChange={e => setNewItem(e.target.value)} 
              />
            </form>
            {newItem.length > 0 && (
              <MotionButton 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                onClick={handleAdd} 
                className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-1.5 rounded-full text-[13px] font-bold mr-1 active:scale-95 transition"
              >
                Add
              </MotionButton>
            )}
          </div>
        </div>
        
        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#0D0D0D] rounded-t-[24px]" />
      </div>

      <div className="px-5 pt-2 space-y-5">
        
        {/* ========== SMART RESTOCK SUGGESTIONS (Collapsible) ========== */}
        {/* Uses brand purple theme */}
        {restockSuggestions.length > 0 && (
            <div className="bg-[#7C3AED]/30 rounded-[16px] border border-[#7C3AED]/50 overflow-hidden">
                <button 
                  onClick={() => setShowRestock(!showRestock)}
                  className="w-full flex items-center justify-between p-3 active:bg-[#7C3AED]/5 transition"
                >
                  <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-xs uppercase tracking-wider">
                    <RefreshCw size={12} /> Smart Restock
                    <span className="text-[#A0A0A0] font-medium normal-case">({restockSuggestions.length} suggestions)</span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-[#7C3AED] transition-transform duration-200 ${showRestock ? 'rotate-180' : ''}`} 
                  />
                </button>
                <AnimatePresence>
                  {showRestock && (
                    <MotionDiv
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {restockSuggestions.map(item => (
                          <div 
                            key={`suggest-${item.id}`} 
                            className="flex items-center justify-between bg-[#1A1A1A] p-2.5 rounded-xl border border-[#7C3AED]/20"
                          >
                            <span className="text-[15px] font-medium text-white">{item.name}</span>
                            <button 
                              onClick={() => addToShoppingList([item.name])} 
                              className="w-7 h-7 flex items-center justify-center bg-[#7C3AED] text-white rounded-full hover:bg-[#6D28D9] active:scale-90 transition"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </MotionDiv>
                  )}
                </AnimatePresence>
            </div>
        )}

        {/* ========== ACTIVE ITEMS LIST ========== */}
        {activeItems.length > 0 && (
          <h2 className="text-[13px] font-bold text-[#A0A0A0] uppercase tracking-wider px-1">
            🛍️ To Buy ({activeItems.length})
          </h2>
        )}
        <div className="space-y-3" role="list" aria-label="Shopping items">
            {activeItems.map((item) => (
              <div 
                key={item.id} 
                /* Item card - #1A1A1A surface */
                className="group bg-[#1A1A1A] rounded-[18px] p-4 shadow-sm border border-black/5 flex items-center justify-between" 
                role="listitem"
              >
                <button 
                  onClick={() => handleItemClick(item)} 
                  aria-label={`Mark ${item.name} as bought`} 
                  className="flex items-center gap-3.5 flex-1 text-left"
                >
                  {/* Circle icon - #6B6B6B tertiary, hover #FFC244 yellow */}
                  <div className="text-[#6B6B6B] group-hover:text-[#FFC244] transition-colors active:scale-90">
                    <Circle size={26} strokeWidth={1.5} />
                  </div>
                  {/* Item name - #FFFFFF white */}
                  <span className="text-[17px] text-[#FFFFFF] font-semibold leading-tight">{item.name}</span>
                </button>
                {/* Delete button - #6B6B6B tertiary, hover #F87171 red */}
                <button 
                  onClick={() => removeShoppingItem(item.id)} 
                  aria-label={`Remove ${item.name} from list`} 
                  className="text-[#6B6B6B] hover:text-[#F87171] transition p-2 -mr-2 active:scale-90"
                >
                  <Trash2 size={20} strokeWidth={1.5} />
                </button>
              </div>
            ))}
        </div>

        {/* ========== COMPLETED ITEMS SECTION ========== */}
        {completedItems.length > 0 && (
            <div className="pt-4 pb-10">
                {/* Section header */}
                <div className="flex items-center justify-between mb-3">
                  {/* Toggle button - #A0A0A0 muted text */}
                  <button 
                    onClick={() => setShowCompleted(!showCompleted)} 
                    className="flex items-center gap-1 text-[13px] font-bold text-[#A0A0A0] uppercase tracking-wider ml-1 hover:text-[#FFFFFF] transition"
                  >
                    {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Completed ({completedItems.length})
                  </button>
                  {/* Clear all button - #FFC244 yellow */}
                  {showCompleted && (
                    <button 
                      onClick={clearCheckedItems} 
                      className="text-[#FFC244] text-[13px] font-medium active:opacity-50"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {/* Completed items container - #1A1A1A/50 semi-transparent */}
                {showCompleted && (
                  <div className="bg-[#1A1A1A]/50 rounded-[20px] overflow-hidden border border-black/5 backdrop-blur-sm">
                    <AnimatePresence initial={false}>
                      {completedItems.map((item, idx) => (
                        <MotionDiv 
                          key={item.id} 
                          layout 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }} 
                          className={`flex items-center p-4 ${idx !== completedItems.length - 1 ? 'border-b border-black/5' : ''}`}
                        >
                          {/* Checked icon - #FFC244 yellow fill */}
                          <button 
                            onClick={() => toggleShoppingItem(item.id)} 
                            className="mr-3.5 text-[#FFC244] active:scale-90"
                          >
                            <CheckCircle2 size={26} className="fill-[#FFC244] text-white" />
                          </button>
                          {/* Completed item name - #A0A0A0 muted with strikethrough */}
                          <span className="flex-1 text-[17px] text-[#A0A0A0] line-through decoration-2 decoration-[#A0A0A0]/30 font-medium">
                            {item.name}
                          </span>
                          {/* Remove button - #6B6B6B tertiary, hover #F87171 red */}
                          <button 
                            onClick={() => removeShoppingItem(item.id)} 
                            className="text-[#6B6B6B] hover:text-[#F87171] transition active:scale-90"
                          >
                            <X size={20} strokeWidth={1.5} />
                          </button>
                        </MotionDiv>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
            </div>
        )}
        
        {/* ========== EMPTY STATE ========== */}
        {shoppingList.length === 0 && restockSuggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-in zoom-in-95">
              {/* Empty icon container - #2A2A2A secondary surface */}
              <div className="w-24 h-24 bg-[#2A2A2A] rounded-full flex items-center justify-center text-[#A0A0A0] mb-6 shadow-inner">
                <ShoppingBag size={48} strokeWidth={1} />
              </div>
              {/* Empty title - #FFFFFF white */}
              <h3 className="text-[22px] font-bold text-[#FFFFFF] mb-2">All stocked up. Nice.</h3>
              {/* Empty description - #A0A0A0 muted */}
              <p className="text-[#A0A0A0] max-w-[220px] leading-relaxed text-[15px]">
                Your list is empty. Add items or generate a shopping list from a recipe.
              </p>
            </div>
        )}
      </div>

      {/* ========== PURCHASE CONFIRMATION MODAL ========== */}
      <AnimatePresence>
        {confirmingItem && (
          <MotionDiv 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            /* Overlay - black with blur */
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <MotionDiv 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              /* Modal container - #0D0D0D background */
              className="bg-[#0D0D0D] w-full max-w-xs rounded-[24px] overflow-hidden shadow-2xl"
            >
              {/* Modal content - #1A1A1A surface */}
              <div className="p-6 bg-[#1A1A1A] text-center">
                {/* Modal title - #FFFFFF white */}
                <h3 className="text-[19px] font-bold text-[#FFFFFF] mb-1">Mark as Bought?</h3>
                {/* Modal description - #A0A0A0 muted */}
                <p className="text-[15px] text-[#A0A0A0] mb-4">
                  Did you buy <span className="text-[#FFFFFF] font-semibold">{confirmingItem.name}</span>?
                </p>
                
                <div className="space-y-3">
                  {/* Quantity input row - #0D0D0D background */}
                  <div className="bg-[#0D0D0D] rounded-xl p-3 flex items-center justify-center gap-2">
                    <span className="text-[15px] font-bold text-[#A0A0A0] uppercase text-xs tracking-wider">Qty:</span>
                    {/* Quantity input - #1A1A1A surface */}
                    <input 
                      type="text" 
                      value={buyQty} 
                      onChange={(e) => setBuyQty(e.target.value)} 
                      className="w-16 text-center bg-[#1A1A1A] rounded-lg py-1 text-[17px] font-bold text-[#FFFFFF] shadow-sm outline-none border border-black/5" 
                      autoFocus 
                    />
                    {/* Unit select - #1A1A1A surface */}
                    <select 
                      value={buyUnit} 
                      onChange={(e) => setBuyUnit(e.target.value)} 
                      className="bg-[#1A1A1A] rounded-lg py-1 px-2 text-[17px] font-bold text-[#FFFFFF] shadow-sm outline-none border border-black/5"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  
                  {/* Category select - #0D0D0D background */}
                  <select 
                    className="w-full bg-[#0D0D0D] text-[#FFFFFF] text-[15px] font-medium p-3 rounded-xl appearance-none outline-none border-none text-center" 
                    value={buyCategory} 
                    onChange={e => setBuyCategory(e.target.value)}
                  >
                    {PANTRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  
                  {/* Expiry date input - #0D0D0D background */}
                  <div className="relative flex items-center bg-[#0D0D0D] rounded-xl px-3">
                    <span className="text-[#A0A0A0] text-[13px] mr-2 uppercase font-bold tracking-wider">Expires:</span>
                    <input 
                      type="date" 
                      className="flex-1 bg-transparent py-2.5 text-[15px] outline-none text-[#FFFFFF] text-center" 
                      value={buyExpiry} 
                      onChange={e => setBuyExpiry(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              
              {/* Modal action buttons - #333333 dividers */}
              <div className="grid grid-cols-1 divide-y divide-[#333333]/10">
                {/* Add to Pantry button - #1A1A1A surface, #FFC244 yellow text */}
                <button 
                  onClick={() => confirmPurchase(true)} 
                  className="w-full py-3.5 bg-[#1A1A1A] text-[#FFC244] font-bold text-[17px] active:bg-[#2A2A2A] transition"
                >
                  Add to Pantry & Complete
                </button>
                {/* Just Complete button - #1A1A1A surface, #FFC244 yellow text */}
                <button 
                  onClick={() => confirmPurchase(false)} 
                  className="w-full py-3.5 bg-[#1A1A1A] text-[#FFC244] text-[17px] active:bg-[#2A2A2A] transition"
                >
                  Just Mark Complete
                </button>
                {/* Cancel button - #1A1A1A surface, #F87171 red text */}
                <button 
                  onClick={() => setConfirmingItem(null)} 
                  className="w-full py-3.5 bg-[#1A1A1A] text-[#F87171] font-semibold text-[17px] active:bg-[#2A2A2A] transition"
                >
                  Cancel
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};
