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
  Calendar,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [pendingBulkAction, setPendingBulkAction] = useState<'hide' | 'unhide' | null>(null);
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

  const toggleStatus = async (campaignId: string | string[], currentStatus: boolean, reason?: string) => {
    const ids = Array.isArray(campaignId) ? campaignId : [campaignId];
    setProcessingId(ids.length === 1 ? ids[0] : 'bulk');
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          is_active: !currentStatus,
          moderation_message: !currentStatus ? reason || null : null 
        })
        .in('id', ids);

      if (error) throw error;

      // 4. Send Email Notifications (only for hide action)
      if (!currentStatus && reason) {
        // Group by brand owner to send "One Email" per brand
        const brandGroups = ids.reduce((acc, id) => {
          const campaign = campaigns.find(cam => cam.id === id);
          if (campaign?.user_id) {
            if (!acc[campaign.user_id]) acc[campaign.user_id] = [];
            acc[campaign.user_id].push(campaign.title || campaign.brand || "Unnamed Campaign");
          }
          return acc;
        }, {} as Record<string, string[]>);

        for (const brandUserId in brandGroups) {
          supabase.functions.invoke('notify-user-email', {
            body: {
              user_id: brandUserId,
              type: 'campaign_hidden',
              reason: reason,
              items: brandGroups[brandUserId]
            }
          }).catch(e => console.error('Failed to send campaign hidden email:', e));
        }
      }

      setCampaigns(prev => prev.map(c => ids.includes(c.id) ? { ...c, is_active: !currentStatus, moderation_message: !currentStatus ? reason || null : null } : c));
      setSelectedIds([]);
      
      toast({
        title: `${ids.length > 1 ? ids.length + ' Campaigns' : 'Campaign'} ${!currentStatus ? 'Hidden' : 'Activated'}`,
        description: `The visibility has been updated successfully.`,
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
      setIsReasonDialogOpen(false);
      setModerationReason('');
    }
  };

  const handleBulkAction = (action: 'hide' | 'unhide') => {
    if (selectedIds.length === 0) return;
    
    if (action === 'hide') {
      setPendingBulkAction('hide');
      setIsReasonDialogOpen(true);
    } else {
      toggleStatus(selectedIds, true); // Unhide doesn't need reason
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCampaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCampaigns.map(c => c.id));
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    (c.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.niche || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(searchTerm.toLowerCase())
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

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <Checkbox 
              id="select-all" 
              checked={selectedIds.length > 0 && selectedIds.length === filteredCampaigns.length}
              onCheckedChange={toggleSelectAll}
            />
            <Label htmlFor="select-all" className="text-xs font-semibold text-slate-500 cursor-pointer">
              {selectedIds.length > 0 ? `${selectedIds.length} Selected` : 'Select All'}
            </Label>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by brand, niche, or city..."
              className="pl-10 h-10 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                "bg-white p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 relative",
                c.is_active ? "border-slate-200 shadow-sm" : "border-red-100 bg-red-50/30 opacity-80",
                selectedIds.includes(c.id) ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/10" : ""
              )}
            >
              {/* Checkbox Overlay */}
              <div 
                className="absolute top-4 left-4 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox 
                  checked={selectedIds.includes(c.id)}
                  onCheckedChange={() => toggleSelect(c.id)}
                  className="h-5 w-5 border-slate-300 bg-white"
                />
              </div>

              <div className="flex gap-4 pl-8">
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
                  onClick={() => {
                    if (c.is_active) {
                      setPendingBulkAction(null);
                      setProcessingId(c.id);
                      setIsReasonDialogOpen(true);
                    } else {
                      toggleStatus(c.id, c.is_active);
                    }
                  }}
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
          {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-slate-800">
          <div className="flex flex-col">
            <span className="text-sm font-bold">{selectedIds.length} campaigns selected</span>
            <span className="text-[10px] text-slate-400">Apply action to all</span>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="destructive" 
              className="gap-2 bg-red-600 hover:bg-red-700 h-9"
              onClick={() => handleBulkAction('hide')}
            >
              <EyeOff className="h-4 w-4" />
              Hide All
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 border-slate-700 bg-transparent hover:bg-slate-800 h-9 text-white"
              onClick={() => handleBulkAction('unhide')}
            >
              <Check className="h-4 w-4" />
              Unhide All
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-slate-400 hover:text-white h-9"
              onClick={() => setSelectedIds([])}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Moderation Reason Dialog */}
      <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reason for Hiding</DialogTitle>
            <DialogDescription>
              Provide a reason for hiding {pendingBulkAction ? `${selectedIds.length} campaigns` : 'this campaign'}. This message will be sent to the brand via email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="mb-2 block font-semibold text-slate-700">Moderation Message</Label>
            <Textarea 
              id="reason"
              placeholder="e.g. Campaign content violates our terms or requires more specific deliverables. Please update to be unhidden."
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              className="min-h-[120px] border-slate-200 focus:ring-blue-500"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsReasonDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700" 
              onClick={() => {
                if (pendingBulkAction) {
                  toggleStatus(selectedIds, false, moderationReason);
                } else {
                  toggleStatus(processingId as string, true, moderationReason);
                }
              }}
              disabled={!moderationReason.trim() || (processingId === 'bulk' && !pendingBulkAction)}
            >
              {processingId === 'bulk' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Hide'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      )}
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
