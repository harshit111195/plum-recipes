
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ASSETS } from '../brand';

const MotionDiv = motion.div as any;
const MotionImg = motion.img as any;

const LOADING_MESSAGES = [
    "Consulting the flavor gods...",
    "Vibing with your ingredients...",
    "Calculating maximum tastiness...",
    "Rescuing that spinach...",
    "Pairing flavors like a pro...",
    "Heating up the pan...",
    "Asking grandma for secret tips...",
    "Chopping virtual onions...",
    "Simulating the maillard reaction...",
    "Checking pantry expiration dates...",
    "Balancing your macros...",
    "Reading the whole internet for recipes...",
    "Negotiating peace between your ingredients...",
    "Preheating imagination to 200°C...",
    "Whispering to your vegetables...",
    "Optimizing for zero food waste...",
    "Stirring up something brilliant...",
    "Bribing the sous-chef with olive oil...",
    "Unlocking hidden pantry potential...",
    "Taste-testing in a parallel universe...",
    "Convincing your fridge to cooperate...",
    "Organizing a flavor brainstorming meeting...",
    "Scanning for underrated ingredients...",
    "Picking a hero ingredient worthy of you...",
    "Sharpening virtual knives...",
    "Running a full spice compatibility check...",
    "Channeling your inner Michelin chef...",
    "Reducing chaos, like a perfect sauce...",
    "Debugging flavor combinations...",
    "Waking up the recipe spirits...",
    "Doing culinary math so you don't have to...",
    "Fetching fresh inspiration from the cloud kitchen...",
    "Fine-tuning your dinner destiny...",
    "Smelling imaginary aromas...",
    "Leveling up your leftovers...",
    "Teaching pasta how to behave..."
];

// Food icons arranged in a perfect circle
const FOOD_EMOJIS = ['🥑', '🍳', '🥕', '🍝', '🥗', '🍕', '🌮', '🥐'];
const ORBIT_RADIUS = 90; // Distance from center

// Calculate positions in a perfect circle
const FOOD_ICONS = FOOD_EMOJIS.map((emoji, index) => {
    const angle = (index * (360 / FOOD_EMOJIS.length) - 90) * (Math.PI / 180); // Start from top, go clockwise
    return {
        emoji,
        x: Math.cos(angle) * ORBIT_RADIUS,
        y: Math.sin(angle) * ORBIT_RADIUS,
    };
});

interface Props {
  onCancel?: () => void;
}

