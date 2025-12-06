
import { CapacitorHttp } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';
import { CONFIG } from '../config';
import { logger } from './loggerService';
import { supabase } from './supabase';

interface ApiError {
    message: string;
    code?: string;
    status?: number;
}

// Check if we're running in a native Capacitor app vs web browser
const isNativeApp = (): boolean => {
    return Capacitor.isNativePlatform();
};

/**
 * Core API Client
 * Handles HTTP communication with the backend services.
 * Implements security best practices: timeout, retry, proper auth handling.
 */
class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = CONFIG.api.baseUrl;
    }

    /**
     * Get authentication token using Supabase's session management
     * This ensures token refresh is handled automatically
     */
    private async getAuthToken(): Promise<string> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return session?.access_token || CONFIG.supabase.anonKey;
        } catch (error) {
            logger.warn('Failed to get session, using anon key', error);
            return CONFIG.supabase.anonKey;
        }
    }

    /**
     * Create abort controller with timeout
     */
    private createTimeoutController(timeoutMs: number): AbortController {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), timeoutMs);
        return controller;
    }

    /**
     * Retry logic with exponential backoff
     */
    private async retryWithBackoff<T>(
        fn: () => Promise<T>,
        maxRetries: number = CONFIG.api.retries || 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: any;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error: any) {
                lastError = error;
                
                // Don't retry on 4xx errors (client errors)
                if (error.status >= 400 && error.status < 500) {
                    throw error;
                }
                
                // Don't retry on last attempt
                if (attempt === maxRetries) {
                    break;
                }
                
                // Exponential backoff: 1s, 2s, 4s
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }

    /**
     * Generic POST request wrapper with security best practices
     */
    async post<T>(
        endpoint: string, 
        body: any, 
        options?: { 
            timeout?: number;
            signal?: AbortSignal;
            skipRetry?: boolean;
        }
    ): Promise<T> {
        // Check if we are calling an Edge Function (starts with http) or a relative path
        const isAbsolute = endpoint.startsWith('http');
        const url = isAbsolute ? endpoint : `${this.baseUrl}${endpoint}`;
        
        // Get auth token using Supabase's session management (handles refresh automatically)
        const token = await this.getAuthToken();

        const headers: any = {
            'Content-Type': 'application/json',
            'X-App-Version': CONFIG.version,
            'apikey': CONFIG.supabase.anonKey,
            'Authorization': `Bearer ${token}`
        };

        const timeout = options?.timeout || CONFIG.api.timeout || 30000;
        const timeoutController = options?.signal 
            ? null 
            : this.createTimeoutController(timeout);
        const signal = options?.signal || timeoutController?.signal;

        const makeRequest = async (): Promise<T> => {
            try {
                let responseData: any;
                let responseStatus: number;

                if (isNativeApp()) {
                    // Use CapacitorHttp for native apps (bypasses CORS)
                    const response = await CapacitorHttp.post({
                        url,
                        headers,
                        data: body,
                    });
                    responseData = response.data;
                    responseStatus = response.status;
                } else {
                    // Use fetch for web browsers (works with tunnels)
                    const response = await fetch(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(body),
                        signal,
                    });
                    responseStatus = response.status;
                    responseData = await response.json();
                }

                if (responseStatus >= 400) {
                    const error: ApiError = {
                        message: responseData?.error || responseData?.message || `API Error: ${responseStatus}`,
                        status: responseStatus,
                        code: responseData?.code
                    };
                    throw error;
                }
                
                // Check if response has an error field even with 200 status
                if (responseData?.error && !responseData?.recipes) {
                    const error: ApiError = {
                        message: responseData.error,
                        status: responseStatus,
                        code: responseData.code
                    };
                    throw error;
                }

                return responseData;
            } catch (error: any) {
                // Handle timeout
                if (timeoutController?.signal.aborted || error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                
                // Handle network errors
                if (!error.status && error.message !== 'Request timeout') {
                    throw new Error('Network error. Please check your connection.');
                }
                
                throw error;
            }
        };

        try {
            // Retry logic (unless explicitly skipped)
            if (options?.skipRetry) {
                return await makeRequest();
            }
            return await this.retryWithBackoff(makeRequest);
        } catch (error: any) {
            // Sanitize URL in logs (don't expose full endpoint structure)
            const sanitizedUrl = isAbsolute 
                ? endpoint.split('?')[0] // Remove query params
                : endpoint; // Relative paths are OK
            
            logger.error(`API POST failed for ${sanitizedUrl}`, {
                status: error.status,
                code: error.code,
                message: error.message
            });
            throw error;
        }
    }
}

export const api = new ApiClient();
