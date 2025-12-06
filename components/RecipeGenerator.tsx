
import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useUser } from '../context/UserContext';
import { useRecipes } from '../context/RecipeContext';
import { generateRecipes, isBasicStaple } from '../services/geminiService';
import { Recipe, CUISINES } from '../types';
import { Sparkles, Clock, Heart, ArrowLeft, ArrowDown, Flame, Loader2, Leaf, SlidersHorizontal, ChevronUp, ChevronDown, Users, Home, Plus, Minus, Trash2 } from 'lucide-react';
import { RecipeDetail } from './RecipeDetail';
import { CookingLoader } from './CookingLoader';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdUnit } from './AdUnit';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageUrl } from '../services/supabase';
import { hapticMedium, hapticSuccess } from '../utils/hapticService';

/**
 * 🎨 COOK PAGE COLOR REFERENCE (Dark Mode)
 * =========================================
 * Background:     #0D0D0D (near black - page bg)
 * Surface:        #1A1A1A (cards, inputs, containers)
 * Surface Alt:    #2A2A2A (secondary surfaces, toggles off)
 * 
 * Text Primary:   #FFFFFF (white)
 * Text Secondary: #A0A0A0 (muted - labels, placeholders)
 * Text Tertiary:  #6B6B6B (very muted)
 * 
 * Brand Yellow:   #FFC244 (accents, links, icons)
 * Button Purple:  #7C3AED (primary CTA - Let's Cook)
 * Button Purple Hover: #6D28D9
 * 
 * Success Green:  #34D399 (toggle on, pantry ready badge)
 * Info Blue:      #60A5FA (home style toggle)
 * Warning Orange: #F97316 (missing items badge)
 * Error Red:      #F87171
 * 
 * Recipe Card Badges:
 * - Pantry Ready: #10B981 (emerald)
 * - Missing:      #F97316 (orange)
 * - Saves Waste:  #F43F5E (rose)
 */

const MotionDiv = motion.div as any;

