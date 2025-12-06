import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../../context/OnboardingContext';
import { useUser } from '../../context/UserContext';
import { GRADIENTS, COLORS } from '../../brand';
import { Diet } from '../../types';

// Screens
import { HeroScreen } from './screens/HeroScreen';
import { FeatureAIChef } from './screens/FeatureAIChef';
import { FeaturePantry } from './screens/FeaturePantry';
import { FeatureShopping } from './screens/FeatureShopping';
import { DietScreen } from './screens/DietScreen';
import { AllergiesScreen } from './screens/AllergiesScreen';
import { KitchenScreen } from './screens/KitchenScreen';

// Components
import { OnboardingProgress } from './components/OnboardingProgress';

const TOTAL_STEPS = 7;

export const OnboardingFlow: React.FC = () => {
  const { showWelcome, completeOnboarding, startTour } = useOnboarding();
  const { preferences, updatePreferences } = useUser();
  
  // Local state for onboarding data
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDiet, setSelectedDiet] = useState<Diet | null>(preferences.diet || null);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(preferences.allergies || []);
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>(preferences.appliances || ['oven', 'stovetop', 'microwave']);
  const [householdSize, setHouseholdSize] = useState<number>(preferences.householdSize || 2);

  if (!showWelcome) return null;

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    // Save minimal preferences and complete
    updatePreferences({
      ...preferences,
      hasCompletedOnboarding: true,
    });
    completeOnboarding();
  };

  const handleFinish = () => {
    // Save all collected preferences
    const finalAllergies = selectedAllergies.includes('none') 
      ? [] 
      : selectedAllergies;
    
    updatePreferences({
      ...preferences,
      diet: selectedDiet || Diet.Omnivore,
      allergies: finalAllergies,
      appliances: selectedAppliances,
      householdSize: householdSize,
      hasCompletedOnboarding: true,
    });
    
    // Complete onboarding and optionally start tour
    completeOnboarding();
    // Uncomment to auto-start tour after onboarding:
    // startTour();
  };

  // Animation variants for page transitions
  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  // Render current screen based on step
  const renderScreen = () => {
    switch (currentStep) {
      case 0:
        return <HeroScreen onNext={nextStep} onSkip={handleSkip} />;
      case 1:
        return <FeatureAIChef onNext={nextStep} />;
      case 2:
        return <FeaturePantry onNext={nextStep} />;
      case 3:
        return <FeatureShopping onNext={nextStep} />;
      case 4:
        return (
          <DietScreen
            selectedDiet={selectedDiet}
            onSelectDiet={setSelectedDiet}
            onNext={nextStep}
          />
        );
      case 5:
        return (
          <AllergiesScreen
            selectedAllergies={selectedAllergies}
            onSelectAllergies={setSelectedAllergies}
            onNext={nextStep}
          />
        );
      case 6:
        return (
          <KitchenScreen
            selectedAppliances={selectedAppliances}
            householdSize={householdSize}
            onSelectAppliances={setSelectedAppliances}
            onSelectHouseholdSize={setHouseholdSize}
            onFinish={handleFinish}
          />
        );
      default:
        return null;
    }
  };

  // Background colors based on step
  const getBackgroundColor = () => {
    switch (currentStep) {
      case 0: return '#FFC244'; // Hero - Yellow
      case 1: return '#7C3AED'; // AI Chef - Purple
      case 2: return '#7C3AED'; // Pantry - Purple
      case 3: return '#7C3AED'; // Shopping - Purple
      case 4: return '#FFC244'; // Diet - Yellow
      case 5: return '#FFC244'; // Allergies - Yellow
      case 6: return '#7C3AED'; // Kitchen - Purple
      default: return '#FFC244';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex flex-col transition-colors duration-500"
      style={{ background: getBackgroundColor() }}
    >
      {/* Progress bar - hidden on first screen */}
      {currentStep > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-safe pt-4"
        >
          <OnboardingProgress 
            currentStep={currentStep} 
            totalSteps={TOTAL_STEPS} 
          />
        </motion.div>
      )}

      {/* Main content area with page transitions */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Safe area padding at bottom */}
      <div className="pb-safe" />
    </div>
  );
};

export default OnboardingFlow;

