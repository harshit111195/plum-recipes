import { Capacitor } from '@capacitor/core';

/**
 * Permission Service
 * 
 * Checks and manages permissions for camera and microphone access.
 * Works on both web and native platforms.
 */

export type PermissionType = 'microphone' | 'camera' | 'photo-library';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

interface PermissionCheckResult {
  status: PermissionStatus;
  canRequest: boolean;
  message?: string;
}

const isNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
};

/**
 * Check microphone permission status
 */
export const checkMicrophonePermission = async (): Promise<PermissionCheckResult> => {
  // Native platforms - check via browser API (will be handled by system when requesting)
  if (isNative()) {
    // On native, we can't check status without requesting, but we can try
    // The actual permission check happens when webkitSpeechRecognition starts
    return {
      status: 'unknown',
      canRequest: true,
    };
  }

  // Web platform - use Permissions API if available
  if ('permissions' in navigator) {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const status = result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt';
      
      return {
        status,
        canRequest: status !== 'denied',
        message: status === 'denied' 
          ? 'Microphone access was denied. Please enable it in your browser settings.'
          : undefined,
      };
    } catch (error) {
      // Permissions API not fully supported, fall back to trying
      return {
        status: 'unknown',
        canRequest: true,
      };
    }
  }

  // Fallback - assume we can request
  return {
    status: 'unknown',
    canRequest: true,
  };
};

/**
 * Check camera permission status
 */
export const checkCameraPermission = async (): Promise<PermissionCheckResult> => {
  // Native platforms - handled by Capacitor Camera plugin
  if (isNative()) {
    return {
      status: 'unknown',
      canRequest: true,
    };
  }

  // Web platform - use Permissions API if available
  if ('permissions' in navigator) {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const status = result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt';
      
      return {
        status,
        canRequest: status !== 'denied',
        message: status === 'denied'
          ? 'Camera access was denied. Please enable it in your browser settings.'
          : undefined,
      };
    } catch (error) {
      // Permissions API not fully supported, fall back to trying
      return {
        status: 'unknown',
        canRequest: true,
      };
    }
  }

  // Fallback - assume we can request
  return {
    status: 'unknown',
    canRequest: true,
  };
};

/**
 * Check if Speech Recognition API is available
 * Note: Only works in Chrome, Edge, and Safari. Firefox does not support it.
 */
export const isSpeechRecognitionAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for both standard and webkit-prefixed versions
  // @ts-ignore
  const hasAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  // Additional check: Firefox claims to have the API but it doesn't work
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  
  return hasAPI && !isFirefox;
};

/**
 * Get user-friendly error message for permission denial
 */
export const getPermissionErrorMessage = (type: PermissionType, platform: 'ios' | 'android' | 'web' = 'web'): string => {
  const messages = {
    microphone: {
      ios: 'Microphone access is required for voice input. Please enable it in Settings → Plum → Microphone.',
      android: 'Microphone access is required for voice input. Please enable it in Settings → Apps → Plum → Permissions → Microphone.',
      web: 'Microphone access was denied. Please allow microphone access in your browser settings and try again.',
    },
    camera: {
      ios: 'Camera access is required to scan pantry items. Please enable it in Settings → Plum → Camera.',
      android: 'Camera access is required to scan pantry items. Please enable it in Settings → Apps → Plum → Permissions → Camera.',
      web: 'Camera access was denied. Please allow camera access in your browser settings and try again.',
    },
    'photo-library': {
      ios: 'Photo library access is required to select images. Please enable it in Settings → Plum → Photos.',
      android: 'Photo library access is required to select images. Please enable it in Settings → Apps → Plum → Permissions → Photos.',
      web: 'Photo library access was denied. Please allow photo access in your browser settings and try again.',
    },
  };

  return messages[type][platform];
};

/**
 * Detect platform for error messages
 */
export const detectPlatform = (): 'ios' | 'android' | 'web' => {
  if (isNative()) {
    const platform = Capacitor.getPlatform();
    return platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web';
  }
  return 'web';
};

