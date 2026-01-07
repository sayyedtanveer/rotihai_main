/**
 * Image URL utility for constructing proper image URLs
 * Ensures images load from the correct backend server
 * 
 * Development: http://localhost:5000/uploads/filename.jpg
 * Production: https://rotihai-backend.onrender.com/uploads/filename.jpg
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Convert relative image URL to absolute URL
 * 
 * @param imageUrl - Can be:
 *   - Relative path: "/uploads/filename.jpg"
 *   - Absolute URL: "https://example.com/image.jpg"
 *   - Relative HTTP: "http://localhost/image.jpg"
 * @returns Absolute URL to image
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/placeholder-image.svg'; // Fallback placeholder
  }

  // If already an absolute URL (http:// or https://), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If relative path like /uploads/filename.jpg
  if (imageUrl.startsWith('/uploads/')) {
    // In development: Use localhost
    // In production: Use backend URL from .env.production
    if (API_BASE_URL) {
      return `${API_BASE_URL}${imageUrl}`;
    }
    // Fallback to relative path (for development with proxy)
    return imageUrl;
  }

  // If relative path like uploads/filename.jpg (without leading slash)
  if (imageUrl.startsWith('uploads/')) {
    const fullPath = `/${imageUrl}`;
    if (API_BASE_URL) {
      return `${API_BASE_URL}${fullPath}`;
    }
    return fullPath;
  }

  // Default: treat as relative path from API
  if (API_BASE_URL) {
    return `${API_BASE_URL}/${imageUrl}`;
  }
  return `/${imageUrl}`;
}

/**
 * Get placeholder image URL for error fallback
 */
export function getPlaceholderImageUrl(): string {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e0e0e0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle" dy=".3em"%3EImage Not Found%3C/text%3E%3C/svg%3E';
}

/**
 * Handle image load error - use placeholder
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (!img.src.includes('placeholder')) {
    img.src = getPlaceholderImageUrl();
  }
}
