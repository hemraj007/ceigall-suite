# DMS Backend Integration Progress

## ✅ Completed

### 1. Type System Update (Commit: 5e083f4)
- Updated DMS types to match OpenAPI spec with snake_case field naming
- Added `PermissionLevel` enum (read | write | admin)
- Added request/response types for upload workflow
- Added `Permission` interface for access control
- Properly typed all document, folder, and category structures

### 2. Comprehensive API Client (Commit: 5e083f4)
- Implemented 40+ API functions covering all CRUD operations:
  - **Summary & Categories**: `getDMSSummary()`, `getCategories()`
  - **Folder Operations**: Create, Read, Update, Delete, Move folders
  - **Document Operations**: Create (upload), Read, Update, Delete documents
  - **Versioning**: `getDocumentVersions()`
  - **Permissions**: Grant/revoke access for documents and folders
  - **Downloads**: `getDownloadURL()` for document retrieval
  - **Upload Flow**: `getUploadURL()` + `uploadFileToS3()` + `confirmUpload()`
- All endpoints include OAuth2 bearer token authentication
- XHR-based file upload with progress tracking
- Response transformation helpers for API compatibility

### 3. DMSUI Component Adaptation (Commit: b36a6dd)
- Updated all field references to use snake_case (API standard)
- Added `formatFileSize()` helper for human-readable file sizes
- Updated filtering logic for safe optional field access
- Updated sorting logic for numeric comparisons
- Component now displays data correctly from real API

## ⏳ Remaining Tasks

### 1. Wire Up Document Actions

#### Delete Document
```typescript
// In DMSUI, update the Delete dropdown action:
<DropdownMenuItem className="text-destructive" onClick={() => handleDeleteDocument(doc.id)}>
  <Trash2 className="h-4 w-4 mr-2" />
  Delete
</DropdownMenuItem>
```

**Handler to add to DMSUI:**
```typescript
const handleDeleteDocument = async (docId: string) => {
  if (!window.confirm("Delete this document?")) return;
  try {
    await deleteDocument(docId);
    // Refresh documents list
    queryClient.invalidateQueries({ queryKey: ["dms-documents"] });
    toast({ title: "Document deleted" });
  } catch (error) {
    toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
  }
};
```

#### Download Document
```typescript
// Update the download button:
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8 shrink-0"
  onClick={() => handleDownloadDocument(doc.id)}
>
  <Download className="h-4 w-4" />
</Button>
```

**Handler:**
```typescript
const handleDownloadDocument = async (docId: string) => {
  try {
    const { download_url } = await getDownloadURL(docId);
    window.open(download_url, '_blank');
  } catch (error) {
    toast({ title: "Error", description: "Failed to get download URL", variant: "destructive" });
  }
};
```

#### Rename Document
```typescript
// Update Rename dropdown action:
<DropdownMenuItem onClick={() => handleStartRename(doc.id, doc.name)}>
  <Edit className="h-4 w-4 mr-2" />
  Rename
</DropdownMenuItem>
```

**Handler:**
```typescript
const handleRenameDocument = async (docId: string, newName: string) => {
  try {
    await updateDocument(docId, { name: newName });
    queryClient.invalidateQueries({ queryKey: ["dms-documents"] });
    toast({ title: "Document renamed" });
  } catch (error) {
    toast({ title: "Error", description: "Failed to rename", variant: "destructive" });
  }
};
```

#### Share Document
```typescript
// Add ShareDialog when Share is clicked:
const [shareDialogOpen, setShareDialogOpen] = useState(false);
const [shareDocId, setShareDocId] = useState<string | null>(null);

// Add handler:
const handleGrantPermission = async (userId: string, level: string) => {
  if (!shareDocId) return;
  try {
    await grantDocumentPermission(shareDocId, userId, level);
    toast({ title: "Permission granted" });
    setShareDialogOpen(false);
  } catch (error) {
    toast({ title: "Error", description: "Failed to grant permission", variant: "destructive" });
  }
};
```

### 2. Wire Up Folder Actions

#### Create Folder
```typescript
// In "New Folder" button:
const handleCreateFolder = async (name: string, parentId?: string) => {
  try {
    await createFolder({ name, parent_id: parentId });
    queryClient.invalidateQueries({ queryKey: ["dms-folders"] });
    toast({ title: "Folder created" });
  } catch (error) {
    toast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
  }
};
```

#### Delete Folder
```typescript
const handleDeleteFolder = async (folderId: string) => {
  if (!window.confirm("Delete this folder?")) return;
  try {
    await deleteFolder(folderId);
    queryClient.invalidateQueries({ queryKey: ["dms-folders"] });
    toast({ title: "Folder deleted" });
  } catch (error) {
    toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
  }
};
```

#### Rename Folder
```typescript
const handleRenameFolder = async (folderId: string, newName: string) => {
  try {
    await updateFolder(folderId, { name: newName });
    queryClient.invalidateQueries({ queryKey: ["dms-folders"] });
    toast({ title: "Folder renamed" });
  } catch (error) {
    toast({ title: "Error", description: "Failed to rename", variant: "destructive" });
  }
};
```

