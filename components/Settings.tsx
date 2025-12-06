
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Diet, CUISINES } from '../types';
import { Plus, Minus, X, Check, Flame, ChefHat, Tag, Star, Bug, FileText, ChevronRight, HelpCircle, User, LogOut, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { ManageAccountModal } from './ManageAccountModal';
import { CONFIG } from '../config';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
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
                {icon && <div className="text-[#FFC244]">{icon}</div>}
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#A0A0A0]">{title}</h2>
            </div>
            {hint && <span className="text-[11px] text-[#6B6B6B]">{hint}</span>}
        </div>
        <div className="bg-[#1A1A1A] rounded-[20px] overflow-hidden shadow-sm border border-[#333333]">{children}</div>
    </div>
);

// Group header for section grouping
const GroupHeader: React.FC<{ title: string; emoji: string }> = ({ title, emoji }) => (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
        <span className="text-lg">{emoji}</span>
        <span className="text-[13px] font-bold text-[#FFFFFF] uppercase tracking-wide">{title}</span>
        <div className="flex-1 h-[1px] bg-[#333333] ml-2"></div>
    </div>
);

const TogglePill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button 
        onClick={onClick} 
        className={`px-4 py-2 rounded-full text-[14px] font-semibold transition-all duration-200 ${
            active 
                ? 'bg-[#FFC244] text-black shadow-md shadow-[#FFC244]/20' 
                : 'bg-[#0D0D0D] text-[#FFFFFF] hover:bg-[#2A2A2A] active:scale-95 border border-[#333333]'
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
            <label className="text-[12px] text-[#A0A0A0] font-bold uppercase mb-3 block tracking-wider">{label}</label>
            {items.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {items.map(tag => (
                        <MotionDiv
                            key={tag}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[#E84142]/10 text-[#E84142] border border-[#E84142]/20"
                        >
                            <span>{tag}</span>
                            <button 
                                onClick={() => onRemove(tag)} 
                                className="hover:bg-[#E84142]/20 rounded-full p-0.5 transition active:scale-90"
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
                    className="w-full bg-[#0D0D0D] rounded-xl px-4 py-3 text-[15px] text-[#FFFFFF] placeholder-[#6B6B6B] outline-none focus:ring-2 focus:ring-[#FFC244]/20 transition border border-[#333333] focus:border-[#FFC244]/30" 
                />
                <button 
                    onClick={handleAddClick} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] active:scale-90 transition"
                >
                    <Plus size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

export const Settings: React.FC = () => {
  const { preferences, updatePreferences } = useUser();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
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
    <div className="min-h-screen bg-[#0D0D0D] pb-28">
      {/* ========== BRANDED HEADER ========== */}
      <div className="relative bg-[#FFC244] pt-safe overflow-hidden">
        {/* Header content - increased height by 30% */}
        <div className="relative z-10 px-5 pt-10 pb-12">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-[28px] font-bold text-black">Settings</h1>
          </div>
          <p className="text-black/70 text-[15px]">Personalize your {APP_NAME} experience</p>
        </div>
        
        {/* Curved bottom edge - matching other pages */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#0D0D0D] rounded-t-[24px]" />
      </div>

      <div className="px-5 pt-5">
        {/* ========== PROFILE GROUP ========== */}
        <GroupHeader title="Profile" emoji="👤" />

        {/* Account Hero Card */}
        <div className="mb-5 bg-[#1A1A1A] rounded-[20px] overflow-hidden border border-[#333333]">
          <div className="p-5">
            <div className="flex items-center gap-4 mb-5">
              {/* Large Avatar */}
              <div className="relative">
                <div className="w-16 h-16 bg-[#FFC244] rounded-2xl flex items-center justify-center text-black text-2xl font-bold shadow-lg shadow-[#FFC244]/20">
                  {getInitials(userEmail)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00A67E] rounded-full border-2 border-[#1A1A1A] flex items-center justify-center">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <div className="font-bold text-[#FFFFFF] text-[18px] mb-0.5">{userName}</div>
                <div className="text-[13px] text-[#A0A0A0] mb-2">{userEmail}</div>
                
                {/* Profile Progress */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#0D0D0D] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#FFC244] rounded-full transition-all duration-500"
                      style={{ width: `${profileComplete}%` }}
                    ></div>
                  </div>
                  <span className="text-[11px] font-bold text-[#FFC244]">{profileComplete}%</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAccountModal(true)} 
                className="flex-1 py-3 bg-[#7C3AED] text-white font-bold rounded-xl text-[14px] active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <SettingsIcon size={16} /> 
                Manage Account
              </button>
              <button 
                onClick={handleLogout} 
                className="w-12 h-12 flex items-center justify-center bg-[#0D0D0D] text-[#F87171] rounded-xl active:scale-90 transition border border-[#333333]"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Membership */}
        <Section title="Membership" icon={<Star size={14} />}>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-[#FFFFFF] text-[17px] mb-0.5">
                {preferences.isPro ? `${APP_NAME} Pro` : "Free Tier"}
              </div>
              <div className="text-[12px] text-[#A0A0A0]">
                {preferences.isPro ? "All features unlocked" : "Upgrade for unlimited recipes"}
              </div>
            </div>
            {preferences.isPro ? (
              <div className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#FFC244]/10 text-[#FFC244] border border-[#FFC244]/20">
                PRO
              </div>
            ) : (
              <button className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#7C3AED] text-white flex items-center gap-1.5 active:scale-95 transition">
                <Sparkles size={14} /> Upgrade
              </button>
            )}
          </div>
        </Section>

        {/* ========== PREFERENCES GROUP ========== */}
        <GroupHeader title="Preferences" emoji="⚙️" />

        {/* General Settings */}
        <Section title="General" icon={<ChefHat size={14} />} hint="Tap to adjust">
          <div className="divide-y divide-[#333333]/50">
            {/* Units */}
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-semibold text-[#FFFFFF]">Units</span>
              <div className="bg-[#0D0D0D] p-1 rounded-xl flex gap-1 border border-[#333333]">
                {['Metric', 'Imperial'].map(u => (
                  <button 
                    key={u} 
                    onClick={() => update('measurementUnit', u)} 
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                      preferences.measurementUnit === u 
                        ? 'bg-[#2A2A2A] text-[#FFFFFF]' 
                        : 'text-[#6B6B6B] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Household Size */}
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-semibold text-[#FFFFFF]">Household Size</span>
              <div className="flex items-center gap-3 bg-[#0D0D0D] rounded-xl px-2 py-1.5 border border-[#333333]">
                <button 
                  className="p-1 hover:bg-[#2A2A2A] rounded-lg transition active:scale-90" 
                  onClick={() => update('householdSize', Math.max(1, preferences.householdSize - 1))}
                >
                  <Minus size={16} className="text-[#FFC244]" strokeWidth={2.5} />
                </button>
                <span className="font-bold w-6 text-center text-[15px] text-[#FFFFFF]">{preferences.householdSize}</span>
                <button 
                  className="p-1 hover:bg-[#2A2A2A] rounded-lg transition active:scale-90" 
                  onClick={() => update('householdSize', preferences.householdSize + 1)}
                >
                  <Plus size={16} className="text-[#FFC244]" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Cooking Skill */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[15px] font-semibold text-[#FFFFFF]">Cooking Skill</span>
                <span className="text-[13px] font-bold text-[#FFC244] bg-[#FFC244]/10 px-2.5 py-1 rounded-lg">
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
                className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer accent-[#FFC244]" 
              />
              <div className="flex justify-between mt-2 text-[10px] text-[#6B6B6B] font-medium uppercase tracking-wide">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Advanced</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Dietary Profile */}
        <Section title="Dietary Profile" icon={<Tag size={14} />} hint="Personalizes recipes">
          <div className="divide-y divide-[#333333]/50">
            {/* Diet Type */}
            <div className="p-4">
              <label className="text-[11px] text-[#A0A0A0] font-bold uppercase mb-3 block tracking-wider">Diet Type</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Diet).map(d => (
                  <TogglePill key={d} label={d} active={preferences.diet === d} onClick={() => update('diet', d)} />
                ))}
              </div>
            </div>

            {/* Nutritional Goal */}
            <div className="p-4">
              <label className="text-[11px] text-[#A0A0A0] font-bold uppercase mb-3 block tracking-wider">Nutritional Goal</label>
              <div className="flex flex-wrap gap-2">
                {['Balanced', 'High Protein', 'Low Carb', 'Low Fat'].map(g => (
                  <TogglePill key={g} label={g} active={preferences.nutritionalGoal === g} onClick={() => update('nutritionalGoal', g)} />
                ))}
              </div>
            </div>

            {/* Max Calories */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[15px] font-semibold text-[#FFFFFF]">Max Calories / Meal</span>
                <span className="text-[13px] font-bold text-[#FFC244] bg-[#FFC244]/10 px-2.5 py-1 rounded-lg">
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
                className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer accent-[#FFC244]" 
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
                  className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-[#FFC244]/10 border-2 border-[#FFC244]/30' 
                      : 'bg-[#0D0D0D] border-2 border-transparent hover:border-[#333333]'
                  } active:scale-95`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                    isActive 
                      ? 'bg-[#FFC244] border-[#FFC244]' 
                      : 'border-[#6B6B6B] bg-transparent'
                  }`}>
                    {isActive && <Check size={12} className="text-black" strokeWidth={3} />}
                  </div>
                  <span className={`text-[13px] font-semibold ${isActive ? 'text-[#FFC244]' : 'text-[#FFFFFF]'}`}>
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
            className="w-full flex items-center justify-between p-4 hover:bg-[#0D0D0D] active:bg-[#2A2A2A] transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#7C3AED]/20 rounded-xl flex items-center justify-center">
                <Bug size={16} className="text-[#7C3AED]" />
              </div>
              <div className="text-left">
                <span className="text-[15px] font-semibold text-[#FFFFFF] block">Report a Bug / Feedback</span>
                <span className="text-[11px] text-[#6B6B6B]">Help us improve {APP_NAME}</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#6B6B6B]" />
          </button>
        </Section>

        {/* Legal */}
        <Section title="Legal" icon={<FileText size={14} />}>
          <button 
            onClick={() => openExternalLink(LINKS.privacyPolicy)} 
            className="w-full flex items-center justify-between p-4 border-b border-[#333333]/50 hover:bg-[#0D0D0D] active:bg-[#2A2A2A] transition"
          >
            <span className="text-[15px] font-semibold text-[#FFFFFF]">Privacy Policy</span>
            <ChevronRight size={16} className="text-[#6B6B6B]" />
          </button>
          <button 
            onClick={() => openExternalLink(LINKS.termsOfService)} 
            className="w-full flex items-center justify-between p-4 hover:bg-[#0D0D0D] active:bg-[#2A2A2A] transition"
          >
            <span className="text-[15px] font-semibold text-[#FFFFFF]">Terms of Service</span>
            <ChevronRight size={16} className="text-[#6B6B6B]" />
          </button>
        </Section>

        {/* Version */}
        <p className="text-center text-[11px] text-[#6B6B6B] mt-6 mb-4">{APP_NAME} v{CONFIG.version}</p>
      </div>
      
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showAccountModal && <ManageAccountModal onClose={() => setShowAccountModal(false)} />}
    </div>
  );
};
