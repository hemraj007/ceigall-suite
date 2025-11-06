import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  Play,
  TrendingUp,
  TrendingDown,
  Minus,
  FileCode,
  DollarSign,
  Calendar,
  MapPin,
  Building2,
  BarChart3,
  Shield,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAnalyzeTender } from '@/hooks/useAnalyzeTender';
import { fetchTenderById } from '@/lib/api/tenderiq';
import { useState, useEffect } from 'react';
interface AnalysisOnePager {
  project_overview: string;
  eligibility_highlights: string[];
  important_dates: string[];
  financial_requirements: string[];
  risk_analysis: {
    summary: string;
  };
}

interface TenderAnalysisResponse {
  one_pager_json: AnalysisOnePager | null;
  scope_of_work_json: any | null;
  data_sheet_json: any | null;
  tenderInfo?: any;
}

export default function AnalyzeTender() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState<any>(null);
  const [tenderLoading, setTenderLoading] = useState(true);
  const [tenderError, setTenderError] = useState<string | null>(null);

  // Initialize analysis hook
  const analysis = useAnalyzeTender({
    tenderId: id || '',
    autoStartAnalysis: true,
    pollInterval: 2000,
  });

  // Fetch tender details on mount
  useEffect(() => {
    const loadTender = async () => {
      if (!id) {
        setTenderError('No tender ID provided');
        setTenderLoading(false);
        return;
      }

      try {
        setTenderLoading(true);
        const tenderData = await fetchTenderById(id);
        setTender(tenderData);
        setTenderError(null);
      } catch (error) {
        setTenderError(error instanceof Error ? error.message : 'Failed to load tender');
        console.error('Error loading tender:', error);
      } finally {
        setTenderLoading(false);
      }
    };

    loadTender();
  }, [id]);

  const analysisResults = analysis.analysisResults as TenderAnalysisResponse | null;
  const isAnalysisComplete = analysis.analysisStatus?.status === 'completed' || analysisResults;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-6 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/tenderiq')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analyze Tender</h1>
              <p className="text-muted-foreground mt-1">
                {tenderLoading
                  ? 'Loading tender details...'
                  : tender
                  ? tender.title
                  : analysisResults?.tenderInfo.title || 'Analysis Results'}
              </p>
            </div>
          </div>
          {isAnalysisComplete && (
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          )}
        </div>

        {/* Error State */}
        {tenderError && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{tenderError}</p>
            </div>
          </Card>
        )}

        {/* Loading Tender */}
        {tenderLoading && (
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading tender details...</p>
            </div>
          </Card>
        )}


        {/* Analysis Loading Progress */}
        {(analysis.isPolling || analysis.analysisStatus?.status === 'in_progress') && (
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI Analysis in Progress</h3>
              <p className="text-sm text-muted-foreground">
                {analysis.currentStep || 'Processing tender documents...'}
              </p>
              <Progress value={analysis.progress} className="w-full max-w-md" />
              <p className="text-xs text-muted-foreground">{analysis.progress}% Complete</p>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {isAnalysisComplete && analysisResults && analysisResults.one_pager_json && (
          <div className="space-y-6">
            {/* Project Overview */}
            <Card className="p-6 space-y-4">
              <h3 className="text-xl font-bold">Project Overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysisResults.one_pager_json.project_overview}
              </p>
            </Card>

            {/* Financial Requirements */}
            <Card className="p-6 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Requirements
              </h3>
              <ul className="space-y-2">
                {analysisResults.one_pager_json.financial_requirements.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Eligibility Highlights */}
            <Card className="p-6 space-y-4">
              <h3 className="text-xl font-bold">Eligibility Highlights</h3>
              <ul className="space-y-2">
                {analysisResults.one_pager_json.eligibility_highlights.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Key Dates */}
            <Card className="p-6 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Important Dates
              </h3>
              <ul className="space-y-2">
                {analysisResults.one_pager_json.important_dates.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Risk Analysis */}
            <Card className="p-6 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Analysis
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {analysisResults.one_pager_json.risk_analysis.summary}
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
