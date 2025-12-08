import React from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../../../brand';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ 
  currentStep, 
  totalSteps 
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full px-8">
      {/* Progress bar background */}
      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
        {/* Animated progress fill */}
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: COLORS.surface }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      
      {/* Step indicator text */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-white/60 text-caption font-medium">
          {currentStep + 1} of {totalSteps}
        </span>
      </div>
    </div>
  );
};

