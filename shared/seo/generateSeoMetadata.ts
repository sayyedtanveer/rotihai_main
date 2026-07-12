/**
 * Unified SEO Metadata Generator for RotiHai
 *
 * Pure function that accepts an entity type and entity data,
 * and returns complete SEO metadata. No network requests, no side effects.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMAIN = 'https://rotihai.com';
const SITE_NAME = 'RotiHai';
const DEFAULT_OG_IMAGE = `${DOMAIN}/icon-512.png`;
const DEFAULT_LOCALE = 'en_IN';
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;

// ─── Types & Interfaces ──────────────────────────────────────────────────────

export type EntityType =
  | 'product'
  | 'chef'
  | 'category'
  | 'subscriptionPlan'
  | 'homepage'
  | 'staticPage';

export interface OpenGraphTags {
  'og:title': string;
  'og:description': string;
  'og:image': string;
  'og:url': string;
  'og:type': string;
  'og:site_name': string;
  'og:locale': string;
  'og:image:width'?: string;
  'og:image:height'?: string;
}

export interface TwitterCardTags {
  'twitter:card': string;
  'twitter:title': string;
  'twitter:description': string;
  'twitter:image': string;
}

export type JsonLdSchema = Record<string, unknown>;

export interface SeoMetadata {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  og: OpenGraphTags;
  twitter: TwitterCardTags;
  jsonLd: JsonLdSchema[];
}

// ─── Entity Data Interfaces ──────────────────────────────────────────────────

export interface ProductEntityData {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  rating: string;
  reviewCount: number;
  isVeg: boolean;
  offerPercentage: number;
  categoryId: string;
  categoryName: string;
  chefId: string;
  chefName: string;
}

export interface ChefEntityData {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: string;
  reviewCount: number;
  address: string | null;
  addressArea: string | null;
  latitude: number;
  longitude: number;
  isVerified: boolean;
  fssaiNumber: string | null;
}

export interface CategoryEntityData {
  id: string;
  name: string;
  description: string;
  image: string;
  itemCount: string;
}

export interface SubscriptionPlanEntityData {
  id: string;
  name: string;
  description: string;
  price: number;
  frequency: string;
  deliveryDays: string[];
  categoryId: string;
}

export interface HomepageData {}

export interface StaticPageData {
  title: string;
  description: string;
  path: string;
}

export type EntityData =
  | ProductEntityData
  | ChefEntityData
  | CategoryEntityData
  | SubscriptionPlanEntityData
  | HomepageData
  | StaticPageData;

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Truncates a string at a word boundary with "..." suffix.
 * If the string fits within max, returns it unchanged.
 */
export function truncate(str: string, max: number): string {
  if (!str) return '';
  if (str.length <= max) return str;

  // Leave room for "..."
  const truncatedMax = max - 3;
  if (truncatedMax <= 0) return str.slice(0, max);

  const truncated = str.slice(0, truncatedMax);
  // Find last space for word boundary
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + '...';
  }
  // No space found - just hard truncate
  return truncated + '...';
}

// ─── Title Generators ────────────────────────────────────────────────────────

function generateProductTitle(data: ProductEntityData): string {
  const raw = `${data.name} - ₹${data.price} | ${data.chefName} | RotiHai`;
  return truncate(raw, MAX_TITLE_LENGTH);
}

function generateChefTitle(data: ChefEntityData): string {
  const area = data.addressArea || 'Mumbai';
  const raw = `${data.name} - Home Chef in ${area} | RotiHai`;
  return truncate(raw, MAX_TITLE_LENGTH);
}

function generateCategoryTitle(data: CategoryEntityData): string {
  const raw = `${data.name} - Order Online | RotiHai Mumbai`;
  return truncate(raw, MAX_TITLE_LENGTH);
}

function generateSubscriptionTitle(data: SubscriptionPlanEntityData): string {
  const raw = `${data.name} - ₹${data.price}/${data.frequency} | RotiHai Mumbai`;
  return truncate(raw, MAX_TITLE_LENGTH);
}

function generateHomepageTitle(): string {
  return 'Fresh Homemade Food Delivery | RotiHai Mumbai';
}

function generateStaticPageTitle(data: StaticPageData): string {
  const raw = `${data.title} | RotiHai`;
  return truncate(raw, MAX_TITLE_LENGTH);
}

// ─── Description Generators ──────────────────────────────────────────────────

function generateProductDescription(data: ProductEntityData): string {
  const vegLabel = data.isVeg ? 'Veg' : 'Non-Veg';
  const raw = `Order ${data.name} (${vegLabel}) at ₹${data.price} from ${data.chefName}. ${data.categoryName} category. Fresh homemade food delivered to your doorstep in Mumbai.`;
  return truncate(raw, MAX_DESCRIPTION_LENGTH);
}

function generateChefDescription(data: ChefEntityData): string {
  const area = data.addressArea || 'Mumbai';
  const raw = `${data.name} - Home Chef in ${area}. Rating: ${data.rating}/5 (${data.reviewCount} reviews). Order fresh homemade food online on RotiHai.`;
  return truncate(raw, MAX_DESCRIPTION_LENGTH);
}

