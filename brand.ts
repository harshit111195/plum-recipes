/**
 * 🍑 PLUM BRAND CONFIGURATION
 * ============================================
 * Single Source of Truth for all brand-related values.
 * 
 * UPDATE THIS FILE to change:
 * - App name, tagline, descriptions
 * - Colors (primary, secondary, system)
 * - Logo paths
 * - Social links
 * - Legal URLs
 * 
 * After updating values here, run the app to see changes.
 * CSS variables in index.css will automatically sync.
 */

// ============================================
// APP IDENTITY
// ============================================
export const APP_NAME = 'Plum';
export const APP_NAME_LOWER = 'plum';
export const APP_TAGLINE = 'Your daily "what\'s for dinner?" solved.';
export const APP_TAGLINE_SHORT = 'Cook smarter, not harder';
export const APP_DESCRIPTION = 'AI-powered recipe generator that creates delicious meals from your pantry ingredients.';
export const APP_VERSION = '1.0.0';

// ============================================
// BRAND COLORS - Yellow brand with Purple/Green buttons
// ============================================
export const COLORS = {
  // Primary Brand Colors (Yellow - for hero cards, accents)
  primary: '#FFC244',        // Yellow - Main brand color
  primaryLight: '#FFD470',   // Lighter yellow
  primaryLighter: '#FFE4A0', // Even lighter
  primaryDark: '#E5A830',    // Darker for hover states
  
  // Button Colors
  buttonPrimary: '#7C3AED',  // Purple - Primary buttons
  buttonPrimaryHover: '#6D28D9', // Darker purple for hover
  buttonSecondary: '#10B981', // Green - Secondary buttons
  buttonSecondaryHover: '#059669', // Darker green for hover
  
  // Secondary/Accent Colors
  secondary: '#E84142',      // Tomato Red - Secondary brand color
  accent: '#00A67E',         // Glovo Green - Success/accent
  
  // Light Mode Neutral Colors
  background: '#FFFFFF',     // Clean white background
  surface: '#FFFFFF',        // Card/surface background
  surfaceSecondary: '#F7F7F7', // Secondary surface (inputs, etc.)
  
  // Text Colors
  text: '#1A1A1A',           // Primary text - Near black
  textSecondary: '#6B6B6B',  // Secondary text
  textTertiary: '#9B9B9B',   // Tertiary/placeholder text
  
  // Semantic Colors
  success: '#10B981',        // Emerald Green
  warning: '#F59E0B',        // Amber
  error: '#EF4444',          // Red
  info: '#3B82F6',           // Blue
  
  // Special UI Colors
  divider: '#EBEBEB',        // Divider lines
  overlay: 'rgba(0,0,0,0.5)', // Modal overlays
  shadow: 'rgba(0,0,0,0.08)', // Card shadows
  
  // Dark Mode Colors (prefixed with dark)
  darkBackground: '#0D0D0D',
  darkSurface: '#1A1A1A',
  darkSurfaceSecondary: '#2A2A2A',
  darkText: '#FFFFFF',
  darkTextSecondary: '#A0A0A0',
  darkTextTertiary: '#6B6B6B',
  darkDivider: '#333333',
} as const;

// ============================================
// GRADIENTS (Solid colors - no gradients used)
// ============================================
export const GRADIENTS = {
  // Solid primary brand color (for hero cards)
  primary: COLORS.primary,
  
  // Splash screen - solid primary
  splash: COLORS.primary,
  
  // Card overlay for text readability on images
  cardOverlay: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
  
  // Header fade (functional gradient, not decorative)
  headerFade: `linear-gradient(to bottom, ${COLORS.background}, transparent)`,
  
  // Dark mode splash - solid dark
  darkSplash: COLORS.darkSurface,
} as const;

// ============================================
// SHADOWS
// ============================================
export const SHADOWS = {
  // Primary button shadow (purple glow)
  primaryButton: `0 4px 14px -2px rgba(124, 58, 237, 0.4)`,
  
  // Secondary button shadow (green glow)
  secondaryButton: `0 4px 14px -2px rgba(16, 185, 129, 0.35)`,
  
  // Card shadow
  card: `0 1px 3px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.04)`,
  
  // Elevated card shadow
  cardElevated: `0 8px 30px rgba(0, 0, 0, 0.1)`,
  
  // Navigation shadow
  nav: `0 -1px 0 rgba(0, 0, 0, 0.05)`,
  
  // Dark mode shadows
  darkCard: `0 2px 8px rgba(0, 0, 0, 0.4)`,
  darkElevated: `0 12px 40px rgba(0, 0, 0, 0.5)`,
} as const;

// ============================================
// ASSETS
// ============================================
export const ASSETS = {
  // Logo
  logo: '/logo.png',
  logoAlt: `${APP_NAME} Logo`,
  
  // Favicon (if different from logo)
  favicon: '/logo.png',
  
  // Default recipe placeholder
  recipePlaceholder: (id: string) => `https://picsum.photos/seed/${id}/600/400`,
} as const;

