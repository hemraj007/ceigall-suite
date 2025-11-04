import { Tender, TenderFilterParams } from '@/lib/types/tenderiq';

/**
 * Filter tenders based on multiple criteria
 * @param tenders - Array of tenders to filter
 * @param params - Filter parameters
 * @returns Filtered array of tenders
 */
/**
 * Filter tenders based on multiple criteria
 * @param tenders - Array of tenders to filter
 * @param params - Filter parameters
 * @returns Filtered array of tenders
 */
export const filterTenders = (
  tenders: Tender[],
  params: TenderFilterParams
): Tender[] => {
  return tenders.filter(tender => {
    // Search filter
    if (params.searchTerm) {
      const search = params.searchTerm.toLowerCase();
      const matchesSearch =
        tender.title.toLowerCase().includes(search) ||
        tender.authority.toLowerCase().includes(search) ||
        tender.category.toLowerCase().includes(search);

      if (!matchesSearch) return false;
    }

    // Category filter
    if (params.category && params.category !== "all") {
      if (tender.category !== params.category) return false;
    }

    // Location filter
    if (params.location && params.location !== "all") {
      if (!tender.location.includes(params.location)) return false;
    }

    // Value range filter
    if (params.minValue !== undefined && params.minValue !== null) {
      if (tender.value < params.minValue) return false;
    }
    if (params.maxValue !== undefined && params.maxValue !== null) {
      if (tender.value > params.maxValue) return false;
    }

    return true;
  });
};

/**
 * Filter tenders by category (query_name)
 * @param tenders - Array of tenders to filter
 * @param category - Category/query_name to filter by
 * @returns Filtered tenders matching the category
 */
export const filterTendersByCategory = (tenders: Tender[], category: string): Tender[] => {
  if (category === "all" || !category) {
    return tenders;
  }
  return tenders.filter(tender => tender.category === category);
};

/**
 * Get all available categories from tenders
 * @param tenders - Array of tenders
 * @returns Array of unique categories
 */
export const getAvailableCategories = (tenders: Tender[]): string[] => {
  const categories = new Set(tenders.map(t => t.category));
  return Array.from(categories).sort();
};

/**
 * Get all available locations from tenders
 * @param tenders - Array of tenders
 * @returns Array of unique locations
 */
export const getAvailableLocations = (tenders: Tender[]): string[] => {
  const locations = new Set(tenders.map(t => t.location).filter(loc => loc && loc !== 'N/A'));
  return Array.from(locations).sort();
};

/**
 * Group tenders by category
 * @param tenders - Array of tenders to group
 * @returns Object with categories as keys and tender arrays as values
 */
export const groupTendersByCategory = (
  tenders: Tender[]
): Record<string, Tender[]> => {
  const grouped: Record<string, Tender[]> = {};
  tenders.forEach(tender => {
    if (!grouped[tender.category]) {
      grouped[tender.category] = [];
    }
    grouped[tender.category].push(tender);
  });
  return grouped;
};

/**
 * Auto-select the first "Civil" category from available categories
 * @param tenders - Array of tenders
 * @returns Selected category or "all"
 */
export const getDefaultCategory = (tenders: Tender[]): string => {
  const categories = new Set(tenders.map(t => t.category));
  for (const cat of categories) {
    if (cat.includes("Civil")) {
      return cat;
    }
  }
  return "all";
};
