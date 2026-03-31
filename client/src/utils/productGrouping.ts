import type { Product } from "@shared/schema";

/**
 * ProductGroup interface for organized menu display
 * Groups products by section with maintained ordering
 */
export interface ProductGroup {
  section: string;
  sectionOrder: number;
  products: Product[];
}

/**
 * Groups products by section with stable sorting
 * 
 * Sorting Priority:
 * 1. sectionOrder (0, 10, 20, ...)
 * 2. sortOrder within section (0, 1, 2, ...)
 * 3. Product name alphabetically (fallback for stability)
 * 
 * @param products - Array of products to group
 * @returns Array of ProductGroups sorted by sectionOrder
 * 
 * @example
 * const products = [
 *   { id: "p1", name: "Aloo Frankie", section: "Aloo & Noodle", sectionOrder: 0, sortOrder: 0 },
 *   { id: "p2", name: "Mayo Special", section: "Mayo Specials", sectionOrder: 10, sortOrder: 0 },
 *   { id: "p3", name: "Old Product", section: null, sectionOrder: 0, sortOrder: 0 }
 * ];
 * 
 * const groups = groupProductsBySection(products);
 * // Result:
 * // [
 * //   { section: "Aloo & Noodle", sectionOrder: 0, products: [p1] },
 * //   { section: "Mayo Specials", sectionOrder: 10, products: [p2] },
 * //   { section: "Others", sectionOrder: 999, products: [p3] }
 * // ]
 */
export function groupProductsBySection(products: Product[]): ProductGroup[] {
  if (!products || products.length === 0) {
    return [];
  }

  // STEP 1: Assign "Others" section to products with NULL section
  const withDefaults = products.map((p) => ({
    ...p,
    section: p.section || "Others",
    sectionOrder: p.section ? p.sectionOrder : 999, // "Others" always at end
  }));

  // STEP 2: Sort with stable 3-tier sorting
  // Tier 1: sectionOrder (primary)
  // Tier 2: sortOrder (secondary, within section)
  // Tier 3: product name (tertiary, fallback for stable UI)
  const sorted = withDefaults.sort((a, b) => {
    // Compare section order first
    const sectionCompare = a.sectionOrder - b.sectionOrder;
    if (sectionCompare !== 0) return sectionCompare;

    // Within same section, compare sort order
    const sortOrderCompare = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (sortOrderCompare !== 0) return sortOrderCompare;

    // If sort_order is equal/missing, fallback to alphabetical by name
    // This ensures stable, predictable ordering
    return a.name.localeCompare(b.name);
  });

  // STEP 3: Group products by section using Map
  const grouped = new Map<string, Product[]>();
  sorted.forEach((product) => {
    const section = product.section;
    if (!grouped.has(section)) {
      grouped.set(section, []);
    }
    grouped.get(section)!.push(product);
  });

  // STEP 4: Convert Map to array of ProductGroups
  // Maintains order because Map preserves insertion order
  return Array.from(grouped, ([section, groupProducts]) => ({
    section,
    sectionOrder: groupProducts[0]?.sectionOrder ?? 999,
    products: groupProducts,
  }));
}

/**
 * Get all unique sections from products
 * Useful for admin interfaces or debugging
 * 
 * @param products - Array of products
 * @returns Array of unique section names
 */
export function getUniqueSections(products: Product[]): string[] {
  const sections = new Set<string>();
  products.forEach((p) => {
    sections.add(p.section || "Others");
  });
  return Array.from(sections).sort();
}

/**
 * Get products count by section
 * Useful for UI statistics or admin dashboards
 * 
 * @param products - Array of products
 * @returns Object with section name as key and product count as value
 * 
 * @example
 * const counts = getProductCountBySection(products);
 * // { "Aloo & Noodle": 4, "Mayo Specials": 3, "Others": 1 }
 */
export function getProductCountBySection(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};

  products.forEach((p) => {
    const section = p.section || "Others";
    counts[section] = (counts[section] ?? 0) + 1;
  });

  return counts;
}