// ============================================
// URLS & LINKS
// ============================================
export const LINKS = {
  // Legal
  privacyPolicy: 'https://example.com/privacy',
  termsOfService: 'https://example.com/terms',
  
  // Support
  supportEmail: 'support@plum.app',
  feedbackForm: 'https://example.com/feedback',
  
  // Social Media (add when available)
  twitter: '',
  instagram: '',
  tiktok: '',
} as const;

// ============================================
// APP STORE METADATA
// ============================================
export const APP_STORE = {
  // iOS App Store
  appStoreId: '', // Add after launch
  appStoreUrl: '', // Add after launch
  
  // Google Play Store
  playStoreId: 'com.plum.app',
  playStoreUrl: '', // Add after launch
} as const;

// ============================================
// TOAST MESSAGES (Brand Voice)
// ============================================
export const MESSAGES = {
  // Auth
  welcomeBack: 'Welcome back, Chef!',
  accountCreated: 'Account created! You are logged in.',
  loggedOut: 'See you soon, Chef!',
  
  // Success
  recipeGenerated: 'Recipes ready! Let\'s cook.',
  itemAdded: 'Added to pantry!',
  bookmarkAdded: 'Recipe saved!',
  bookmarkRemoved: 'Removed from saved',
  
  // Errors
  genericError: 'Something went wrong. Try again?',
  networkError: 'No connection. Check your internet.',
  emptyPantry: 'Can\'t cook with vibes alone. Add some food!',
  
  // Fun/Playful
  chefDisconnected: 'Chef is disconnected.',
  pantryEmpty: 'This pantry is giving empty.',
  allStockedUp: 'All stocked up. Nice.',
} as const;

// ============================================
// UI CONFIGURATION
// ============================================
export const UI = {
  // Border radius values
  borderRadius: {
    sm: '10px',
    md: '18px',
    lg: '20px',
    xl: '24px',
    full: '9999px',
    card: '22px',
    button: '18px',
    input: '12px',
    modal: '28px',
  },
  
  // Animation durations (ms)
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
    splash: 8000, // Splash screen duration
  },
  
  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// ============================================
// HELPER: Generate CSS Variables (Light Mode)
// ============================================
export const getCSSVariables = (): string => {
  return `
    --brand-primary: ${COLORS.primary};
    --brand-primary-light: ${COLORS.primaryLight};
    --brand-primary-lighter: ${COLORS.primaryLighter};
    --brand-primary-dark: ${COLORS.primaryDark};
    --brand-secondary: ${COLORS.secondary};
    --brand-accent: ${COLORS.accent};
    --brand-button-primary: ${COLORS.buttonPrimary};
    --brand-button-primary-hover: ${COLORS.buttonPrimaryHover};
    --brand-button-secondary: ${COLORS.buttonSecondary};
    --brand-button-secondary-hover: ${COLORS.buttonSecondaryHover};
    --brand-background: ${COLORS.background};
    --brand-surface: ${COLORS.surface};
    --brand-surface-secondary: ${COLORS.surfaceSecondary};
    --brand-text: ${COLORS.text};
    --brand-text-secondary: ${COLORS.textSecondary};
    --brand-text-tertiary: ${COLORS.textTertiary};
    --brand-success: ${COLORS.success};
    --brand-warning: ${COLORS.warning};
    --brand-error: ${COLORS.error};
    --brand-info: ${COLORS.info};
    --brand-divider: ${COLORS.divider};
  `.trim();
};

// ============================================
// HELPER: Generate Dark Mode CSS Variables
// ============================================
export const getDarkCSSVariables = (): string => {
  return `
    --brand-primary: ${COLORS.primary};
    --brand-primary-light: ${COLORS.primaryLight};
    --brand-primary-lighter: ${COLORS.primaryLighter};
    --brand-primary-dark: ${COLORS.primaryDark};
    --brand-secondary: ${COLORS.secondary};
    --brand-accent: ${COLORS.accent};
    --brand-button-primary: ${COLORS.buttonPrimary};
    --brand-button-primary-hover: ${COLORS.buttonPrimaryHover};
    --brand-button-secondary: ${COLORS.buttonSecondary};
    --brand-button-secondary-hover: ${COLORS.buttonSecondaryHover};
    --brand-background: ${COLORS.darkBackground};
    --brand-surface: ${COLORS.darkSurface};
    --brand-surface-secondary: ${COLORS.darkSurfaceSecondary};
    --brand-text: ${COLORS.darkText};
    --brand-text-secondary: ${COLORS.darkTextSecondary};
    --brand-text-tertiary: ${COLORS.darkTextTertiary};
    --brand-success: ${COLORS.success};
    --brand-warning: ${COLORS.warning};
    --brand-error: ${COLORS.error};
    --brand-info: ${COLORS.info};
    --brand-divider: ${COLORS.darkDivider};
  `.trim();
};

// ============================================
// DEFAULT EXPORT
// ============================================
const BRAND = {
  name: APP_NAME,
  nameLower: APP_NAME_LOWER,
  tagline: APP_TAGLINE,
  taglineShort: APP_TAGLINE_SHORT,
  description: APP_DESCRIPTION,
  colors: COLORS,
  gradients: GRADIENTS,
  shadows: SHADOWS,
  assets: ASSETS,
  links: LINKS,
  appStore: APP_STORE,
  messages: MESSAGES,
  ui: UI,
} as const;

export default BRAND;

