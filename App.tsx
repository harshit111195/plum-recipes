
import React, { Suspense, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { UserProvider, useUser } from './context/UserContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { RecipeProvider, useRecipes } from './context/RecipeContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { PageTransition } from './components/PageTransition';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { TourGuide } from './components/Onboarding/TourGuide';
import { SplashScreen } from './components/SplashScreen';
import { AuthScreen } from './components/AuthScreen';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { UI } from './brand';

// Lazy Load heavy routes
const PantryView = React.lazy(() => import('./components/PantryView').then(module => ({ default: module.PantryView })));
const RecipeGenerator = React.lazy(() => import('./components/RecipeGenerator').then(module => ({ default: module.RecipeGenerator })));
const ShoppingList = React.lazy(() => import('./components/ShoppingList').then(module => ({ default: module.ShoppingList })));
const Settings = React.lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-brand-background">
    <Loader2 className="animate-spin text-brand-primary" size={40} />
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/pantry" element={<Suspense fallback={<PageLoader />}><PageTransition><PantryView /></PageTransition></Suspense>} />
        <Route path="/recipes" element={<Suspense fallback={<PageLoader />}><PageTransition><RecipeGenerator /></PageTransition></Suspense>} />
        <Route path="/shopping" element={<Suspense fallback={<PageLoader />}><PageTransition><ShoppingList /></PageTransition></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageLoader />}><PageTransition><Settings /></PageTransition></Suspense>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent: React.FC = () => {
  const { isLoading: userLoading, preferences } = useUser();
  const { isLoading: invLoading } = useInventory();
  const { isLoading: recipeLoading } = useRecipes();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  const isLoading = userLoading || invLoading || recipeLoading;

  // Track if we've loaded at least once
  useEffect(() => {
    if (!isLoading) {
      setHasLoadedOnce(true);
    }
  }, [isLoading]);

  // Always use dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Only show loader on initial load, not on subsequent navigations
  if (isLoading && !hasLoadedOnce) {
    return (
      <div className="fixed inset-0 bg-brand-background flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-brand-background text-brand-text font-sans selection:bg-blue-100">
      <ScrollToTop />
      <OfflineBanner />
      <OnboardingFlow />
      <TourGuide />
      <main className="w-full min-h-screen">
        <AnimatedRoutes />
      </main>
      <Navigation />
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let appUrlListener: any = null;
    
    const initAuth = async () => {
      // Minimum splash screen display time (configured in brand.ts)
      const minDelay = new Promise(resolve => setTimeout(resolve, UI.animation.splash));
      
      const authCheck = async () => {
        try {
          // 1. Get session from storage (fast)
          const { data: { session: localSession } } = await supabase.auth.getSession();

          if (localSession) {
            // 2. VERIFY against server (Crucial for handling deleted accounts on other devices)
            // getUser() hits the auth api to validate the token/user existence
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
              // Token exists but user is gone (deleted remotely or token revoked)
              console.warn("User validation failed, signing out...", error);
              await supabase.auth.signOut();
              if (isMounted) setSession(null);
            } else {
              // User is valid
              if (isMounted) setSession(localSession);
            }
          } else {
            if (isMounted) setSession(null);
          }
        } catch (e) {
          console.error("Auth init error", e);
          if (isMounted) setSession(null);
        }
      };

      // Wait for both auth check and minimum delay
      await Promise.all([authCheck(), minDelay]);
      if (isMounted) setCheckingAuth(false);
    };

    initAuth();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event, !!newSession);
      if (isMounted) {
        setSession(newSession);
      }
    });

    // Deep link handler for OAuth callbacks (native apps only)
    const initDeepLinks = async () => {
      // Check if running on native platform
      const isNative = typeof window !== 'undefined' && 
        (window as any).Capacitor?.isNativePlatform();
      
      if (isNative) {
        try {
          // Dynamically import Capacitor plugins for native platforms only
          const { App: CapApp } = await import('@capacitor/app');
          const { Browser } = await import('@capacitor/browser');
          
          appUrlListener = CapApp.addListener('appUrlOpen', async ({ url }) => {
            // Handle OAuth callback deep link
            if (url.includes('auth-callback')) {
              // Close the browser if it's still open
              try {
                await Browser.close();
              } catch (e) {
                // Browser might already be closed
              }
              
              // Extract tokens from URL and set session
              // Supabase handles this automatically via onAuthStateChange
              // The URL contains the tokens, and Supabase SDK parses them
              const hashParams = new URLSearchParams(url.split('#')[1] || '');
              const accessToken = hashParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token');
              
              if (accessToken && refreshToken) {
                await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
              }
            }
          });
        } catch (error) {
          console.warn('Failed to initialize deep links:', error);
        }
      }
    };
    
    initDeepLinks();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (appUrlListener) {
        appUrlListener.remove();
      }
    };
  }, []); // Empty dependency array - run once on mount

  if (checkingAuth) {
    return <SplashScreen />;
  }

  return (
    <>
      <Toaster position="bottom-center" toastOptions={{
          style: { background: '#333', color: '#fff', borderRadius: '12px', fontSize: '14px' },
      }} />
      {!session ? (
        <AuthScreen onSuccess={() => { 
          // The session will be updated via onAuthStateChange
          // Just navigate to home
          window.location.hash = '/';
          window.scrollTo(0, 0);
        }} />
      ) : (
        <ErrorBoundary>
          <UserProvider>
            <InventoryProvider>
              <RecipeProvider>
                <OnboardingProvider>
                  <HashRouter>
                    <AppContent />
                  </HashRouter>
                </OnboardingProvider>
              </RecipeProvider>
            </InventoryProvider>
          </UserProvider>
        </ErrorBoundary>
      )}
    </>
  );
};

export default App;
