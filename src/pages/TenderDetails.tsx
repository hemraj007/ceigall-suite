import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchTenderById } from '@/lib/api/tenderiq';
import { TenderDetailsType } from '@/lib/types/tenderiq';
import TenderDetailsUI from '@/components/tenderiq/TenderDetailsUI';
import { Button } from '@/components/ui/button';
import { performTenderAction, fetchWishlistedTenders } from '@/lib/api/tenderiq';
import { Tender } from '@/lib/types/tenderiq';

export default function TenderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tender, isLoading, isError } = useQuery<TenderDetailsType, Error>({
    queryKey: ['tenderDetails', id],
    queryFn: () => fetchTenderById(id!),
    enabled: !!id,
  });

  const { data: wishlist } = useQuery<Tender[], Error>({
    queryKey: ['wishlist'],
    queryFn: fetchWishlistedTenders,
  });

  const isWishlisted = wishlist?.some((item) => item.id === id) ?? false;

  const handleAddToWishlist = async () => {
    if (!tender) return;
    try {
      await performTenderAction(tender.id, { action: 'toggle_wishlist' });
      toast({
        title: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
        description: 'Tender wishlist updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update wishlist', variant: 'destructive' });
    }
  };
  
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading tender details...</p>
        </div>
      </div>
    );
  }

  if (isError || !tender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Tender not found</p>
          <p className="text-muted-foreground text-sm">
            The tender you're looking for doesn't exist or may have been removed.
          </p>
          <Button onClick={() => navigate('/tenderiq')} variant="outline">
            Back to TenderIQ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TenderDetailsUI
      tender={tender}
      isWishlisted={isWishlisted}
      onAddToWishlist={handleAddToWishlist}
      onNavigate={handleNavigate}
    />
  );
}
