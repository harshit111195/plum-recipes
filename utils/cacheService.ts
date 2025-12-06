/**
 * Client-Side Cache Service for Native Apps (Capacitor)
 * Uses Capacitor Preferences API for native apps, localStorage for web
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Platform detection - with safety check
const isNative = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    return Capacitor.isNativePlatform();
  } catch (error) {
    console.warn('Platform detection error:', error);
    return false;
  }
};

/**
 * Generate a hash from a string (simple hash function)
 */
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Cache service for Ask AI Step responses
 */
class AskStepCacheService {
  private readonly PREFIX = 'ask_step:';
  private readonly TTL_DAYS = 90; // Cache for 90 days

  /**
   * Generate cache key from recipe title, step content, and optional question
   */
  private getCacheKey(title: string, step: string, question?: string): string {
    const keyString = `${title}:${step}:${question || 'default'}`;
    const hash = simpleHash(keyString);
    return `${this.PREFIX}${hash}`;
  }

  /**
   * Get cached answer for a step
   */
  async getCachedAnswer(title: string, step: string, question?: string): Promise<string | null> {
    try {
      // Validate inputs
      if (!title || !step) return null;
      
      const key = this.getCacheKey(title, step, question);
      
      if (isNative()) {
        try {
          const result = await Preferences.get({ key });
          if (!result?.value) return null;
          
          const cached = JSON.parse(result.value);
          const now = Date.now();
          
          // Check if expired
          if (cached?.expiresAt && now > cached.expiresAt) {
            await this.clearCache(title, step, question);
            return null;
          }
          
          return cached?.answer || null;
        } catch (nativeError) {
          console.warn('Native Preferences.get error:', nativeError);
          // Fallback to localStorage on native error
          const cachedStr = localStorage.getItem(key);
          if (!cachedStr) return null;
          const cached = JSON.parse(cachedStr);
          return cached?.answer || null;
        }
      } else {
        const cachedStr = localStorage.getItem(key);
        if (!cachedStr) return null;
        
        const cached = JSON.parse(cachedStr);
        const now = Date.now();
        
        // Check if expired
        if (cached?.expiresAt && now > cached.expiresAt) {
          localStorage.removeItem(key);
          return null;
        }
        
        return cached?.answer || null;
      }
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Cache an answer for a step
   */
  async setCachedAnswer(title: string, step: string, answer: string, question?: string): Promise<void> {
    try {
      const key = this.getCacheKey(title, step, question);
      const expiresAt = Date.now() + (this.TTL_DAYS * 24 * 60 * 60 * 1000);
      
      const cacheData = {
        answer,
        expiresAt,
        cachedAt: Date.now()
      };
      
      if (isNative()) {
        await Preferences.set({
          key,
          value: JSON.stringify(cacheData)
        });
      } else {
        localStorage.setItem(key, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.warn('Cache set error:', error);
      // Don't throw - caching is optional
    }
  }

  /**
   * Clear cache for a specific step
   */
  async clearCache(title: string, step: string, question?: string): Promise<void> {
    try {
      const key = this.getCacheKey(title, step, question);
      
      if (isNative()) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Check if a step has been asked (for "only once per card" logic)
   */
  async hasBeenAsked(title: string, stepIndex: number): Promise<boolean> {
    try {
      // Validate inputs
      if (!title || typeof stepIndex !== 'number') return false;
      
      const key = `${this.PREFIX}asked:${simpleHash(`${title}:${stepIndex}`)}`;
      
      if (isNative()) {
        try {
          const result = await Preferences.get({ key });
          return !!result?.value;
        } catch (nativeError) {
          console.warn('Native Preferences.get error:', nativeError);
          // Fallback to localStorage on native error
          return !!localStorage.getItem(key);
        }
      } else {
        return !!localStorage.getItem(key);
      }
    } catch (error) {
      console.warn('hasBeenAsked error:', error);
      return false;
    }
  }

  /**
   * Mark a step as asked (for "only once per card" logic)
   */
  async markAsAsked(title: string, stepIndex: number): Promise<void> {
    try {
      // Validate inputs
      if (!title || typeof stepIndex !== 'number') return;
      
      const key = `${this.PREFIX}asked:${simpleHash(`${title}:${stepIndex}`)}`;
      
      if (isNative()) {
        try {
          await Preferences.set({ key, value: 'true' });
        } catch (nativeError) {
          console.warn('Native Preferences.set error:', nativeError);
          // Fallback to localStorage on native error
          localStorage.setItem(key, 'true');
        }
      } else {
        localStorage.setItem(key, 'true');
      }
    } catch (error) {
      console.warn('Mark as asked error:', error);
    }
  }
}

export const askStepCache = new AskStepCacheService();

