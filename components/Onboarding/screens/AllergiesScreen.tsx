import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { OnboardingButton } from '../components/OnboardingButton';
import { ChipSelect } from '../components/ChipSelect';

interface AllergiesScreenProps {
  selectedAllergies: string[];
  onSelectAllergies: (allergies: string[]) => void;
  onNext: () => void;
}

const ALLERGY_OPTIONS = [
  { id: 'none', label: 'None', emoji: '✓' },
  { id: 'peanuts', label: 'Peanuts', emoji: '🥜' },
  { id: 'tree-nuts', label: 'Tree Nuts', emoji: '🌰' },
  { id: 'dairy', label: 'Dairy', emoji: '🥛' },
  { id: 'eggs', label: 'Eggs', emoji: '🥚' },
  { id: 'gluten', label: 'Gluten', emoji: '🌾' },
  { id: 'soy', label: 'Soy', emoji: '🫘' },
  { id: 'fish', label: 'Fish', emoji: '🐟' },
  { id: 'shellfish', label: 'Shellfish', emoji: '🦐' },
  { id: 'sesame', label: 'Sesame', emoji: '🫘' },
];

export const AllergiesScreen: React.FC<AllergiesScreenProps> = ({
  selectedAllergies,
  onSelectAllergies,
  onNext,
}) => {
  const handleSelect = (selected: string[]) => {
    // If "none" is selected, clear all others
    if (selected.includes('none') && !selectedAllergies.includes('none')) {
      onSelectAllergies(['none']);
    } 
    // If selecting something else while "none" is selected, remove "none"
    else if (selectedAllergies.includes('none') && selected.length > 1) {
      onSelectAllergies(selected.filter(s => s !== 'none'));
    }
    else {
      onSelectAllergies(selected);
    }
  };

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
            <ShieldAlert size={24} className="text-black" />
          </div>
          <div>
            <p className="text-black/60 text-sm font-medium">Safety First</p>
            <h2 className="text-2xl font-bold text-black">Any allergies?</h2>
          </div>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-black/70 text-base leading-relaxed"
        >
          We'll make sure these ingredients never sneak into your recipes.
        </motion.p>
      </div>

      {/* Allergies selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-1 py-4"
      >
        <ChipSelect
          options={ALLERGY_OPTIONS}
          selected={selectedAllergies}
          onChange={handleSelect}
          multiSelect={true}
        />
        
        {/* Helper text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-black/50 text-sm mt-6 text-center"
        >
          Select all that apply, or "None" if you're allergy-free
        </motion.p>
      </motion.div>

      {/* Bottom button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="pb-8 pt-6"
      >
        <OnboardingButton 
          onClick={onNext}
          disabled={selectedAllergies.length === 0}
        >
          {selectedAllergies.length > 0 ? 'Next' : 'Select allergies or None'}
        </OnboardingButton>
      </motion.div>
    </div>
  );
};

