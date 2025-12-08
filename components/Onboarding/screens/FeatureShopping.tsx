import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Plus, Share2 } from 'lucide-react';
import { OnboardingButton } from '../components/OnboardingButton';
import { COLORS } from '../../../brand';

interface FeatureShoppingProps {
  onNext: () => void;
}

export const FeatureShopping: React.FC<FeatureShoppingProps> = ({ onNext }) => {
  const shoppingItems = [
    { name: 'Olive Oil', checked: true, delay: 0.4 },
    { name: 'Fresh Basil', checked: true, delay: 0.6 },
    { name: 'Parmesan Cheese', checked: false, delay: 0.8 },
    { name: 'Cherry Tomatoes', checked: false, delay: 1.0 },
    { name: 'Pine Nuts', checked: false, delay: 1.2 },
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
            <ShoppingCart size={24} className="text-white" />
          </div>
          <div>
            <p className="text-white/60 text-body font-medium">Feature</p>
            <h2 className="text-2xl font-bold text-white">Smart Shopping</h2>
          </div>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/70 text-body leading-relaxed"
        >
          Add missing ingredients from recipes with one tap. Check items off as you shop and share lists with family.
        </motion.p>
      </div>

      {/* Shopping list mockup */}
      <div className="flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-5 space-y-3"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* List header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-h2">Shopping List</h3>
            <div className="flex items-center gap-2">
              <div 
                className="px-2 py-1 rounded-full text-caption font-medium"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              >
                5 items
              </div>
              <Share2 size={18} className="text-white/60" />
            </div>
          </div>

          {/* Items */}
          {shoppingItems.map((item) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: item.delay }}
              className="flex items-center gap-3 py-2"
            >
              <motion.div
                initial={item.checked ? { scale: 0 } : { scale: 1 }}
                animate={{ scale: 1 }}
                transition={{ delay: item.delay + 0.3 }}
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  ${item.checked ? 'bg-white' : 'border-2 border-white/40'}
                `}
              >
                {item.checked && (
                  <Check size={14} style={{ color: COLORS.primary }} strokeWidth={3} />
                )}
              </motion.div>
              <span 
                className={`flex-1 font-medium ${item.checked ? 'line-through text-white/40' : 'text-white'}`}
              >
                {item.name}
              </span>
            </motion.div>
          ))}

          {/* Add item hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex items-center gap-3 py-2 border-t border-white/10 mt-4 pt-4"
          >
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
              <Plus size={12} className="text-white/40" />
            </div>
            <span className="text-white/40 font-medium">Add item...</span>
          </motion.div>
        </motion.div>

        {/* Feature callouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="flex justify-center gap-4 mt-6"
        >
          <div 
            className="px-4 py-2 rounded-full text-body font-medium flex items-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <Plus size={14} className="text-white" />
            <span className="text-white/80">Auto-add from recipes</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className="pb-8 pt-6"
      >
        <OnboardingButton onClick={onNext}>
          Next
        </OnboardingButton>
      </motion.div>
    </div>
  );
};

