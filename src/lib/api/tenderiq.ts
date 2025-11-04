import { API_BASE_URL } from '@/lib/config/api';
import { Tender, TenderDetailsType, TenderDocument } from '@/lib/types/tenderiq';

// Based on OpenAPI spec
interface ScrapedTenderFile {
  id: string;
  file_name: string;
  file_url: string;
  file_description?: string | null;
  file_size?: string | null;
}

interface ScrapedTender {
  id: string; // uuid
  tender_id_str: string;
  tender_name: string;
  tender_url: string;
  drive_url?: string | null;
  city: string;
  summary: string;
  value: string;
  due_date: string;
  tdr?: string | null;
  tendering_authority?: string | null;
  tender_no?: string | null;
  state?: string | null;
  emd?: string | null;
  tender_value?: string | null;
  publish_date?: string | null;
  last_date_of_bid_submission?: string | null;
  files: ScrapedTenderFile[];
  [key: string]: any; // Allow other properties
}

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
const transformTender = (apiTender: ScrapedTender, category: string): Tender => {
  console.log('Transforming tender:', { apiTender, category });
  
  return {
    id: apiTender.id,
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

    if (data.queries && Array.isArray(data.queries)) {
      data.queries.forEach(query => {
        const category = query.query_name || 'Uncategorized';
        console.log(`Processing category: ${category}, tenders count: ${query.tenders?.length || 0}`);

        if (query.tenders && Array.isArray(query.tenders)) {
          query.tenders.forEach(tender => {
            allTenders.push(transformTender(tender, category));
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

export interface AvailableDate {
  date: string;
  date_str: string;
  run_at: string;
  tender_count: number;
  is_latest: boolean;
}

export interface FilteredTendersResponse {
  tenders: Tender[];
  total_count: number;
  filtered_by: {
    date?: string;
    date_range?: string;
    include_all_dates?: boolean;
    category?: string;
    location?: string;
  };
  available_dates: string[];
}

/**
 * Fetch available scrape dates from the backend
 * @returns Array of available dates with metadata
 */
export const fetchAvailableDates = async (): Promise<AvailableDate[]> => {
  console.log('Fetching available dates from:', `${API_BASE_URL}/tenderiq/dates`);

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE_URL}/tenderiq/dates`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
 * @param params - Filter parameters (date, date_range, include_all_dates, category, location, min_value, max_value)
 * @returns Filtered tenders response
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
  const token = localStorage.getItem('token');
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
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to fetch filtered tenders: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Filtered tenders response:', data);

    // Transform tenders if needed
    const transformedTenders: Tender[] = (data.tenders || []).map((t: ScrapedTender) => ({
      id: t.id,
      organization: t.tendering_authority || t.tender_name || 'Unknown',
      tdrNumber: t.tdr || t.tender_id_str || 'N/A',
      description: t.summary || t.tender_brief || t.tender_details || 'No description',
      tenderValue: t.value || t.tender_value || 'Ref Document',
      dueDate: t.due_date ? t.due_date.trim() : 'N/A',
      location: t.city || t.state || 'N/A',
      category: t.query_name || t.category || 'Uncategorized',
      scrapedDate: t.date || t.scraped_date || new Date().toISOString().split('T')[0],
      driveUrl: t.drive_url || t.tender_url || undefined,
    }));

    return {
      tenders: transformedTenders,
      total_count: data.total_count || transformedTenders.length,
      filtered_by: data.filtered_by || {},
      available_dates: data.available_dates || [],
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
  const token = localStorage.getItem('token');
  const url = `${API_BASE_URL}/tenderiq/tenders/${id}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
