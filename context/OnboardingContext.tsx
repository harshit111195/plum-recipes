
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';

interface OnboardingContextType {
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  completeOnboarding: () => void;
  isTourActive: boolean;
  startTour: () => void;
  endTour: () => void;
  currentStep: number;
  nextStep: () => void;
  tourSteps: TourStep[];
}

export interface TourStep { targetId: string; title: string; content: string; path: string; }

const TOUR_STEPS: TourStep[] = [
  { targetId: 'tour-pantry-add', title: 'Stock Up', content: 'Start here! Snap a photo or scan items to fill your pantry instantly.', path: '/pantry' },
  { targetId: 'tour-cook-btn', title: 'Magic Chef', content: 'Tap "Let\'s Cook" to have AI invent a recipe using what you have.', path: '/recipes' },
  { targetId: 'tour-customize', title: 'Your Rules', content: 'Filter by time, cuisine, or specific ingredients you want to use.', path: '/recipes' },
  { targetId: 'tour-shop-input', title: 'Smart Shopping', content: 'Add items quickly. We also suggest restocks based on what you use.', path: '/shopping' },
  { targetId: 'tour-settings-nav', title: 'Personalize', content: 'Set your diet, allergies, and appliances here.', path: '/settings' }
];

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, updatePreferences, isLoading } = useUser();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Do not determine onboarding state while user data is still loading
    if (isLoading) return;

    // Strict check: Only show if explicit false, otherwise hide.
    // This fixes the issue where undefined (during load) or check-less state causing it to stick to true.
    if (preferences.hasCompletedOnboarding === false) {
       setShowWelcome(true);
    } else {
       setShowWelcome(false);
    }
  }, [preferences.hasCompletedOnboarding, isLoading]);

  const completeOnboarding = () => { 
    setShowWelcome(false); 
  };
  const startTour = () => { setShowWelcome(false); setIsTourActive(true); setCurrentStep(0); };
  const endTour = () => { setIsTourActive(false); setCurrentStep(0); updatePreferences({ ...preferences, hasCompletedOnboarding: true }); };
  const nextStep = () => { if (currentStep < TOUR_STEPS.length - 1) { setCurrentStep(prev => prev + 1); } else { endTour(); } };

  return (
    <OnboardingContext.Provider value={{ showWelcome, setShowWelcome, completeOnboarding, isTourActive, startTour, endTour, currentStep, nextStep, tourSteps: TOUR_STEPS }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
};
