import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sanitizeInput, validateLength, checkRateLimit, getUserId } from "../_shared/security.ts";

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Production: Use CORS_ORIGINS env var
  // Development: Allow localhost and local network IPs
  const envOrigins = Deno.env.get('CORS_ORIGINS');
  
  if (envOrigins) {
    // Production mode - strict origin checking
    const allowedOrigins = envOrigins.split(',').map(o => o.trim());
    const isAllowed = origin && allowedOrigins.some(allowed => 
      origin === allowed || (allowed.includes('*') && origin.endsWith(allowed.replace('*', '')))
    );
    return {
      'Access-Control-Allow-Origin': isAllowed ? origin! : allowedOrigins[0],
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  // Development mode - allow localhost, local network IPs, and tunnel services
  const isDevOrigin = origin && (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.match(/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.169\.)/) ||
    origin.startsWith('capacitor://') ||
    origin.endsWith('.trycloudflare.com') ||
    origin.endsWith('.loca.lt') ||
    origin.endsWith('.ngrok-free.app') ||
    origin.endsWith('.ngrok.io')
  );
  
  return {
    'Access-Control-Allow-Origin': isDevOrigin ? origin! : 'http://localhost:3000',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const userId = getUserId(req);
    const rateLimit = checkRateLimit(userId, 30); // 30 requests per minute for thumbnails
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again in a minute.',
        code: 'RATE_LIMIT_EXCEEDED'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
        status: 429,
      });
    }

    const { title, description } = await req.json();
    
    // Input validation and sanitization
    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    const sanitizedTitle = sanitizeInput(title, 200);
    const sanitizedDescription = description ? sanitizeInput(description, 500) : '';
    
    if (!validateLength(sanitizedTitle, 1, 200)) {
      return new Response(JSON.stringify({ error: 'Invalid title length' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // ========== RUNWARE IMAGE GENERATION ==========
    const apiKey = Deno.env.get('RUNWARE_API_KEY');
    if (!apiKey) throw new Error('RUNWARE_API_KEY is not set');

    // Craft a detailed food photography prompt
    const prompt = `Professional food photography of ${sanitizedTitle}. ${sanitizedDescription}. Vibrant saturated colors, soft natural window lighting, appetizing and fresh looking, modern Instagram aesthetic, high-end presentation, garnished beautifully, 4K quality, food magazine cover shot. Slightly zoomed out to have an aesthetic background`;

    const negativePrompt = 'text, watermark, logo, words, letters, low quality, blurry, distorted, oversaturated, artificial looking, plastic, cartoon, illustration, drawing, painting, sketch, anime, 3d render, cgi';

    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify([
        {
          taskType: 'imageInference',
          taskUUID: crypto.randomUUID(),
          positivePrompt: prompt,
          negativePrompt: negativePrompt,
          height: 576,
          width: 1024,
          model: 'runware:111@1', // User's preferred model
          steps: 25,
          CFGScale: 7.5,
          numberResults: 1,
          outputFormat: 'WEBP',
          includeCost: false,
        }
      ]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Runware API error:', response.status, errorText);
      throw new Error(`Runware API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Runware returns an array of results
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.error('Runware response missing data:', JSON.stringify(data));
      throw new Error('No image data in response');
    }

    // Find the image inference result
    const imageResult = data.data.find((item: any) => item.taskType === 'imageInference');
    
    if (!imageResult || !imageResult.imageURL) {
      console.error('No image URL in Runware response:', JSON.stringify(data));
      throw new Error('No image URL in response');
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageResult.imageURL);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch generated image');
    }
    
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = btoa(
      new Uint8Array(imageArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    return new Response(JSON.stringify({ 
      image: imageBase64 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('Thumbnail Generation Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate thumbnail. Please try again.',
      code: 'GENERATION_ERROR'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