function generateCategoryDescription(data: CategoryEntityData): string {
  const raw = `Browse ${data.name} - ${data.itemCount} items available. Order online from home chefs in Mumbai. Fast delivery by RotiHai.`;
  return truncate(raw, MAX_DESCRIPTION_LENGTH);
}

function generateSubscriptionDescription(data: SubscriptionPlanEntityData): string {
  const days = data.deliveryDays.join(', ');
  const raw = `${data.name} meal subscription at ₹${data.price}/${data.frequency}. Delivery on ${days}. Subscribe for fresh homemade meals on RotiHai Mumbai.`;
  return truncate(raw, MAX_DESCRIPTION_LENGTH);
}

function generateHomepageDescription(): string {
  return 'Order fresh homemade food from local home chefs in Mumbai. Daily meals, rotis, tiffins & more delivered to your doorstep. RotiHai - Ghar Ka Khana.';
}

function generateStaticPageDescription(data: StaticPageData): string {
  return truncate(data.description, MAX_DESCRIPTION_LENGTH);
}

// ─── Canonical URL Generator ─────────────────────────────────────────────────

function generateCanonical(entityType: EntityType, data: EntityData): string {
  switch (entityType) {
    case 'product':
      return `${DOMAIN}/product/${(data as ProductEntityData).id}`;
    case 'chef':
      return `${DOMAIN}/chef/${(data as ChefEntityData).id}`;
    case 'category':
      return `${DOMAIN}/category/${(data as CategoryEntityData).id}`;
    case 'subscriptionPlan':
      return `${DOMAIN}/subscription/${(data as SubscriptionPlanEntityData).id}`;
    case 'homepage':
      return `${DOMAIN}/`;
    case 'staticPage':
      return `${DOMAIN}${(data as StaticPageData).path}`;
    default:
      return `${DOMAIN}/`;
  }
}

// ─── OG Image Resolver ───────────────────────────────────────────────────────

function resolveOgImage(entityType: EntityType, data: EntityData): string {
  switch (entityType) {
    case 'product': {
      const productData = data as ProductEntityData;
      return productData.image || DEFAULT_OG_IMAGE;
    }
    case 'chef':
      return (data as ChefEntityData).image || DEFAULT_OG_IMAGE;
    case 'category':
      return (data as CategoryEntityData).image || DEFAULT_OG_IMAGE;
    default:
      return DEFAULT_OG_IMAGE;
  }
}

// ─── OG Type Resolver ────────────────────────────────────────────────────────

function resolveOgType(entityType: EntityType): string {
  if (entityType === 'product') return 'product';
  return 'website';
}

// ─── Robots Directive ────────────────────────────────────────────────────────

function getRobotsDirective(entityType: EntityType): string {
  // All public entity pages should be indexed
  return 'index, follow';
}

// ─── Main Generator Function ─────────────────────────────────────────────────

/**
 * Generates complete SEO metadata for a given entity type and data.
 * Pure function — no network requests, no side effects.
 */
export function generateSeoMetadata(entityType: EntityType, data: EntityData): SeoMetadata {
  let title: string;
  let description: string;

  switch (entityType) {
    case 'product':
      title = generateProductTitle(data as ProductEntityData);
      description = generateProductDescription(data as ProductEntityData);
      break;
    case 'chef':
      title = generateChefTitle(data as ChefEntityData);
      description = generateChefDescription(data as ChefEntityData);
      break;
    case 'category':
      title = generateCategoryTitle(data as CategoryEntityData);
      description = generateCategoryDescription(data as CategoryEntityData);
      break;
    case 'subscriptionPlan':
      title = generateSubscriptionTitle(data as SubscriptionPlanEntityData);
      description = generateSubscriptionDescription(data as SubscriptionPlanEntityData);
      break;
    case 'homepage':
      title = generateHomepageTitle();
      description = generateHomepageDescription();
      break;
    case 'staticPage':
      title = generateStaticPageTitle(data as StaticPageData);
      description = generateStaticPageDescription(data as StaticPageData);
      break;
    default:
      title = `RotiHai - Fresh Homemade Food Delivery`;
      description = 'Order fresh homemade food from local home chefs in Mumbai.';
  }

  const canonical = generateCanonical(entityType, data);
  const robots = getRobotsDirective(entityType);
  const ogImage = resolveOgImage(entityType, data);

  const og: OpenGraphTags = {
    'og:title': title,
    'og:description': description,
    'og:image': ogImage,
    'og:url': canonical,
    'og:type': resolveOgType(entityType),
    'og:site_name': SITE_NAME,
    'og:locale': DEFAULT_LOCALE,
  };

  const twitter: TwitterCardTags = {
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': ogImage,
  };

  // JSON-LD: return empty array for now — structured data builders (task 4.1) will be integrated later
  const jsonLd: JsonLdSchema[] = [];

  return {
    title,
    description,
    canonical,
    robots,
    og,
    twitter,
    jsonLd,
  };
}
