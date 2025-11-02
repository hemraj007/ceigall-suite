/**
 * DMSIQ UI Component - AI-powered Document Management System
 * Features: Folder navigation, Grid/List views, Enhanced AI summary, Advanced search
 */

import { useState, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DocumentSummary, Document, Folder, AISummary, Category, ConfidentialityLevel } from "@/lib/types/dms";
import { uploadFile, createFolder, downloadDocument, deleteDocument, getDocumentPreviewUrl } from "@/lib/api/dms";
import { 
  FileText, 
  Upload, 
  HardDrive,
  FolderOpen,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Grid3x3,
  List,
  Home,
  File,
  Share2,
  Trash2,
  Edit,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Building2,
  MapPin,
  Users,
  Tag,
  ChevronRight as BreadcrumbChevron,
  X,
  CloudUpload,
  FolderPlus,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DMSUIProps {
  summary: DocumentSummary;
  documents: Document[];
  folders: Folder[];
  categories: Category[];
}

type ViewMode = 'grid' | 'list';

const fileTypeIcons: Record<string, any> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileText,
  xlsx: FileText,
  ppt: FileText,
  pptx: FileText,
  jpg: File,
  jpeg: File,
  png: File,
  zip: File,
};

const getFileIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return fileTypeIcons[extension] || FileText;
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const statusColors = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  archived: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

const confidentialityColors = {
  public: 'bg-blue-500/10 text-blue-500',
  internal: 'bg-purple-500/10 text-purple-500',
  confidential: 'bg-orange-500/10 text-orange-500',
  restricted: 'bg-red-500/10 text-red-500',
};

