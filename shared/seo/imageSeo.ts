/**
 * Image SEO Utility for RotiHai
 *
 * Generates SEO-optimized alt text, title attributes, and loading strategies
 * for entity images. Pure functions — no side effects, no async.
 */

import { EntityType } from './generateSeoMetadata';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ImageSeoData {
  entityName: string;
  categoryName?: string;
  chefName?: string;
  areaName?: string;
}

export interface ImageAttributes {
  alt: string;
  title: string;
  loading: 'eager' | 'lazy';
  width?: number;
  height?: number;
}

// ─── Alt Text Generator ──────────────────────────────────────────────────────

/**
 * Generates SEO-optimized alt text for entity images.
 *
 * Formats:
 * - product: "{product_name} - {category_name} by {chef_name} | RotiHai"
 * - chef: "{chef_name} - Home Chef in {area} | RotiHai"
 * - category: "{category_name} - Food Menu | RotiHai"
 * - others: "{entity_name} | RotiHai"
 */
export function generateImageAlt(entityType: EntityType, data: ImageSeoData): string {
  switch (entityType) {
    case 'product': {
      const parts = [data.entityName];
      if (data.categoryName) {
        parts.push(`- ${data.categoryName}`);
      }
      if (data.chefName) {
        parts.push(`by ${data.chefName}`);
      }
      return `${parts.join(' ')} | RotiHai`;
    }
    case 'chef': {
      const area = data.areaName || 'Mumbai';
      return `${data.entityName} - Home Chef in ${area} | RotiHai`;
    }
    case 'category': {
      return `${data.entityName} - Food Menu | RotiHai`;
    }
    default:
      return `${data.entityName} | RotiHai`;
  }
}

// ─── Title Generator ─────────────────────────────────────────────────────────

/**
 * Generates a concise image title attribute.
 * Returns the entity name directly (shorter than alt text).
 */
export function generateImageTitle(entityType: EntityType, data: ImageSeoData): string {
  return data.entityName;
}

// ─── Image Attributes ────────────────────────────────────────────────────────

/**
 * Returns complete image attributes including alt, title, loading strategy,
 * and optional dimensions.
 *
 * - above-fold: loading='eager' (render immediately)
 * - below-fold: loading='lazy' (defer until near viewport)
 *
 * Width/height are undefined in Phase 1 — will be added when image
 * processing is implemented in Phase 2.
 */
export function getImageAttributes(
  entityType: EntityType,
  data: ImageSeoData,
  position: 'above-fold' | 'below-fold'
): ImageAttributes {
  return {
    alt: generateImageAlt(entityType, data),
    title: generateImageTitle(entityType, data),
    loading: position === 'above-fold' ? 'eager' : 'lazy',
    width: undefined,
    height: undefined,
  };
}
