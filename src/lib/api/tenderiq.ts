import { API_BASE_URL } from '@/lib/config/api';
import { getAuthHeaders } from '@/lib/api/authHelper';
import { Document, Tender, TenderDetailsType, TenderDocument, ScrapedTenderFile, ScrapedTender, TenderApiResponse, AvailableDate, FilteredTendersResponse, TenderActionRequest } from '@/lib/types/tenderiq';

// Transform API response to frontend format
const transformTender = (apiTender: ScrapedTender, category: string): Tender => {
  console.log('Transforming tender:', { apiTender, category });
  
  return {
    id: apiTender.id,
    title: apiTender.tender_name,
    authority: apiTender.tendering_authority || 'Unknown',
    value: parseCurrency(apiTender.value || apiTender.tender_value) || 0,
    dueDate: apiTender.due_date ? apiTender.due_date.trim() : 'N/A',
    status: 'live',
    category: category.trim(),
    ePublishedDate: apiTender.publish_date || new Date().toISOString(),
    bidSecurity: 0, // Not in ScrapedTender
    emd: parseCurrency(apiTender.emd) || 0,
    location: apiTender.city || apiTender.state || 'N/A',
    progressPct: 0,
    documents: [], // Not in ScrapedTender
  };
};

const parseCurrency = (value: string | null | undefined): number | null => {
  if (!value || typeof value !== 'string' || value.toLowerCase().includes('ref document')) {
    return null;
  }
  // Remove currency symbols and commas
  const cleanedValue = value.replace(/₹/g, '').replace(/,/g, '').trim();
  const match = cleanedValue.match(/([\d.]+)\s*(cr|crore|lakh|l)/i);

  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'cr' || unit === 'crore') {
      return num * 10000000;
    }
    if (unit === 'lakh' || unit === 'l') {
      return num * 100000;
    }
  }
  
  const numOnly = parseFloat(cleanedValue);
  if (!isNaN(numOnly)) {
    return numOnly;
  }

  return null;
};

/**
 * Get the latest scraped date (extracted from last API response)
 * This is stored when fetchDailyTenders or fetchFilteredTenders is called
 */
let latestScrapedDate: { date: string; dateStr: string } | null = null;

export const getLatestScrapedDate = (): { date: string; dateStr: string } | null => {
  return latestScrapedDate;
};

/**
 * Fetch tenders for the latest scraped date (main source)
 * The /tenders endpoint returns latest date tenders by default when called without parameters
 * @returns Array of tenders for the latest date
 */
export const fetchDailyTenders = async (): Promise<Tender[]> => {
  console.log('Fetching daily tenders from latest scraped date');

  try {
    // Call /tenders without parameters - returns tenders for latest scraped date
    const response = await fetch(`${API_BASE_URL}/tenderiq/tenders`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to fetch daily tenders: ${response.status} ${errorText}`);
    }

    const data: TenderApiResponse = await response.json();
    console.log('Daily tenders API response:', data);

    // Store the latest scraped date from response
    if (data.date_str) {
      // Extract date from run_at timestamp
      const dateMatch = data.run_at.match(/(\d{4}-\d{2}-\d{2})/);
      const dateStr = dateMatch ? dateMatch[1] : data.date_str;
      latestScrapedDate = {
        date: dateStr,
        dateStr: data.date_str,
      };
      console.log('Latest scraped date:', latestScrapedDate);
    }

    // Extract and transform all tenders from queries
    const allTenders: Tender[] = [];

    if (data.queries && Array.isArray(data.queries)) {
      data.queries.forEach(query => {
        const category = query.query_name || 'Uncategorized';
        if (query.tenders && Array.isArray(query.tenders)) {
          query.tenders.forEach(tender => {
            allTenders.push(transformTender(tender, category));
          });
        }
      });
    }

    console.log('Transformed daily tenders count:', allTenders.length);
    return allTenders;
  } catch (error) {
    console.error('Error in fetchDailyTenders:', error);
    throw error;
  }
};


/**
 * Fetch available scrape dates from the backend
 * Used by date selector to show available dates with tender counts
 * @returns Array of available dates with metadata
 */
export const fetchAvailableDates = async (): Promise<AvailableDate[]> => {
  console.log('Fetching available dates from:', `${API_BASE_URL}/tenderiq/dates`);

  try {
    const response = await fetch(`${API_BASE_URL}/tenderiq/dates`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to fetch available dates: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Available dates response:', data);

    return data.dates || [];
  } catch (error) {
    console.error('Error in fetchAvailableDates:', error);
    throw error;
  }
};

/**
 * Fetch filtered tenders with date and other filters
 * Uses the /tenders endpoint which now returns the same format as /dailytenders
 * @param params - Filter parameters (date, date_range, include_all_dates, category, location, min_value, max_value)
 * @returns Filtered tenders response with transformed tenders
 */
export const fetchFilteredTenders = async (params: {
  date?: string;
  date_range?: 'last_1_day' | 'last_5_days' | 'last_7_days' | 'last_30_days';
  include_all_dates?: boolean;
  category?: string;
  location?: string;
  min_value?: number;
  max_value?: number;
}): Promise<FilteredTendersResponse> => {
  const queryParams = new URLSearchParams();

  if (params.date) queryParams.append('date', params.date);
  if (params.date_range) queryParams.append('date_range', params.date_range);
  if (params.include_all_dates) queryParams.append('include_all_dates', 'true');
  if (params.category) queryParams.append('category', params.category);
  if (params.location) queryParams.append('location', params.location);
  if (params.min_value) queryParams.append('min_value', params.min_value.toString());
  if (params.max_value) queryParams.append('max_value', params.max_value.toString());

  const url = `${API_BASE_URL}/tenderiq/tenders?${queryParams.toString()}`;
  console.log('Fetching filtered tenders from:', url);

  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to fetch filtered tenders: ${response.status} ${errorText}`);
    }

    const data: TenderApiResponse = await response.json();
    console.log('Filtered tenders API response:', data);

    // Extract and transform all tenders from queries (same format as dailytenders)
    const allTenders: Tender[] = [];

    if (data.queries && Array.isArray(data.queries)) {
      data.queries.forEach(query => {
        const category = query.query_name || 'Uncategorized';
        if (query.tenders && Array.isArray(query.tenders)) {
          query.tenders.forEach(tender => {
            allTenders.push(transformTender(tender, category));
          });
        }
      });
    }

    console.log('Transformed filtered tenders count:', allTenders.length);

    return {
      tenders: allTenders,
      total_count: allTenders.length,
      filtered_by: {},
      available_dates: [],
    };
  } catch (error) {
    console.error('Error in fetchFilteredTenders:', error);
    throw error;
  }
};

