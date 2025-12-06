
import React from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full h-full"
    >
      {children}
    </MotionDiv>
  );
};
