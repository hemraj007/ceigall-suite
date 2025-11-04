import { API_BASE_URL } from '@/lib/config/api';
import { Document, Tender, TenderDetailsType, TenderDocument, ScrapedTenderFile, ScrapedTender, TenderApiResponse, AvailableDate, FilteredTendersResponse } from '@/lib/types/tenderiq';

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
    const transformedTenders: Tender[] = (data.tenders || []).map((t: ScrapedTender) => transformTender(t, t.category || 'Uncategorized'));

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
