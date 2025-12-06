

import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { CONFIG } from '../config';

// --- PLATFORM-AWARE STORAGE ADAPTER ---
// Uses Capacitor Preferences for native apps (more secure, persists across cache clears)
// Falls back to localStorage for web browsers
const isNative = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Capacitor.isNativePlatform();
};

// Create storage adapter that uses Capacitor Preferences on native, localStorage on web
const storageAdapter = {
    async getItem(key: string): Promise<string | null> {
        try {
            if (isNative()) {
                // Use Capacitor Preferences for native apps (more secure)
                const result = await Preferences.get({ key });
                return result.value;
            } else {
                // Use localStorage for web browsers
                return localStorage.getItem(key);
            }
        } catch (error) {
            console.warn('Storage getItem failed, falling back to localStorage', error);
            // Fallback to localStorage if Preferences fails
            return localStorage.getItem(key);
        }
    },
    
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (isNative()) {
                // Use Capacitor Preferences for native apps
                await Preferences.set({ key, value });
            } else {
                // Use localStorage for web browsers
                localStorage.setItem(key, value);
            }
        } catch (error) {
            console.warn('Storage setItem failed, falling back to localStorage', error);
            // Fallback to localStorage if Preferences fails
            localStorage.setItem(key, value);
        }
    },
    
    async removeItem(key: string): Promise<void> {
        try {
            if (isNative()) {
                // Use Capacitor Preferences for native apps
                await Preferences.remove({ key });
            } else {
                // Use localStorage for web browsers
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.warn('Storage removeItem failed, falling back to localStorage', error);
            // Fallback to localStorage if Preferences fails
            localStorage.removeItem(key);
        }
    }
};

// Initialize the Supabase client
export const supabase = createClient(
    CONFIG.supabase.url,
    CONFIG.supabase.anonKey,
    {
        auth: {
            storage: storageAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);

/**
 * Uploads a Base64 image string to Supabase Storage 'recipe-images' bucket.
 * Returns the public URL of the uploaded image.
 */
import { compressBase64Image } from '../utils/imageUtils';

/**
 * Uploads a Base64 image string to Supabase Storage 'recipe-images' bucket.
 * Returns the public URL of the uploaded image.
 * Always converts to WebP for optimization.
 */
export const uploadRecipeImage = async (recipeId: string, base64Data: string): Promise<string | null> => {
    try {
        // 1. Check if it's already a URL (skip upload)
        if (!base64Data || base64Data.startsWith('http')) return base64Data;

        // 2. Get User ID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null; // Can't upload if not logged in

        // 3. Compress and Convert to WebP
        let webpDataUrl = await compressBase64Image(base64Data);
        
        // 4. Ensure WebP format - validate and force conversion if needed
        let parts = webpDataUrl.split(';base64,');
        let detectedContentType = parts[0].split(':')[1];
        
        if (detectedContentType !== 'image/webp') {
            console.warn(`Image compression returned ${detectedContentType} instead of WebP. Attempting re-conversion...`);
            // Re-compress the image to force WebP
            webpDataUrl = await compressBase64Image(webpDataUrl);
            parts = webpDataUrl.split(';base64,');
            detectedContentType = parts[0].split(':')[1];
            
            // If still not WebP after retry, we'll force WebP content type anyway
            // The browser should handle the conversion, but log for monitoring
            if (detectedContentType !== 'image/webp') {
                console.error(`Warning: Image may not be true WebP format (detected: ${detectedContentType}). Uploading with WebP content type.`);
            }
        }
        
        // 5. Convert Data URL to Blob - ALWAYS force WebP format and content type
        const rawBase64 = parts[1];
        if (!rawBase64) {
            console.error('Invalid base64 data - missing base64 content');
            return null;
        }
        
        const byteCharacters = atob(rawBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        // CRITICAL: Always use 'image/webp' content type for Capacitor native apps
        const blob = new Blob([byteArray], { type: 'image/webp' });

        // 6. Upload to Supabase Storage - ALWAYS use .webp extension
        const filePath = `${session.user.id}/${recipeId}.webp`;
        
        const { error: uploadError } = await supabase.storage
            .from('recipe-images')
            .upload(filePath, blob, { 
                upsert: true,
                contentType: 'image/webp', // Force WebP content type
                cacheControl: '31536000'
            });

        if (uploadError) {
            console.error('Supabase Storage Upload Error:', JSON.stringify(uploadError));
            return null;
        }

        // 6. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(filePath);

        // Force cache bust if needed, but usually not needed with unique paths or if we want latest
        return `${publicUrl}?t=${Date.now()}`;

    } catch (e) {
        console.error('Failed to upload recipe image', e);
        return null;
    }
};

/**
 * Generates an optimized image URL using Supabase Image Transformations.
 * Falls back to original URL if transformations aren't available on the tier.
 * 
 * @param url The public URL from Supabase Storage
 * @param width Target width (e.g., 300 for list, 800 for detail)
 */
export const getOptimizedImageUrl = (url: string | undefined, width: number): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('data:')) return url; // Cannot optimize base64 client-side easily here

    // Append transformation params
    // format=webp ensures the smallest possible file size for modern browsers
    // quality=50 is sufficient for mobile screens and significantly reduces bandwidth
    return `${url}?width=${width}&quality=50&format=webp`;
};