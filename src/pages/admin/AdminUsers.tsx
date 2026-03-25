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
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

type UserType = 'influencer' | 'brand';

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<UserType>('influencer');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
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
                "bg-white p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between",
                user.is_active ? "border-slate-200 shadow-sm" : "border-red-100 bg-red-50/30 opacity-80"
              )}
            >
              <div className="flex items-center gap-4">
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
                  onClick={() => toggleStatus(user.id, user.is_active)}
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
                  onClick={() => {
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
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
