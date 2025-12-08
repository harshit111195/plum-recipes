
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const MotionDiv = motion.div as any;

export const TourGuide: React.FC = () => {
  const { isTourActive, currentStep, nextStep, endTour, tourSteps } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const currentTourStep = tourSteps[currentStep];

  // Auto-navigate to correct page
  useEffect(() => {
    if (isTourActive && currentTourStep) {
      if (location.pathname !== currentTourStep.path) {
        navigate(currentTourStep.path);
      }
    }
  }, [isTourActive, currentStep, currentTourStep, location.pathname, navigate]);

  // Find target element position
  useEffect(() => {
    if (!isTourActive || !currentTourStep) return;

    const updateRect = () => {
      const el = document.getElementById(currentTourStep.targetId);
      if (el) {
        setRect(el.getBoundingClientRect());
        // Scroll into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // If element not found immediately (due to route transition), retry briefly
        setTimeout(() => {
            const retryEl = document.getElementById(currentTourStep.targetId);
            if (retryEl) setRect(retryEl.getBoundingClientRect());
        }, 500);
      }
    };

    // Wait for route transition/animation
    const timer = setTimeout(updateRect, 600);
    window.addEventListener('resize', updateRect);
    
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateRect);
    };
  }, [isTourActive, currentStep, location.pathname]);

  if (!isTourActive || !currentTourStep) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] overflow-hidden">
      {/* Dark Overlay with composed divs to avoid complex clip-path issues */}
      {rect && (
        <>
          {/* Top Mask */}
          <div className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ height: rect.top - 8 }} />
          {/* Bottom Mask */}
          <div className="absolute left-0 right-0 bottom-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ top: rect.bottom + 8 }} />
          {/* Left Mask */}
          <div className="absolute left-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ top: rect.top - 8, bottom: window.innerHeight - (rect.bottom + 8), width: rect.left - 8 }} />
          {/* Right Mask */}
          <div className="absolute right-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ top: rect.top - 8, bottom: window.innerHeight - (rect.bottom + 8), left: rect.right + 8 }} />
          
          {/* Active Highlight Ring (Visual only) */}
          <div 
            className="absolute border-2 border-brand-primary rounded-2xl shadow-lg box-content transition-all duration-300 ease-out animate-pulse"
            style={{ 
                top: rect.top - 8, 
                left: rect.left - 8, 
                width: rect.width + 16, 
                height: rect.height + 16 
            }}
          />

          {/* Tooltip Card */}
          <div 
            className="absolute left-0 right-0 px-6 flex justify-center transition-all duration-300"
            style={{ 
                top: rect.bottom + 24 > window.innerHeight - 200 ? 'auto' : rect.bottom + 24,
                bottom: rect.bottom + 24 > window.innerHeight - 200 ? window.innerHeight - rect.top + 24 : 'auto'
            }}
          >
            <MotionDiv 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={currentStep}
                className="bg-brand-surface p-5 rounded-2xl shadow-xl max-w-sm w-full relative"
            >
                <button onClick={endTour} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                <h3 className="font-bold text-lg text-brand-text mb-2">{currentTourStep.title}</h3>
                <p className="text-brand-text-secondary text-sm mb-6 leading-relaxed">{currentTourStep.content}</p>
                <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                        {tourSteps.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-brand-primary' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                    <button 
                        onClick={nextStep}
                        className="bg-brand-text text-white px-5 py-2.5 rounded-2xl text-sm font-bold active:scale-95 transition"
                    >
                        {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </MotionDiv>
          </div>
        </>
      )}
    </div>,
    document.body
  );
};
