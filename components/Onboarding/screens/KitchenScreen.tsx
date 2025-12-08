import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Users, Check } from 'lucide-react';
import { OnboardingButton } from '../components/OnboardingButton';
import { COLORS } from '../../../brand';
import { triggerHaptic } from '../../../utils/hapticService';

interface KitchenScreenProps {
  selectedAppliances: string[];
  householdSize: number;
  onSelectAppliances: (appliances: string[]) => void;
  onSelectHouseholdSize: (size: number) => void;
  onFinish: () => void;
}

const APPLIANCE_OPTIONS = [
  { id: 'oven', label: 'Oven', emoji: '🔥' },
  { id: 'stovetop', label: 'Stovetop', emoji: '🍳' },
  { id: 'microwave', label: 'Microwave', emoji: '📦' },
  { id: 'air-fryer', label: 'Air Fryer', emoji: '🌪️' },
  { id: 'instant-pot', label: 'Instant Pot', emoji: '🍲' },
  { id: 'blender', label: 'Blender', emoji: '🥤' },
  { id: 'grill', label: 'Grill', emoji: '🥩' },
  { id: 'slow-cooker', label: 'Slow Cooker', emoji: '🥘' },
];

const HOUSEHOLD_SIZES = [
  { value: 1, label: 'Just me', emoji: '👤' },
  { value: 2, label: 'Two of us', emoji: '👥' },
  { value: 4, label: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { value: 6, label: 'Big crew', emoji: '🎉' },
];

export const KitchenScreen: React.FC<KitchenScreenProps> = ({
  selectedAppliances,
  householdSize,
  onSelectAppliances,
  onSelectHouseholdSize,
  onFinish,
}) => {
  const toggleAppliance = (id: string) => {
    triggerHaptic('light');
    if (selectedAppliances.includes(id)) {
      onSelectAppliances(selectedAppliances.filter(a => a !== id));
    } else {
      onSelectAppliances([...selectedAppliances, id]);
    }
  };

  return (
    <div className="flex flex-col h-full px-8">
      {/* Header */}
      <div className="pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <ChefHat size={24} className="text-white" />
          </div>
          <div>
            <p className="text-white/60 text-body font-medium">Almost Done</p>
            <h2 className="text-2xl font-bold text-white">Your Kitchen</h2>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Appliances section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-white/70 text-body font-medium mb-3">
            What appliances do you have?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {APPLIANCE_OPTIONS.map((appliance, index) => {
              const isSelected = selectedAppliances.includes(appliance.id);
              return (
                <motion.button
                  key={appliance.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => toggleAppliance(appliance.id)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-2xl
                    transition-all relative
                    ${isSelected ? 'ring-2 ring-white' : 'ring-1 ring-white/20'}
                  `}
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span className="text-2xl mb-1">{appliance.emoji}</span>
                  <span className="text-white text-caption font-medium text-center leading-tight">
                    {appliance.label}
                  </span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center"
                    >
                      <Check size={12} style={{ color: COLORS.primary }} strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Household size section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-white/70 text-body font-medium mb-3 flex items-center gap-2">
            <Users size={16} />
            How many are you cooking for?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {HOUSEHOLD_SIZES.map((size) => {
              const isSelected = householdSize === size.value;
              return (
                <motion.button
                  key={size.value}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectHouseholdSize(size.value);
                  }}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-2xl
                    transition-all
                    ${isSelected ? 'ring-2 ring-white' : 'ring-1 ring-white/20'}
                  `}
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-2xl mb-1">{size.emoji}</span>
                  <span className="text-white text-caption font-medium text-center">
                    {size.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Bottom button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="pb-8 pt-6"
      >
        <OnboardingButton onClick={onFinish}>
          Let's Cook! 🍳
        </OnboardingButton>
      </motion.div>
    </div>
  );
};

