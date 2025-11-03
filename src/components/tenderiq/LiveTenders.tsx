import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Filter, RefreshCw, ExternalLink, MessageSquare, MapPin, Calendar, IndianRupee, Loader2 } from "lucide-react";
import { Tender } from "@/lib/types/tenderiq";
import { fetchDailyTenders, filterTendersByCategory, getAvailableCategories, getAvailableLocations } from "@/lib/api/tenderiq";
import { useToast } from "@/hooks/use-toast";

interface LiveTendersProps {
  onBack: () => void;
}

const LiveTenders = ({ onBack }: LiveTendersProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [minValue, setMinValue] = useState("300");
  const [maxValue, setMaxValue] = useState("");
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTenders = async () => {
    setLoading(true);
    try {
      const data = await fetchDailyTenders();
      setTenders(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load daily tenders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenders();
  }, []);

  // Extract unique categories and locations
  const categories = useMemo(() => {
    const cats = getAvailableCategories(tenders);
    return ["all", ...cats];
  }, [tenders]);

  const locations = useMemo(() => {
    const locs = getAvailableLocations(tenders);
    return ["all", ...locs];
  }, [tenders]);

  // Parse tender value to number
  const parseValue = (value: string): number | null => {
    if (value === "Ref Document") return null;
    const match = value.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

  // Filter tenders
  const filteredTenders = useMemo(() => {
    return tenders.filter(tender => {
      const matchesSearch = searchTerm === "" || 
        tender.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.tdrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "all" || tender.category === selectedCategory;
      const matchesLocation = selectedLocation === "all" || tender.location.includes(selectedLocation);

      const tenderVal = parseValue(tender.tenderValue);
      const minVal = minValue ? parseFloat(minValue) : null;
      const maxVal = maxValue ? parseFloat(maxValue) : null;
      
      let matchesValue = true;
      if (tenderVal !== null) {
        if (minVal !== null && tenderVal < minVal) matchesValue = false;
        if (maxVal !== null && tenderVal > maxVal) matchesValue = false;
      }

      return matchesSearch && matchesCategory && matchesLocation && matchesValue;
    });
  }, [tenders, searchTerm, selectedCategory, selectedLocation, minValue, maxValue]);

  // Group by category
  const groupedTenders = useMemo(() => {
    const grouped: Record<string, Tender[]> = {};
    filteredTenders.forEach(tender => {
      if (!grouped[tender.category]) {
        grouped[tender.category] = [];
      }
      grouped[tender.category].push(tender);
    });
    return grouped;
  }, [filteredTenders]);

  const getValueColor = (value: string) => {
    const numValue = parseValue(value);
    if (numValue === null) return "text-muted-foreground";
    if (numValue >= 30) return "text-green-600 font-semibold";
    if (numValue >= 10) return "text-blue-600 font-semibold";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <ExternalLink className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Live Tenders</h1>
            <p className="text-sm text-muted-foreground">Browse daily scraped live tenders with smart filtering</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Search & Filter Tenders</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={loadTenders} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>Filter tenders by keywords, category, value, and location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by organization, TDR number, description, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>
                    {loc === "all" ? "All Locations" : loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Min Value (Crore)"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
            />

            <Input
              type="number"
              placeholder="Max Value (Crore)"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold">{filteredTenders.length}</span> of <span className="font-semibold">{tenders.length}</span> tenders
        </p>
        <Badge variant="secondary">
          Last Updated: Today
        </Badge>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading daily tenders...</p>
        </Card>
      )}

      {/* Grouped Tender Lists */}
      {!loading && (
        <div className="space-y-6">
          {Object.entries(groupedTenders).map(([category, categoryTenders]) => (
          <div key={category} className="space-y-4">
            {/* Category Header */}
            <div className="bg-primary rounded-lg px-6 py-4">
              <h2 className="text-xl font-bold text-primary-foreground">{category}</h2>
              <p className="text-sm text-primary-foreground/80">{categoryTenders.length} tenders available</p>
            </div>

            {/* Tender Cards */}
            <div className="space-y-4">
              {categoryTenders.map((tender, index) => (
                <Card key={tender.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Index Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-lg border border-primary/20">
                          {index + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{tender.organization}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4" />
                            <span>{tender.location}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded inline-block">{tender.tdrNumber}</p>
                          </div>
                        </div>

                        <p className="text-sm text-foreground leading-relaxed">{tender.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-md">
                            <IndianRupee className="h-4 w-4 text-primary" />
                            <span className="font-medium">Tender Value:</span>
                            <span className={getValueColor(tender.tenderValue)}>{tender.tenderValue}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-md">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">Due Date:</span>
                            <span className="text-muted-foreground">{tender.dueDate}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            className="hover-scale"
                            onClick={() => tender.driveUrl && window.open(tender.driveUrl, '_blank')}
                            disabled={!tender.driveUrl}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Tender
                          </Button>
                          <Button size="sm" variant="outline" className="hover-scale">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat with RoadGPT
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
        </div>
      )}

      {!loading && filteredTenders.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No tenders found matching your filters.</p>
        </Card>
      )}
    </div>
  );
};

export default LiveTenders;
