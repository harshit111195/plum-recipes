/**
 * Security utilities for Supabase Edge Functions
 * Protects against prompt injection, XSS, and other attacks
 */

/**
 * Sanitizes user input to prevent prompt injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Truncate to max length
  let sanitized = input.slice(0, maxLength);
  
  // Remove or escape XML/HTML tags that could break prompt structure
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove common injection patterns
  const injectionPatterns = [
    /ignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/gi,
    /system\s*:\s*(you\s+are|act\s+as|pretend)/gi,
    /\[INST\]|\[\/INST\]|<<SYS>>|<<\/SYS>>/gi,
    /(roleplay|jailbreak|bypass|override)/gi,
  ];
  
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validates that input is cooking/recipe related
 */
export function isCookingRelated(input: string): boolean {
  if (!input || input.length < 3) return false;
  
  const cookingKeywords = [
    'recipe', 'cook', 'ingredient', 'food', 'meal', 'dish', 'kitchen',
    'bake', 'fry', 'boil', 'grill', 'roast', 'steam', 'sauté',
    'pantry', 'spice', 'herb', 'sauce', 'dressing', 'marinade',
    'breakfast', 'lunch', 'dinner', 'snack', 'appetizer', 'dessert',
    'chicken', 'beef', 'pork', 'fish', 'vegetable', 'fruit', 'dairy',
    'flour', 'sugar', 'salt', 'pepper', 'oil', 'butter', 'cheese'
  ];
  
  const lowerInput = input.toLowerCase();
  return cookingKeywords.some(keyword => lowerInput.includes(keyword));
}

/**
 * Escapes XML/HTML special characters
 */
export function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validates input length
 */
export function validateLength(input: string, min: number = 1, max: number = 1000): boolean {
  if (!input) return min === 0;
  return input.length >= min && input.length <= max;
}

/**
 * Rate limiting store (in-memory, for production use Redis/Supabase KV)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
export const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export function checkRateLimit(
  userId: string, 
  maxRequests: number = 10
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (userLimit.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: maxRequests - userLimit.count };
}

/**
 * Extracts user ID from auth token or headers
 */
export function getUserId(req: Request): string {
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from JWT token (first part before dot)
    const parts = authHeader.split('.');
    if (parts.length > 0) {
      return parts[0];
    }
  }
  return req.headers.get('x-client-info') || 'anonymous';
}

/**
 * Validates JSON structure and sanitizes nested strings
 */
export function sanitizeObject(obj: any, maxDepth: number = 5, currentDepth: number = 0): any {
  if (currentDepth > maxDepth) {
    return null; // Prevent deep nesting attacks
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj, 2000);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxDepth, currentDepth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Limit object size to prevent DoS
      if (Object.keys(sanitized).length >= 100) break;
      sanitized[key] = sanitizeObject(value, maxDepth, currentDepth + 1);
    }
    return sanitized;
  }
  
  return obj;
}

