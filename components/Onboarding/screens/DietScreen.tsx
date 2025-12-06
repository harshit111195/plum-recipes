import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';
import { OnboardingButton } from '../components/OnboardingButton';
import { OnboardingCard } from '../components/OnboardingCard';
import { Diet } from '../../../types';

interface DietScreenProps {
  selectedDiet: Diet | null;
  onSelectDiet: (diet: Diet) => void;
  onNext: () => void;
}

const DIET_OPTIONS = [
  { 
    value: Diet.Omnivore, 
    label: 'Omnivore', 
    emoji: '🍖', 
    subtitle: 'I eat everything' 
  },
  { 
    value: Diet.Vegetarian, 
    label: 'Vegetarian', 
    emoji: '🥬', 
    subtitle: 'No meat, fish is okay' 
  },
  { 
    value: Diet.Vegan, 
    label: 'Vegan', 
    emoji: '🌱', 
    subtitle: 'Plant-based only' 
  },
  { 
    value: Diet.Pescatarian, 
    label: 'Pescatarian', 
    emoji: '🐟', 
    subtitle: 'Fish but no meat' 
  },
  { 
    value: Diet.Keto, 
    label: 'Keto / Low-Carb', 
    emoji: '🥑', 
    subtitle: 'High fat, low carbs' 
  },
];

export const DietScreen: React.FC<DietScreenProps> = ({ 
  selectedDiet, 
  onSelectDiet, 
  onNext 
}) => {
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
            style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
          >
            <UtensilsCrossed size={24} className="text-black" />
          </div>
          <div>
            <p className="text-black/60 text-sm font-medium">Personalize</p>
            <h2 className="text-2xl font-bold text-black">What's your vibe?</h2>
          </div>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-black/70 text-base leading-relaxed"
        >
          Pick your eating style. We'll filter out recipes that don't match.
        </motion.p>
      </div>

      {/* Diet options */}
      <div className="flex-1 overflow-y-auto py-2 space-y-3">
        {DIET_OPTIONS.map((diet, index) => (
          <motion.div
            key={diet.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <OnboardingCard
              title={diet.label}
              subtitle={diet.subtitle}
              emoji={diet.emoji}
              selected={selectedDiet === diet.value}
              onClick={() => onSelectDiet(diet.value)}
            />
          </motion.div>
        ))}
      </div>

      {/* Bottom button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="pb-8 pt-6"
      >
        <OnboardingButton 
          onClick={onNext}
          disabled={!selectedDiet}
        >
          {selectedDiet ? 'Next' : 'Select your diet'}
        </OnboardingButton>
      </motion.div>
    </div>
  );
};

