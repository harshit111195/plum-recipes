
import React from 'react';
import { motion } from 'framer-motion';
import { APP_NAME_LOWER, APP_TAGLINE, ASSETS } from '../brand';

const MotionDiv = motion.div as any;
const MotionH1 = motion.h1 as any;
const MotionP = motion.p as any;

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] gradient-brand flex flex-col items-center justify-center overflow-hidden">

      {/* Subtle Background Blobs */}
      <MotionDiv
        className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <MotionDiv
        className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      {/* Main Logo & Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container with Enhanced Animation */}
        <MotionDiv
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            y: [0, -8, 0] // Subtle floating
          }}
          transition={{ 
            scale: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }, // Bounce effect
            opacity: { duration: 0.6 },
            y: {
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="mb-8 drop-shadow-2xl"
        >
          {/* Logo with subtle pulse */}
          <MotionDiv
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8
            }}
          >
            <img 
              src={ASSETS.logo} 
              alt={ASSETS.logoAlt} 
              className="w-32 h-32 object-contain"
              style={{ maxWidth: '140px', maxHeight: '140px' }}
            />
          </MotionDiv>
        </MotionDiv>

        {/* App Name with Staggered Letter Animation */}
        <MotionH1 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            delay: 0.4, 
            duration: 0.7,
            ease: [0.34, 1.56, 0.64, 1]
          }}
          className="text-5xl font-bold text-white tracking-tight mb-5 drop-shadow-lg"
        >
          {APP_NAME_LOWER}
        </MotionH1>

        {/* Tagline with Fade In */}
        <MotionP 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.95, y: 0 }}
          transition={{ 
            delay: 0.7, 
            duration: 0.6,
            ease: "easeOut"
          }}
          className="text-white/95 text-body font-medium tracking-wide text-center px-8 drop-shadow-md max-w-xs"
        >
          {APP_TAGLINE}
        </MotionP>
      </div>

      {/* Enhanced Loading Bar */}
      <MotionDiv 
        className="absolute bottom-24 w-64 h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm shadow-lg"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ 
          opacity: 1,
          scaleX: 1
        }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <MotionDiv 
          className="h-full bg-white rounded-full shadow-lg"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ 
            duration: 8, 
            ease: [0.43, 0.13, 0.23, 0.96] // Smooth acceleration, matches 8-second minimum
          }}
        />
        {/* Shimmer effect */}
        <MotionDiv
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ["-100%", "200%"]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            delay: 1
          }}
        />
      </MotionDiv>

      {/* Static Food Icons - Large and Faded */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { emoji: '🍕', x: '5%', y: '8%', size: 56 },
          { emoji: '🥗', x: '82%', y: '12%', size: 52 },
          { emoji: '🍳', x: '8%', y: '72%', size: 48 },
          { emoji: '🥑', x: '78%', y: '68%', size: 50 },
          { emoji: '🍝', x: '88%', y: '42%', size: 54 },
          { emoji: '🥕', x: '3%', y: '38%', size: 44 },
          { emoji: '🍰', x: '72%', y: '85%', size: 46 },
          { emoji: '🌮', x: '15%', y: '88%', size: 52 },
          { emoji: '🍜', x: '92%', y: '78%', size: 42 },
          { emoji: '🥐', x: '45%', y: '3%', size: 48 },
          { emoji: '🍓', x: '68%', y: '5%', size: 40 },
          { emoji: '🧁', x: '25%', y: '92%', size: 44 },
          { emoji: '🥞', x: '55%', y: '88%', size: 46 },
          { emoji: '🍔', x: '18%', y: '5%', size: 50 },
          { emoji: '🥦', x: '35%', y: '95%', size: 42 },
        ].map((item, i) => (
          <div
            key={i}
            className="absolute select-none opacity-20"
            style={{
              left: item.x,
              top: item.y,
              fontSize: item.size,
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

    </div>
  );
};