/**
 * Fetch tender details by ID
 * @param id - The ID of the tender to fetch
 * @returns The detailed tender information
 */
export const fetchTenderById = async (id: string): Promise<TenderDetailsType> => {
  console.log(`Fetching tender details for id: ${id}`);
  const url = `${API_BASE_URL}/tenderiq/tenders/${id}`;

  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to fetch tender details: ${response.status} ${errorText}`);
    }

    const data: ScrapedTender = await response.json();
    console.log('Tender details API response:', data);
    
    // Transform the backend response to the frontend TenderDetailsType
    const transformDocuments = (files: ScrapedTenderFile[]): TenderDocument[] => {
      return files.map(file => {
        const name = file.file_name;
        let type: TenderDocument['type'] = 'other';
        if (name.endsWith('.pdf')) type = 'pdf';
        else if (name.endsWith('.doc') || name.endsWith('.docx')) type = 'doc';
        else if (name.endsWith('.xls') || name.endsWith('.xlsx')) type = 'excel';
        
        return {
          id: file.id,
          name: name,
          type: type,
          url: file.file_url,
          description: file.file_description,
          size: file.file_size,
        };
      });
    };

    const transformedTender: TenderDetailsType = {
      id: data.id,
      tenderNo: data.tender_no || data.tdr || data.tender_id_str,
      title: data.tender_name,
      authority: data.tendering_authority || 'N/A',
      value: parseCurrency(data.value || data.tender_value),
      dueDate: data.due_date || data.last_date_of_bid_submission || 'N/A',
      status: 'live', // Default status, not provided by this endpoint
      category: data.query_name || 'Uncategorized', // Assuming query_name is category
      emd: parseCurrency(data.emd),
      location: data.city || data.state || 'N/A',
      ePublishedDate: data.publish_date || new Date().toISOString(),
      documents: data.files ? transformDocuments(data.files) : [],
    };

    return transformedTender;
  } catch (error) {
    console.error(`Error in fetchTenderById for id ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch all wishlisted tenders.
 * @returns Array of wishlisted tenders.
 */
export const fetchWishlistedTenders = async (): Promise<Tender[]> => {
  const url = `${API_BASE_URL}/tenderiq/wishlist`;
  console.log('Fetching wishlisted tenders from:', url);
  try {
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) {
      throw new Error('Failed to fetch wishlisted tenders');
    }
    const data: ScrapedTender[] = await response.json();
    return data.map(tender => transformTender(tender, tender.query_name || 'Uncategorized'));
  } catch (error) {
    console.error('Error fetching wishlisted tenders:', error);
    throw error;
  }
};

/**
 * Fetch all archived tenders.
 * @returns Array of archived tenders.
 */
export const fetchArchivedTenders = async (): Promise<Tender[]> => {
  const url = `${API_BASE_URL}/tenderiq/archived`;
  console.log('Fetching archived tenders from:', url);
  try {
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) {
      throw new Error('Failed to fetch archived tenders');
    }
    const data: ScrapedTender[] = await response.json();
    return data.map(tender => transformTender(tender, tender.query_name || 'Uncategorized'));
  } catch (error) {
    console.error('Error fetching archived tenders:', error);
    throw error;
  }
};

/**
 * Fetch all favorite tenders.
 * @returns Array of favorite tenders.
 */
export const fetchFavoriteTenders = async (): Promise<Tender[]> => {
  const url = `${API_BASE_URL}/tenderiq/favourite`;
  console.log('Fetching favorite tenders from:', url);
  try {
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) {
      throw new Error('Failed to fetch favorite tenders');
    }
    const data: ScrapedTender[] = await response.json();
    return data.map(tender => transformTender(tender, tender.query_name || 'Uncategorized'));
  } catch (error) {
    console.error('Error fetching favorite tenders:', error);
    throw error;
  }
};

/**
 * Perform an action on a tender (e.g., wishlist, archive).
 * @param tenderId The ID of the tender.
 * @param action The action to perform.
 */
export const performTenderAction = async (
  tenderId: string,
  action: TenderActionRequest
): Promise<void> => {
  const url = `${API_BASE_URL}/tenderiq/tenders/${tenderId}/actions`;
  console.log(`Performing action on tender ${tenderId}:`, action);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to perform action on tender: ${response.status} ${errorText}`);
    }
    
    console.log(`Action ${action.action} on tender ${tenderId} successful.`);
  } catch (error) {
    console.error(`Error in performTenderAction for tender ${tenderId}:`, error);
    throw error;
  }
};
