import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Mic, ScanLine, Plus } from 'lucide-react';
import { OnboardingButton } from '../components/OnboardingButton';
import { COLORS } from '../../../brand';

interface FeaturePantryProps {
  onNext: () => void;
}

export const FeaturePantry: React.FC<FeaturePantryProps> = ({ onNext }) => {
  const scanItems = [
    { name: 'Tomatoes', emoji: '🍅', delay: 0.5 },
    { name: 'Chicken', emoji: '🍗', delay: 0.7 },
    { name: 'Garlic', emoji: '🧄', delay: 0.9 },
    { name: 'Pasta', emoji: '🍝', delay: 1.1 },
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
            <Camera size={24} className="text-white" />
          </div>
          <div>
            <p className="text-white/60 text-sm font-medium">Feature</p>
            <h2 className="text-2xl font-bold text-white">Snap & Add</h2>
          </div>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/70 text-base leading-relaxed"
        >
          Point your camera at groceries or speak out loud. We'll add everything to your pantry instantly.
        </motion.p>
      </div>

      {/* Camera mockup */}
      <div className="flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative rounded-3xl overflow-hidden aspect-[4/3]"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.3)',
            border: '3px solid rgba(255,255,255,0.2)',
          }}
        >
          {/* Scan line animation */}
          <motion.div
            className="absolute left-4 right-4 h-0.5 rounded-full"
            style={{ backgroundColor: COLORS.primary }}
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-lg" />
          
          {/* Detected items popping up */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-3 p-8">
              {scanItems.map((item) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: item.delay, type: 'spring' }}
                  className="px-3 py-2 rounded-xl flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                >
                  <span>{item.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: COLORS.text }}>
                    {item.name}
                  </span>
                  <Plus size={12} style={{ color: COLORS.primary }} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Input methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="flex justify-center gap-6 mt-6"
        >
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Camera size={24} className="text-white" />
            </div>
            <span className="text-white/60 text-xs">Camera</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Mic size={24} className="text-white" />
            </div>
            <span className="text-white/60 text-xs">Voice</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Plus size={24} className="text-white" />
            </div>
            <span className="text-white/60 text-xs">Manual</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="pb-8 pt-6"
      >
        <OnboardingButton onClick={onNext}>
          Next
        </OnboardingButton>
      </motion.div>
    </div>
  );
};