export const RecipeGenerator: React.FC = () => {
  const { pantry } = useInventory();
  const { preferences } = useUser();
  const { generatedRecipes, setGeneratedRecipes, bookmarkedRecipes, history, toggleBookmark } = useRecipes();
  
  const [loading, setLoading] = useState(false);
  const recipes = generatedRecipes;
  const [error, setError] = useState<string | null>(null);
  
  // Basic Filters
  const [mealType, setMealType] = useState('Dinner');
  const [timeAvailable, setTimeAvailable] = useState('45 mins');
  
  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [cuisine, setCuisine] = useState('Any');
  const [heroIngredient, setHeroIngredient] = useState('');
  const [prioritizeExpiring, setPrioritizeExpiring] = useState(true);
  const [homeStyle, setHomeStyle] = useState(false);
  const [servings, setServings] = useState(preferences.householdSize || 2);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fromDashboardRef = useRef(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const abortRef = useRef(false);
  
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false }; }, []);

  // Handle URL & State
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    
    setShowSaved(view === 'saved');
    setShowHistory(view === 'history');

    const stateParams = location.state as { recipeToOpen?: Recipe, triggerSurprise?: boolean, fromDashboard?: boolean } | null;
    
    // Track if user came from dashboard
    if (stateParams?.fromDashboard) {
        fromDashboardRef.current = true;
    }
    
    if (stateParams?.recipeToOpen) {
        setSelectedRecipe(stateParams.recipeToOpen);
        // Clear the state to prevent re-opening on refresh
        navigate(location.pathname + location.search, { replace: true, state: {} });
    }

    if (stateParams?.triggerSurprise) {
        if (pantry.length > 0) {
            const randomItem = pantry[Math.floor(Math.random() * pantry.length)];
            setHeroIngredient(randomItem.name);
            setMealType('Dinner');
            setCuisine('Any');
            setHomeStyle(false);
            
            setTimeout(() => {
                if (isMounted.current && !loading) handleGenerate(false);
            }, 100);
        } else {
            setError("Can't surprise you with an empty pantry! Add some food first.");
        }
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, pantry, navigate]); 

  const handleGenerate = async (append = false) => {
    if (pantry.length === 0) {
      setError("Can't cook with vibes alone. Add some food!");
      return;
    }
    
    hapticMedium();
    abortRef.current = false;
    setLoading(true);
    if (!append) { setError(null); setGeneratedRecipes([]); }
    
    try {
      const existingTitles = append ? recipes.map(r => r.title) : [];
      const recipeCount = append ? 3 : 4;
      
      const results = await generateRecipes(
          pantry, 
          preferences, 
          { mealType, timeAvailable, cuisine, heroIngredient, prioritizeExpiring, servings, homeStyle }, 
          existingTitles,
          recipeCount
      );
      
      if (!isMounted.current || abortRef.current) return;

      hapticSuccess();
      setGeneratedRecipes(append ? [...recipes, ...results] : results);
    } catch (err: any) {
      if(isMounted.current && !abortRef.current) {
        console.error('Recipe generation error:', err);
        
        let errorMessage = "Chef's brain freeze. Try again?";
        
        if (err.message?.includes('timeout') || err.message?.includes('Timeout')) {
          errorMessage = "Taking too long... Check your connection and try again.";
        } else if (err.message?.includes('Network error') || err.message?.includes('network')) {
          errorMessage = "No connection. Check your internet and try again.";
        } else if (err.status === 429) {
          errorMessage = "Too many requests. Wait a moment and try again.";
        } else if (err.status === 500 || err.code === 'GENERATION_ERROR') {
          errorMessage = "Something went wrong on our end. Try again in a moment.";
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      if(isMounted.current && !abortRef.current) setLoading(false);
    }
  };

  const handleCancel = () => {
      abortRef.current = true;
      setLoading(false);
  };

  const handleLoadMore = () => handleGenerate(true);

  // Transitions
  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  };

  return (
    <AnimatePresence mode="wait">
      {selectedRecipe ? (
        /* Recipe Detail View - #0D0D0D background */
        <MotionDiv key="detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }} className="relative z-50 bg-[#0D0D0D] min-h-screen">
            <RecipeDetail recipe={selectedRecipe} onBack={() => {
              if (fromDashboardRef.current) {
                fromDashboardRef.current = false;
                navigate('/');
              } else {
                setSelectedRecipe(null);
              }
            }} />
        </MotionDiv>
      ) : showSaved ? (
        /* ========== SAVED RECIPES VIEW ========== */
        <MotionDiv key="saved" {...variants} className="min-h-screen bg-[#0D0D0D] pt-safe pb-28">
            {/* Header - #0D0D0D background */}
            <div className="px-4 pt-8 pb-4 flex justify-between items-end sticky top-0 bg-[#0D0D0D] z-10">
              {/* Title - #FFFFFF white */}
              <h1 className="text-[34px] font-bold text-[#FFFFFF]">Saved</h1>
              {/* Back button - #FFC244 yellow */}
              <button onClick={() => {
                if (fromDashboardRef.current) {
                  fromDashboardRef.current = false;
                  navigate('/');
                } else {
                  setShowSaved(false);
                  navigate('/recipes', { replace: true });
                }
              }} className="text-[#FFC244] font-medium text-[17px]">Back</button>
            </div>
            <div className="px-4 space-y-4">
                {/* Empty state - #A0A0A0 muted */}
                {bookmarkedRecipes.length === 0 && <div className="text-center text-[#A0A0A0] mt-10">No saved recipes yet.</div>}
                {bookmarkedRecipes.map((r, index) => (
                    /* Saved recipe card - #1A1A1A surface */
                    <div key={`${r.id}-${index}`} className="group relative w-full bg-[#1A1A1A] rounded-xl flex border border-black/5 shadow-sm overflow-hidden transition-all">
                        <button onClick={() => setSelectedRecipe(r)} className="flex-1 text-left p-4 flex gap-4 focus:outline-none">
                            <img 
                                src={getOptimizedImageUrl(r.generatedImage, 300) || `https://picsum.photos/seed/${r.id}/300/300`} 
                                className="w-20 h-20 rounded-lg object-cover bg-gray-100" 
                                loading={index < 2 ? "eager" : "lazy"}
                                decoding="async" 
                            />
                            <div className="flex-1 min-w-0">
                                {/* Recipe title - #FFFFFF white */}
                                <h3 className="font-bold text-[#FFFFFF] line-clamp-1">{r.title}</h3>
                                {/* Description - #A0A0A0 muted */}
                                <p className="text-sm text-[#A0A0A0] line-clamp-2">{r.description}</p>
                            </div>
                        </button>
                        {/* Delete button */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(r);
                                toast.success("Removed from saved");
                            }}
                            className="w-14 flex items-center justify-center bg-[#2A2A2A] text-[#6B6B6B] hover:text-[#F87171] hover:bg-[#F87171]/10 border-l border-[#333333] transition-colors active:bg-[#F87171]/20"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </MotionDiv>
      ) : showHistory ? (
        /* ========== HISTORY VIEW ========== */
        <MotionDiv key="history" {...variants} className="min-h-screen bg-[#0D0D0D] pt-safe pb-28">
            <div className="px-4 pt-8 pb-4 flex justify-between items-end sticky top-0 bg-[#0D0D0D] z-10">
              <h1 className="text-[34px] font-bold text-[#FFFFFF]">History</h1>
              <button onClick={() => {
                if (fromDashboardRef.current) {
                  fromDashboardRef.current = false;
                  navigate('/');
                } else {
                  setShowHistory(false);
                  navigate('/recipes', { replace: true });
                }
              }} className="text-[#FFC244] font-medium text-[17px]">Back</button>
            </div>
            {history.length > 0 && (
                 <div className="px-4 mb-4 text-xs text-[#6B6B6B] font-medium uppercase tracking-wide">
                    Showing {preferences.isPro ? '30' : '15'} Days History {preferences.isPro ? '(Pro)' : '(Free)'}
                 </div>
            )}
            <div className="px-4 space-y-4">
                {history.length === 0 && <div className="text-center text-[#A0A0A0] mt-10">No cooking history recently.</div>}
                {history.map((r, index) => (
                    /* History card - #1A1A1A surface */
                    <div key={`${r.id}-${index}`} className="bg-[#1A1A1A] p-4 rounded-xl flex gap-4 border border-black/5 shadow-sm">
                        <button className="relative w-20 h-20 shrink-0 rounded-lg" onClick={() => setSelectedRecipe(r)}>
                           <img 
                                src={getOptimizedImageUrl(r.generatedImage, 300) || `https://picsum.photos/seed/${r.id}/300/300`} 
                                className="w-full h-full rounded-lg object-cover bg-gray-100" 
                                loading={index < 2 ? "eager" : "lazy"}
                                decoding="async" 
                           />
                        </button>
                        <button className="flex-1 min-w-0 text-left" onClick={() => setSelectedRecipe(r)}>
                            <h3 className="font-bold text-[#FFFFFF] line-clamp-1">{r.title}</h3>
                            <p className="text-sm text-[#A0A0A0] line-clamp-2">{r.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-block px-2 py-0.5 bg-[#2A2A2A] text-[#6B6B6B] text-[10px] rounded-md font-medium uppercase">Cooked</span>
                                {r.lastCooked && <span className="text-[10px] text-[#6B6B6B]">{new Date(r.lastCooked).toLocaleDateString()}</span>}
                            </div>
                        </button>
                    </div>
                ))}
            </div>
        </MotionDiv>
      ) : (
        /* ========== MAIN COOK VIEW ========== */
        <MotionDiv key="main" {...variants} className="min-h-screen bg-[#0D0D0D] pb-28 relative">
          {/* ========== PLAIN YELLOW HEADER ========== */}
          <div className="relative bg-[#FFC244] overflow-hidden">
            {/* Header content - safe area padding + design padding */}
            <div className="relative z-10 px-5 pb-10" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2.5rem)' }}>
              {/* Title row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-4xl">👨‍🍳</span>
                    <h1 className="text-[32px] font-bold text-black tracking-tight">Cook</h1>
                  </div>
                  <p className="text-black/70 text-[16px] font-medium">What's on the menu today?</p>
                </div>
                {/* Saved button - white circle with red heart */}
                <button onClick={() => setShowSaved(true)} aria-label="View saved recipes" className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-[#E84142] shadow-md active:scale-95 transition">
                    <Heart size={22} fill="currentColor" />
                </button>
              </div>
            </div>
            
            {/* Curved bottom edge */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#0D0D0D] rounded-t-[24px]" />
          </div>

          {/* ========== FILTERS CARD (Original Position) ========== */}
          <div className="px-4 pt-2 mb-4 relative z-10">
            <div className="bg-[#1A1A1A] rounded-[24px] p-2 shadow-sm border border-black/5">
                {/* Meal Type Tabs */}
                <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar">
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'].map(type => (
                        <button 
                          key={type} 
                          onClick={() => setMealType(type)} 
                          className={`flex-1 py-2.5 px-1 rounded-[18px] text-[13px] font-bold transition-all whitespace-nowrap ${
                            mealType === type 
                              ? 'bg-[#FFC244] text-[#0D0D0D] shadow-lg' 
                              : 'bg-transparent text-[#A0A0A0] hover:bg-[#0D0D0D]'
                          }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Time Slider */}
                <div className="px-4 py-3 flex items-center gap-4">
                    <Clock size={18} className="text-[#A0A0A0]" />
                    <input 
                      type="range" 
                      min="15" 
                      max="120" 
                      step="15" 
                      className="flex-1 h-2 bg-[#0D0D0D] rounded-lg appearance-none cursor-pointer accent-[#FFC244]" 
                      onChange={(e) => setTimeAvailable(`${e.target.value} mins`)} 
                    />
                    <span className="text-[15px] font-bold text-[#FFFFFF] min-w-[70px] text-right">{timeAvailable}</span>
                </div>

                {/* Customize Toggle */}
                <button 
                    id="tour-customize"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-[#FFC244] text-[13px] font-medium border-t border-[#0D0D0D] mt-1 active:bg-[#0D0D0D]/50 rounded-b-[20px] transition"
                >
                    <SlidersHorizontal size={14} /> 
                    {showFilters ? 'Tap to collapse' : 'Tap to customize'}
                    {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {/* ========== ADVANCED FILTERS ========== */}
                <AnimatePresence>
                    {showFilters && (
                        <MotionDiv
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-3 pt-1 space-y-3">
                                {/* Servings */}
                                <div className="flex items-center justify-between p-3 bg-[#0D0D0D] rounded-xl">
                                    <div className="flex items-center gap-2 text-[#A0A0A0]">
                                      <Users size={16} />
                                      <span className="text-[13px] font-bold uppercase">Servings</span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-[#2A2A2A] rounded-lg px-2 py-1">
                                        <button className="p-1 active:opacity-50 text-[#FFC244]" onClick={() => setServings(Math.max(1, servings - 1))}>
                                          <Minus size={16} />
                                        </button>
                                        <span className="font-bold w-6 text-center text-[15px] text-[#FFFFFF]">{servings}</span>
                                        <button className="p-1 active:opacity-50 text-[#FFC244]" onClick={() => setServings(servings + 1)}>
                                          <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Cuisine & Hero Ingredient */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-[#FFC244] uppercase ml-1">Cuisine</label>
                                        <div className="relative">
                                            <select 
                                              className="w-full bg-[#0D0D0D] text-[#FFFFFF] text-[15px] font-medium p-3 rounded-xl appearance-none outline-none border border-[#333333]" 
                                              value={cuisine} 
                                              onChange={(e) => setCuisine(e.target.value)}
                                            >
                                                <option value="Any">Any</option>
                                                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-4 text-[#FFC244] pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-[#FFC244] uppercase ml-1">Hero Item</label>
                                         <div className="relative">
                                            <select 
                                              className="w-full bg-[#0D0D0D] text-[#FFFFFF] text-[15px] font-medium p-3 rounded-xl appearance-none outline-none border border-[#333333]" 
                                              value={heroIngredient} 
                                              onChange={(e) => setHeroIngredient(e.target.value)}
                                            >
                                                <option value="">None</option>
                                                {pantry.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-4 text-[#FFC244] pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Prioritize Expiring */}
                                <div className="flex items-center justify-between bg-[#0D0D0D] p-3 rounded-xl border border-[#333333]">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${prioritizeExpiring ? 'bg-[#FFC244]/20 text-[#FFC244]' : 'bg-[#2A2A2A] text-[#6B6B6B]'}`}>
                                          <Leaf size={16} />
                                        </div>
                                        <div>
                                          <div className="text-[15px] font-bold text-[#FFFFFF]">Prioritize Expiring</div>
                                          <div className="text-[11px] text-[#A0A0A0]">Use oldest items first</div>
                                        </div>
                                    </div>
                                    <button 
                                      onClick={() => setPrioritizeExpiring(!prioritizeExpiring)} 
                                      className={`w-12 h-7 rounded-full p-1 transition-colors ${prioritizeExpiring ? 'bg-[#FFC244]' : 'bg-[#2A2A2A]'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${prioritizeExpiring ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Home Style */}
                                <div className="flex items-center justify-between bg-[#0D0D0D] p-3 rounded-xl border border-[#333333]">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${homeStyle ? 'bg-[#FFC244]/20 text-[#FFC244]' : 'bg-[#2A2A2A] text-[#6B6B6B]'}`}>
                                          <Home size={16} />
                                        </div>
                                        <div>
                                          <div className="text-[15px] font-bold text-[#FFFFFF]">Household Staples</div>
                                          <div className="text-[11px] text-[#A0A0A0]">Simple everyday meals</div>
                                        </div>
                                    </div>
                                    <button 
                                      onClick={() => setHomeStyle(!homeStyle)} 
                                      className={`w-12 h-7 rounded-full p-1 transition-colors ${homeStyle ? 'bg-[#FFC244]' : 'bg-[#2A2A2A]'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${homeStyle ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </MotionDiv>
                    )}
                </AnimatePresence>
            </div>

            {/* ========== GENERATE BUTTON ========== */}
            <button 
              id="tour-cook-btn"
              onClick={() => handleGenerate(false)}
              disabled={loading}
              className="w-full mt-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-[17px] py-4 rounded-[20px] shadow-lg shadow-purple-500/30 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
            >
                {loading ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Thinking...</span> : "Let's Cook"}
            </button>
          </div>

          {/* Error message - red theme */}
          {error && <div className="mx-4 mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-center text-sm font-medium border border-red-100">{error}</div>}

          {/* ========== RECIPE CARDS ========== */}
          <div className="space-y-6 px-4 pb-12">
            {recipes.map((recipe, index) => {
                const missingCount = recipe.ingredients.filter(i => !i.isAvailableInPantry && !isBasicStaple(i.name)).length;
                const isReady = missingCount === 0;
                
                return (
              <React.Fragment key={recipe.id}>
                {/* Recipe card - #1A1A1A surface with image */}
                <button 
                  onClick={() => setSelectedRecipe(recipe)} 
                  className="group relative h-[320px] w-full text-left rounded-[28px] overflow-hidden bg-[#1A1A1A] shadow-xl shadow-black/20 cursor-pointer active:scale-[0.98] transition-all focus:outline-none focus:ring-4 focus:ring-[#FFC244]/20"
                >
                    <img 
                        src={getOptimizedImageUrl(recipe.generatedImage, 600) || `https://picsum.photos/seed/${recipe.id}/600/400`} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        loading={index < 2 ? "eager" : "lazy"} 
                        decoding="async" 
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    {/* Status badges */}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                        {/* Pantry Ready - #10B981 emerald / Missing - #F97316 orange */}
                        {isReady 
                          ? <span className="px-3 py-1.5 bg-[#10B981] text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-lg border border-white/20">Pantry Ready</span> 
                          : <span className="px-3 py-1.5 bg-[#F97316] text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-lg border border-white/20">{missingCount} Missing</span>
                        }
                        {/* Saves Waste - #F43F5E rose */}
                        {recipe.usesExpiringIngredients && (
                          <span className="px-3 py-1.5 bg-[#F43F5E] text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-lg border border-white/20 flex items-center gap-1">
                            <Leaf size={10} fill="currentColor" /> Saves Waste
                          </span>
                        )}
                    </div>
                    
                    {/* Recipe info overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-[20px] shadow-lg">
                            <h3 className="text-white text-[22px] font-bold leading-tight mb-2 text-shadow-sm line-clamp-2">{recipe.title}</h3>
                            <div className="flex items-center gap-3 text-white/90 text-[13px] font-semibold">
                                <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg"><Clock size={14} /> {recipe.totalTimeMinutes}m</span>
                                <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg"><Flame size={14} /> {recipe.caloriesApprox} kcal</span>
                                <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg"><Sparkles size={14} /> {recipe.difficulty}</span>
                            </div>
                        </div>
                    </div>
                </button>
                {index === recipes.length - 1 && <div className="animate-in fade-in slide-in-from-bottom-2 mt-4"><AdUnit type="card" /></div>}
              </React.Fragment>
            )})}
            
            {/* Load More button - #1A1A1A surface, #FFC244 yellow text */}
            {recipes.length > 0 && (
              <button 
                onClick={handleLoadMore} 
                disabled={loading} 
                className="w-full py-4 bg-[#1A1A1A] border border-black/5 text-[#FFC244] font-bold text-[17px] rounded-[20px] shadow-sm active:bg-[#2A2A2A] transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <ArrowDown size={20} />} Generate More
              </button>
            )}
          </div>
          {loading && <CookingLoader onCancel={handleCancel} />}
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};
