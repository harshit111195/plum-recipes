
import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { X, Volume2, Sparkles, Loader2, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { askAiAboutStep } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageUrl } from '../services/supabase';
import { hapticSuccess } from '../utils/hapticService';
import { askStepCache } from '../utils/cacheService';

const MotionDiv = motion.div as any;

interface Props {
  recipe: Recipe;
  onClose: () => void;
  onFinish: () => void;
  origin?: { x: number, y: number } | null; // Coordinates of the button click
}

export const ChefMode: React.FC<Props> = ({ recipe, onClose, onFinish, origin }) => {
  // Validate recipe data
  if (!recipe || !recipe.instructions || !Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-brand-background flex flex-col items-center justify-center p-6 text-center">
        <div className="text-brand-text mb-4">
          <h2 className="text-xl font-bold mb-2">Invalid Recipe</h2>
          <p className="text-brand-text-secondary">This recipe doesn't have cooking instructions.</p>
        </div>
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-brand-button-primary text-white font-bold rounded-full shadow-lg shadow-purple-500/30"
        >
          Go Back
        </button>
      </div>
    );
  }

  const [activeStep, setActiveStep] = useState(0);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [hasAskedCurrentStep, setHasAskedCurrentStep] = useState(false);

  // Ensure activeStep is within bounds
  const safeActiveStep = Math.max(0, Math.min(activeStep, recipe.instructions.length - 1));
  const currentInstruction = recipe.instructions[safeActiveStep] || '';

  // Ensure activeStep stays within bounds when recipe changes
  useEffect(() => {
    const maxStep = recipe.instructions.length - 1;
    if (activeStep > maxStep) {
      setActiveStep(maxStep);
    }
  }, [recipe.instructions.length]);

  // Check if current step has been asked when step changes
  useEffect(() => {
    // Safely cancel speech synthesis (not available on all platforms)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Ignore errors - speechSynthesis might not be available on Android
      }
    }
    setAiTip(null);
    
    // Validate before accessing
    if (!recipe?.title || !currentInstruction) return;
    
    // Check if this step has been asked before
    const checkCache = async () => {
      try {
        const asked = await askStepCache.hasBeenAsked(recipe.title, safeActiveStep);
        setHasAskedCurrentStep(asked);
        // If already asked, load cached answer
        if (asked) {
          const cached = await askStepCache.getCachedAnswer(recipe.title, currentInstruction);
          if (cached) {
            setAiTip(cached);
          }
        }
      } catch (error) {
        console.warn('Cache check error:', error);
        setHasAskedCurrentStep(false);
      }
    };
    
    checkCache();
  }, [safeActiveStep, recipe?.title, currentInstruction]);

  const handleStepAiHelp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingTip || hasAskedCurrentStep || !recipe.title || !currentInstruction) return; // Prevent if already asked or invalid
    
    setLoadingTip(true);
    try {
      const tip = await askAiAboutStep(recipe.title, currentInstruction);
      setAiTip(tip);
      setHasAskedCurrentStep(true);
      
      // Mark this step as asked (only once per card)
      await askStepCache.markAsAsked(recipe.title, safeActiveStep);
    } catch (error) {
      console.error('Error getting AI tip:', error);
      setAiTip("Chef is disconnected. Please try again.");
    } finally {
      setLoadingTip(false);
    }
  };

  const speakStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis && currentInstruction) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentInstruction);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      // speechSynthesis not available on this platform (e.g., some Android WebViews)
      console.warn('Speech synthesis not available:', error);
    }
  };

  const nextStep = () => {
    if (safeActiveStep < recipe.instructions.length - 1) {
      setDirection(1);
      setActiveStep(prev => Math.min(prev + 1, recipe.instructions.length - 1));
    } else {
      hapticSuccess();
      onFinish();
    }
  };

  const prevStep = () => {
    if (safeActiveStep > 0) {
      setDirection(-1);
      setActiveStep(prev => Math.max(prev - 1, 0));
    }
  };

  // Handle Swipe Down to Close, Swipe Left/Right to nav
  const onDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.y > 100) {
      onClose();
    } else if (info.offset.x < -swipeThreshold) {
        nextStep();
    } else if (info.offset.x > swipeThreshold) {
        prevStep();
    }
  };

  // Calculate font size based on text length to fit card
  const getAdaptiveTextStyle = (text: string) => {
    const len = text.length;
    if (len < 50) return "text-[32px] md:text-[40px] leading-tight tracking-tight"; // Short
    if (len < 100) return "text-[26px] md:text-[32px] leading-snug"; // Medium
    if (len < 200) return "text-[22px] md:text-[26px] leading-normal"; // Long
    if (len < 350) return "text-[18px] md:text-[22px] leading-relaxed"; // Very Long
    return "text-[16px] md:text-[18px] leading-relaxed"; // Novel
  };


  // Concurrent Slide Animations
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '110%' : '-110%', // Increased distance to ensure fully off-screen
      opacity: 0,
      scale: 0.95,
      zIndex: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '110%' : '-110%',
      opacity: 0,
      scale: 0.95,
    })
  };

  // Default origin if none provided (center screen)
  const x = origin?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const y = origin?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

  return (
    <MotionDiv
        // RIPPLE EFFECT WRAPPER
        initial={{ clipPath: `circle(0px at ${x}px ${y}px)` }}
        animate={{ clipPath: `circle(150% at ${x}px ${y}px)` }}
        exit={{ clipPath: `circle(0px at ${x}px ${y}px)` }}
        transition={{ duration: 0.85, ease: [0.32, 1, 0.6, 1] }}
        className="fixed inset-0 z-[100] bg-brand-background flex flex-col overflow-hidden"
    >
      
      {/* Background Image (Reduced Blur) */}
      <MotionDiv 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="absolute inset-0 z-0"
      >
         <img 
            src={getOptimizedImageUrl(recipe.generatedImage, 300) || `https://picsum.photos/seed/${recipe.id || 'default'}/300/300`} 
            className="w-full h-full object-cover opacity-40 blur-md scale-105"
            alt=""
         />
         {/* Theme-aware gradient overlay - darker in light mode for better contrast */}
         <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50 dark:from-black/60 dark:via-black/40 dark:to-black/80" />
      </MotionDiv>

      {/* Main Content Fade-In Wrapper */}
      <MotionDiv 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative z-10 flex flex-col h-full"
      >
        {/* Top UI Layer */}
        <div className="relative z-20 pt-safe px-4 pb-2 shrink-0">
            {/* Progress Segments - Yellow active, dark inactive */}
            <div className="flex gap-1.5 mb-4 mt-2">
                {recipe.instructions.map((_, idx) => (
                    <div key={idx} className="h-1.5 flex-1 bg-brand-divider rounded-full overflow-hidden">
                        <div 
                            className={`h-full bg-brand-primary transition-all duration-300 ${
                                idx <= safeActiveStep ? 'w-full' : 'w-0'
                            }`} 
                        />
                    </div>
                ))}
            </div>
            
            <div className="flex justify-between items-center">
                {/* Step badge - Yellow accent */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-black uppercase tracking-widest bg-brand-primary px-3 py-1.5 rounded-full shadow-lg shadow-brand-primary/20">
                        Step {safeActiveStep + 1} of {recipe.instructions.length}
                    </span>
                </div>
                {/* Close button - Dark surface */}
                <button onClick={onClose} aria-label="Exit cooking mode" className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center text-brand-text-secondary border border-brand-divider active:bg-brand-surface-secondary transition">
                    <X size={18} />
                </button>
            </div>
        </div>

        {/* Central Content Area - Flexible Space */}
        <div className="flex-1 relative z-30 w-full max-w-md mx-auto min-h-0">
            {/* 
                NOTE: Removed flex centering from parent to avoid fighting with absolute positioning.
                The children handle their own centering via absolute positioning constraints.
            */}
            <AnimatePresence initial={false} custom={direction}>
                <MotionDiv
                    key={safeActiveStep}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    // Optimized Spring for Mobile (Less bounce, less tearing)
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={onDragEnd}
                    style={{ 
                        // Fix for iOS Flicker
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                        // Center vertically in the available space
                        top: '50%',
                        y: '-50%' // Use Framer Motion 'y' prop for vertical centering to avoid transform conflicts
                    }}
                    className={`
                        absolute left-4 right-4 mx-auto
                        shadow-2xl flex flex-col overflow-hidden
                        bg-brand-surface/95 backdrop-blur-xl border border-brand-divider rounded-[32px]
                        transform-gpu will-change-transform
                        ${aiTip ? 'h-[85%]' : 'h-[75%] max-h-[600px]'} 
                    `}
                >
                    {/* Card Content */}
                    <div className={`
                        flex-1 p-8 custom-scrollbar flex flex-col
                        ${aiTip ? 'justify-start overflow-y-auto' : 'justify-center overflow-y-auto'}
                    `}>
                        {/* Instruction text - White on dark */}
                        <h2 className={`font-bold text-brand-text font-sans transition-all duration-300 text-center ${getAdaptiveTextStyle(currentInstruction || '')}`}>
                            {currentInstruction || 'No instruction available'}
                        </h2>

                        {/* Chef's Explanation Bubble - Yellow accent */}
                        <AnimatePresence>
                        {aiTip && (
                            <MotionDiv 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-brand-background border border-brand-primary/30 p-4 rounded-2xl mt-6 overflow-hidden shrink-0 text-left"
                            >
                                <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider mb-2">
                                    <Sparkles size={12} fill="currentColor" /> Chef's Note
                                </div>
                                <p className="text-brand-text-secondary text-[15px] leading-relaxed">{aiTip}</p>
                            </MotionDiv>
                        )}
                        </AnimatePresence>
                    </div>

                    {/* Fixed Action Footer inside Card */}
                    <div className="p-6 pt-2 bg-transparent shrink-0">
                        <div className="flex gap-3">
                            {/* Speak button - Dark surface */}
                            <button 
                                onClick={speakStep}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-background text-brand-primary active:scale-95 transition shrink-0 border border-brand-divider"
                            >
                                <Volume2 size={20} />
                            </button>
                            
                            {/* Explain button - Purple primary */}
                            <button 
                                onClick={handleStepAiHelp}
                                disabled={loadingTip || hasAskedCurrentStep}
                                className="flex-1 py-3 bg-brand-button-primary hover:bg-brand-button-primary-hover text-white font-bold rounded-full text-sm flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-70 shadow-lg shadow-purple-500/30"
                            >
                                {loadingTip ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {hasAskedCurrentStep ? 'Explained ✓' : aiTip ? 'Chef\'s Note' : 'Explain this step'}
                            </button>
                        </div>
                    </div>

                </MotionDiv>
            </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <div className="relative z-30 p-6 pb-safe flex justify-between items-center pointer-events-none shrink-0 h-[120px]">
            {/* Previous button - Dark surface */}
            <button 
                onClick={prevStep}
                disabled={safeActiveStep === 0}
                aria-label="Previous step"
                className={`w-14 h-14 rounded-full flex items-center justify-center text-brand-text transition pointer-events-auto ${safeActiveStep === 0 ? 'opacity-0' : 'bg-brand-surface border border-brand-divider active:bg-brand-surface-secondary'}`}
            >
                <ChevronLeft size={28} />
            </button>

            {/* Finish button - Green success */}
            {safeActiveStep === recipe.instructions.length - 1 && (
                <button 
                    onClick={onFinish}
                    aria-label="Finish cooking"
                    className="pointer-events-auto px-8 py-4 bg-brand-accent hover:bg-brand-accent text-white font-bold text-lg rounded-full shadow-lg shadow-brand-accent/30 active:scale-95 transition flex items-center gap-2 animate-in zoom-in"
                >
                    Done Cooking! <Check size={20} />
                </button>
            )}

            {/* Next button - Dark surface */}
            <button 
                onClick={nextStep}
                disabled={safeActiveStep === recipe.instructions.length - 1}
                aria-label="Next step"
                className={`w-14 h-14 rounded-full flex items-center justify-center text-brand-text transition pointer-events-auto ${safeActiveStep === recipe.instructions.length - 1 ? 'opacity-0' : 'bg-brand-surface border border-brand-divider active:bg-brand-surface-secondary'}`}
            >
                <ChevronRight size={28} />
            </button>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
};
