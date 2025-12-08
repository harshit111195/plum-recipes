
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, ArrowRight, Check } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { useUser } from '../../context/UserContext';
import { Diet } from '../../types';

const MotionDiv = motion.div as any;

export const WelcomeFlow: React.FC = () => {
  const { showWelcome, startTour, setShowWelcome } = useOnboarding();
  const { preferences, updatePreferences } = useUser();
  const [step, setStep] = React.useState(0);

  if (!showWelcome) return null;

  const handleDietSelect = (diet: Diet) => { updatePreferences({ ...preferences, diet }); };
  const handleSkip = () => { updatePreferences({ ...preferences, hasCompletedOnboarding: true }); setShowWelcome(false); };

  const content = [
    <div key="intro" className="text-center space-y-6"><MotionDiv initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center mx-auto shadow-lg shadow-brand-primary/20"><ChefHat size={48} className="text-white" /></MotionDiv><div><h2 className="text-3xl font-bold text-brand-text mb-2">Hi, I'm Plum.</h2><p className="text-brand-text-secondary text-h2">Stop wondering what to cook.<br/>I'll handle the thinking.</p></div><button onClick={() => setStep(1)} className="w-full bg-brand-text text-white py-4 rounded-2xl font-bold text-h2 active:scale-95 transition">Let's get started</button></div>,
    <div key="diet" className="space-y-6"><div><h2 className="text-2xl font-bold text-brand-text mb-2">How do you eat?</h2><p className="text-brand-text-secondary">I'll filter recipes automatically.</p></div><div className="grid grid-cols-1 gap-3">{[Diet.Omnivore, Diet.Vegetarian, Diet.Vegan, Diet.Keto].map(d => (<button key={d} onClick={() => handleDietSelect(d)} className={`p-4 rounded-2xl border-2 flex items-center justify-between transition ${preferences.diet === d ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-transparent bg-gray-100 text-brand-text'}`}><span className="font-bold">{d}</span>{preferences.diet === d && <Check size={20} />}</button>))}</div><button onClick={startTour} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-4 rounded-2xl font-bold text-h2 active:scale-95 transition flex items-center justify-center gap-2">Start Tour <ArrowRight size={20} /></button></div>
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-brand-surface flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-8 max-w-md mx-auto w-full"><AnimatePresence mode="wait"><MotionDiv key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">{content[step]}</MotionDiv></AnimatePresence></div>
      {step === 0 && (<button onClick={handleSkip} className="p-6 text-brand-text-secondary text-body font-medium">Skip setup</button>)}
    </div>
  );
};
