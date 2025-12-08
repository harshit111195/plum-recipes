import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { COLORS } from '../../../brand';
import { triggerHaptic } from '../../../utils/hapticService';

interface ChipOption {
  id: string;
  label: string;
  emoji?: string;
}

interface ChipSelectProps {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiSelect?: boolean;
}

export const ChipSelect: React.FC<ChipSelectProps> = ({
  options,
  selected,
  onChange,
  multiSelect = true,
}) => {
  const handleSelect = (id: string) => {
    triggerHaptic('light');
    
    if (multiSelect) {
      if (selected.includes(id)) {
        onChange(selected.filter(s => s !== id));
      } else {
        onChange([...selected, id]);
      }
    } else {
      onChange([id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        
        return (
          <motion.button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`
              px-4 py-2.5 rounded-full font-medium text-body
              flex items-center gap-2 transition-all
              ${isSelected 
                ? 'ring-2 ring-black/30' 
                : 'ring-1 ring-black/10'
              }
            `}
            style={{
              backgroundColor: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
              color: 'black',
            }}
            whileTap={{ scale: 0.95 }}
            layout
          >
            {option.emoji && <span className="text-body">{option.emoji}</span>}
            <span>{option.label}</span>
            {isSelected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4 rounded-full bg-white flex items-center justify-center"
              >
                <Check size={10} style={{ color: COLORS.primary }} strokeWidth={3} />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

