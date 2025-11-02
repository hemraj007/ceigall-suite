import { API_BASE_URL } from "@/lib/config/api";
import type {
  DocumentSummary,
  Document,
  Folder,
  Category,
  UpdateDocumentRequest,
  CreateFolderRequest,
  UpdateFolderRequest,
  Permission,
} from "../types/dms";

const transformDocumentFromAPI = (doc: any): Document => {
  return doc as Document;
};

const transformFolderFromAPI = (folder: any): Folder => ({
  ...folder,
  parent_id: folder.parent_folder_id,
  subfolders: folder.subfolders?.map(transformFolderFromAPI) || [],
});

/**
 * Get DMS summary (total documents, recent uploads, storage used, shared documents)
 */
export const getDMSSummary = async (): Promise<DocumentSummary> => {
  const response = await fetch(`${API_BASE_URL}/dms/summary`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch DMS summary");
  }

  const data = await response.json();
  return {
    total_documents: data.total_documents,
    recent_uploads: data.recent_uploads,
    storage_used: data.storage_used,
    shared_documents: data.shared_documents,
  };
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_BASE_URL}/dms/categories`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
};

/**
 * Get all folders with optional filtering
 */
export const getFolders = async (options?: {
  parent_id?: string;
  department?: string;
  search?: string;
}): Promise<Folder[]> => {
  const params = new URLSearchParams();
  if (options?.parent_id) params.append("parent_id", options.parent_id);
  if (options?.department) params.append("department", options.department);
  if (options?.search) params.append("search", options.search);

  const response = await fetch(
    `${API_BASE_URL}/dms/folders?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch folders");
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(transformFolderFromAPI) : [];
};

/**
 * Get specific folder details
 */
export const getFolder = async (folderId: string): Promise<Folder> => {
  const response = await fetch(`${API_BASE_URL}/dms/folders/${folderId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch folder ${folderId}`);
  }

  const data = await response.json();
  return transformFolderFromAPI(data);
};

/**
 * Create a new folder
 */
export const createFolder = async (
  request: CreateFolderRequest
): Promise<Folder> => {
  const response = await fetch(`${API_BASE_URL}/dms/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to create folder");
  }

  const data = await response.json();
  return transformFolderFromAPI(data);
};

/**
 * Update folder (rename, change department)
 */
export const updateFolder = async (
  folderId: string,
  request: UpdateFolderRequest
): Promise<Folder> => {
  const response = await fetch(`${API_BASE_URL}/dms/folders/${folderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to update folder");
  }

  const data = await response.json();
  return transformFolderFromAPI(data);
};

/**
 * Delete folder (soft delete)
 */
export const deleteFolder = async (folderId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/dms/folders/${folderId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete folder");
  }
};

/**
 * Move folder to another location
 */
export const moveFolder = async (
  folderId: string,
  parentId: string | null
): Promise<Folder> => {
  const response = await fetch(`${API_BASE_URL}/dms/folders/${folderId}/move`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ parent_id: parentId }),
  });

  if (!response.ok) {
    throw new Error("Failed to move folder");
  }

  const data = await response.json();
  return transformFolderFromAPI(data);
};

/**
 * Get documents with optional filtering
 */
export const getDocuments = async (options?: {
  folder_id?: string;
  category_id?: string;
  search?: string;
  tags?: string[];
  status?: string;
}): Promise<Document[]> => {
  const params = new URLSearchParams();
  if (options?.folder_id) params.append("folder_id", options.folder_id);
  if (options?.category_id) params.append("category_id", options.category_id);
  if (options?.search) params.append("search", options.search);
  if (options?.status) params.append("status", options.status);
  if (options?.tags?.length) {
    options.tags.forEach((tag) => params.append("tags", tag));
  }

  const response = await fetch(
    `${API_BASE_URL}/dms/documents?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  const data = await response.json();
  return data.documents.map(transformDocumentFromAPI);
};

/**
 * Get specific document details
 */
export const getDocument = async (documentId: string): Promise<Document> => {
  const response = await fetch(`${API_BASE_URL}/dms/documents/${documentId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch document ${documentId}`);
  }

  const data = await response.json();
  return transformDocumentFromAPI(data);
};

/**
 * Upload a file directly to the server
 */
export const uploadFile = async (
  { file, folder_id, tags, confidentiality_level, category_id }: {
    file: File;
    folder_id: string;
    tags?: string[];
    confidentiality_level: string;
    category_id?: string;
  },
  onProgress?: (progress: number) => void
): Promise<Document> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder_id", folder_id);
  if (tags?.length) {
    formData.append("tags", tags.join(","));
  }
  formData.append("confidentiality_level", confidentiality_level);
  if (category_id) {
    formData.append("category_id", category_id);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${API_BASE_URL}/dms/file-upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("token")}`);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed due to a network error."));
    };
    
    xhr.send(formData);
  });
};

/**
 * Update document metadata
 */
export const updateDocument = async (
  documentId: string,
  request: UpdateDocumentRequest
): Promise<Document> => {
  const response = await fetch(`${API_BASE_URL}/dms/documents/${documentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to update document");
  }

  const data = await response.json();
  return transformDocumentFromAPI(data);
};

/**
 * Delete document (soft delete)
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/dms/documents/${documentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete document");
  }
};

/**
 * Download a document directly
 */
export const downloadDocument = async (documentId: string, filename: string) => {
  const response = await fetch(
    `${API_BASE_URL}/dms/documents/${documentId}/download`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to download document");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Get a previewable URL for a document
 */
export const getDocumentPreviewUrl = async (documentId: string): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}/dms/documents/${documentId}/download`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch document for preview");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  return url;
};

/**
 * Get document version history
 */
export const getDocumentVersions = async (
  documentId: string
): Promise<Document[]> => {
  const response = await fetch(
    `${API_BASE_URL}/dms/documents/${documentId}/versions`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch document versions");
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(transformDocumentFromAPI) : [];
};

/**
 * Get document permissions
 */
export const getDocumentPermissions = async (
  documentId: string
): Promise<Permission[]> => {
  const response = await fetch(
    `${API_BASE_URL}/dms/documents/${documentId}/permissions`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch document permissions");
  }

  return response.json();
};

/**
 * Grant document permissions
 */
export const grantDocumentPermission = async (
  documentId: string,
  userId: string,
  permissionLevel: string
): Promise<Permission> => {
  const response = await fetch(
    `${API_BASE_URL}/dms/documents/${documentId}/permissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ user_id: userId, permission_level: permissionLevel }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to grant permission");
  }

  return response.json();
};

/**
 * Revoke document permissions
 */
export const revokeDocumentPermission = async (
  documentId: string,
  permissionId: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/dms/documents/${documentId}/permissions/${permissionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to revoke permission");
  }
};

/**
 * Get folder permissions
 */
export const getFolderPermissions = async (
  folderId: string
): Promise<Permission[]> => {
  const response = await fetch(
    `${API_BASE_URL}/dms/folders/${folderId}/permissions`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch folder permissions");
  }

  return response.json();
};

/**
 * Grant folder permissions
 */
export const grantFolderPermission = async (
  folderId: string,
  userId: string,
  permissionLevel: string
): Promise<Permission> => {
  const response = await fetch(
    `${API_BASE_URL}/dms/folders/${folderId}/permissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ user_id: userId, permission_level: permissionLevel }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to grant permission");
  }

  return response.json();
};

/**
 * Revoke folder permissions
 */
export const revokeFolderPermission = async (
  folderId: string,
  permissionId: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/dms/folders/${folderId}/permissions/${permissionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to revoke permission");
  }
};
