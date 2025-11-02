// Status and Level enums from OpenAPI spec
export type DocumentStatus = 'pending' | 'processing' | 'active' | 'archived';
export type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'restricted';
export type PermissionLevel = 'read' | 'write' | 'admin';

// Summary response from backend
export interface DocumentSummary {
  total_documents: number;
  recent_uploads: number;
  storage_used: string;
  shared_documents: number;
}

// Category from backend
export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

// Permission for document/folder access
export interface Permission {
  id: string;
  user_id?: string;
  role?: string;
  permission_level: PermissionLevel;
  created_at: string;
}

// Folder from backend
export interface Folder {
  id: string;
  name: string;
  parent_id?: string | null;
  path: string;
  document_count: number;
  subfolders?: Folder[];
  created_at: string;
  modified_at: string;
  department?: string;
}

// Document from backend
export interface Document {
  id: string;
  name: string;
  file_type: string;
  size: number; // bytes instead of string
  uploaded_by: string;
  uploaded_at: string;
  modified_at: string;
  folder_id?: string | null;
  folder_path?: string;
  category_ids?: string[];
  tags?: string[];
  status: DocumentStatus;
  confidentiality_level: ConfidentialityLevel;
  description?: string;
  version?: string;
  department?: string;
}

// Request types
export interface UploadURLRequest {
  filename: string;
  file_size: number;
  mime_type: string;
  folder_id: string;
  category_id?: string;
  tags?: string[];
  confidentiality_level: ConfidentialityLevel;
}

export interface UploadURLResponse {
  upload_url: string;
  document_id: string;
  storage_path: string;
  expires_in: number;
}

export interface ConfirmUploadRequest {
  s3_etag: string;
  s3_version_id?: string;
}

export interface UpdateDocumentRequest {
  name?: string;
  description?: string;
  category_ids?: string[];
  tags?: string[];
  confidentiality_level?: ConfidentialityLevel;
}

export interface CreateFolderRequest {
  name: string;
  parent_id?: string;
  department?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  department?: string;
}

// AI Summary (for /askai integration)
export interface AISummary {
  documentType: string;
  keyTopic: string;
  language: string;
  generatedAt: string;
  executiveSummary: string;
  keyInformation: Record<string, string>;
  importantDates: Array<{ date: string; description: string }>;
  keyEntities: {
    organizations: string[];
    people: string[];
    locations: string[];
  };
  riskFlags: string[];
  tags: string[];
  confidenceScore: number;
}
