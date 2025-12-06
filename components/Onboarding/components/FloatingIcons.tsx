import React from 'react';
import { motion } from 'framer-motion';

const FOOD_EMOJIS = ['🍅', '🥕', '🧅', '🥦', '🍋', '🥑', '🍳', '🧀', '🥚', '🍗', '🥩', '🍝', '🥗', '🍜', '🥘'];

interface FloatingIconsProps {
  count?: number;
  opacity?: number;
}

export const FloatingIcons: React.FC<FloatingIconsProps> = ({ 
  count = 12,
  opacity = 0.4 
}) => {
  // Generate random positions for each icon
  const icons = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: FOOD_EMOJIS[i % FOOD_EMOJIS.length],
      x: Math.random() * 100, // % from left
      y: Math.random() * 100, // % from top
      size: 20 + Math.random() * 24, // 20-44px
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4, // 3-7s
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      {icons.map((icon) => (
        <motion.div
          key={icon.id}
          className="absolute"
          style={{
            left: `${icon.x}%`,
            top: `${icon.y}%`,
            fontSize: icon.size,
          }}
          initial={{ 
            y: 0, 
            rotate: -10,
            opacity: 0 
          }}
          animate={{ 
            y: [0, -15, 0],
            rotate: [-10, 10, -10],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: icon.duration,
            delay: icon.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {icon.emoji}
        </motion.div>
      ))}
    </div>
  );
};