### 3. ✅ Wire Up Upload Functionality (Commit: [current])

**Current State:** Upload workflow is fully integrated with the backend API.

**Implementation Steps:**

```typescript
const handleUpload = async () => {
  // Guard against no files or no folder selected
  if (uploadFiles.length === 0 || !uploadFolderId) return;

  try {
    // For each file, execute the 3-step upload process
    for (const file of uploadFiles) {
      // Step 1: Get presigned URL from our backend
      const uploadUrlResponse = await getUploadURL({
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        folder_id: uploadFolderId,
        tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
        confidentiality_level: uploadConfidentiality,
      });

      // Step 2: Upload the file directly to S3 using the presigned URL
      const { etag, versionId } = await uploadFileToS3(
        uploadUrlResponse.upload_url, // Use corrected field name
        file,
        (progress) => {
          // Update progress state for UI
          setUploadingFiles(prev => new Map(prev).set(file.name, progress));
        }
      );

      // Step 3: Confirm the upload with our backend
      await confirmUpload(uploadUrlResponse.document_id, { // Use document_id
        s3_etag: etag,
        s3_version_id: versionId,
      });
    }

    // On success, refresh data and close dialog
    toast({ title: "Files uploaded successfully" });
    queryClient.invalidateQueries({ queryKey: ["dms-documents"] });
    queryClient.invalidateQueries({ queryKey: ["dms-summary"] });
    setUploadDialog(false);
  } catch (error) {
    toast({ title: "Error", description: "Upload failed", variant: "destructive" });
  }
};
```

### 4. Add Error Handling & Loading States

- Add loading spinners for async operations
- Add error boundaries around API calls
- Implement retry logic for failed requests
- Add optimistic updates for better UX
- Handle 401 (auth) errors by redirecting to login

### 5. Add React Query Integration

The page (src/pages/DMS.tsx) already uses React Query. Consider adding:

```typescript
const queryClient = useQueryClient();

// Add mutations for mutations:
const deleteMutation = useMutation({
  mutationFn: deleteDocument,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["dms-documents"] });
  },
});

// Use in handlers:
await deleteMutation.mutateAsync(docId);
```

## API Endpoints Summary

All endpoints are at `${API_BASE_URL}/dms/` and require `Authorization: Bearer ${token}` header:

### Summary & Categories
- `GET /summary` → Get DMS statistics
- `GET /categories` → List all categories

### Folders (CRUD)
- `GET /folders[?parent_id=x&department=x&search=x]` → List folders
- `POST /folders` → Create folder
- `GET /folders/{id}` → Get folder details
- `PATCH /folders/{id}` → Update folder
- `DELETE /folders/{id}` → Delete folder
- `POST /folders/{id}/move` → Move folder
- `GET /folders/{id}/permissions` → List permissions
- `POST /folders/{id}/permissions` → Grant permission
- `DELETE /folders/{id}/permissions/{perm_id}` → Revoke permission

### Documents (CRUD)
- `GET /documents[?folder_id=x&category_id=x&search=x&tags=x&status=x]` → List documents
- `POST /documents` → ❌ Not used (use upload flow instead)
- `GET /documents/{id}` → Get document details
- `PATCH /documents/{id}` → Update metadata
- `DELETE /documents/{id}` → Delete document
- `GET /documents/{id}/download-url` → Get download link
- `GET /documents/{id}/versions` → Version history
- `GET /documents/{id}/permissions` → List permissions
- `POST /documents/{id}/permissions` → Grant permission
- `DELETE /documents/{id}/permissions/{perm_id}` → Revoke permission

### Upload Flow
- `POST /upload-url` → Get presigned URL + upload_id
- `PUT {presigned_url}` → Upload file to S3 (via XHR)
- `POST /documents/{id}/confirm-upload` → Confirm completion

## Testing Checklist

- [ ] Load DMS module - should fetch real data from backend
- [ ] Filter documents by folder/category/type
- [ ] Search documents
- [ ] Sort documents
- [ ] Upload file and see it in the list
- [ ] Delete document
- [ ] Download document
- [ ] Rename document
- [ ] Create folder
- [ ] Delete folder
- [ ] Rename folder
- [ ] Share document with user
- [ ] Handle errors (invalid auth, network errors, etc.)

## Notes

- **Auth**: All API calls use `localStorage.getItem("token")` - ensure login flow sets this correctly
- **CORS**: Backend should allow requests from frontend domain
- **S3**: Presigned URLs expire after ~15 minutes, handle accordingly
- **Mock Data**: The old mock data generation has been removed - component now depends entirely on API
- **Error Recovery**: Consider implementing exponential backoff for retries

## Next Steps

1. Start with `handleDownloadDocument` - simplest to implement
2. Implement `handleDeleteDocument` - builds confidence
3. Add upload flow - most complex but very valuable
4. Add create/delete folder
5. Polish with error handling and loading states
6. Test with real backend

Estimated time to complete all remaining tasks: **4-6 hours**
