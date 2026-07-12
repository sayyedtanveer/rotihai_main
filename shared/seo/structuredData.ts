/**
 * Structured Data Builders for RotiHai SEO
 *
 * Generates valid schema.org JSON-LD for different entity types.
 * All schemas include @context and @type, and are validated via JSON.stringify.
 */

import {
  ProductEntityData,
  ChefEntityData,
  CategoryEntityData,
  SubscriptionPlanEntityData,
  JsonLdSchema,
} from './generateSeoMetadata';

// ─── Constants ────────────────────────────────────────────────────────────────

const SCHEMA_CONTEXT = 'https://schema.org';
const DOMAIN = 'https://rotihai.com';
const BRAND_NAME = 'RotiHai';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely validates a JSON-LD schema. If serialization fails,
 * returns a minimal object with just @context and @type.
 */
function safeJsonLd(schema: JsonLdSchema): JsonLdSchema {
  try {
    JSON.stringify(schema);
    return schema;
  } catch {
    return {
      '@context': SCHEMA_CONTEXT,
      '@type': (schema['@type'] as string) || 'Thing',
    };
  }
}

// ─── Builders ─────────────────────────────────────────────────────────────────

/**
 * Builds JSON-LD Product schema for a menu item.
 * Includes offers with price, conditional aggregateRating, and optional discount.
 */
export function buildProductSchema(product: ProductEntityData): JsonLdSchema {
  const schema: JsonLdSchema = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || `${DOMAIN}/icon-512.png`,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      ...(product.offerPercentage > 0
        ? {
            highPrice: Math.round(
              product.price / (1 - product.offerPercentage / 100)
            ).toString(),
          }
        : {}),
    },
  };

  if (product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return safeJsonLd(schema);
}

/**
 * Builds JSON-LD Restaurant schema for a home chef.
 * Includes geo coordinates, address, conditional aggregateRating, and FSSAI identifier.
 */
export function buildChefSchema(chef: ChefEntityData): JsonLdSchema {
  const schema: JsonLdSchema = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Restaurant',
    name: chef.name,
    description: chef.description,
    image: chef.image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mumbai',
      addressRegion: 'Maharashtra',
      addressCountry: 'IN',
      streetAddress: chef.address || '',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: chef.latitude,
      longitude: chef.longitude,
    },
  };

  if (chef.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: chef.rating,
      reviewCount: chef.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  if (chef.isVerified && chef.fssaiNumber) {
    schema.identifier = chef.fssaiNumber;
  }

  return safeJsonLd(schema);
}

/**
 * Builds JSON-LD BreadcrumbList schema for a category page.
 * Home > Category structure.
 */
export function buildCategoryBreadcrumb(category: CategoryEntityData): JsonLdSchema {
  const schema: JsonLdSchema = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${DOMAIN}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: `${DOMAIN}/category/${category.id}`,
      },
    ],
  };

  return safeJsonLd(schema);
}

/**
 * Builds JSON-LD Product schema for a subscription plan.
 * Includes subscription frequency in the category field.
 */
export function buildSubscriptionSchema(plan: SubscriptionPlanEntityData): JsonLdSchema {
  const schema: JsonLdSchema = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Product',
    name: plan.name,
    description: plan.description,
    category: `${plan.frequency} subscription`,
    offers: {
      '@type': 'Offer',
      price: plan.price.toString(),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
  };

  return safeJsonLd(schema);
}

/**
 * Builds JSON-LD AggregateRating schema.
 * Returns null if reviewCount === 0 (NEVER fabricate ratings).
 */
export function buildAggregateRatingSchema(
  name: string,
  rating: string,
  reviewCount: number
): JsonLdSchema | null {
  if (reviewCount === 0) {
    return null;
  }

  const schema: JsonLdSchema = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'AggregateRating',
    itemReviewed: {
      '@type': 'Thing',
      name,
    },
    ratingValue: rating,
    reviewCount,
    bestRating: '5',
    worstRating: '1',
  };

  return safeJsonLd(schema);
}

/**
 * Builds JSON-LD FoodEstablishment schema for the homepage.
 * Contains brand info, contact, cuisine types, and price range.
 */
export function buildHomepageSchema(): JsonLdSchema {
  const schema: JsonLdSchema = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'FoodEstablishment',
    name: BRAND_NAME,
    url: DOMAIN,
    logo: `${DOMAIN}/icon-512.png`,
    telephone: '+918169020290',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Kurla West',
      addressLocality: 'Mumbai',
      addressRegion: 'Maharashtra',
      postalCode: '400070',
      addressCountry: 'IN',
    },
    servesCuisine: ['Indian', 'North Indian', 'Homemade Food'],
    priceRange: '₹50-₹300',
  };

  return safeJsonLd(schema);
}

/**
 * Builds JSON-LD WebSite schema with SearchAction.
 * Used alongside homepage schema for site-level structured data.
 */
export function buildWebsiteSchema(): JsonLdSchema {
  const schema: JsonLdSchema = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebSite',
    name: BRAND_NAME,
    url: DOMAIN,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${DOMAIN}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return safeJsonLd(schema);
}
