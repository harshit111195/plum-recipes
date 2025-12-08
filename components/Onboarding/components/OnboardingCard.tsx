import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { COLORS } from '../../../brand';
import { triggerHaptic } from '../../../utils/hapticService';

interface OnboardingCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  emoji?: string;
  selected?: boolean;
  onClick: () => void;
  variant?: 'default' | 'compact';
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  title,
  subtitle,
  icon,
  emoji,
  selected = false,
  onClick,
  variant = 'default',
}) => {
  const handleClick = () => {
    triggerHaptic(selected ? 'light' : 'medium');
    onClick();
  };

  const isCompact = variant === 'compact';

  return (
    <motion.button
      onClick={handleClick}
      className={`
        w-full text-left rounded-2xl transition-all relative overflow-hidden
        ${isCompact ? 'p-4' : 'p-5'}
        ${selected 
          ? 'ring-2 ring-black/30 shadow-lg' 
          : 'ring-1 ring-black/10'
        }
      `}
      style={{
        backgroundColor: selected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
      }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
      layout
    >
      <div className="flex items-center gap-4">
        {/* Icon or Emoji */}
        {(icon || emoji) && (
          <div 
            className={`
              flex items-center justify-center rounded-2xl
              ${isCompact ? 'w-10 h-10 text-h1' : 'w-14 h-14 text-2xl'}
            `}
            style={{ 
              backgroundColor: selected ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)' 
            }}
          >
            {emoji || icon}
          </div>
        )}
        
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-black ${isCompact ? 'text-body' : 'text-h2'}`}>
            {title}
          </p>
          {subtitle && (
            <p className="text-black/60 text-body mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Checkmark */}
        <motion.div
          initial={false}
          animate={{ 
            scale: selected ? 1 : 0,
            opacity: selected ? 1 : 0 
          }}
          className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0"
        >
          <Check size={14} style={{ color: COLORS.primary }} strokeWidth={3} />
        </motion.div>
      </div>
    </motion.button>
  );
};

