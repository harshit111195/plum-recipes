
/**
 * Compresses and converts an image to WebP format.
 * @param base64Str Base64 string (with or without data URI prefix)
 * @param maxWidth Max width to resize to (default 1024)
 * @param quality Quality from 0 to 1 (default 0.7)
 */
export const compressBase64Image = (base64Str: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        // Ensure we have a valid data URI
        if (!base64Str.startsWith('data:')) {
            img.src = `data:image/png;base64,${base64Str}`;
        } else {
            img.src = base64Str;
        }

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Resize if needed
            if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = height * ratio;
            }

            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) { 
                // Fallback to original if canvas fails
                resolve(img.src); 
                return; 
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Export as WebP
            // Note: toDataURL returns "data:image/webp;base64,..."
            resolve(canvas.toDataURL('image/webp', quality));
        };

        img.onerror = (e) => {
            console.error("Image compression failed - cannot convert to WebP", e);
            // Try to extract base64 and create a minimal WebP canvas as last resort
            // If that fails, return original but log warning - upload function will handle it
            const fallback = base64Str.startsWith('data:') ? base64Str : `data:image/png;base64,${base64Str}`;
            console.warn("Returning original format - upload function should handle WebP conversion", fallback.substring(0, 50));
            resolve(fallback);
        };
    });
};
