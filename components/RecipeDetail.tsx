
import React, { useMemo, useState, useEffect } from 'react';
import { Recipe, PantryItem } from '../types';
import { ArrowLeft, Clock, Flame, Check, Play, Heart, Share, Plus, ShoppingBag, Sparkles, Loader2, X, Info } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useRecipes } from '../context/RecipeContext';
import { PieChart, Pie, Cell } from 'recharts';
import { askAiAboutStep, isBasicStaple } from '../services/geminiService';
import { ChefMode } from './ChefMode';
import { PantryUpdateModal } from './PantryUpdateModal';
import toast from 'react-hot-toast';
import { getOptimizedImageUrl } from '../services/supabase';
import { hapticMedium, hapticSuccess } from '../utils/hapticService';
import { APP_NAME } from '../brand';

interface Props { recipe: Recipe; onBack: () => void; }

export const RecipeDetail: React.FC<Props> = ({ recipe, onBack }) => {
  const { addToShoppingList, consumeIngredients, pantry } = useInventory();
  const { addRecipeToHistory, toggleBookmark, isBookmarked } = useRecipes();
  const [currentRecipe] = useState<Recipe>(recipe);
  const [prepList, setPrepList] = useState<string[]>([]);
  const [isLoadingSubst, setIsLoadingSubst] = useState(false);
  const [substResult, setSubstResult] = useState<string | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [cookingOrigin, setCookingOrigin] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const isSaved = isBookmarked(currentRecipe.id);
  const { available, missing } = useMemo(() => {
    const isAvailable = (ing: any) => ing.isAvailableInPantry || isBasicStaple(ing.name);
    const available = currentRecipe.ingredients.filter(isAvailable);
    const missing = currentRecipe.ingredients.filter(i => !isAvailable(i));
    return { available, missing };
  }, [currentRecipe]);

  const matchedPantryItems = useMemo(() => {
    return currentRecipe.ingredients.filter(i => i.isAvailableInPantry).map(ing => {
      const match = pantry.find(p => p.name.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(p.name.toLowerCase()));
      return match ? { ingredient: ing.name, amount: ing.amount, pantryItem: match } : null;
    }).filter(Boolean) as { ingredient: string, amount: string, pantryItem: PantryItem }[];
  }, [currentRecipe, pantry]);

  const handleAddToShop = () => { hapticSuccess(); addToShoppingList(missing.map(i => i.name)); toast.success("Added missing items to shopping list"); };
  const handleFinishCooking = (usage: { pantryId: string, usedAmount: string }[]) => { hapticSuccess(); consumeIngredients(usage); addRecipeToHistory(currentRecipe); setShowFinishModal(false); onBack(); };

  const handleShare = async () => {
    const shareData = { title: currentRecipe.title, text: `Check out this recipe for ${currentRecipe.title} on ${APP_NAME}!`, url: window.location.href };
    const doCopy = async () => {
      const textArea = document.createElement("textarea"); textArea.value = `${shareData.text}\n${shareData.url}`; textArea.style.position = "fixed"; document.body.appendChild(textArea); textArea.focus(); textArea.select();
      try { document.execCommand('copy'); toast.success('Recipe link copied to clipboard!'); } catch (err) { toast.error('Could not copy link.'); }
      document.body.removeChild(textArea);
    };
    if (!navigator.share) { await doCopy(); return; }
    try { await navigator.share(shareData); } catch (e) { await doCopy(); }
  };

  const startCooking = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticMedium();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCookingOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setIsCooking(true);
  };

  const togglePrep = (name: string) => { setPrepList(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]); };
  const handleFindSubstitutions = async () => {
    if (isLoadingSubst) return; setIsLoadingSubst(true);
    const missingNames = missing.map(i => i.name).join(", ");
    try { const result = await askAiAboutStep(currentRecipe.title, `Missing Ingredients: ${missingNames}`, "Suggest simple, common substitutions."); setSubstResult(result); }
    catch (e) { setSubstResult("Could not fetch substitutions."); } finally { setIsLoadingSubst(false); }
  };

  const macroData = useMemo(() => {
    const getMacroColor = (name: string) => name === 'Protein' ? 'var(--brand-success)' : name === 'Carbs' ? 'var(--brand-secondary)' : 'var(--brand-error)';
    if (currentRecipe.macros?.length === 3) return currentRecipe.macros.map(m => ({ name: m.name, value: m.value, color: getMacroColor(m.name), label: m.value > 40 ? 'High' : m.value > 20 ? 'Mod' : 'Low' }));
    return [{ name: 'Protein', value: 30, color: 'var(--brand-success)', label: 'Est.' }, { name: 'Carbs', value: 45, color: 'var(--brand-secondary)', label: 'Est.' }, { name: 'Fat', value: 25, color: 'var(--brand-error)', label: 'Est.' }];
  }, [currentRecipe]);

  const showNutritionDisclaimer = () => {
    toast("Nutritional values are calculated estimates based on ingredients. Consult a doctor for medical needs.", { icon: 'ℹ️', duration: 5000, style: { borderRadius: '12px', background: '#333', color: '#fff', fontSize: '13px' } });
  };

  if (isCooking) return <ChefMode recipe={currentRecipe} origin={cookingOrigin} onClose={() => setIsCooking(false)} onFinish={() => { setIsCooking(false); setShowFinishModal(true); }} />;

  return (
    // Main container - #0D0D0D (dark background)
    <div className="bg-brand-background min-h-screen pb-safe animate-in fade-in duration-500">
      {/* Hero image - fixed at top */}
      <div className="fixed top-0 left-0 right-0 h-[45vh] z-0">
        <img src={getOptimizedImageUrl(currentRecipe.generatedImage, 800) || `https://picsum.photos/seed/${currentRecipe.id}/800/800`} className="w-full h-full object-cover" />
        {/* Gradient overlay - fades to dark background #0D0D0D */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0D0D0D]" />
      </div>
      <div className="fixed top-0 left-0 right-0 z-50 pt-safe pointer-events-none">
        <div className="p-4 flex justify-between items-start">
          <button onClick={onBack} aria-label="Go back" className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white active:bg-white/40 transition shadow-lg pointer-events-auto border border-white/10"><ArrowLeft size={20} strokeWidth={2.5} /></button>
          {/* Share and Save buttons */}
          <div className="flex gap-2 pointer-events-auto"><button onClick={handleShare} aria-label="Share recipe" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center text-white transition shadow-lg border border-white/10 active:scale-90"><Share size={18} strokeWidth={2.5} /></button><button onClick={() => toggleBookmark(currentRecipe)} aria-label={isSaved ? "Remove from saved" : "Save recipe"} className={`w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center transition shadow-lg border border-white/10 active:scale-90 ${isSaved ? 'bg-white text-brand-secondary' : 'bg-white/20 text-white'}`}><Heart size={18} fill={isSaved ? "currentColor" : "none"} strokeWidth={2.5} /></button></div>
        </div>
      </div>
      {/* Content sheet - OPAQUE #0D0D0D background to cover hero image */}
      <div className="relative z-10 mt-[35vh] bg-brand-background rounded-t-[32px] overflow-hidden min-h-screen shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {/* Drag handle - #6B6B6B (muted) */}
        <div className="w-full flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-[#6B6B6B] rounded-full" /></div>
        <div className="px-6 pt-2 pb-6">
          {/* Tags - #FFC244 (brand yellow), #E84142 (tomato red) */}
          <div className="flex justify-between items-start mb-4"><div className="flex gap-2 mb-2"><span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-caption font-bold uppercase tracking-wide">{currentRecipe.difficulty}</span><span className="px-3 py-1 bg-brand-secondary/10 text-brand-secondary rounded-full text-caption font-bold uppercase tracking-wide">{currentRecipe.totalTimeMinutes} Min</span></div></div>
          {/* Title #FFFFFF, Description #A0A0A0 */}
          <h1 className="text-[32px] font-bold text-brand-text leading-[1.1] mb-2">{currentRecipe.title}</h1><p className="text-brand-text-secondary text-h3 leading-relaxed">{currentRecipe.description}</p>
        </div>
        {/* Start Cooking button with helper text */}
        <div className="px-6 mb-8">
          <button onClick={startCooking} onTouchEnd={startCooking} className="w-full py-4 bg-brand-button-primary hover:bg-brand-button-primary-hover text-white font-bold text-h3 rounded-2xl shadow-lg shadow-purple-500/30 active:scale-[0.98] transition flex flex-col items-center justify-center gap-1 cursor-pointer touch-manipulation">
            <span className="text-center">Tap here to start cooking or scroll down to view details</span>
          </button>
        </div>
        {/* Nutrition section */}
        <div className="mb-8">
          <div className="flex items-center justify-between px-6 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[19px] font-bold text-brand-text">Nutrition</h3>
              <button type="button" onClick={showNutritionDisclaimer} className="relative z-20 active:opacity-50 transition p-1 hover:bg-brand-surface-secondary rounded-full"><Info size={16} className="text-brand-text-secondary" /></button>
            </div>
            <span className="text-caption text-brand-text-tertiary">Swipe to see more →</span>
          </div>
          <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar">
            {/* Calories card - off-white #FAFAFA background */}
            <div className="min-w-[140px] h-[140px] bg-brand-surface-light rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary"><Flame size={16} fill="currentColor" /></div>
              </div>
              <div>
                <span className="text-h1 font-bold text-brand-text-on-light block leading-none">{currentRecipe.caloriesApprox}</span>
                <span className="text-body font-medium text-brand-text-tertiary">Calories</span>
              </div>
            </div>
            {/* Macro cards - off-white #FAFAFA background */}
            {macroData.map((m) => (
              <div key={m.name} className="min-w-[120px] h-[140px] bg-brand-surface-light rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center relative">
                <div className="relative w-16 h-16 mb-2 flex items-center justify-center">
                  <PieChart width={64} height={64}>
                    <Pie data={[m, { value: 100 - m.value, color: '#E8E8E8' }]} innerRadius={20} outerRadius={28} dataKey="value" startAngle={90} endAngle={-270} stroke="none" cornerRadius={4} paddingAngle={0}>
                      <Cell fill={m.color} />
                      <Cell fill="#E8E8E8" />
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex items-center justify-center text-caption font-bold text-brand-text-tertiary">{m.value}%</div>
                </div>
                <div className="text-center">
                  <div className="text-body font-bold text-brand-text-on-light">{m.name}</div>
                  <div className="text-caption font-medium text-brand-text-tertiary">{m.label}</div>
                </div>
              </div>
            ))}
            {/* Fiber card - off-white #FAFAFA background, shown if available */}
            {currentRecipe.nutrition?.fiber && (
              <div className="min-w-[120px] h-[140px] bg-brand-surface-light rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent mb-2 text-2xl">🌾</div>
                <div className="text-center">
                  <div className="text-h2 font-bold text-brand-text-on-light">{currentRecipe.nutrition.fiber}</div>
                  <div className="text-body font-bold text-brand-text-on-light">Fiber</div>
                  <div className="text-caption font-medium text-brand-text-tertiary">per serving</div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Ingredients section */}
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[19px] font-bold text-brand-text">Ingredients</h3>
            <span className="text-caption text-brand-text-tertiary">{available.length + missing.length} items</span>
          </div>
          <div className="bg-brand-surface rounded-2xl overflow-hidden shadow-sm border border-brand-divider">
            {available.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-caption font-bold text-brand-accent uppercase tracking-wider">✓ From Your Pantry</span>
                  <span className="text-caption text-brand-text-tertiary">Tap to mark as prepped</span>
                </div>
                {available.map((ing, i) => (
                  <div key={i} onClick={() => togglePrep(ing.name)} className="flex items-center p-3 hover:bg-brand-surface-secondary transition cursor-pointer rounded-xl group">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition ${prepList.includes(ing.name) ? 'bg-brand-accent border-brand-accent' : 'border-brand-text-tertiary'}`}>
                      {prepList.includes(ing.name) && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className={`flex-1 ${prepList.includes(ing.name) ? 'opacity-30 line-through' : 'opacity-100'}`}>
                      <span className="text-h3 text-brand-text font-medium">{ing.name}</span>
                      <div className="text-body text-brand-text-secondary">{ing.amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {available.length > 0 && missing.length > 0 && <div className="h-[1px] bg-brand-divider mx-4" />}
            {missing.length > 0 && (
              <div className="p-2 bg-brand-secondary/10">
                <div className="px-3 py-2">
                  <div className="flex flex-wrap justify-between items-center gap-y-2 mb-1">
                    <span className="text-caption font-bold text-brand-secondary uppercase tracking-wider">Missing Ingredients</span>
                    <div className="flex gap-3 flex-wrap justify-end">
                      <button onClick={handleFindSubstitutions} className="text-brand-secondary flex items-center gap-1 active:opacity-50 text-caption font-bold border border-brand-secondary/30 bg-brand-background/50 px-2 py-1 rounded-lg shadow-sm">
                        {isLoadingSubst ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Substitutions
                      </button>
                      <button onClick={handleAddToShop} className="text-brand-primary text-caption font-bold flex items-center gap-1 active:opacity-50 border border-brand-primary/30 bg-brand-background/50 px-2 py-1 rounded-lg shadow-sm">
                        <ShoppingBag size={12} /> Add All To Cart
                      </button>
                    </div>
                  </div>
                  <span className="text-caption text-brand-secondary/60">Get AI substitutions or add to your shopping list</span>
                </div>
                {substResult && (
                  <div className="mx-3 mb-2 p-3 bg-brand-surface-secondary rounded-xl text-body text-brand-text border border-brand-divider relative animate-in zoom-in-95">
                    <button onClick={() => setSubstResult(null)} className="absolute right-2 top-2 opacity-50 hover:opacity-100 text-brand-text-secondary"><X size={14} /></button>
                    <div className="flex items-center gap-1.5 font-bold text-brand-primary mb-1 text-caption uppercase"><Sparkles size={10} fill="currentColor" /> AI Suggestion</div>
                    <p className="leading-relaxed text-brand-text-secondary">{substResult}</p>
                  </div>
                )}
                {missing.map((ing, i) => (
                  <div key={i} className="flex items-center p-3 rounded-xl">
                    <div className="w-5 h-5 rounded-full border-2 border-brand-secondary mr-3 flex items-center justify-center bg-brand-background text-brand-secondary"><Plus size={12} strokeWidth={3} /></div>
                    <div className="flex-1">
                      <span className="text-h3 text-brand-text font-medium">{ing.name}</span>
                      <div className="text-body text-brand-secondary/80 font-medium">{ing.amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Method section */}
        <div className="px-6 pb-20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[19px] font-bold text-brand-text">Method</h3>
            <span className="text-caption text-brand-text-tertiary">{currentRecipe.instructions.length} steps</span>
          </div>
          <div className="bg-brand-surface p-5 rounded-2xl shadow-sm border border-brand-divider space-y-6">
            {currentRecipe.instructions.slice(0, 3).map((step, i) => (
              <div key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-surface-secondary rounded-full flex items-center justify-center text-caption font-bold text-brand-text-secondary">{i + 1}</span>
                <p className="text-h3 text-brand-text leading-relaxed">{step}</p>
              </div>
            ))}
            {currentRecipe.instructions.length > 3 && (
              <div className="pt-2 border-t border-brand-divider">
                <button onClick={startCooking} onTouchEnd={startCooking} className="w-full py-3 text-brand-primary font-medium text-body bg-brand-background rounded-xl cursor-pointer touch-manipulation flex flex-col items-center gap-1">
                  <span>Tap to view all {currentRecipe.instructions.length} steps</span>
                  <span className="text-caption text-brand-text-tertiary font-normal">Opens hands-free Chef Mode with timers & voice</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showFinishModal && <PantryUpdateModal matchedItems={matchedPantryItems} onConfirm={handleFinishCooking} onCancel={() => { setShowFinishModal(false); onBack(); }} />}
    </div>
  );
};
