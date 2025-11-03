import { API_BASE_URL } from '@/lib/config/api';
import { Tender } from '@/lib/types/tenderiq';

interface TenderApiResponse {
  id: string;
  run_at: string;
  date_str: string;
  name: string;
  contact: string;
  no_of_new_tenders: string;
  company: string;
  queries: {
    id: string;
    query_name: string;
    number_of_tenders: string;
    tenders: {
      id: string;
      tender_id_str: string;
      tender_name: string;
      tender_url: string;
      drive_url: string;
      city: string;
      summary: string;
      value: string;
      due_date: string;
      tdr: string;
      tendering_authority: string;
      tender_no: string;
      [key: string]: any;
    }[];
  }[];
}

// Transform API response to frontend format
const transformTender = (apiTender: any, category: string, index: number): Tender => {
  console.log('Transforming tender:', { apiTender, category });
  
  return {
    id: index,
    organization: apiTender.tendering_authority || apiTender.tender_name || 'Unknown',
    tdrNumber: apiTender.tdr || apiTender.tender_id_str || 'N/A',
    description: apiTender.summary || apiTender.tender_brief || apiTender.tender_details || 'No description',
    tenderValue: apiTender.value || apiTender.tender_value || 'Ref Document',
    dueDate: apiTender.due_date ? apiTender.due_date.trim() : 'N/A',
    location: apiTender.city || apiTender.state || 'N/A',
    category: category.trim(),
    scrapedDate: new Date().toISOString().split('T')[0],
    driveUrl: apiTender.drive_url || apiTender.tender_url || undefined,
  };
};

export const fetchDailyTenders = async (): Promise<Tender[]> => {
  console.log('Fetching daily tenders from:', `${API_BASE_URL}/tenderiq/dailytenders`);

  const token = localStorage.getItem('token');
  console.log('Auth token present:', !!token);

  try {
    const response = await fetch(`${API_BASE_URL}/tenderiq/dailytenders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to fetch daily tenders: ${response.status} ${errorText}`);
    }

    const data: TenderApiResponse = await response.json();
    console.log('Raw API response:', data);

    // Extract all tenders from all queries
    const allTenders: Tender[] = [];
    let tenderIndex = 1;

    if (data.queries && Array.isArray(data.queries)) {
      data.queries.forEach(query => {
        const category = query.query_name || 'Uncategorized';
        console.log(`Processing category: ${category}, tenders count: ${query.tenders?.length || 0}`);

        if (query.tenders && Array.isArray(query.tenders)) {
          query.tenders.forEach(tender => {
            allTenders.push(transformTender(tender, category, tenderIndex++));
          });
        }
      });
    }

    console.log('Transformed tenders count:', allTenders.length);
    console.log('Sample transformed tender:', allTenders[0]);

    return allTenders;
  } catch (error) {
    console.error('Error in fetchDailyTenders:', error);
    throw error;
  }
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
