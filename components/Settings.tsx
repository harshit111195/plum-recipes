
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Diet, CUISINES } from '../types';
import { Plus, Minus, X, Check, Flame, ChefHat, Tag, Star, Bug, FileText, ChevronRight, HelpCircle, User, LogOut, Settings as SettingsIcon, Sparkles, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { FeedbackModal } from './FeedbackModal';
import { ManageAccountModal } from './ManageAccountModal';
import { CONFIG } from '../config';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME, MESSAGES, LINKS } from '../brand';

/**
 * 🎨 SETTINGS COLOR REFERENCE (Dark Mode)
 * ========================================
 * Background:     #0D0D0D (near black)
 * Surface:        #1A1A1A (cards, containers)
 * Surface Alt:    #2A2A2A (inputs, secondary surfaces)
 * 
 * Text Primary:   #FFFFFF (white)
 * Text Secondary: #A0A0A0 (muted)
 * Text Tertiary:  #6B6B6B (very muted)
 * 
 * Brand Yellow:   #FFC244 (primary brand color)
 * Tomato Red:     #E84142 (secondary accent)
 * Button Purple:  #7C3AED (primary buttons)
 * Brand Green:    #00A67E (success/accent)
 * Error Red:      #F87171
 * 
 * Divider:        #333333
 */

const MotionDiv = motion.div as any;

const APPLIANCES_LIST = ["Stove", "Oven", "Microwave", "Air Fryer", "Blender", "Food Processor", "Instant Pot", "Grill", "Toaster"];

// Section component with optional icon
const Section: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode; hint?: string }> = ({ title, children, icon, hint }) => (
    <div className="mb-5">
        <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
                {icon && <div className="text-brand-primary">{icon}</div>}
                <h2 className="text-caption font-bold uppercase tracking-wider text-brand-text-secondary">{title}</h2>
            </div>
            {hint && <span className="text-caption text-brand-text-tertiary">{hint}</span>}
        </div>
        <div className="bg-brand-surface rounded-2xl overflow-hidden shadow-sm border border-brand-divider">{children}</div>
    </div>
);

// Group header for section grouping
const GroupHeader: React.FC<{ title: string; emoji: string }> = ({ title, emoji }) => (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
        <span className="text-lg">{emoji}</span>
        <span className="text-caption font-bold text-brand-text uppercase tracking-wide">{title}</span>
        <div className="flex-1 h-[1px] bg-brand-divider ml-2"></div>
    </div>
);

const TogglePill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button 
        onClick={onClick} 
        className={`px-4 py-2 rounded-full text-body font-semibold transition-all duration-200 ${
            active 
                ? 'bg-brand-primary text-black shadow-md shadow-brand-primary/20' 
                : 'bg-brand-background text-brand-text hover:bg-brand-surface-secondary active:scale-95 border border-brand-divider'
        }`}
    >
        {label}
    </button>
);

interface TagInputProps { label: string; items: string[]; onAdd: (val: string) => void; onRemove: (val: string) => void; placeholder: string; }
const TagInputSection: React.FC<TagInputProps> = ({ label, items, onAdd, onRemove, placeholder }) => {
    const [input, setInput] = useState('');
    const handleKeyDown = (e: React.KeyboardEvent) => { 
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            if (input.trim()) { 
                onAdd(input.trim()); 
                setInput(''); 
            } 
        } 
    };
    const handleAddClick = () => { 
        if (input.trim()) { 
            onAdd(input.trim()); 
            setInput(''); 
        } 
    };
    return (
        <div className="p-4">
            <label className="text-caption text-brand-text-secondary font-bold uppercase mb-3 block tracking-wider">{label}</label>
            {items.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {items.map(tag => (
                        <MotionDiv
                            key={tag}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-caption font-medium bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20"
                        >
                            <span>{tag}</span>
                            <button 
                                onClick={() => onRemove(tag)} 
                                className="hover:bg-brand-secondary/20 rounded-full p-0.5 transition active:scale-90"
                            >
                                <X size={14} />
                            </button>
                        </MotionDiv>
                    ))}
                </div>
            )}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder={placeholder} 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    className="w-full bg-brand-background rounded-2xl px-4 py-3 text-body text-brand-text placeholder-brand-text-tertiary outline-none focus:ring-2 focus:ring-brand-primary/20 transition border border-brand-divider focus:border-brand-primary/30" 
                />
                <button 
                    onClick={handleAddClick} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-brand-button-primary text-white rounded-2xl hover:bg-brand-button-primary-hover active:scale-90 transition"
                >
                    <Plus size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

