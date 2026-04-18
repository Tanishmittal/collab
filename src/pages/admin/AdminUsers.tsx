import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  Loader2,
  UserCheck,
  Building2,
  Save,
  Globe,
  Instagram,
  Youtube,
  Twitter,
  Link as LinkIcon,
  Check,
  X,
  Mail,
  Filter,
  ChevronDown,
  RotateCcw,
  UserPlus,
  Users as UsersIcon,
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type UserType = 'influencer' | 'brand';

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<UserType>('influencer');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [pendingBulkAction, setPendingBulkAction] = useState<'hide' | 'unhide' | null>(null);
  
  // Advanced Filters State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'hidden'>('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [filterFollowers, setFilterFollowers] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [filterQuality, setFilterQuality] = useState<string[]>([]);
  const [qualityInvert, setQualityInvert] = useState(true);
  
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    setUsers([]); // Clear previous data to prevent property mismatched rendering
    try {
      const table = activeTab === 'influencer' ? 'influencer_profiles' : 'brand_profiles';
      
      const { data, error } = await supabase
        .from(table)
        .select(activeTab === 'influencer' ? '*, portfolio_items(count)' : '*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const toggleStatus = async (userId: string | string[], currentStatus: boolean, reason?: string) => {
    const ids = Array.isArray(userId) ? userId : [userId];
    setProcessingId(ids.length === 1 ? ids[0] : 'bulk');
    
    try {
      const table = activeTab === 'influencer' ? 'influencer_profiles' : 'brand_profiles';
      const { error } = await supabase
        .from(table)
        .update({ 
          is_active: !currentStatus,
          moderation_message: !currentStatus ? reason || null : null // Clear reason if unhiding
        })
        .in('id', ids);

      if (error) throw error;

      // 4. Send Email Notifications (only for hide action)
      if (currentStatus && reason) {
        for (const id of ids) {
          const userToNotify = users.find(u => u.id === id);
          if (userToNotify?.user_id) {
            supabase.functions.invoke('notify-user-email', {
              body: {
                user_id: userToNotify.user_id,
                type: 'profile_hidden',
                reason: reason
              }
            }).catch(e => console.error('Failed to send email:', e));
          }
        }
      }

      setUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, is_active: !currentStatus, moderation_message: !currentStatus ? reason || null : null } : u));
      setSelectedIds([]); // Clear selection after action
      
      toast({
        title: `${ids.length > 1 ? ids.length + ' Profiles' : 'Profile'} ${!currentStatus ? 'Hidden' : 'Activated'}`,
        description: `Visibility has been updated successfully.`,
        variant: !currentStatus ? 'default' : 'destructive',
      });
    } catch (err) {
      console.error('Error toggling status:', err);
      toast({
        title: 'Update Failed',
        description: 'Could not update profile status. Please try again.',
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
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };

  const handleEdit = (user: any) => {
    setEditForm({ ...user });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editForm) return;
    setIsSaving(true);
    try {
      const table = activeTab === 'influencer' ? 'influencer_profiles' : 'brand_profiles';
      const { error } = await supabase
        .from(table)
        .update({
          ...editForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', editForm.id);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === editForm.id ? { ...editForm } : u));
      setIsSheetOpen(false);
      
      toast({
        title: 'Changes Saved',
        description: 'The profile has been updated successfully.',
      });
    } catch (err: any) {
      console.error('Error saving user:', err);
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save changes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormField = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const filteredUsers = React.useMemo(() => {
    return users.filter(item => {
      // 1. Search Term Logic
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
             (item.name || item.business_name || '').toLowerCase().includes(searchStr) ||
             (item.city || item.location || '').toLowerCase().includes(searchStr) ||
             (item.niche || item.industry || '').toLowerCase().includes(searchStr);
             
      if (!matchesSearch) return false;

      // Only apply additional filters for influencers as per user request
      if (activeTab === 'brand') return true;

      // 2. Status Filter
      if (filterStatus === 'active' && !item.is_active) return false;
      if (filterStatus === 'hidden' && item.is_active) return false;

      // 3. Verification Filter
      if (filterVerified === 'verified' && !item.is_verified) return false;
      if (filterVerified === 'unverified' && item.is_verified) return false;

      // 4. Followers Filter
      const followers = Number(item.total_followers_count || 0);
      if (filterFollowers === 'small' && followers >= 10000) return false;
      if (filterFollowers === 'medium' && (followers < 10000 || followers > 50000)) return false;
      if (filterFollowers === 'large' && followers <= 50000) return false;

      // 5. New: Advanced Profile Quality Filters (Smart Logic)
      if (filterQuality.length > 0) {
        const checkProblem = (id: string) => {
          switch (id) {
            case 'missing-bio': return !(item.bio?.trim());
            case 'missing-socials': return !(item.instagram_url || item.youtube_url || item.twitter_url);
            case 'missing-avatar': return !item.avatar_url;
            case 'missing-pricing': return !(item.price_reel > 0 || item.price_story > 0 || item.price_visit > 0);
            case 'no-username': return !item.verification_code;
            case 'minimal-bio': return (item.bio?.length || 0) < 20;
            case 'no-portfolio': return (item.portfolio_items?.[0]?.count || 0) === 0;
            default: return false;
          }
        };

        if (qualityInvert) {
          // Moderation mode: Show if ANY of the selected problems are present (OR logic)
          const hasAnyProblem = filterQuality.some(id => checkProblem(id));
          if (!hasAnyProblem) return false;
        } else {
          // Discovery mode: Show ONLY if ALL of the selected quality traits are present (AND logic)
          const hasAllQuality = filterQuality.every(id => !checkProblem(id));
          if (!hasAllQuality) return false;
        }
      }

      return true;
    });
  }, [users, searchTerm, activeTab, filterStatus, filterVerified, filterFollowers, filterQuality, qualityInvert]);

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterVerified('all');
    setFilterFollowers('all');
    setFilterQuality([]);
  };

  const hasActiveFilters = filterStatus !== 'all' || filterVerified !== 'all' || filterFollowers !== 'all' || filterQuality.length > 0;

  return (
    <div className="space-y-6">
      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('influencer')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              activeTab === 'influencer' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <UserCheck className="h-4 w-4" />
            Influencers
          </button>
          <button
            onClick={() => setActiveTab('brand')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              activeTab === 'brand' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Building2 className="h-4 w-4" />
            Brands
          </button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <Checkbox 
              id="select-all" 
              checked={selectedIds.length > 0 && selectedIds.length === filteredUsers.length}
              onCheckedChange={toggleSelectAll}
            />
            <Label htmlFor="select-all" className="text-xs font-semibold text-slate-500 cursor-pointer">
              {selectedIds.length > 0 ? `${selectedIds.length} Selected` : 'Select All'}
            </Label>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Showing <span className="text-slate-700 font-bold">{filteredUsers.length}</span> {activeTab === 'influencer' ? 'influencers' : 'brands'}</span>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="h-7 px-3 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full font-bold uppercase tracking-wider transition-all"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={`Search by name, city, or niche...`}
              className="pl-10 h-10 border-slate-200 focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button 
            variant={isFiltersOpen || hasActiveFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={cn(
              "h-10 gap-2 border-slate-200",
              (isFiltersOpen || hasActiveFilters) && "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm"
            )}
            disabled={activeTab === 'brand'}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-white/20 text-white border-none min-w-5 justify-center">
                { (filterStatus !== 'all' ? 1 : 0) + (filterVerified !== 'all' ? 1 : 0) + (filterFollowers !== 'all' ? 1 : 0) + filterQuality.length }
              </Badge>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform", isFiltersOpen && "rotate-180")} />
          </Button>
        </div>
      </div>

      {/* Advanced Filters Collapsible */}
      <Collapsible open={isFiltersOpen && activeTab === 'influencer'} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between px-2 mt-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-blue-600" />
              Advanced Filters
            </h3>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters} 
                className="h-8 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 font-bold gap-2 uppercase tracking-wider transition-all"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Status Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Visibility Status</Label>
              <div className="flex flex-col gap-2">
                {['all', 'active', 'hidden'].map((s) => (
                  <div key={s} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`status-${s}`} 
                      checked={filterStatus === s}
                      onCheckedChange={() => setFilterStatus(s as any)}
                    />
                    <Label htmlFor={`status-${s}`} className="text-sm cursor-pointer capitalize">{s}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Status</Label>
              <div className="flex flex-col gap-2">
                {['all', 'verified', 'unverified'].map((v) => (
                  <div key={v} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`verified-${v}`} 
                      checked={filterVerified === v}
                      onCheckedChange={() => setFilterVerified(v as any)}
                    />
                    <Label htmlFor={`verified-${v}`} className="text-sm cursor-pointer capitalize">{v}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Reach Filter */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reach Level</Label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'all', label: 'All Sizes' },
                  { id: 'small', label: 'Small (<10k)' },
                  { id: 'medium', label: 'Medium (10k-50k)' },
                  { id: 'large', label: 'Large (>50k)' }
                ].map((r) => (
                  <div key={r.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`followers-${r.id}`} 
                      checked={filterFollowers === r.id}
                      onCheckedChange={() => setFilterFollowers(r.id as any)}
                    />
                    <Label htmlFor={`followers-${r.id}`} className="text-sm cursor-pointer">{r.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Quality Filter */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Profile Quality</Label>
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                  <span className={cn("text-[10px] font-bold transition-colors", qualityInvert ? "text-slate-400" : "text-emerald-600")}>PRESENT</span>
                  <Switch 
                    checked={qualityInvert} 
                    onCheckedChange={setQualityInvert}
                    className="data-[state=checked]:bg-blue-600 h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
                  />
                  <span className={cn("text-[10px] font-bold transition-colors", qualityInvert ? "text-blue-600" : "text-slate-400")}>MISSING</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {[
                  { id: 'missing-bio', label: qualityInvert ? 'Missing Bio' : 'Has Bio' },
                  { id: 'missing-socials', label: qualityInvert ? 'Missing Social Links' : 'Has Social Links' },
                  { id: 'missing-avatar', label: qualityInvert ? 'Missing Avatar' : 'Has Avatar' },
                  { id: 'missing-pricing', label: qualityInvert ? 'Missing Pricing' : 'Has Pricing Set' },
                  { id: 'no-username', label: qualityInvert ? 'No Branded Username' : 'Has Branded Username' },
                  { id: 'minimal-bio', label: qualityInvert ? 'Minimal Bio (<20)' : 'Deep Bio (20+)' },
                  { id: 'no-portfolio', label: qualityInvert ? 'No Portfolio' : 'Has Portfolio' }
                ].map((q) => (
                  <div key={q.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`quality-${q.id}`} 
                      checked={filterQuality.includes(q.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setFilterQuality(prev => [...prev, q.id]);
                        else setFilterQuality(prev => prev.filter(i => i !== q.id));
                      }}
                    />
                    <Label htmlFor={`quality-${q.id}`} className="text-sm cursor-pointer">{q.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-2">Active Filters:</span>
              {filterStatus !== 'all' && (
                <Badge variant="outline" className="gap-1 px-2 py-1 bg-blue-50 border-blue-200 text-blue-700 font-medium">
                  Status: {filterStatus}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterStatus('all')} />
                </Badge>
              )}
              {filterVerified !== 'all' && (
                <Badge variant="outline" className="gap-1 px-2 py-1 bg-blue-50 border-blue-200 text-blue-700 font-medium">
                  {filterVerified}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterVerified('all')} />
                </Badge>
              )}
              {filterFollowers !== 'all' && (
                <Badge variant="outline" className="gap-1 px-2 py-1 bg-blue-50 border-blue-200 text-blue-700 font-medium">
                  Reach: {filterFollowers}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterFollowers('all')} />
                </Badge>
              )}
              {filterQuality.map(q => (
                <Badge key={q} variant="outline" className="gap-1 px-2 py-1 bg-blue-50 border-blue-200 text-blue-700 font-medium">
                  {q.replace('-', ' ')}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterQuality(prev => prev.filter(i => i !== q))} />
                </Badge>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-slate-800">
          <div className="flex flex-col">
            <span className="text-sm font-bold">{selectedIds.length} users selected</span>
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
              Provide a reason for hiding {pendingBulkAction ? `${selectedIds.length} profiles` : 'this profile'}. This message will be shown privately on their dashboard and sent via email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="mb-2 block font-semibold text-slate-700">Moderation Message</Label>
            <Textarea 
              id="reason"
              placeholder="e.g. Profile is missing a biography or professional photos. Please update to be unhidden."
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
                  toggleStatus(processingId as string, true, moderationReason); // true here means current is active, so we hide
                }
              }}
              disabled={!moderationReason.trim() || (processingId === 'bulk')}
            >
              {processingId === 'bulk' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Hide'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100 italic text-slate-400">
          No {activeTab}s found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredUsers.map((user) => (
             <div 
              key={user.id} 
              className={cn(
                "bg-white p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer hover:border-blue-200 hover:shadow-md group relative",
                user.is_active ? "border-slate-200 shadow-sm" : "border-red-100 bg-red-50/30 opacity-80",
                selectedIds.includes(user.id) ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/10" : ""
              )}
              onClick={() => handleEdit(user)}
            >
              <div 
                className="absolute top-4 left-4 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox 
                  checked={selectedIds.includes(user.id)}
                  onCheckedChange={() => toggleSelect(user.id)}
                  className="h-5 w-5 border-slate-300 bg-white"
                />
              </div>

              <div className="flex items-start gap-5 flex-1 pl-8">
                <div className="h-20 w-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner shrink-0 mt-1">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-2xl uppercase">
                      {(user.name || user.business_name || '?')[0]}
                    </div>
                  )}
                  {!user.is_active && (
                    <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] flex items-center justify-center">
                      <EyeOff className="text-red-600 h-6 w-6 opacity-80" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                    <h4 className="font-bold text-lg text-slate-800 tracking-tight truncate max-w-[200px]">
                      {user.name || user.business_name}
                    </h4>
                    {user.is_verified && (
                      <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" fill="currentColor" />
                    )}
                    {user.created_at && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-wider font-bold">
                        <Clock className="h-2.5 w-2.5" />
                        Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </div>
                    )}
                    {!user.is_active && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 text-[10px] uppercase h-5 font-bold">
                        Hidden
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-xs mb-3">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{user.city || 'Global'}</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1.5 font-medium capitalize">
                      <UsersIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{user.niche || 'General'}</span>
                    </div>
                    {user.email && (
                      <>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1.5 group/email">
                          <Mail className="h-3.5 w-3.5 text-slate-400 group-hover/email:text-blue-500 active:scale-95 transition-all" />
                          <span className="truncate max-w-[200px] text-slate-600 font-medium">{user.email}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {activeTab === 'influencer' && (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50 shadow-sm">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-xs font-bold text-blue-700">
                          {formatNumber(user.total_followers_count || 0)} <span className="text-blue-500/80 font-medium">Reach</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {user.instagram_url && (
                          <div className="h-7 w-7 rounded-lg bg-pink-50 flex items-center justify-center border border-pink-100 text-pink-600 shrink-0">
                            <Instagram className="h-4 w-4" />
                          </div>
                        )}
                        {user.youtube_url && (
                          <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center border border-red-100 text-red-600 shrink-0">
                            <Youtube className="h-4 w-4" />
                          </div>
                        )}
                        {user.twitter_url && (
                          <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-500 shrink-0">
                            <Twitter className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!user.bio && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 uppercase tracking-tighter shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            <AlertCircle className="h-2.5 w-2.5" />
                            No Bio
                          </div>
                        )}
                        {!user.avatar_url && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 uppercase tracking-tighter shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            <AlertCircle className="h-2.5 w-2.5" />
                            No Avatar
                          </div>
                        )}
                        {activeTab === 'influencer' && !user.instagram_url && !user.youtube_url && !user.twitter_url && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-tighter shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            <AlertCircle className="h-2.5 w-2.5" />
                            No Socials
                          </div>
                        )}
                        {activeTab === 'influencer' && (user.portfolio_items?.[0]?.count || 0) === 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 uppercase tracking-tighter shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            <AlertCircle className="h-2.5 w-2.5" />
                            No Portfolio
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 border-slate-200 h-9 px-4 font-semibold shadow-sm transition-all active:scale-95",
                    user.is_active 
                      ? "text-slate-600 hover:bg-slate-50 hover:border-slate-300" 
                      : "text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-200"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (user.is_active) {
                      setPendingBulkAction(null);
                      setProcessingId(user.id);
                      setIsReasonDialogOpen(true);
                    } else {
                      toggleStatus(user.id, user.is_active);
                    }
                  }}
                  disabled={processingId === user.id}
                >
                  {processingId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : user.is_active ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                        <span>Show</span>
                    </>
                  )}
                </Button>
                <div className="flex sm:flex-col gap-1 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if(confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) {
                          toast({ title: 'Danger Zone', description: 'Hard deletion is restricted for safety. Use Hide instead.', variant: 'destructive' });
                      }
                    }}
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto bg-slate-50 p-0">
          <SheetHeader className="p-6 pb-6 border-b border-slate-200 bg-white">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Moderating {editForm?.name || editForm?.business_name}
              {editForm?.is_verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
            </SheetTitle>
            <SheetDescription className="text-slate-500">
              Update profile information directly to fix completeness or moderation issues.
            </SheetDescription>
          </SheetHeader>

          {editForm && (
            <div className="p-6 space-y-8">
              {/* Profile Header Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={editForm.avatar_url || editForm.logo_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
                    editForm.is_active ? "bg-green-500" : "bg-red-500"
                  )}>
                    {editForm.is_active ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-white" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{editForm.name || editForm.business_name}</h4>
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <MapPin className="h-3 w-3" /> {editForm.city}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3" /> {editForm.email}
                    </p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="identity" className="w-full">
                <TabsList className="w-full grid grid-cols-3 bg-slate-100 p-1 mb-6">
                  <TabsTrigger value="identity" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm uppercase tracking-wider">Identity</TabsTrigger>
                  <TabsTrigger value="commercial" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm uppercase tracking-wider">Stats</TabsTrigger>
                  <TabsTrigger value="moderation" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm uppercase tracking-wider">Safety</TabsTrigger>
                </TabsList>

                <TabsContent value="identity" className="space-y-6 focus-visible:outline-none">
                  {/* Status Switches */}
                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visibility</Label>
                      <div className="flex items-center gap-2 h-10 px-3 bg-slate-50 rounded-lg border border-slate-100">
                        <Switch 
                          checked={editForm.is_active} 
                          onCheckedChange={(checked) => updateFormField('is_active', checked)}
                        />
                        <span className="text-xs font-bold text-slate-700">{editForm.is_active ? 'VISIBLE' : 'HIDDEN'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification</Label>
                      <div className="flex items-center gap-2 h-10 px-3 bg-slate-50 rounded-lg border border-slate-100">
                        <Switch 
                          checked={editForm.is_verified} 
                          onCheckedChange={(checked) => updateFormField('is_verified', checked)}
                        />
                        <span className="text-xs font-bold text-slate-700">{editForm.is_verified ? 'VERIFIED' : 'PENDING'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2 text-left">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Profile Name / Title</Label>
                      <Input 
                        value={editForm.name || editForm.business_name || ''} 
                        onChange={(e) => updateFormField(activeTab === 'influencer' ? 'name' : 'business_name', e.target.value)}
                        className="bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">City</Label>
                        <Input 
                          value={editForm.city || ''} 
                          onChange={(e) => updateFormField('city', e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">{activeTab === 'influencer' ? 'Niche' : 'Industry'}</Label>
                        <Input 
                          value={editForm.niche || editForm.industry || ''} 
                          onChange={(e) => updateFormField(activeTab === 'influencer' ? 'niche' : 'industry', e.target.value)}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Biography / Description</Label>
                      <Textarea 
                        value={editForm.bio || editForm.description || ''} 
                        onChange={(e) => updateFormField(activeTab === 'influencer' ? 'bio' : 'description', e.target.value)}
                        className="min-h-[120px] bg-white"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="commercial" className="space-y-6 focus-visible:outline-none">
                  {activeTab === 'influencer' ? (
                    <>
                      {/* Platform stats breakdown */}
                      <div className="space-y-4">
                         <Label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                           Social Reach Breakdown
                         </Label>
                         <div className="grid grid-cols-1 gap-3">
                           {[
                             { label: 'Instagram', field: 'ig_followers', engagementField: 'ig_engagement', dateField: 'ig_last_verified', icon: Instagram },
                             { label: 'YouTube', field: 'yt_subscribers', engagementField: 'yt_engagement', dateField: 'yt_last_verified', icon: Youtube },
                             { label: 'Twitter / X', field: 'twitter_followers', engagementField: 'twitter_engagement', dateField: 'twitter_last_verified', icon: Twitter },
                           ].map((plat) => (
                             <div key={plat.label} className="bg-white p-4 rounded-xl border border-slate-200">
                               <div className="flex items-center justify-between mb-3">
                                 <span className="text-xs font-bold flex items-center gap-2">
                                   <plat.icon className="h-3.5 w-3.5 text-slate-400" />
                                   {plat.label}
                                 </span>
                                 {editForm[plat.dateField] && (
                                   <Badge variant="secondary" className="text-[9px] font-bold px-1.5 h-4 bg-slate-100 text-slate-500 border-none">
                                     LAST SYNC: {formatDistanceToNow(new Date(editForm[plat.dateField]))} AGO
                                   </Badge>
                                 )}
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                 <div>
                                   <Label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Followers</Label>
                                   <Input 
                                     type="number"
                                     value={editForm[plat.field] || 0}
                                     onChange={(e) => updateFormField(plat.field, parseInt(e.target.value))}
                                     className="h-8 text-sm font-bold"
                                   />
                                 </div>
                                 <div>
                                    <Label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Engagement %</Label>
                                    <Input 
                                      type="number"
                                      step="0.1"
                                      value={editForm[plat.engagementField] || 0}
                                      onChange={(e) => updateFormField(plat.engagementField, parseFloat(e.target.value))}
                                      className="h-8 text-sm font-bold"
                                    />
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>

                      {/* Pricing */}
                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Save className="h-3.5 w-3.5 text-blue-600" />
                          Service Rates (INR)
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                           {[
                             { label: 'Reel', field: 'price_reel' },
                             { label: 'Story', field: 'price_story' },
                             { label: 'Visit', field: 'price_visit' },
                           ].map((price) => (
                             <div key={price.label} className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100">
                               <Label className="text-[10px] font-bold text-slate-400 uppercase">{price.label}</Label>
                               <div className="relative">
                                 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">₹</span>
                                 <Input 
                                   type="number"
                                   value={editForm[price.field] || 0}
                                   onChange={(e) => updateFormField(price.field, parseInt(e.target.value))}
                                   className="h-8 pl-5 text-xs font-bold border-none bg-slate-50"
                                 />
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                       {/* Brand Commercials */}
                       <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-5">
                          <div className="space-y-2">
                             <Label className="text-xs font-bold text-slate-500 uppercase">Monthly Ad Budget</Label>
                             <Input 
                               value={editForm.monthly_budget || ''} 
                               onChange={(e) => updateFormField('monthly_budget', e.target.value)}
                               className="font-bold"
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <Label className="text-xs font-bold text-slate-500 uppercase">Campaigns / Month</Label>
                               <Input 
                                 type="number"
                                 value={editForm.campaigns_per_month || 0} 
                                 onChange={(e) => updateFormField('campaigns_per_month', parseInt(e.target.value))}
                                 className="font-bold"
                               />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-xs font-bold text-slate-500 uppercase">Fast Responses</Label>
                               <Input 
                                 value={editForm.response_time_expectation || ''} 
                                 onChange={(e) => updateFormField('response_time_expectation', e.target.value)}
                                 className="font-bold text-blue-600"
                               />
                            </div>
                          </div>
                       </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="moderation" className="space-y-6 focus-visible:outline-none">
                  {/* Warning Box */}
                  <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 space-y-4">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Internal Moderation Reason</span>
                    </div>
                    <Textarea 
                      value={editForm.moderation_message || ''} 
                      onChange={(e) => updateFormField('moderation_message', e.target.value)}
                      placeholder="Visible to user: explain why the profile is hidden..."
                      className="bg-white border-orange-200 min-h-[120px] text-sm"
                    />
                  </div>

                  {/* Verification code helper */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                    <Label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
                      Verification Code / Branded Username
                      <Badge variant="outline" className="text-[10px] border-blue-100 text-blue-600 font-bold">MANUAL OVERRIDE</Badge>
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        value={editForm.verification_code || ''} 
                        onChange={(e) => updateFormField('verification_code', e.target.value)}
                        className="font-mono font-bold tracking-widest text-center h-10 bg-slate-50"
                      />
                      <Button variant="outline" className="border-slate-200 hover:bg-slate-50 font-bold text-xs px-4" onClick={() => {
                        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                        updateFormField('verification_code', code);
                      }}>GENERATE</Button>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                    <Label className="text-xs font-bold text-slate-900 border-b pb-2 flex items-center gap-2 uppercase tracking-tighter">
                      <Globe className="h-3.5 w-3.5 text-blue-600" />
                      Social Profile URLs
                    </Label>
                    <div className="space-y-3">
                      {[
                        { label: 'Instagram', field: 'instagram_url', icon: Instagram },
                        { label: 'YouTube', field: 'youtube_url', icon: Youtube },
                        { label: 'Twitter / X', field: 'twitter_url', icon: Twitter },
                        { label: 'Main Website', field: 'website', icon: LinkIcon },
                      ].map((link) => (
                        <div key={link.field} className="space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-slate-400 ml-1">{link.label}</Label>
                          <div className="flex gap-2 group">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 flex items-center group-focus-within:border-blue-200 transition-colors">
                              <link.icon className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500" />
                            </div>
                            <Input 
                              value={editForm[link.field] || ''} 
                              onChange={(e) => updateFormField(link.field, e.target.value)}
                              className="h-10 text-xs border-slate-200 focus:ring-1 focus:ring-blue-100"
                              placeholder="https://..."
                            />
                            {editForm[link.field] && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg"
                                onClick={() => window.open(editForm[link.field], '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <SheetFooter className="p-6 bg-white border-t mt-auto sticky bottom-0 z-10 flex gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <Button 
              variant="ghost" 
              className="flex-1 font-bold text-slate-400 hover:text-slate-600" 
              onClick={() => setIsSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-[2] bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 font-bold gap-2 h-11" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
