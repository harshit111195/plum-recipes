import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChefHat, Clock, Flame } from 'lucide-react';
import { OnboardingButton } from '../components/OnboardingButton';
import { COLORS } from '../../../brand';

interface FeatureAIChefProps {
  onNext: () => void;
}

export const FeatureAIChef: React.FC<FeatureAIChefProps> = ({ onNext }) => {
  // Mock recipe cards for animation
  const recipeCards = [
    { title: 'Creamy Garlic Pasta', time: '20 min', emoji: '🍝', delay: 0.3 },
    { title: 'Honey Glazed Chicken', time: '35 min', emoji: '🍗', delay: 0.5 },
    { title: 'Fresh Garden Salad', time: '10 min', emoji: '🥗', delay: 0.7 },
  ];

  return (
    <div className="flex flex-col h-full px-8">
      {/* Header */}
      <div className="pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Sparkles size={24} className="text-yellow-300" />
          </div>
          <div>
            <p className="text-white/60 text-body font-medium">Feature</p>
            <h2 className="text-2xl font-bold text-white">AI Recipe Magic</h2>
          </div>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/70 text-body leading-relaxed"
        >
          Our AI chef creates personalized recipes from whatever you have. No more staring at the fridge.
        </motion.p>
      </div>

      {/* Recipe cards showcase */}
      <div className="flex-1 flex flex-col justify-center gap-4 py-4">
        {recipeCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: card.delay, type: 'spring', stiffness: 100 }}
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Emoji/Image */}
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              {card.emoji}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <h3 className="font-bold text-white text-h2">{card.title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-white/60 text-body">
                  <Clock size={14} />
                  {card.time}
                </span>
                <span className="flex items-center gap-1 text-white/60 text-body">
                  <Flame size={14} />
                  Easy
                </span>
              </div>
            </div>
            
            {/* AI badge */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-2 py-1 rounded-full text-caption font-bold flex items-center gap-1"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Sparkles size={10} />
              AI
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Bottom button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="pb-8"
      >
        <OnboardingButton onClick={onNext}>
          Next
        </OnboardingButton>
      </motion.div>
    </div>
  );
};

