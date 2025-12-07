

/**
 * Application Configuration
 * Centralizes environment variables, feature flags, and API endpoints.
 */

// Helper to get env vars from different bundler standards (Vite vs Webpack vs Create React App)
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// Environment Detection
// @ts-ignore
const isProd = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) || (typeof process !== 'undefined' && process.env.NODE_ENV === 'production');

const SUPABASE_PROJECT_ID = 'irpziphnckxichjyyeaj'; // Extracted for reuse

// Helper to detect Capacitor at runtime
const isCapacitorRuntime = (): boolean => {
  if (typeof window === 'undefined') return false;
  // @ts-ignore
  return !!(window.Capacitor || window.CapacitorWeb || window.location?.protocol === 'capacitor:');
};

export const CONFIG = {
  // Feature Flags
  features: {
    useBackendProxy: true
  },

  // API Keys
  geminiApiKey: '', // API Key is now handled by Edge Functions

  // Supabase Configuration (Cloud Database)
  supabase: {
      url: getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL') || process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`,
      get anonKey() {
        const key = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY') || process.env.SUPABASE_KEY;
        if (!key) {
          throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required. Create a .env file with this key.');
        }
        return key;
      }
  },

  // Ads Configuration
  ads: {
      // Toggle between "House Ads" (Pro Upsell) and "Network Ads" (AdSense/AdMob)
      // Set to TRUE to show "Upgrade to Pro" cards
      // Set to FALSE to show Google AdSense units
      showHouseAds: true, 

      // Google AdSense Config (Web) - Disabled, using house ads instead
      // To enable: uncomment and set your AdSense IDs
      // adSenseClientId: 'ca-pub-YOUR_ID',
      // slots: {
      //     banner: 'YOUR_BANNER_SLOT',
      //     card: 'YOUR_CARD_SLOT'
      // }
  },

  // API Configuration
  api: {
    // Mobile/Production builds must use HTTPS. Local dev uses localhost.
    baseUrl: `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1`,
    endpoints: {
        parsePantry: '/parse-pantry',
        generateRecipes: '/generate-recipes',
        generateThumbnail: '/generate-thumbnail',
        askStep: '/ask-step'
    },
    timeout: 120000, // 2 minutes - allows time for recipe + image generation with large pantries
    retries: 3
  },

  // Limits
  limits: {
    maxPantryItems: 200,
    maxHistoryItems: 50,
    maxImageSize: 512, 
    localStorageQuota: 4.5 * 1024 * 1024 
  },

  // Metadata
  version: '1.0.0'
};