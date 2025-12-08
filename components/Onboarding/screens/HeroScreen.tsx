import React from 'react';
import { motion } from 'framer-motion';
import { APP_NAME, APP_TAGLINE, COLORS } from '../../../brand';
import { OnboardingButton } from '../components/OnboardingButton';
import { FloatingIcons } from '../components/FloatingIcons';
import { ChefHat, Sparkles } from 'lucide-react';

interface HeroScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

export const HeroScreen: React.FC<HeroScreenProps> = ({ onNext, onSkip }) => {
  return (
    <div className="relative flex flex-col h-full">
      {/* Floating food icons background */}
      <FloatingIcons count={15} opacity={0.3} />
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 relative z-10">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 200, 
            damping: 15,
            delay: 0.2 
          }}
          className="relative mb-8"
        >
          {/* Glow effect */}
          <div 
            className="absolute inset-0 blur-3xl opacity-50 rounded-full"
            style={{ backgroundColor: COLORS.primaryLight }}
          />
          
          {/* Logo container */}
          <div 
            className="relative w-28 h-28 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: COLORS.surface }}
          >
            <ChefHat size={56} style={{ color: COLORS.primary }} />
          </div>
          
          {/* Sparkle decoration */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ 
              rotate: [0, 15, 0],
              scale: [1, 1.2, 1] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: 'easeInOut' 
            }}
          >
            <Sparkles size={24} className="text-yellow-300" />
          </motion.div>
        </motion.div>

        {/* Brand name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl font-black text-black mb-4 tracking-tight"
        >
          {APP_NAME}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-black/80 text-center leading-relaxed max-w-xs"
        >
          The "what's for dinner?" panic stops here.
        </motion.p>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-black/60 text-center mt-4 max-w-xs"
        >
          Tell me what's in your fridge. I'll handle the thinking.
        </motion.p>
      </div>

      {/* Bottom buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="px-8 pb-8 space-y-3 relative z-10"
      >
        <OnboardingButton onClick={onNext}>
          Let's go 🍳
        </OnboardingButton>
        
        <button 
          onClick={onSkip}
          className="w-full py-3 text-black/60 text-sm font-medium"
        >
          Skip setup
        </button>
      </motion.div>
    </div>
  );
};

