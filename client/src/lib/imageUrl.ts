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

/**
 * Get device-appropriate image dimensions based on screen size
 * Returns object with width, height, and srcset for responsive images
 */
export interface ResponsiveImageProps {
  src: string;
  alt: string;
  aspectRatio?: 'square' | '16/9' | '4/3' | '1/1';
  sizes?: 'thumbnail' | 'small' | 'medium' | 'large';
  className?: string;
  priority?: boolean;
}

/**
 * Generate responsive image dimensions for different devices
 * Size presets: thumbnail (48-96px), small (96-192px), medium (192-300px), large (300+px)
 */
export function getResponsiveImageDimensions(size: string = 'medium'): {
  mobile: { width: number; height: number };
  tablet: { width: number; height: number };
  desktop: { width: number; height: number };
} {
  const dimensions = {
    thumbnail: {
      mobile: { width: 48, height: 48 },
      tablet: { width: 64, height: 64 },
      desktop: { width: 96, height: 96 },
    },
    small: {
      mobile: { width: 96, height: 96 },
      tablet: { width: 128, height: 128 },
      desktop: { width: 192, height: 192 },
    },
    medium: {
      mobile: { width: 160, height: 160 },
      tablet: { width: 240, height: 240 },
      desktop: { width: 300, height: 300 },
    },
    large: {
      mobile: { width: 200, height: 200 },
      tablet: { width: 300, height: 300 },
      desktop: { width: 400, height: 400 },
    },
  };

  return dimensions[size as keyof typeof dimensions] || dimensions.medium;
}

/**
 * Generate srcset string for responsive images
 * Handles different device pixel ratios (1x, 2x, 3x)
 */
export function generateImageSrcSet(baseUrl: string, widths: number[] = [192, 384, 768, 1024]): string {
  return widths
    .map((width) => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Get CSS classes for responsive image sizing
 * Ensures images don't distort and fit properly on all devices
 */
export function getResponsiveImageClasses(aspectRatio: string = '1/1'): string {
  const aspectRatioClasses: Record<string, string> = {
    'square': 'aspect-square',
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
  };

  return `
    w-full h-auto object-cover object-center
    ${aspectRatioClasses[aspectRatio] || 'aspect-square'}
    rounded-lg
  `;
}

/**
 * Get device-aware image width for specific use cases
 * Prevents image distortion by matching display size
 */
export function getDeviceImageWidth(): {
  mobile: number;
  tablet: number;
  desktop: number;
  current: number;
} {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  const isTablet = typeof window !== 'undefined' ? window.innerWidth >= 640 && window.innerWidth < 1024 : false;
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;

  let current = 1024;
  if (isMobile) current = 360;
  else if (isTablet) current = 768;
  else if (isDesktop) current = 1280;

  return {
    mobile: 360,
    tablet: 768,
    desktop: 1280,
    current,
  };
}

/**
 * Optimize image URL with query parameters for device
 * Supports width, height, quality optimization
 */
export function optimizeImageUrl(
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number; // 0-100
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const absoluteUrl = getImageUrl(imageUrl);
  
  // Only add query params if it's a custom backend that supports them
  // For uploaded images from /uploads, return as-is
  if (!absoluteUrl.includes('/uploads/')) {
    const params = new URLSearchParams();
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());
    if (options.format) params.append('f', options.format);
    
    const separator = absoluteUrl.includes('?') ? '&' : '?';
    return params.toString() ? `${absoluteUrl}${separator}${params.toString()}` : absoluteUrl;
  }
  
  return absoluteUrl;
}
