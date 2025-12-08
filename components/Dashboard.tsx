
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useRecipes } from '../context/RecipeContext';
import { 
  Coffee, Sun, Moon, X,
  Check, History, ChefHat, Plus, RefreshCw,
  Clock, ChevronRight, Utensils,
  AlertCircle, BatteryWarning, Archive, Sparkles, Trash2
} from 'lucide-react';
import { formatDistanceToNow, isThisWeek, startOfWeek, format } from 'date-fns';
import { AdUnit } from './AdUnit';
import { isLowStock } from '../services/quantityService';
import { getOptimizedImageUrl, supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const MotionSpan = motion.span as any;
const MotionDiv = motion.div as any;

// Curated inspiration images for empty state
const INSPIRATION_RECIPES = [
  { id: 'insp-1', title: 'Fresh Pasta Carbonara', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80', time: '25 min' },
  { id: 'insp-2', title: 'Grilled Salmon Bowl', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80', time: '20 min' },
  { id: 'insp-3', title: 'Thai Green Curry', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80', time: '30 min' },
  { id: 'insp-4', title: 'Mediterranean Mezze', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80', time: '15 min' },
];

// Daily cooking tips
const COOKING_TIPS = [
  { emoji: "🧂", tip: "Salt your pasta water generously — it should taste like the sea!" },
  { emoji: "🔪", tip: "Let meat rest after cooking for 5 mins for juicier results." },
  { emoji: "🧄", tip: "Smash garlic with the flat of your knife to peel it instantly." },
  { emoji: "🍳", tip: "Preheat your pan before adding oil for better searing." },
  { emoji: "🥬", tip: "Store herbs in a damp paper towel to keep them fresh longer." },
  { emoji: "🍋", tip: "Add a squeeze of lemon at the end to brighten any dish." },
  { emoji: "🧈", tip: "Room temperature butter creams better for baking." },
  { emoji: "🥚", tip: "Add eggs to cold water, then boil for easier peeling." },
  { emoji: "🌶️", tip: "Remove seeds from peppers for less heat, keep for more." },
  { emoji: "🧅", tip: "Chill onions before cutting to reduce tears." },
  { emoji: "🍝", tip: "Save pasta water — the starch helps sauce cling to noodles." },
  { emoji: "🥩", tip: "Pat meat dry before searing for a better crust." },
  { emoji: "🫒", tip: "Use olive oil for low-medium heat, not high heat frying." },
  { emoji: "🍅", tip: "Store tomatoes stem-side down to keep them fresh." },
  { emoji: "🥑", tip: "Ripen avocados faster by putting them in a paper bag." },
  { emoji: "🧊", tip: "Freeze leftover herbs in olive oil for easy cooking cubes." },
  { emoji: "🍞", tip: "Stale bread makes the best croutons and breadcrumbs." },
  { emoji: "🥕", tip: "Roast vegetables at high heat for caramelization magic." },
  { emoji: "🍯", tip: "Microwave honey for 10 secs to make it easier to pour." },
  { emoji: "🧀", tip: "Grate cold cheese — it melts more evenly." },
  { emoji: "🌿", tip: "Add delicate herbs like basil at the very end of cooking." },
  { emoji: "🍖", tip: "Bring meat to room temp before cooking for even results." },
  { emoji: "🥄", tip: "Taste as you go — seasoning is a journey, not a destination." },
  { emoji: "🫚", tip: "Freeze ginger and grate it directly — no peeling needed!" },
  { emoji: "🥞", tip: "Let pancake batter rest 5 mins for fluffier pancakes." },
  { emoji: "🍲", tip: "Soups and stews taste better the next day — make extra!" },
  { emoji: "🥗", tip: "Dress salads right before serving to keep them crispy." },
  { emoji: "🍰", tip: "Use a hot knife to cut clean slices of cake." },
  { emoji: "☕", tip: "A pinch of salt in coffee reduces bitterness." },
  { emoji: "🥜", tip: "Toast nuts before adding to dishes for deeper flavor." },
];

// Animated number component
const AnimatedNumber: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }
    
    const duration = 600;
    const steps = 20;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <MotionSpan 
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={className}
    >
      {displayValue}
    </MotionSpan>
  );
};

// Skeleton loader component
// Skeleton: #2A2A2A (surface secondary for dark mode)
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-brand-surface-secondary rounded-lg ${className}`} />
);

// Stat card skeleton
// Card: #1A1A1A surface | Border: #333333
const StatCardSkeleton: React.FC = () => (
  <div className="bg-brand-surface p-5 rounded-[22px] shadow-sm border border-brand-divider flex flex-col justify-between h-[160px]">
    <div className="w-full flex items-start justify-between">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="w-12 h-10" />
    </div>
    <div>
      <Skeleton className="w-24 h-5 mb-2" />
      <Skeleton className="w-32 h-4" />
    </div>
  </div>
);

// Recipe card skeleton
// Card: #1A1A1A surface | Border: #333333
const RecipeCardSkeleton: React.FC = () => (
  <div className="snap-start shrink-0 w-[260px] h-[180px] bg-brand-surface rounded-[20px] shadow-sm border border-brand-divider overflow-hidden">
    <Skeleton className="w-full h-full rounded-none" />
  </div>
);

// Hero carousel skeleton - removed, using inline skeleton instead

// Recipe Carousel Hero Component
interface CarouselRecipe {
  id: string;
  title: string;
  image?: string;
  generatedImage?: string;
  time?: string;
  cookTime?: number;
  lastCooked?: number;
  isInspiration?: boolean;
}

const RecipeCarousel: React.FC<{ 
  recipes: CarouselRecipe[]; 
  onRecipeClick: (recipe: CarouselRecipe) => void;
  onStartCooking: () => void;
}> = ({ recipes, onRecipeClick, onStartCooking }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = 280 + 12; // card width + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    }
  }, []);
  
  const displayRecipes = recipes.length > 0 ? recipes : INSPIRATION_RECIPES;
  const isInspiration = recipes.length === 0;
  
  return (
    <div className="relative">
      {/* Carousel container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 pb-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {displayRecipes.map((recipe, index) => (
          <button
            key={recipe.id}
            onClick={() => isInspiration ? onStartCooking() : onRecipeClick(recipe)}
            className="snap-start shrink-0 w-[280px] h-[180px] rounded-[20px] overflow-hidden relative group focus:outline-none shadow-lg"
          >
            {/* Food image */}
            <img 
              src={recipe.generatedImage ? getOptimizedImageUrl(recipe.generatedImage, 600) : (recipe.image || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80`)}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading={index < 2 ? "eager" : "lazy"}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute inset-0 p-4 flex flex-col justify-end items-start text-left">
              {/* Time badge */}
              {(recipe.time || recipe.cookTime) && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
                  <Clock size={12} className="text-white/80" />
                  <span className="text-white text-[11px] font-semibold">
                    {recipe.time || `${recipe.cookTime} min`}
                  </span>
                </div>
              )}
              
              {/* Recipe title */}
              <h2 className="text-white text-[18px] font-bold leading-tight mb-1 drop-shadow-lg line-clamp-2 text-left">
                {recipe.title}
              </h2>
              
              {/* CTA for inspiration cards */}
              {isInspiration && (
                <div className="flex items-center gap-1 text-brand-primary font-semibold text-xs">
                  <span>Start cooking</span>
                  <ChevronRight size={14} />
                </div>
              )}
              
              {/* Last cooked date for real recipes */}
              {!isInspiration && (
                <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
                  <Clock size={12} />
                  <span>
                    {recipe.lastCooked 
                      ? `Cooked ${new Date(recipe.lastCooked).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : 'Recently cooked'
                    }
                  </span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {/* Dots indicator - below carousel */}
      {displayRecipes.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {displayRecipes.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'w-5 bg-brand-primary' 
                  : 'w-1.5 bg-brand-divider'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Compact Stats Strip Component
// Pantry stats grid - compact 2x2 with emojis and brand colors
const PantryStatsGrid: React.FC<{ stats: { emoji: string; count: number; label: string; bg: string; onClick: () => void }[] }> = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3">
    {stats.map((stat, index) => (
      <button
        key={index}
        onClick={stat.onClick}
        className={`${stat.bg}/85 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 active:scale-[0.98] transition border border-white/10 shadow-lg`}
      >
        <span className="text-2xl">{stat.emoji}</span>
        <div className="text-left">
          <span className="text-white font-bold text-base block">{stat.count}</span>
          <span className="text-white/90 text-[15px] font-semibold">{stat.label}</span>
        </div>
      </button>
    ))}
  </div>
);

export const Dashboard: React.FC = () => {
  const { pantry, shoppingList, recentEmptyItems, addToShoppingList, removePantryItem, updatePantryItem, isLoading: inventoryLoading } = useInventory();
  const { history, bookmarkedRecipes, isLoading: recipesLoading } = useRecipes();
  const navigate = useNavigate();
  const [showExpiring, setShowExpiring] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [showCleanUp, setShowCleanUp] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [userName, setUserName] = useState<string>('');
  
  const isLoading = inventoryLoading || recipesLoading;
  
  // Fetch user's name
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) {
        // Get first name only
        const firstName = user.user_metadata.full_name.split(' ')[0];
        setUserName(firstName);
      }
    });
  }, []);
  
  // Pull to refresh logic
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      const touch = e.touches[0];
      (e.currentTarget as any).startY = touch.clientY;
    }
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0 && (e.currentTarget as any).startY) {
      const touch = e.touches[0];
      const diff = touch.clientY - (e.currentTarget as any).startY;
      if (diff > 0 && diff < 150) {
        setPullDistance(diff);
      }
    }
  }, []);
  
  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 80) {
      setIsRefreshing(true);
      // Simulate refresh - in real app, this would refetch data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsRefreshing(false);
      toast.success('Dashboard refreshed!', { icon: '🔄' });
    }
    setPullDistance(0);
  }, [pullDistance]);
  
  const hour = new Date().getHours();
  const timeContext = useMemo(() => {
    if (hour < 11) return { greeting: 'Morning vibe check.', icon: <Coffee size={14} strokeWidth={2.5} />, label: 'Breakfast' };
    if (hour < 16) return { greeting: 'Let\'s get cooking.', icon: <Sun size={14} strokeWidth={2.5} />, label: 'Lunch' };
    return { greeting: 'Dinner time?', icon: <Moon size={14} strokeWidth={2.5} />, label: 'Dinner' };
  }, [hour]);

  const expiringSoon = pantry.filter(item => {
      if (!item.expiryDate) return false;
      const diff = new Date(item.expiryDate).getTime() - Date.now();
      return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  });

  const lowStockItems = pantry.filter(item => isLowStock(item.quantity, item.unit || 'pcs', item.category));

  const outOfStockItems = useMemo(() => {
      const currentInventoryNames = new Set(pantry.map(i => i.name.toLowerCase().trim()));
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const candidates = (recentEmptyItems || []).filter(item => item.removedAt > sevenDaysAgo).filter(item => !currentInventoryNames.has(item.name.toLowerCase().trim()));
      const uniqueHistory = new Map();
      candidates.forEach(item => { const key = item.name.toLowerCase().trim(); if (!uniqueHistory.has(key)) { uniqueHistory.set(key, item); } });
      return Array.from(uniqueHistory.values());
  }, [pantry, recentEmptyItems]);

  // Weekly cooking stats
  const weeklyStats = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const recipesThisWeek = history.filter(recipe => {
      if (!recipe.lastCooked) return false;
      return isThisWeek(new Date(recipe.lastCooked), { weekStartsOn: 1 });
    });
    return {
      count: recipesThisWeek.length,
      weekLabel: `Week of ${format(weekStart, 'MMM d')}`
    };
  }, [history]);

  // Quick Meal Suggestion - saved recipe with highest pantry match
  const quickMealSuggestion = useMemo(() => {
    if (bookmarkedRecipes.length === 0 || pantry.length === 0) return null;
    
    const pantryNames = pantry.map(p => p.name.toLowerCase());
    
    const withMatch = bookmarkedRecipes.map(recipe => {
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        return { ...recipe, matchCount: 0, totalCount: 1, matchPercent: 0 };
      }
      
      const matchCount = recipe.ingredients.filter(ing => 
        pantryNames.some(pName => 
          pName.includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(pName)
        )
      ).length;
      
      return {
        ...recipe,
        matchCount,
        totalCount: recipe.ingredients.length,
        matchPercent: Math.round((matchCount / recipe.ingredients.length) * 100)
      };
    });
    
    // Only suggest if at least 60% match
    const goodMatches = withMatch.filter(r => r.matchPercent >= 60);
    if (goodMatches.length === 0) return null;
    
    // Return the best match
    return goodMatches.sort((a, b) => b.matchPercent - a.matchPercent)[0];
  }, [bookmarkedRecipes, pantry]);

  // Today's cooking tip - rotates daily
  const todaysTip = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return COOKING_TIPS[dayOfYear % COOKING_TIPS.length];
  }, []);

  const staleItems = pantry.filter(item => (Date.now() - (item.addedAt || 0)) > 30 * 24 * 60 * 60 * 1000);
  const recentRecipes = history.slice(0, 5);
  
  // Carousel recipes - recent history with images
  const carouselRecipes = useMemo(() => {
    return history
      .filter(r => r.generatedImage) // Only recipes with images
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        title: r.title,
        generatedImage: r.generatedImage,
        cookTime: r.cookTime,
        lastCooked: r.lastCooked,
      }));
  }, [history]);

  const handleAddToShoppingList = (itemName: string) => {
    addToShoppingList([itemName]);
    toast.success(`Added ${itemName} to shopping list`, { icon: '🛒' });
  };

  // Quick action button component - emoji style for visual appeal
const QuickAction: React.FC<{ emoji: string; label: string; onClick: () => void }> = ({ emoji, label, onClick }) => (
    <button 
      onClick={onClick} 
      aria-label={label}
      className="flex flex-col items-center gap-2 group focus:outline-none"
    >
        {/* Large colorful emoji icon */}
        <span className="text-[42px] group-active:scale-90 transition-transform drop-shadow-lg">{emoji}</span>
        {/* Theme-aware label */}
        <span className="text-[12px] font-semibold text-brand-text">{label}</span>
    </button>
  );

  // Background: #0D0D0D (near black - page bg)
  return (
    <div 
      className="min-h-screen bg-brand-background pb-28 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
        {/* Pull to refresh indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div 
            className="absolute left-0 right-0 flex justify-center z-50 transition-all"
            style={{ top: Math.min(pullDistance, 80) - 40 }}
          >
            {/* Refresh icon: purple bg | Icon: white */}
            <div className={`w-10 h-10 rounded-full bg-brand-button-primary shadow-lg flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw size={20} className="text-white" />
            </div>
          </div>
        )}
        
        {/* Yellow Header Section - compact for mobile */}
        <div className="relative bg-brand-primary pt-safe overflow-hidden">
          {/* Purple wavy accent - diagonal stripe extending to bottom */}
          <div className="absolute -right-10 -top-10 w-[180px] h-[500px] bg-brand-button-primary rotate-[20deg] opacity-90" />
          <div className="absolute -right-16 top-0 w-[80px] h-[500px] bg-brand-button-primary rotate-[20deg] opacity-70" />
          {/* Small purple circles for decoration */}
          <div className="absolute right-6 top-16 w-3 h-3 bg-brand-button-primary rounded-full opacity-60" />
          <div className="absolute right-14 top-24 w-2 h-2 bg-white rounded-full opacity-40" />
          
          {/* Header content - optimized spacing */}
          <div className="relative z-10 px-5 pt-5 pb-10">
            {/* Top row: Date */}
            <div className="mb-3">
              <div className="inline-flex items-center gap-1.5 bg-black/10 px-2.5 py-1 rounded-full">
                <span className="text-black/70 text-[11px] font-bold uppercase tracking-wider">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
            
            {/* Main row: Greeting + Achievement Card */}
            <div className="flex items-start justify-between gap-4">
              {/* Left: Greeting */}
              <div className="flex-1">
                <h1 className="text-[24px] font-bold text-black tracking-tight leading-tight">
                  {userName ? `Hey ${userName}! 👋` : 'Hey there! 👋'}
                </h1>
                <p className="text-black/70 text-[14px] font-medium mt-0.5">
                  {timeContext.greeting.replace('?', '')} — let's cook!
                </p>
                
                {/* Pantry status badge */}
                <Link 
                  to="/pantry"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-black/10 hover:bg-black/15 rounded-full text-[13px] transition"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                  <span className="text-black/80 font-semibold">{pantry.length} items</span>
                  <ChevronRight size={12} className="text-black/60" />
                </Link>
              </div>
              
              {/* Right: Weekly Achievement Card - Premium Badge */}
              <div className="relative flex-shrink-0 animate-[float_3s_ease-in-out_infinite]">
                {/* Card with intense shadow */}
                <div className={`relative rounded-2xl px-3 py-2.5 shadow-2xl shadow-black/40 border overflow-hidden ${
                  weeklyStats.count > 0 
                    ? 'bg-gradient-to-br from-white via-white to-amber-50 border-amber-200/50' 
                    : 'bg-gradient-to-br from-white via-white to-purple-50 border-purple-200/50'
                }`}>
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                  
                  {weeklyStats.count > 0 ? (
                    <>
                      {/* Top row: Trophy + Count + Label */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        <span className="text-2xl font-black text-black leading-none">{weeklyStats.count}</span>
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">
                          {weeklyStats.count === 1 ? 'meal' : 'meals'}<br/>cooked
                        </span>
                      </div>
                      {/* Bottom: Motivational text */}
                      <div className="text-[11px] font-semibold text-gray-500 mt-1 text-center">
                        🔥 Keep it up!
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Motivational state for 0 meals */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👨‍🍳</span>
                        <span className="text-[11px] font-bold text-brand-button-primary uppercase tracking-wide">
                          Let's cook<br/>this week!
                        </span>
                      </div>
                      {/* Bottom: CTA text */}
                      <div className="text-[11px] font-semibold text-gray-500 mt-1 text-center">
                        ✨ Start your streak
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Curved bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-brand-background rounded-t-[24px]" />
        </div>
        
        <div className="space-y-6 pt-2">
            {/* SECTION: Recent Recipes */}
            <div>
              <div className="px-5 flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-bold text-brand-text-secondary uppercase tracking-wider">Cook Again</h2>
                {carouselRecipes.length > 0 && (
                  <button onClick={() => navigate('/recipes?view=history', { state: { fromDashboard: true } })} className="text-brand-primary text-[13px] font-semibold">See All</button>
                )}
              </div>
              <div className="pl-5">
                {isLoading ? (
                  <div className="flex gap-3 pr-5">
                    <Skeleton className="w-[280px] h-[180px] rounded-[20px] shrink-0" />
                    <Skeleton className="w-[280px] h-[180px] rounded-[20px] shrink-0" />
                  </div>
                ) : (
                  <RecipeCarousel 
                    recipes={carouselRecipes}
                    onRecipeClick={(recipe) => navigate('/recipes', { state: { recipeToOpen: history.find(h => h.id === recipe.id), fromDashboard: true } })}
                    onStartCooking={() => navigate('/recipes')}
                  />
                )}
              </div>
            </div>
            
            {/* SECTION: Quick Actions */}
            <div className="px-5">
                <h2 className="text-[13px] font-bold text-brand-text-secondary uppercase tracking-wider mb-4">Quick Actions</h2>
                <div className="flex justify-between items-start">
                    <QuickAction emoji="📸" label="Snap to add" onClick={() => navigate('/pantry?action=snap')} />
                    <QuickAction emoji="✨" label="Surprise me" onClick={() => navigate('/recipes', { state: { triggerSurprise: true } })} />
                    <QuickAction emoji="♻️" label="Clean pantry" onClick={() => setShowCleanUp(true)} />
                    <QuickAction emoji="❤️" label="My likes" onClick={() => navigate('/recipes?view=saved', { state: { fromDashboard: true } })} />
                </div>
            </div>
            
            {/* SECTION: Pantry Status */}
            <div className="px-5">
              <h2 className="text-[13px] font-bold text-brand-text-secondary uppercase tracking-wider mb-3">Pantry Status</h2>
              {isLoading ? (
                <div className="flex gap-2">
                  <Skeleton className="w-32 h-12 rounded-full" />
                  <Skeleton className="w-32 h-12 rounded-full" />
                  <Skeleton className="w-32 h-12 rounded-full" />
                </div>
              ) : (
                <PantryStatsGrid 
                  stats={[
                    { emoji: "⏰", count: expiringSoon.length, label: "Expiring soon", bg: "bg-brand-primary/85", onClick: () => setShowExpiring(true) },
                    { emoji: "📉", count: lowStockItems.length, label: "Low on stock", bg: "bg-brand-button-primary/85", onClick: () => setShowLowStock(true) },
                    { emoji: "⚠️", count: outOfStockItems.length, label: "Out of stock", bg: "bg-brand-secondary/85", onClick: () => setShowOutOfStock(true) },
                    { emoji: "🛒", count: shoppingList.filter(i => !i.checked).length, label: "To buy", bg: "bg-brand-accent/85", onClick: () => navigate('/shopping') },
                  ]}
                />
              )}
            </div>
            
            <div className="px-5"><AdUnit type="banner" /></div>
            
            {/* SECTION: Quick Meal Idea */}
            {quickMealSuggestion && (
              <div className="px-5">
                <h2 className="text-[13px] font-bold text-brand-text-secondary uppercase tracking-wider mb-3">Quick Meal Idea</h2>
                <button 
                  onClick={() => navigate('/recipes', { state: { recipeToOpen: quickMealSuggestion, fromDashboard: true } })}
                  className="w-full h-[180px] rounded-[20px] overflow-hidden relative group focus:outline-none shadow-lg active:scale-[0.98] transition-all"
                >
                  {/* Food image */}
                  <img 
                    src={getOptimizedImageUrl(quickMealSuggestion.generatedImage, 600) || `https://picsum.photos/seed/${quickMealSuggestion.id}/600/400`}
                    alt={quickMealSuggestion.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Content overlay */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-end items-start text-left">
                    {/* Time badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
                      <Clock size={12} className="text-white/80" />
                      <span className="text-white text-[11px] font-semibold">
                        {quickMealSuggestion.totalTimeMinutes || 30} min
                      </span>
                    </div>
                    
                    {/* Ingredient match badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-brand-accent/90 backdrop-blur-md px-2 py-1 rounded-full">
                      <span className="text-white text-[11px] font-semibold">
                        ✓ {quickMealSuggestion.matchCount}/{quickMealSuggestion.totalCount} ingredients
                      </span>
                    </div>
                    
                    {/* Recipe title */}
                    <h2 className="text-white text-[18px] font-bold leading-tight mb-1 drop-shadow-lg line-clamp-2 text-left">
                      {quickMealSuggestion.title}
                    </h2>
                    
                    {/* CTA */}
                    <div className="flex items-center gap-1 text-brand-primary font-semibold text-xs">
                      <span>Cook now</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </button>
              </div>
            )}
            
            {/* SECTION: Today's Tip */}
            <div className="px-5">
              <h2 className="text-[13px] font-bold text-brand-text-secondary uppercase tracking-wider mb-3">Today's Tip</h2>
              <div className="relative animate-[float_3s_ease-in-out_infinite]">
                {/* Card */}
                <div className="relative bg-[#E8E8E8] rounded-[20px] p-5 text-center overflow-hidden shadow-xl">
                  {/* Shine effect */}
                  <div 
                    className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite]" 
                    style={{ 
                      background: 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 80%)' 
                    }} 
                  />
                  
                  {/* Large emoji */}
                  <span className="text-5xl block mb-3 drop-shadow-lg">{todaysTip.emoji}</span>
                  
                  {/* Tip text */}
                  <p className="text-brand-text-on-light text-[15px] leading-relaxed font-medium italic">
                    "{todaysTip.tip}"
                  </p>
                  
                  {/* Footer label */}
                  <div className="flex items-center justify-center gap-1.5 mt-4 text-brand-text-tertiary text-[11px] font-semibold">
                    <span>💡</span>
                    <span>Daily Tip</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* SECTION: More Recipes - only show if there are recipes not in carousel */}
            {recentRecipes.length > carouselRecipes.length && (
              <div className="pb-4">
                <div className="px-5 flex items-center justify-between mb-3">
                  <h2 className="text-[13px] font-bold text-brand-text-secondary uppercase tracking-wider">More Recipes</h2>
                  <button onClick={() => navigate('/recipes?view=history', { state: { fromDashboard: true } })} className="text-brand-primary text-[13px] font-semibold">See All</button>
                </div>
                
                <div className="flex overflow-x-auto px-5 gap-3 no-scrollbar pb-4 snap-x">
                    {recentRecipes.filter(r => !carouselRecipes.find(c => c.id === r.id)).map((recipe, index) => (
                        <button key={recipe.id} onClick={() => navigate('/recipes', { state: { recipeToOpen: recipe, fromDashboard: true } })} className="snap-start shrink-0 w-[200px] h-[140px] bg-brand-surface rounded-[16px] shadow-sm border border-brand-divider overflow-hidden relative group cursor-pointer active:scale-[0.98] transition-all text-left focus:outline-none focus:ring-4 focus:ring-brand-primary/20">
                            <img src={getOptimizedImageUrl(recipe.generatedImage, 400) || `https://picsum.photos/seed/${recipe.id}/400/300`} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-500" loading="lazy" decoding="async" alt={recipe.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                              <h4 className="text-white font-bold text-sm leading-tight line-clamp-2">{recipe.title}</h4>
                            </div>
                        </button>
                    ))}
                </div>
              </div>
            )}
            
            {/* Empty state for new users */}
            {!isLoading && history.length === 0 && (
              <div className="px-5 pb-4">
                <h2 className="text-[13px] font-bold text-brand-text-secondary uppercase tracking-wider mb-3">Get Started</h2>
                <div className="bg-brand-surface rounded-[20px] p-6 text-center border border-brand-divider">
                  <div className="w-14 h-14 rounded-full bg-brand-background flex items-center justify-center mx-auto mb-3">
                    <ChefHat size={28} className="text-brand-text-secondary" />
                  </div>
                  <h4 className="text-[16px] font-bold text-brand-text mb-1">Ready to start cooking?</h4>
                  <p className="text-[13px] text-brand-text-secondary mb-4">Add ingredients to your pantry and discover recipes</p>
                  <button 
                    onClick={() => navigate('/recipes')}
                    className="px-5 py-2.5 bg-brand-button-primary hover:bg-brand-button-primary-hover text-white font-bold text-sm rounded-full active:scale-95 transition"
                  >
                    Find Recipes
                  </button>
                </div>
              </div>
            )}
        </div>
        
        {/* Modals */}
        {showExpiring && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="expiring-title"><div className="bg-brand-background w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95"><div className="p-4 bg-brand-surface border-b border-brand-divider flex justify-between items-center"><div><h3 id="expiring-title" className="font-bold text-xl text-brand-text">Expiring Soon</h3><p className="text-xs text-brand-text-secondary">Use within 3 days</p></div><button onClick={(e) => { e.stopPropagation(); setShowExpiring(false); }} aria-label="Close expiring items modal" className="w-8 h-8 bg-brand-surface-secondary rounded-full flex items-center justify-center text-brand-text active:opacity-70 transition"><X size={18} /></button></div><div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">{expiringSoon.length === 0 ? (<div className="text-center py-8"><div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto mb-2"><AlertCircle size={24} /></div><p className="text-brand-text-secondary font-medium">Nothing expiring. You're winning at life.</p></div>) : (expiringSoon.map(item => (<div key={item.id} className="bg-brand-surface p-3 rounded-[18px] border border-brand-divider flex items-center justify-between"><div><div className="font-semibold text-brand-text">{item.name}</div><div className="text-xs text-brand-text-secondary">Qty: {item.quantity} {item.unit}</div></div><span className="text-xs font-bold text-orange-400 bg-orange-500/20 px-2.5 py-1 rounded-full">{item.expiryDate ? formatDistanceToNow(new Date(item.expiryDate), { addSuffix: true }) : 'Soon'}</span></div>)))}</div><div className="p-4 bg-brand-surface border-t border-brand-divider"><button onClick={() => { setShowExpiring(false); navigate('/recipes'); }} className="w-full py-3.5 bg-brand-primary text-white font-bold rounded-[18px] active:scale-[0.98] transition">Find Recipes</button></div></div></div>}
        {showLowStock && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="lowstock-title"><div className="bg-brand-background w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95"><div className="p-4 bg-brand-surface border-b border-brand-divider flex justify-between items-center"><div><h3 id="lowstock-title" className="font-bold text-xl text-brand-text">Running Low</h3><p className="text-xs text-brand-text-secondary">Restock your essentials</p></div><button onClick={(e) => { e.stopPropagation(); setShowLowStock(false); }} aria-label="Close low stock modal" className="w-8 h-8 bg-brand-surface-secondary rounded-full flex items-center justify-center text-brand-text active:opacity-70 transition"><X size={18} /></button></div><div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">{lowStockItems.length === 0 ? (<div className="text-center py-8"><div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 mx-auto mb-2"><BatteryWarning size={24} /></div><p className="text-brand-text-secondary font-medium">Your pantry is well stocked.</p></div>) : (lowStockItems.map(item => (<div key={item.id} className="bg-brand-surface p-3 rounded-[18px] border border-brand-divider flex items-center justify-between"><div><div className="font-semibold text-brand-text">{item.name}</div><div className="text-xs text-brand-text-secondary">Qty: {item.quantity} {item.unit}</div></div><button onClick={() => handleAddToShoppingList(item.name)} className="w-8 h-8 rounded-full bg-brand-surface-secondary flex items-center justify-center text-brand-primary active:scale-90 transition"><Plus size={18} strokeWidth={2.5} /></button></div>)))}</div><div className="p-4 bg-brand-surface border-t border-brand-divider"><button onClick={() => { setShowLowStock(false); navigate('/shopping'); }} className="w-full py-3.5 bg-rose-500 text-white font-bold rounded-[18px] active:scale-[0.98] transition">Go to Shopping List</button></div></div></div>}
        {showOutOfStock && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="outofstock-title"><div className="bg-brand-background w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95"><div className="p-4 bg-brand-surface border-b border-brand-divider flex justify-between items-center"><div><h3 id="outofstock-title" className="font-bold text-xl text-brand-text">Gone but not forgotten</h3><p className="text-xs text-brand-text-secondary">Finished in last 7 days</p></div><button onClick={(e) => { e.stopPropagation(); setShowOutOfStock(false); }} aria-label="Close out of stock modal" className="w-8 h-8 bg-brand-surface-secondary rounded-full flex items-center justify-center text-brand-text active:opacity-70 transition"><X size={18} /></button></div><div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">{outOfStockItems.length === 0 ? (<div className="text-center py-8"><div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-2"><Archive size={24} /></div><p className="text-brand-text-secondary font-medium">No recent history.</p></div>) : (outOfStockItems.map(item => (<div key={item.id} className="bg-brand-surface p-3 rounded-[18px] border border-brand-divider flex items-center justify-between"><div><div className="font-semibold text-brand-text">{item.name}</div><div className="text-xs text-brand-text-secondary">{item.category}</div></div><button onClick={() => handleAddToShoppingList(item.name)} className="w-8 h-8 rounded-full bg-brand-surface-secondary flex items-center justify-center text-brand-primary active:scale-90 transition"><Plus size={18} strokeWidth={2.5} /></button></div>)))}</div><div className="p-4 bg-brand-surface border-t border-brand-divider"><button onClick={() => { setShowOutOfStock(false); navigate('/shopping'); }} className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-[18px] active:scale-[0.98] transition">Go to Shopping List</button></div></div></div>}
        {showCleanUp && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="cleanup-title"><div className="bg-brand-background w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95"><div className="p-4 bg-brand-surface border-b border-brand-divider flex justify-between items-center"><div><h3 id="cleanup-title" className="font-bold text-xl text-brand-text">Pantry Cleanup</h3><p className="text-xs text-brand-text-secondary">Stale items ({staleItems.length})</p></div><button onClick={(e) => { e.stopPropagation(); setShowCleanUp(false); }} aria-label="Close cleanup modal" className="w-8 h-8 bg-brand-surface-secondary rounded-full flex items-center justify-center text-brand-text active:opacity-70 transition"><X size={18} /></button></div><div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">{staleItems.length === 0 ? (<div className="text-center py-8"><div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto mb-2"><Sparkles size={24} /></div><p className="text-brand-text-secondary font-medium">Your pantry is fresh!</p></div>) : (staleItems.map(item => (<div key={item.id} className="bg-brand-surface p-3 rounded-[18px] border border-brand-divider flex items-center justify-between"><div><div className="font-semibold text-brand-text">{item.name}</div><div className="text-xs text-brand-text-secondary">Added {formatDistanceToNow(item.addedAt || Date.now())} ago</div></div><div className="flex gap-2"><button onClick={() => updatePantryItem(item.id, { addedAt: Date.now() })} className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 active:scale-90 transition" title="Keep (Update Date)"><Check size={16} /></button><button onClick={() => removePantryItem(item.id)} className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 active:scale-90 transition" title="Remove"><Trash2 size={16} /></button></div></div>)))}</div></div></div>}
    </div>
  );
};