export const CookingLoader: React.FC<Props> = ({ onCancel }) => {
  // Start with a random message
  const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length));

  // Generate random animation parameters for each icon (memoized to prevent re-renders)
  const iconAnimations = useMemo(() => 
    FOOD_ICONS.map(() => ({
      floatY: 8 + Math.random() * 12, // Random float distance 8-20px
      floatX: 4 + Math.random() * 8,  // Random horizontal sway 4-12px
      duration: 2.5 + Math.random() * 1.5, // Random duration 2.5-4s
      delay: Math.random() * 1.5, // Random start delay
      rotateAmount: 5 + Math.random() * 10, // Random rotation 5-15deg
    }))
  , []);

  useEffect(() => {
    // Cycle to a random message every 4 seconds
    const interval = setInterval(() => {
        setMessageIndex(prev => {
            let next;
            // Ensure we don't show the same message twice in a row
            do {
                next = Math.floor(Math.random() * LOADING_MESSAGES.length);
            } while (next === prev && LOADING_MESSAGES.length > 1);
            return next;
        });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MotionDiv
        // Reveal transition: Circular expansion from center
        initial={{ clipPath: "circle(0% at 50% 50%)" }}
        animate={{ clipPath: "circle(150% at 50% 50%)" }}
        exit={{ opacity: 0, clipPath: "circle(0% at 50% 50%)" }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} 
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-brand-button-primary cursor-wait transform-gpu isolate overflow-hidden" /* #7C3AED = Purple background */
    >
        {/* Subtle gradient overlay for depth */}
        <div 
            className="absolute inset-0 pointer-events-none"
            style={{
                background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.12) 0%, transparent 60%)'
            }}
        />

        {/* Floating Food Icons */}
        <div className="relative w-72 h-72 mb-10 flex items-center justify-center">
            {/* Ambient glow behind logo */}
            <div className="absolute w-40 h-40 bg-brand-primary/80 rounded-full blur-[50px]" /> {/* #FFC244 = Yellow glow */}
            
            {/* Food icons with individual floating animations */}
            {FOOD_ICONS.map((icon, index) => {
                const anim = iconAnimations[index];
                
                return (
                    <MotionDiv
                        key={index}
                        className="absolute text-4xl select-none"
                        style={{
                            left: '50%',
                            top: '50%',
                            marginLeft: '-18px', // Half of ~36px emoji size to center
                            marginTop: '-18px',  // Half of ~36px emoji size to center
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                        }}
                        initial={{ 
                            x: icon.x,
                            y: icon.y,
                            scale: 0,
                            opacity: 0
                        }}
                        animate={{ 
                            x: [icon.x - anim.floatX, icon.x + anim.floatX, icon.x - anim.floatX],
                            y: [icon.y - anim.floatY, icon.y + anim.floatY, icon.y - anim.floatY],
                            scale: 1,
                            opacity: 1,
                            rotate: [-anim.rotateAmount, anim.rotateAmount, -anim.rotateAmount]
                        }}
                        transition={{
                            x: { 
                                duration: anim.duration, 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                delay: anim.delay
                            },
                            y: { 
                                duration: anim.duration * 0.8, 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                delay: anim.delay
                            },
                            rotate: {
                                duration: anim.duration * 1.2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: anim.delay
                            },
                            scale: { 
                                duration: 0.6, 
                                delay: index * 0.1,
                                ease: [0.34, 1.56, 0.64, 1] // Bounce
                            },
                            opacity: { 
                                duration: 0.4, 
                                delay: index * 0.1 
                            }
                        }}
                    >
                        {icon.emoji}
                    </MotionDiv>
                );
            })}

            {/* Center Plum Logo */}
            <MotionDiv
                className="relative z-10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                    scale: 1, 
                    opacity: 1,
                    y: [0, -6, 0]
                }}
                transition={{ 
                    scale: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 },
                    opacity: { duration: 0.5, delay: 0.3 },
                    y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                }}
            >
                {/* Logo glow ring */}
                <div className="absolute inset-0 bg-brand-primary/80 rounded-full blur-xl scale-125" /> {/* #FFC244 = Yellow glow */}
                
                <MotionImg
                    src={ASSETS.logo}
                    alt={ASSETS.logoAlt}
                    className="w-24 h-24 object-contain relative z-10 drop-shadow-2xl"
                    animate={{
                        scale: [1, 1.08, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                    }}
                />
            </MotionDiv>
        </div>

        {/* Typography */}
        <div className="h-24 w-full max-w-md px-6 flex items-center justify-center relative">
            <AnimatePresence mode="wait">
                <MotionDiv 
                    key={messageIndex}
                    initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center gap-4"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-brand-text text-center tracking-tight leading-tight"> {/* #FFFFFF = White text */}
                        {LOADING_MESSAGES[messageIndex]}
                    </h2>
                    {/* Yellow loading dots */}
                    <div className="flex gap-2">
                        <MotionDiv 
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} 
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                            className="w-2.5 h-2.5 rounded-full bg-brand-primary" /* #FFC244 = Yellow dot */
                        />
                        <MotionDiv 
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} 
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                            className="w-2.5 h-2.5 rounded-full bg-brand-primary" /* #FFC244 = Yellow dot */
                        />
                        <MotionDiv 
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} 
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                            className="w-2.5 h-2.5 rounded-full bg-brand-primary" /* #FFC244 = Yellow dot */
                        />
                    </div>
                </MotionDiv>
            </AnimatePresence>
        </div>

        {/* Footer with Cancel and Brand */}
        <div className="absolute bottom-12 flex flex-col items-center gap-6 z-20">
            {onCancel && (
                <button 
                    onClick={onCancel}
                    className="text-white/40 hover:text-white/90 text-[11px] font-bold tracking-widest uppercase transition-all active:scale-95"
                >
                    Cancel
                </button>
            )}
            <div className="text-white/30 text-[10px] font-bold tracking-[0.2em] uppercase pointer-events-none">
                Plum Intelligence
            </div>
        </div>
    </MotionDiv>
  );
};
