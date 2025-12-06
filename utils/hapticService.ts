/**
 * Haptic Feedback Service
 * Provides native haptic feedback using Capacitor's Haptics API
 * 
 * Philosophy: Subtle and Premium
 * - Use sparingly for primary actions and important confirmations
 * - Reserve for moments that matter (generation, completion, success/error)
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Check if running on native device
const isNative = () => {
  if (typeof window === 'undefined') return false;
  // @ts-ignore
  return !!(window.Capacitor && window.Capacitor.isNativePlatform());
};

/**
 * Medium impact feedback - for primary actions
 * Use for: Generate recipes, start cooking
 * Fire-and-forget: Doesn't block UI, returns immediately
 */
export const hapticMedium = () => {
  if (!isNative()) return;
  // Fire and forget - don't await to avoid blocking UI
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
};

/**
 * Success notification haptic
 * Use for: Successful completions (recipe generation, purchases, cooking completion)
 * Fire-and-forget: Doesn't block UI, returns immediately
 */
export const hapticSuccess = () => {
  if (!isNative()) return;
  // Fire and forget - don't await to avoid blocking UI
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
};

/**
 * Error notification haptic
 * Use for: Authentication failures, critical errors
 * Fire-and-forget: Doesn't block UI, returns immediately
 */
export const hapticError = () => {
  if (!isNative()) return;
  // Fire and forget - don't await to avoid blocking UI
  Haptics.notification({ type: NotificationType.Error }).catch(() => {});
};

/**
 * Light impact feedback - for subtle interactions
 * Use for: Button taps, selections, toggles
 * Fire-and-forget: Doesn't block UI, returns immediately
 */
export const hapticLight = () => {
  if (!isNative()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

/**
 * Generic trigger function with intensity options
 * Use for: Flexible haptic needs based on context
 * @param intensity - 'light' | 'medium' | 'heavy' | 'success' | 'error'
 */
export const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'medium') => {
  if (!isNative()) return;
  
  switch (intensity) {
    case 'light':
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      break;
    case 'medium':
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      break;
    case 'heavy':
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      break;
    case 'success':
      Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      break;
    case 'error':
      Haptics.notification({ type: NotificationType.Error }).catch(() => {});
      break;
  }
};
