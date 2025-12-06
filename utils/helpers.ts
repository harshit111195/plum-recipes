/**
 * Shared Utility Functions
 * Common helpers used across the application
 */

/**
 * Generate a unique ID using timestamp and random string
 * Used for creating IDs for pantry items, recipes, etc.
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
};