export const Settings: React.FC = () => {
  const { preferences, updatePreferences } = useUser();
  const { theme, setTheme, isDark } = useTheme();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Chef');

  useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => { 
          setUserEmail(session?.user?.email || null);
          const name = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Chef';
          setUserName(name.split(' ')[0]);
      });
  }, []);

  const handleLogout = async () => { 
      setShowLogoutConfirm(false);
      try { 
          await supabase.auth.signOut(); 
          toast.success(MESSAGES.loggedOut); 
      } catch (e) { 
          toast.error("Failed to sign out"); 
      } 
  };
  
  const update = (key: keyof typeof preferences, value: any) => { 
      updatePreferences({ ...preferences, [key]: value }); 
  };
  
  const toggleArrayItem = (key: 'appliances' | 'favoriteCuisines', item: string) => { 
      const current = preferences[key] || []; 
      const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item]; 
      update(key, updated); 
  };
  
  const addTag = (key: 'allergies' | 'dislikedIngredients', value: string) => { 
      const current = preferences[key] || []; 
      if (!current.includes(value)) { 
          update(key, [...current, value]); 
      } 
  };
  
  const removeTag = (key: 'allergies' | 'dislikedIngredients', tag: string) => { 
      update(key, (preferences[key] || []).filter(t => t !== tag)); 
  };

  const openExternalLink = (url: string) => {
      if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
      }
  };

  const getInitials = (email: string | null) => {
      if (!email) return 'C';
      const name = email.split('@')[0];
      return name.charAt(0).toUpperCase();
  };

  // Calculate profile completeness
  const calculateProfileComplete = () => {
      let score = 0;
      if (preferences.diet) score += 15;
      if (preferences.allergies?.length > 0) score += 15;
      if (preferences.appliances?.length > 0) score += 15;
      if (preferences.favoriteCuisines?.length > 0) score += 15;
      if (preferences.cookingSkill) score += 10;
      if (preferences.householdSize > 0) score += 10;
      if (preferences.nutritionalGoal) score += 10;
      if (preferences.dislikedIngredients?.length > 0) score += 10;
      return Math.min(100, score);
  };

  const profileComplete = calculateProfileComplete();

  return (
    <div className="min-h-screen bg-brand-background pb-28">
      {/* ========== BRANDED HEADER ========== */}
      <div className="relative bg-brand-primary pt-safe overflow-hidden">
        {/* Header content - increased height by 30% */}
        <div className="relative z-10 px-5 pt-10 pb-12">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-h1 font-bold text-black">Settings</h1>
          </div>
          <p className="text-black/70 text-body">Personalize your {APP_NAME} experience</p>
        </div>
        
        {/* Curved bottom edge - matching other pages */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-brand-background rounded-t-[24px]" />
      </div>

      <div className="px-5 pt-5">
        {/* ========== PROFILE GROUP ========== */}
        <GroupHeader title="Profile" emoji="👤" />

        {/* Account Hero Card */}
        <div className="mb-5 bg-brand-surface rounded-2xl overflow-hidden border border-brand-divider">
          <div className="p-5">
            <div className="flex items-center gap-4 mb-5">
              {/* Large Avatar */}
              <div className="relative">
                <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-black text-2xl font-bold shadow-lg shadow-brand-primary/20">
                  {getInitials(userEmail)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-accent rounded-full border-2 border-brand-surface flex items-center justify-center">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <div className="font-bold text-brand-text text-h3 mb-0.5">{userName}</div>
                <div className="text-caption text-brand-text-secondary mb-2">{userEmail}</div>
                
                {/* Profile Progress */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-brand-background rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-primary rounded-full transition-all duration-500"
                      style={{ width: `${profileComplete}%` }}
                    ></div>
                  </div>
                  <span className="text-caption font-bold text-brand-primary">{profileComplete}%</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAccountModal(true)} 
                className="flex-1 py-3 bg-brand-button-primary text-white font-bold rounded-2xl text-body active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <SettingsIcon size={16} /> 
                Manage Account
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(true)} 
                className="flex-1 py-3 bg-brand-button-primary text-white font-bold rounded-2xl text-body active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> 
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Membership */}
        <Section title="Membership" icon={<Star size={14} />}>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-brand-text text-h3 mb-0.5">
                {preferences.isPro ? `${APP_NAME} Pro` : "Free Tier"}
              </div>
              <div className="text-caption text-brand-text-secondary">
                {preferences.isPro ? "All features unlocked" : "Upgrade for unlimited recipes"}
              </div>
            </div>
            {preferences.isPro ? (
              <div className="px-3 py-1.5 rounded-full text-caption font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                PRO
              </div>
            ) : (
              <button className="px-4 py-2 rounded-2xl text-caption font-bold bg-brand-button-primary text-white flex items-center gap-1.5 active:scale-95 transition">
                <Sparkles size={14} /> Upgrade
              </button>
            )}
          </div>
        </Section>

        {/* ========== PREFERENCES GROUP ========== */}
        <GroupHeader title="Preferences" emoji="⚙️" />

        {/* General Settings */}
        <Section title="General" icon={<ChefHat size={14} />} hint="Tap to adjust">
          <div className="divide-y divide-brand-divider/50">
            {/* Theme */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                {isDark ? <Moon size={18} className="text-brand-primary" /> : <Sun size={18} className="text-brand-primary" />}
                <span className="text-body font-semibold text-brand-text">Theme</span>
              </div>
              <div className="bg-brand-background rounded-2xl flex gap-1 border border-brand-divider">
                {[
                  { value: 'light', icon: <Sun size={14} />, label: 'Light' },
                  { value: 'dark', icon: <Moon size={14} />, label: 'Dark' },
                  { value: 'system', icon: <Monitor size={14} />, label: 'Auto' },
                ].map(option => (
                  <button 
                    key={option.value} 
                    onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')} 
                    className={`px-2.5 py-1.5 rounded-2xl text-caption font-semibold transition-all flex items-center gap-1.5 ${
                      theme === option.value 
                        ? 'bg-brand-primary text-black' 
                        : 'text-brand-text-tertiary hover:text-brand-text'
                    }`}
                  >
                    {option.icon}
                    <span className="hidden sm:inline">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Units */}
            <div className="flex items-center justify-between p-4">
              <span className="text-body font-semibold text-brand-text">Units</span>
              <div className="bg-brand-background rounded-2xl flex gap-1 border border-brand-divider">
                {['Metric', 'Imperial'].map(u => (
                  <button 
                    key={u} 
                    onClick={() => update('measurementUnit', u)} 
                    className={`px-3 py-1.5 rounded-2xl text-caption font-semibold transition-all ${
                      preferences.measurementUnit === u 
                        ? 'bg-brand-surface-secondary text-brand-text' 
                        : 'text-brand-text-tertiary hover:text-brand-text'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Household Size */}
            <div className="flex items-center justify-between p-4">
              <span className="text-body font-semibold text-brand-text">Household Size</span>
              <div className="flex items-center gap-3 bg-brand-background rounded-2xl px-2 py-1.5 border border-brand-divider">
                <button 
                  className="p-1 hover:bg-brand-surface-secondary rounded-2xl transition active:scale-90" 
                  onClick={() => update('householdSize', Math.max(1, preferences.householdSize - 1))}
                >
                  <Minus size={16} className="text-brand-primary" strokeWidth={2.5} />
                </button>
                <span className="font-bold w-6 text-center text-body text-brand-text">{preferences.householdSize}</span>
                <button 
                  className="p-1 hover:bg-brand-surface-secondary rounded-2xl transition active:scale-90" 
                  onClick={() => update('householdSize', preferences.householdSize + 1)}
                >
                  <Plus size={16} className="text-brand-primary" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Cooking Skill */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-body font-semibold text-brand-text">Cooking Skill</span>
                <span className="text-caption font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-2xl">
                  {preferences.cookingSkill}
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="1" 
                value={preferences.cookingSkill === 'Beginner' ? 0 : preferences.cookingSkill === 'Intermediate' ? 1 : 2} 
                onChange={(e) => { 
                  const val = parseInt(e.target.value); 
                  update('cookingSkill', val === 0 ? 'Beginner' : val === 1 ? 'Intermediate' : 'Advanced'); 
                }} 
                className="w-full h-2 bg-brand-surface-secondary rounded-2xl appearance-none cursor-pointer accent-brand-primary" 
              />
              <div className="flex justify-between mt-2 text-caption text-brand-text-tertiary font-medium uppercase tracking-wide">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Advanced</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Dietary Profile */}
        <Section title="Dietary Profile" icon={<Tag size={14} />} hint="Personalizes recipes">
          <div className="divide-y divide-brand-divider/50">
            {/* Diet Type */}
            <div className="p-4">
              <label className="text-caption text-brand-text-secondary font-bold uppercase mb-3 block tracking-wider">Diet Type</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Diet).map(d => (
                  <TogglePill key={d} label={d} active={preferences.diet === d} onClick={() => update('diet', d)} />
                ))}
              </div>
            </div>

            {/* Nutritional Goal */}
            <div className="p-4">
              <label className="text-caption text-brand-text-secondary font-bold uppercase mb-3 block tracking-wider">Nutritional Goal</label>
              <div className="flex flex-wrap gap-2">
                {['Balanced', 'High Protein', 'Low Carb', 'Low Fat'].map(g => (
                  <TogglePill key={g} label={g} active={preferences.nutritionalGoal === g} onClick={() => update('nutritionalGoal', g)} />
                ))}
              </div>
            </div>

            {/* Max Calories */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-body font-semibold text-brand-text">Max Calories / Meal</span>
                <span className="text-caption font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-2xl">
                  {preferences.maxCaloriesPerMeal || 800} kcal
                </span>
              </div>
              <input 
                type="range" 
                min="200" 
                max="2000" 
                step="50" 
                value={preferences.maxCaloriesPerMeal || 800} 
                onChange={(e) => update('maxCaloriesPerMeal', parseInt(e.target.value))} 
                className="w-full h-2 bg-brand-surface-secondary rounded-2xl appearance-none cursor-pointer accent-brand-primary" 
              />
            </div>

            {/* Allergies - with tomato red tags */}
            <TagInputSection 
              label="Allergies & Restrictions" 
              items={preferences.allergies} 
              onAdd={(val) => addTag('allergies', val)} 
              onRemove={(val) => removeTag('allergies', val)} 
              placeholder="e.g. Peanuts, Gluten, Dairy" 
            />

            {/* Disliked Ingredients */}
            <TagInputSection 
              label="Ingredients to Avoid" 
              items={preferences.dislikedIngredients} 
              onAdd={(val) => addTag('dislikedIngredients', val)} 
              onRemove={(val) => removeTag('dislikedIngredients', val)} 
              placeholder="e.g. Cilantro, Olives" 
            />
          </div>
        </Section>

        {/* Appliances */}
        <Section title="Kitchen Appliances" icon={<Flame size={14} />} hint="Select what you have">
          <div className="p-4 grid grid-cols-2 gap-2">
            {APPLIANCES_LIST.map(appliance => { 
              const isActive = preferences.appliances.includes(appliance); 
              return (
                <button
                  key={appliance} 
                  onClick={() => toggleArrayItem('appliances', appliance)} 
                  className={`flex items-center gap-2.5 p-3 rounded-2xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-brand-primary/10 border-2 border-brand-primary/30' 
                      : 'bg-brand-background border-2 border-transparent hover:border-brand-divider'
                  } active:scale-95`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                    isActive 
                      ? 'bg-brand-primary border-brand-primary' 
                      : 'border-brand-text-tertiary bg-transparent'
                  }`}>
                    {isActive && <Check size={12} className="text-black" strokeWidth={3} />}
                  </div>
                  <span className={`text-caption font-semibold ${isActive ? 'text-brand-primary' : 'text-brand-text'}`}>
                    {appliance}
                  </span>
                </button>
              ); 
            })}
          </div>
        </Section>

        {/* Favorite Cuisines */}
        <Section title="Favorite Cuisines" icon={<ChefHat size={14} />} hint="We'll prioritize these">
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {CUISINES.map(cuisine => (
                <TogglePill 
                  key={cuisine} 
                  label={cuisine} 
                  active={preferences.favoriteCuisines.includes(cuisine)} 
                  onClick={() => toggleArrayItem('favoriteCuisines', cuisine)} 
                />
              ))}
            </div>
          </div>
        </Section>

        {/* ========== HELP GROUP ========== */}
        <GroupHeader title="Help & Legal" emoji="❓" />

        {/* Support */}
        <Section title="Support" icon={<HelpCircle size={14} />}>
          <button 
            onClick={() => setShowFeedback(true)} 
            className="w-full flex items-center justify-between p-4 hover:bg-brand-background active:bg-brand-surface-secondary transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-button-primary/20 rounded-2xl flex items-center justify-center">
                <Bug size={16} className="text-brand-button-primary" />
              </div>
              <div className="text-left">
                <span className="text-body font-semibold text-brand-text block">Report a Bug / Feedback</span>
                <span className="text-caption text-brand-text-tertiary">Help us improve {APP_NAME}</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-brand-text-tertiary" />
          </button>
        </Section>

        {/* Legal */}
        <Section title="Legal" icon={<FileText size={14} />}>
          <button 
            onClick={() => openExternalLink(LINKS.privacyPolicy)} 
            className="w-full flex items-center justify-between p-4 border-b border-brand-divider/50 hover:bg-brand-background active:bg-brand-surface-secondary transition"
          >
            <span className="text-body font-semibold text-brand-text">Privacy Policy</span>
            <ChevronRight size={16} className="text-brand-text-tertiary" />
          </button>
          <button 
            onClick={() => openExternalLink(LINKS.termsOfService)} 
            className="w-full flex items-center justify-between p-4 hover:bg-brand-background active:bg-brand-surface-secondary transition"
          >
            <span className="text-body font-semibold text-brand-text">Terms of Service</span>
            <ChevronRight size={16} className="text-brand-text-tertiary" />
          </button>
        </Section>

        {/* Version */}
        <p className="text-center text-caption text-brand-text-tertiary mt-6 mb-4">{APP_NAME} v{CONFIG.version}</p>
      </div>
      
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showAccountModal && <ManageAccountModal onClose={() => setShowAccountModal(false)} />}
      
      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-brand-surface w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl relative border border-brand-divider"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute top-4 right-4 w-9 h-9 bg-brand-background rounded-full flex items-center justify-center text-brand-text-secondary hover:bg-brand-surface-secondary active:scale-90 transition z-10"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <div className="p-6">
                {/* Header with icon */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-brand-error/20 rounded-2xl flex items-center justify-center">
                    <LogOut size={22} className="text-brand-error" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-h2 font-bold text-brand-text">Sign Out?</h3>
                    <p className="text-caption text-brand-text-secondary">Are you sure you want to sign out?</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-3.5 bg-brand-surface rounded-2xl text-body active:scale-[0.98] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-3.5 bg-brand-error hover:bg-brand-secondary text-white font-bold rounded-2xl text-body active:scale-[0.98] transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} strokeWidth={2.5} />
                    Sign Out
                  </button>
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};
