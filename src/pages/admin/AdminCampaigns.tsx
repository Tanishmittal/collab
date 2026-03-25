import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Tag, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  Loader2,
  Trophy,
  FileText,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const toggleStatus = async (campaignId: string, currentStatus: boolean) => {
    setProcessingId(campaignId);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ is_active: !currentStatus })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, is_active: !currentStatus } : c));
      
      toast({
        title: `Campaign ${!currentStatus ? 'Activated' : 'Hidden'}`,
        description: `The campaign visibility has been updated successfully.`,
        variant: !currentStatus ? 'default' : 'destructive',
      });
    } catch (err) {
      console.error('Error toggling status:', err);
      toast({
        title: 'Update Failed',
        description: 'Could not update campaign visibility.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    (c.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Campaign Management</h3>
            <p className="text-xs text-slate-400">Moderating {campaigns.length} campaigns</p>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search campaign titles or brands..."
            className="pl-10 h-10 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100 italic text-slate-400">
          No campaigns found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCampaigns.map((c) => (
            <div 
              key={c.id} 
              className={cn(
                "bg-white p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6",
                c.is_active ? "border-slate-200 shadow-sm" : "border-red-100 bg-red-50/30 opacity-80"
              )}
            >
              <div className="flex gap-4">
                <div className="h-16 w-16 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                   {c.image_url ? (
                     <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                   ) : (
                     <div className="h-full w-full flex items-center justify-center text-slate-300">
                       <FileText className="h-8 w-8" />
                     </div>
                   )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800">{c.brand}</h4>
                    {!c.is_active && (
                       <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-md tracking-wider">Hidden</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                     <span className="text-blue-600">Niche: {c.niche}</span>
                     <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>Created {format(new Date(c.created_at), 'MMM d, yyyy')}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-semibold">{c.category || 'Lifestyle'}</span>
                     <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-semibold italic capitalize">{c.budget_range || 'Contact'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "min-w-[100px] gap-2 border-slate-200",
                    c.is_active ? "text-slate-600" : "text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-100"
                  )}
                  onClick={() => toggleStatus(c.id, c.is_active)}
                  disabled={processingId === c.id}
                >
                  {processingId === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : c.is_active ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Unhide</span>
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="text-slate-400 hover:text-slate-800">
                   View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
