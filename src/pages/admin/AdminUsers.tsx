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
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
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
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const table = activeTab === 'influencer' ? 'influencer_profiles' : 'brand_profiles';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    setProcessingId(userId);
    try {
      const table = activeTab === 'influencer' ? 'influencer_profiles' : 'brand_profiles';
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      
      toast({
        title: `Profile ${!currentStatus ? 'Activated' : 'Hidden'}`,
        description: `The ${activeTab} profile visibility has been updated successfully.`,
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

  const filteredUsers = users.filter(user => 
    (user.name || user.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.city || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={`Search ${activeTab}s...`}
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
                "bg-white p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer hover:border-blue-200 hover:shadow-md group",
                user.is_active ? "border-slate-200 shadow-sm" : "border-red-100 bg-red-50/30 opacity-80"
              )}
              onClick={() => handleEdit(user)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="h-14 w-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden relative">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-xl uppercase">
                      {(user.name || user.business_name || '?')[0]}
                    </div>
                  )}
                  {!user.is_active && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <EyeOff className="text-red-600 h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800">{user.name || user.business_name}</h4>
                    {user.is_verified && <CheckCircle className="h-4 w-4 text-blue-500" fill="currentColor" />}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-slate-500 text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{user.city || 'Global'}</span>
                    </div>
                    <span>•</span>
                    <span className="capitalize">{user.niche || 'General'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 border-slate-200",
                    user.is_active ? "text-slate-600" : "text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(user.id, user.is_active);
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
                      <span>Unhide</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) {
                        // Hard delete logic could go here if needed, but we prefer hide as per plan.
                        toast({ title: 'Danger Zone', description: 'Hard deletion is restricted to database level for safety.', variant: 'destructive' });
                     }
                  }}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl flex flex-col h-full p-0">
          <div className="flex-1 overflow-y-auto p-6 pb-12">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                Moderating {activeTab === 'influencer' ? editForm?.name : editForm?.business_name}
                {editForm?.is_verified && <CheckCircle className="h-4 w-4 text-blue-500" fill="currentColor" />}
              </SheetTitle>
              <SheetDescription>
                Update profile information directly to fix completeness or moderation issues.
              </SheetDescription>
            </SheetHeader>

            {editForm && (
              <div className="space-y-6">
                {/* Profile Image Preview */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="h-20 w-20 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                    <img src={editForm.avatar_url || editForm.logo_url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{editForm.name || editForm.business_name}</h3>
                    <p className="text-sm text-slate-500">{editForm.city || 'No city set'}</p>
                    {!editForm.avatar_url && !editForm.logo_url && (
                      <Badge variant="destructive" className="mt-1">Missing Avatar</Badge>
                    )}
                  </div>
                </div>

              {/* Status & Verification */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center space-x-2 border rounded-lg p-3 bg-white">
                   <input 
                     type="checkbox"
                     id="is_verified"
                     checked={editForm.is_verified || false}
                     onChange={(e) => updateFormField('is_verified', e.target.checked)}
                     className="h-4 w-4 text-blue-600 rounded"
                   />
                   <Label htmlFor="is_verified" className="cursor-pointer">Verified Account</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 bg-white">
                   <input 
                     type="checkbox"
                     id="is_active"
                     checked={editForm.is_active || false}
                     onChange={(e) => updateFormField('is_active', e.target.checked)}
                     className="h-4 w-4 text-blue-600 rounded"
                   />
                   <Label htmlFor="is_active" className="cursor-pointer">Active / Visible</Label>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name / Business Name</Label>
                  <Input 
                    value={editForm.name || editForm.business_name || ''} 
                    onChange={(e) => updateFormField(activeTab === 'influencer' ? 'name' : 'business_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input 
                    value={editForm.city || ''} 
                    onChange={(e) => updateFormField('city', e.target.value)}
                  />
                </div>
              </div>

              {/* Niche / Industry */}
              <div className="space-y-2">
                <Label>{activeTab === 'influencer' ? 'Niche' : 'Industry'}</Label>
                <Input 
                  value={editForm.niche || editForm.industry || ''} 
                  onChange={(e) => updateFormField(activeTab === 'influencer' ? 'niche' : 'industry', e.target.value)}
                />
              </div>

              {/* Bio / Description */}
              <div className="space-y-2">
                <Label>Bio / Description</Label>
                <Textarea 
                  rows={4}
                  value={editForm.bio || editForm.description || ''} 
                  onChange={(e) => updateFormField(activeTab === 'influencer' ? 'bio' : 'description', e.target.value)}
                  className={!editForm.bio && !editForm.description ? "border-red-200 bg-red-50/20" : ""}
                />
                {(!editForm.bio && !editForm.description) && (
                  <p className="text-[10px] text-red-500 font-medium italic">Empty profiles are less likely to be chosen by partners.</p>
                )}
              </div>

              {/* Stats & Socials - Influencer Specific */}
              {activeTab === 'influencer' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Follower Count (Display)</Label>
                      <Input 
                        value={editForm.followers || ''} 
                        onChange={(e) => updateFormField('followers', e.target.value)}
                        placeholder="e.g. 10.5K"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Engagement Rate (%)</Label>
                      <Input 
                        type="number"
                        step="0.1"
                        value={editForm.engagement_rate || ''} 
                        onChange={(e) => updateFormField('engagement_rate', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Active Platforms */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-bold">Active Platforms (Icons to show)</Label>
                    <div className="flex flex-wrap gap-3">
                      {['Instagram', 'YouTube', 'Twitter'].map(plat => (
                        <div key={plat} className="flex items-center space-x-2 border rounded-full px-4 py-2 bg-white shadow-sm">
                          <input 
                            type="checkbox"
                            checked={(editForm.platforms || []).includes(plat)}
                            onChange={(e) => {
                              const current = editForm.platforms || [];
                              const next = e.target.checked 
                                ? [...current, plat] 
                                : current.filter((p: string) => p !== plat);
                              updateFormField('platforms', next);
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">{plat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Social Profile Links</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1 font-bold text-slate-700">
                          <Instagram className="h-3 w-3" /> Instagram URL
                        </Label>
                        <Input 
                          value={editForm.instagram_url || ''} 
                          onChange={(e) => updateFormField('instagram_url', e.target.value)}
                          className={!editForm.instagram_url ? "border-orange-100 bg-orange-50/10" : ""}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1 font-bold text-slate-700">
                          <Youtube className="h-3 w-3" /> YouTube URL
                        </Label>
                        <Input 
                          value={editForm.youtube_url || ''} 
                          onChange={(e) => updateFormField('youtube_url', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1 font-bold text-slate-700">
                          <Twitter className="h-3 w-3" /> Twitter URL
                        </Label>
                        <Input 
                          value={editForm.twitter_url || ''} 
                          onChange={(e) => updateFormField('twitter_url', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Brand Specific */}
              {activeTab === 'brand' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Brand Presence</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Website</Label>
                      <Input 
                        value={editForm.website || ''} 
                        onChange={(e) => updateFormField('website', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Business Title / Tagline</Label>
                      <Input 
                        value={editForm.brand_tagline || ''} 
                        onChange={(e) => updateFormField('brand_tagline', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>

          <SheetFooter className="p-6 bg-white border-t mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <Button 
              className="w-full gap-2 h-12 text-base font-bold shadow-lg shadow-blue-200"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Moderation Changes
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
