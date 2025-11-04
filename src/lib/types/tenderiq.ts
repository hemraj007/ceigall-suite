export interface Tender {
  id: string;
  organization: string;
  tdrNumber: string;
  description: string;
  tenderValue: string;
  dueDate: string;
  location: string;
  category: string;
  scrapedDate: string;
  driveUrl?: string;
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
