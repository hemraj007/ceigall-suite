import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, AlertTriangle, CheckCircle, Info, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAnalyzeTender } from '@/hooks/useAnalyzeTender';
import { fetchTenderById } from '@/lib/api/tenderiq';
import { useState, useEffect } from 'react';

export default function AnalyzeTender() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState<any>(null);
  const [tenderLoading, setTenderLoading] = useState(true);
  const [tenderError, setTenderError] = useState<string | null>(null);

  // Initialize analysis hook
  const analysis = useAnalyzeTender({
    tenderId: id || '',
    autoStartAnalysis: false,
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

  const mockRFPSections = [
    {
      clause: '1.1',
      title: 'Project Scope',
      extractedText: 'Construction of 4-lane highway with interchanges, service roads, and drainage...',
      aiComment: 'Standard scope definition - Low Risk',
      riskLevel: 'low' as const,
    },
    {
      clause: '3.2',
      title: 'Financial Requirements',
      extractedText: 'EMD of ₹9 Cr required, Performance Bank Guarantee of 10% of contract value...',
      aiComment: 'High financial requirements - Review liquidity',
      riskLevel: 'medium' as const,
    },
    {
      clause: '5.4',
      title: 'Technical Qualifications',
      extractedText: 'Minimum 3 similar projects worth ₹300 Cr each in last 7 years...',
      aiComment: 'CRITICAL: Experience threshold very high',
      riskLevel: 'high' as const,
    },
  ];

  const isAnalysisComplete = analysis.analysisStatus?.status === 'completed' || analysis.analysisResults;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
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
                {tenderLoading ? 'Loading tender details...' : tender ? tender.title : 'Analysis Results'}
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

        {/* Start Analysis Button */}
        {!tenderLoading && tender && !analysis.analysisId && !isAnalysisComplete && (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Start AI-powered analysis of this tender to get risk assessment, scope extraction, and more.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => analysis.startAnalysis()}
                disabled={analysis.isInitiating}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {analysis.isInitiating ? 'Starting Analysis...' : 'Start Analysis'}
              </Button>
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
        {isAnalysisComplete && tender && (
          <Tabs defaultValue="one-pager" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="one-pager">One Pager</TabsTrigger>
              <TabsTrigger value="scope">Scope of Work</TabsTrigger>
              <TabsTrigger value="rfp-sections">RFP Sections</TabsTrigger>
              <TabsTrigger value="data-sheet">Data Sheet</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="one-pager" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Project Overview</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project Name</span>
                      <span className="font-medium">{tender?.title.slice(0, 40)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Authority</span>
                      <span className="font-medium">{tender?.authority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contract Value</span>
                      <span className="font-medium text-primary">
                        ₹{tender && (tender.value / 10000000).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{tender?.location}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Financial Requirements</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EMD</span>
                      <span className="font-medium">
                        ₹{tender && (tender.emd / 100000).toFixed(2)} L
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bid Security</span>
                      <span className="font-medium">
                        ₹{tender && (tender.bidSecurity / 100000).toFixed(2)} L
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date</span>
                      <span className="font-medium">
                        {tender && new Date(tender.dueDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Risk Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">High Risk: Technical Qualifications</p>
                      <p className="text-xs text-muted-foreground">Experience threshold requires careful review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10">
                    <Info className="h-5 w-5 text-warning" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Medium Risk: Financial Requirements</p>
                      <p className="text-xs text-muted-foreground">High EMD and bank guarantee amounts</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="scope" className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Scope of Work</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Field</th>
                        <th className="text-left p-3">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">Project Name</td>
                        <td className="p-3 font-medium">{tender?.title}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">Location</td>
                        <td className="p-3 font-medium">{tender?.location}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">Total Length</td>
                        <td className="p-3 font-medium">{tender?.length}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 text-muted-foreground">Contract Value</td>
                        <td className="p-3 font-medium">
                          ₹{tender && (tender.value / 10000000).toFixed(2)} Cr
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <Button variant="outline">Export Scope (Excel)</Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="rfp-sections" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">RFP Section Analysis</h3>
                  <Button variant="outline">Export Analysis (Excel)</Button>
                </div>
                <div className="space-y-4">
                  {mockRFPSections.map((section) => (
                    <Card key={section.clause} className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-start">
                        <div className="col-span-2">
                          <p className="font-semibold">{section.clause}</p>
                          <p className="text-xs text-muted-foreground mt-1">{section.title}</p>
                        </div>
                        <div className="col-span-5">
                          <p className="text-sm text-muted-foreground">{section.extractedText}</p>
                        </div>
                        <div className="col-span-4">
                          <div className="flex items-start gap-2">
                            <Badge
                              variant={
                                section.riskLevel === 'high' ? 'destructive' :
                                section.riskLevel === 'medium' ? 'default' :
                                'secondary'
                              }
                              className="mt-0.5"
                            >
                              {section.riskLevel}
                            </Badge>
                            <p className="text-sm">{section.aiComment}</p>
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button variant="ghost" size="sm">Ask AI</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="data-sheet" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Compliance Data Sheet</h3>
                  <Button variant="outline">Export Data (Excel)</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Requirement</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Description</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Technical Experience</td>
                        <td className="p-3">Eligibility</td>
                        <td className="p-3">3 similar projects required</td>
                        <td className="p-3">
                          <Badge variant="secondary">Pending</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">To be verified</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Financial Capacity</td>
                        <td className="p-3">Eligibility</td>
                        <td className="p-3">₹200 Cr turnover required</td>
                        <td className="p-3">
                          <Badge variant="secondary">Pending</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">To be verified</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Extracted Templates</h3>
                <div className="space-y-3">
                  {['Form A - Technical Bid', 'Form B - Financial Bid', 'Form C - EMD', 'Form D - BOQ', 'Form E - Compliance'].map((form) => (
                    <Card key={form} className="p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-medium">{form}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
