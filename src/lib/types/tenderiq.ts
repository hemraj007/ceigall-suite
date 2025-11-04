
export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'excel';
  pages?: number;
  isAIGenerated?: boolean;
}

export interface Tender {
  id: string;
  title: string;
  authority: string;
  value: number;              // in rupees
  dueDate: string;            // ISO date: "2025-12-15"
  status: 'live' | 'analyzed' | 'synopsis' | 'evaluated' | 'won' | 'lost' | 'pending';
  category: string;
  ePublishedDate: string;     // ISO date
  bidSecurity: number;        // in rupees
  emd: number;                // Earnest Money Deposit, in rupees
  location: string;
  length?: string;            // e.g., "120 km"
  costPerKm?: number;
  progressPct: number;        // 0-100
  documents: Document[];
  riskLevel?: 'high' | 'medium' | 'low';
}


export interface HistoryTender {
  id: number;
  tenderNo: string;
  title: string;
  authority: string;
  value: string;
  submissionDate: string;
  analysisDate: string;
  status: "Under Evaluation" | "Submitted" | "Analysis Complete" | "Bid Lost" | "Won";
  category: string;
  starred: boolean;
  progress: number;
}

export interface ScrapedTenderFile {
  id: string;
  file_name: string;
  file_url: string;
  file_description?: string | null;
  file_size?: string | null;
}

export interface ScrapedTender {
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

export interface TenderApiResponse {
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

export interface TenderFilterParams {
  searchTerm?: string;
  category?: string;
  location?: string;
  minValue?: number | null;
  maxValue?: number | null;
}

export interface ComparisonClause {
  section: string;
  clauseNumber: string;
  title: string;
  originalText: string;
  amendedText: string;
  changeType: "adverse" | "positive" | "neutral";
  impact: string;
  recommendation: string;
}

export interface ComparisonResult {
  overallRisk: "Medium" | "High" | "Low";
  totalChanges: number;
  adverseChanges: number;
  positiveChanges: number;
  clauses: ComparisonClause[];
}

export interface BidDocument {
  name: string;
  status: "complete" | "incomplete";
  issues: string[];
}

export interface EvaluationResult {
  completeness: number;
  eligibility: "Qualified" | "Not Qualified";
  missingDocuments: string[];
  providedDocuments: BidDocument[];
  recommendations: string[];
}

export interface TenderDocument {
  id: string;
  name: string;
  type: "pdf" | "doc" | "excel" | "other";
  url: string;
  description?: string | null;
  size?: string | null;
  pages?: number;
  isAIGenerated?: boolean;
}

export interface TenderDetailsType {
  id: string;
  tenderNo?: string;
  title: string;
  authority: string;
  value: number | null; // Can be "Ref Document"
  dueDate: string;
  status: "live" | "won" | "lost" | "submitted" | "under evaluation";
  category: string;
  emd: number | null;
  location: string;
  length?: string;
  costPerKm?: number;
  ePublishedDate: string;
  documents: TenderDocument[];
  riskLevel?: "Low" | "Medium" | "High";
}
