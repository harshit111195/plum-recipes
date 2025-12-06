import React from 'react';
import { motion } from 'framer-motion';
import { COLORS, SHADOWS } from '../../../brand';
import { triggerHaptic } from '../../../utils/hapticService';

interface OnboardingButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const OnboardingButton: React.FC<OnboardingButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  icon,
}) => {
  const handleClick = () => {
    if (!disabled) {
      triggerHaptic('light');
      onClick();
    }
  };

  const baseStyles = "w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all";
  
  const variants = {
    primary: {
      bg: COLORS.surface,
      text: COLORS.text,
      shadow: SHADOWS.cardElevated,
    },
    secondary: {
      bg: 'transparent',
      text: COLORS.surface,
      shadow: 'none',
      border: `2px solid ${COLORS.surface}`,
    },
    ghost: {
      bg: 'transparent',
      text: 'rgba(255,255,255,0.7)',
      shadow: 'none',
    },
  };

  const style = variants[variant];

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={baseStyles}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        boxShadow: style.shadow,
        border: (style as any).border || 'none',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
    >
      {children}
      {icon && <span className="ml-1">{icon}</span>}
    </motion.button>
  );
};