export function DMSUI({ summary, documents, folders, categories }: DMSUIProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root-1', 'root-2']));
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('modified-desc');
  
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [uploadFolderId, setUploadFolderId] = useState<string | undefined>(undefined);
  const [uploadConfidentiality, setUploadConfidentiality] = useState<ConfidentialityLevel>('internal');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const [summaryDialog, setSummaryDialog] = useState<{ open: boolean; document: Document | null }>({
    open: false,
    document: null,
  });

  const [createFolderDialog, setCreateFolderDialog] = useState<{ open: boolean; parentId?: string | null }>({ open: false });
  const [newFolderName, setNewFolderName] = useState('');
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    doc: Document | null;
    url: string | null;
  }>({ open: false, doc: null, url: null });

  // Mock AI summary data
  const mockAISummary: AISummary = {
    documentType: 'Contract',
    keyTopic: 'Infrastructure Development Agreement',
    language: 'English',
    generatedAt: new Date().toISOString(),
    executiveSummary: 'This comprehensive contract outlines the terms and conditions for a major infrastructure development project. It establishes clear obligations for both parties, payment schedules, and quality standards that must be maintained throughout the project lifecycle.',
    keyInformation: {
      'Contract Value': '₹15,00,00,000',
      'Contract Period': '24 months from signing date',
      'Payment Terms': '30% advance, 40% on milestones, 30% on completion',
      'Penalty Clause': '0.5% per week for delays, max 10%',
      'Performance Guarantee': '10% of contract value',
    },
    importantDates: [
      { date: '2025-01-15', description: 'Project kickoff meeting' },
      { date: '2025-06-30', description: 'First milestone completion' },
      { date: '2026-12-31', description: 'Final project delivery' },
    ],
    keyEntities: {
      organizations: ['Ceigall India Pvt Ltd', 'National Highway Authority', 'Quality Assurance Board'],
      people: ['Project Director - Rajesh Kumar', 'Site Engineer - Priya Sharma'],
      locations: ['Delhi-NCR', 'Jaipur Highway Corridor'],
    },
    riskFlags: [
      'Payment schedule contingent on milestone approvals',
      'Force majeure clause requires 30-day notice',
      'Quality standards subject to third-party inspection',
    ],
    tags: ['Infrastructure', 'Highway', 'Government Contract', 'Long-term'],
    confidenceScore: 94,
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setDepartmentFilter("all");
    setFileTypeFilter("all");
  };

  const handleAISummary = (doc: Document) => {
    setSummaryDialog({ open: true, document: doc });
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast({ title: "No files selected", variant: "destructive" });
      return;
    }
    if (!uploadFolderId) {
      toast({ title: "Please select a folder", variant: "destructive" });
      return;
    }

    const newUploadingFiles = new Map<string, number>();
    uploadFiles.forEach(f => newUploadingFiles.set(f.name, 0));
    setUploadingFiles(newUploadingFiles);

    try {
      for (const file of uploadFiles) {
        await uploadFile(
          {
            file,
            folder_id: uploadFolderId,
            tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
            confidentiality_level: uploadConfidentiality,
          },
          (progress) => {
            setUploadingFiles(prev => new Map(prev).set(file.name, progress));
          }
        );
      }

      toast({ title: "Files uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: ["dms-documents"] });
      queryClient.invalidateQueries({ queryKey: ["dms-summary"] });
      setUploadDialog(false);
      setUploadFiles([]);
      setUploadingFiles(new Map());
    } catch (error) {
      toast({ title: "Error", description: "Upload failed", variant: "destructive" });
      setUploadingFiles(new Map());
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({ title: "Folder name cannot be empty", variant: "destructive" });
      return;
    }
    try {
      await createFolder({
        name: newFolderName,
        parent_folder_id: createFolderDialog.parentId || undefined,
      });
      toast({ title: "Folder created successfully" });
      queryClient.invalidateQueries({ queryKey: ["dms-folders"] });
      setCreateFolderDialog({ open: false, parentId: null });
      setNewFolderName('');
    } catch (error) {
      toast({ title: "Failed to create folder", variant: "destructive" });
    }
  };

  const handleDownloadDocument = async (docId: string, filename: string) => {
    try {
      setIsDownloading(docId);
      await downloadDocument(docId, filename);
    } catch (error) {
      toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
    } finally {
      setIsDownloading(null);
    }
  };

  const handlePreviewDocument = async (doc: Document) => {
    toast({ title: "Generating preview..." });
    try {
      const previewUrl = await getDocumentPreviewUrl(doc.id);
      setPreviewDialog({ open: true, doc: doc, url: previewUrl });
    } catch (error) {
      toast({
        title: "Preview failed",
        description: "Could not load document preview.",
        variant: "destructive",
      });
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Recursive function to render folder tree
  const renderFolderTree = (folder: Folder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasSubfolders = folder.subfolders.length > 0;
    
    return (
      <div key={folder.id}>
        <Button
          variant={currentFolder === folder.id ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-2",
            level > 0 && "ml-" + (level * 4)
          )}
          onClick={() => {
            setCurrentFolder(folder.id);
            if (hasSubfolders) toggleFolder(folder.id);
          }}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasSubfolders && (
            <ChevronRight className={cn(
              "h-3 w-3 shrink-0 transition-transform",
              isExpanded && "rotate-90"
            )} />
          )}
          {!hasSubfolders && <span className="w-3" />}
          <FolderOpen className="h-4 w-4 shrink-0" />
          <span className="truncate flex-1 text-left text-sm">{folder.name}</span>
          <Badge variant="outline" className="ml-auto shrink-0 text-xs">{folder.document_count + (folder.subfolders?.length || 0)}</Badge>
        </Button>
        
        {hasSubfolders && isExpanded && (
          <div className="mt-1">
            {folder.subfolders.map(subfolder => renderFolderTree(subfolder, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Breadcrumb navigation
  const getBreadcrumbs = () => {
    const breadcrumbs: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Home' }];
    if (currentFolder) {
      const findFolder = (folders: Folder[], id: string): Folder | null => {
        for (const folder of folders) {
          if (folder.id === id) return folder;
          const found = findFolder(folder.subfolders, id);
          if (found) return found;
        }
        return null;
      };
      
      const folder = findFolder(folders, currentFolder);
      if (folder?.path) {
        const pathParts = folder.path.split('/').filter(Boolean);
        pathParts.forEach((part) => {
          breadcrumbs.push({ id: currentFolder, name: part });
        });
      }
    }
    return breadcrumbs;
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesFolder = currentFolder ? doc.folder_id === currentFolder : true;
    const matchesSearch = searchQuery ? doc.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesCategory = categoryFilter !== 'all' ? (doc.category_ids?.includes(categoryFilter) ?? false) : true;
    const matchesDepartment = departmentFilter !== 'all' ? doc.department === departmentFilter : true;
    const matchesFileType = fileTypeFilter !== 'all' ? doc.mime_type.includes(fileTypeFilter) : true;
    return matchesFolder && matchesSearch && matchesCategory && matchesDepartment && matchesFileType;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'modified-desc': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'modified-asc': return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      case 'size-desc': return (b.size_bytes ?? 0) - (a.size_bytes ?? 0);
      case 'size-asc': return (a.size_bytes ?? 0) - (b.size_bytes ?? 0);
      default: return 0;
    }
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Folder Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        {sidebarOpen && (
          <>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Folders</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-1">
                <Button
                  variant={currentFolder === null ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => setCurrentFolder(null)}
                >
                  <Home className="h-4 w-4" />
                  All Documents
                  <Badge variant="outline" className="ml-auto">{documents.length}</Badge>
                </Button>

                <Separator className="my-2" />

                {folders.map((folder) => renderFolderTree(folder))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <Button
                variant="outline"
                className="w-full gap-2"
                size="sm"
                onClick={() => {
                  setNewFolderName('');
                  setCreateFolderDialog({ open: true, parentId: currentFolder });
                }}
              >
                <FolderPlus className="h-4 w-4" />
                New Folder
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-semibold">DMSIQ - Document Library</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered intelligent document management
            </p>
          </div>
          <Button className="gap-2" onClick={() => setUploadDialog(true)}>
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="p-4 border-b bg-card">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalDocuments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all folders
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.recentUploads}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.storageUsed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Of 50 GB available
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shared Documents</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.sharedDocuments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Accessible to you
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Breadcrumb & Filters */}
        <div className="p-4 space-y-3 border-b bg-card">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {getBreadcrumbs().map((crumb, idx) => (
              <div key={crumb.id || 'home'} className="flex items-center gap-1">
                {idx > 0 && <BreadcrumbChevron className="h-3 w-3" />}
                <button
                  onClick={() => setCurrentFolder(crumb.id)}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search documents by name, content, or tags..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Tender & Bidding">Tender & Bidding</SelectItem>
                <SelectItem value="Contracts & Legal">Contracts & Legal</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Procurement">Procurement</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="document">Word</SelectItem>
                <SelectItem value="sheet">Excel</SelectItem>
                <SelectItem value="presentation">PowerPoint</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="modified-desc">Modified (Newest)</SelectItem>
                <SelectItem value="modified-asc">Modified (Oldest)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="size-desc">Size (Largest)</SelectItem>
                <SelectItem value="size-asc">Size (Smallest)</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAllFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>

            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Document Display */}
        <ScrollArea className="flex-1 p-4">
          {sortedDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FolderOpen className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No documents found</p>
              <p className="text-sm">Try adjusting your filters or upload new documents</p>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {sortedDocuments.map((doc) => {
                const FileIcon = getFileIcon(doc.original_filename);
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileIcon className="h-8 w-8 text-primary" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Star className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{doc.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{formatFileSize(doc.size_bytes ?? 0)}</p>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <Badge variant="outline" className="text-xs">{(doc.original_filename.split('.').pop() || '').toUpperCase()}</Badge>
                        <Badge variant="outline" className={cn("text-xs", confidentialityColors[doc.confidentiality_level])}>
                          {doc.confidentiality_level}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <User className="h-3 w-3" />
                        <span className="truncate">{doc.uploaded_by}</span>
                      </div>

                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => handleAISummary(doc)}>
                          <Sparkles className="h-3 w-3" />
                          AI
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handlePreviewDocument(doc)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleDownloadDocument(doc.id, doc.original_filename)} disabled={isDownloading === doc.id}>
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // List View
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {sortedDocuments.map((doc) => {
                    const FileIcon = getFileIcon(doc.original_filename);
                    return (
                      <div key={doc.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                            <div className="p-2 rounded-lg bg-muted shrink-0">
                              <FileIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="font-medium truncate">{doc.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs shrink-0">{(doc.original_filename.split('.').pop() || '').toUpperCase()}</Badge>
                                <span className="shrink-0">{formatFileSize(doc.size_bytes ?? 0)}</span>
                                <span className="shrink-0">•</span>
                                <span className="truncate">{doc.uploaded_by}</span>
                                <span className="shrink-0">•</span>
                                <span className="shrink-0">{new Date(doc.updated_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className={cn(confidentialityColors[doc.confidentiality_level], "shrink-0")}>
                              {doc.confidentiality_level}
                            </Badge>
                            <Badge className={cn(statusColors[doc.status], "shrink-0")} variant="outline">
                              {doc.status}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1.5 h-8 shrink-0"
                              onClick={() => handleAISummary(doc)}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              AI Summary
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handlePreviewDocument(doc)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDownloadDocument(doc.id, doc.original_filename)} disabled={isDownloading === doc.id}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FolderOpen className="h-4 w-4 mr-2" />
                                  Move to Folder
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Star className="h-4 w-4 mr-2" />
                                  Add to Favorites
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Tag className="h-4 w-4 mr-2" />
                                  Edit Categories
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {doc.category_ids.length > 0 && (
                          <div className="flex gap-1 mt-2 ml-14 flex-wrap overflow-hidden">
                            {doc.category_ids.map((catId) => {
                              const category = categories.find(c => c.id === catId);
                              return category ? (
                                <Badge key={catId} variant="secondary" className="text-xs shrink-0">
                                  {category.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload documents to DMSIQ for centralized storage and AI-powered management
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Drop Zone */}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" />
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-1">Drop documents here or click to browse</h3>
              <p className="text-xs text-muted-foreground">Max 100MB per file</p>
            </div>
            
            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                  {uploadFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{file.name}</span>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload Configuration */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="folder">Folder *</Label>
                <Select onValueChange={setUploadFolderId} value={uploadFolderId}>
                  <SelectTrigger id="folder">
                    <SelectValue placeholder="Select a folder..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <div className="p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 font-normal"
                        onClick={(e) => {
                          e.preventDefault();
                          setNewFolderName('');
                          setCreateFolderDialog({ open: true, parentId: null });
                        }}
                      >
                        <FolderPlus className="h-4 w-4" />
                        Create New Folder
                      </Button>
                    </div>
                    <Separator />
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confidentiality">Confidentiality Level</Label>
                <Select onValueChange={(v: ConfidentialityLevel) => setUploadConfidentiality(v)} defaultValue="internal">
                  <SelectTrigger id="confidentiality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="public">Public (all department members)</SelectItem>
                    <SelectItem value="internal">Internal (department only)</SelectItem>
                    <SelectItem value="confidential">Confidential (specific roles)</SelectItem>
                    <SelectItem value="restricted">Restricted (specific users)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" placeholder="Add tags separated by commas" value={uploadTags} onChange={e => setUploadTags(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" placeholder="Brief description of document content" rows={3} value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} />
              </div>
            </div>

            {uploadingFiles.size > 0 && (
              <div className="space-y-2">
                {Array.from(uploadingFiles.entries()).map(([name, progress]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate">{name}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialog(false)} disabled={uploadingFiles.size > 0}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploadingFiles.size > 0}>
                <Upload className="h-4 w-4 mr-2" />
                {uploadingFiles.size > 0 ? "Uploading..." : `Upload ${uploadFiles.length} Document(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced AI Summary Dialog */}
      <Dialog open={summaryDialog.open} onOpenChange={(open) => setSummaryDialog({ open, document: null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Document Summary
            </DialogTitle>
            <DialogDescription>
              {summaryDialog.document?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Quick Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Document Type</p>
                  <p className="font-medium">{mockAISummary.documentType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Key Topic</p>
                  <p className="font-medium">{mockAISummary.keyTopic}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Language</p>
                  <p className="font-medium">{mockAISummary.language}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Generated</p>
                  <p className="font-medium">{new Date(mockAISummary.generatedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Executive Summary */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Executive Summary
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mockAISummary.executiveSummary}
              </p>
            </div>

            {/* Key Information */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Key Information Extracted
              </h4>
              <div className="grid gap-2">
                {Object.entries(mockAISummary.keyInformation).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-3 bg-muted/50 rounded-lg text-sm">
                    <span className="font-medium">{key}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Dates */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Important Dates & Deadlines
              </h4>
              <div className="space-y-2">
                {mockAISummary.importantDates.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{new Date(item.date).toLocaleDateString()}</span>
                    <span className="text-muted-foreground">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Entities */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Key Entities Mentioned
              </h4>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Organizations
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {mockAISummary.keyEntities.organizations.map((org) => (
                      <Badge key={org} variant="outline">{org}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    People
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {mockAISummary.keyEntities.people.map((person) => (
                      <Badge key={person} variant="outline">{person}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Locations
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {mockAISummary.keyEntities.locations.map((location) => (
                      <Badge key={location} variant="outline">{location}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Flags */}
            {mockAISummary.riskFlags.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Flags & Important Notes
                </h4>
                <div className="space-y-2">
                  {mockAISummary.riskFlags.map((risk, idx) => (
                    <div key={idx} className="flex gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags & Keywords */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4" />
                AI-Generated Tags
              </h4>
              <div className="flex flex-wrap gap-1">
                {mockAISummary.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold">Confidence Score</p>
                  <p className="text-sm text-muted-foreground">AI accuracy rating for this summary</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">{mockAISummary.confidenceScore}%</p>
                <p className="text-xs text-muted-foreground">High confidence</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download Summary
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share Summary
              </Button>
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                View Full Document
              </Button>
              <Button variant="outline" className="ml-auto gap-2" onClick={() => navigate('/ask-ai')}>
                <Sparkles className="h-4 w-4" />
                Ask AI about this
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialog.open} onOpenChange={(open) => setCreateFolderDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder. It will be created {createFolderDialog.parentId ? "inside the current folder." : "at the root level."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-folder-name" className="sr-only">Folder Name</Label>
            <Input
              id="new-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g., 'Project Documents'"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateFolderDialog({ open: false });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create Folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onOpenChange={(open) => {
          if (!open && previewDialog.url) {
            window.URL.revokeObjectURL(previewDialog.url);
          }
          setPreviewDialog({ open, doc: open ? previewDialog.doc : null, url: open ? previewDialog.url : null });
        }}
      >
        <DialogContent className="max-w-5xl h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDialog.doc?.name}</DialogTitle>
            <DialogDescription>
              {previewDialog.doc?.original_filename} ({formatFileSize(previewDialog.doc?.size_bytes ?? 0)})
            </DialogDescription>
          </DialogHeader>
          {previewDialog.url ? (
            <div className="flex-1">
              <iframe
                src={previewDialog.url}
                className="w-full h-full border-0 rounded-md"
                title={previewDialog.doc?.name}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p>Loading preview...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
