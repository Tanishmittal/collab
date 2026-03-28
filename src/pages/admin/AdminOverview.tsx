import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/button';

interface Stats {
  totalUsers: number;
  totalBrands: number;
  totalInfluencers: number;
  needsProfile: number;
  activeCampaigns: number;
  totalBookings: number;
  revenue: number;
}

export const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { data: profileRows, count: totalUserCount },
          { data: influencerRows },
          { data: brandRows },
          { count: campaignCount },
          { count: bookingCount },
          { data: bookingData }
        ] = await Promise.all([
          supabase.from('profiles').select('user_id', { count: 'exact' }),
          supabase.from('influencer_profiles').select('user_id'),
          supabase.from('brand_profiles').select('user_id'),
          supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('bookings').select('*', { count: 'exact', head: true }),
          supabase.from('bookings').select('total_amount').eq('status', 'completed')
        ]);

        const totalRevenue = bookingData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;
        const creatorUserIds = new Set((influencerRows || []).map((row) => row.user_id));
        const brandUserIds = new Set((brandRows || []).map((row) => row.user_id));
        const usersWithCompletedProfiles = new Set([...creatorUserIds, ...brandUserIds]);
        const pendingCount =
          (profileRows || []).filter((row) => !usersWithCompletedProfiles.has(row.user_id)).length;

        setStats({
          totalUsers: totalUserCount || 0,
          totalBrands: brandUserIds.size,
          totalInfluencers: creatorUserIds.size,
          needsProfile: pendingCount,
          activeCampaigns: campaignCount || 0,
          totalBookings: bookingCount || 0,
          revenue: totalRevenue
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      meta: `${stats?.totalInfluencers ?? 0} creators • ${stats?.totalBrands ?? 0} brands • ${stats?.needsProfile ?? 0} pending`,
    },
    { title: 'Active Campaigns', value: stats?.activeCampaigns, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Bookings', value: stats?.totalBookings, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Platform Revenue', value: `$${stats?.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white p-3 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow min-h-[128px] md:min-h-[180px]">
            <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
              <div className={cn("p-2 md:p-3 rounded-xl", card.bg)}>
                <card.icon className={cn("h-4 w-4 md:h-6 md:w-6", card.color)} />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-[10px] md:text-xs font-bold leading-none bg-emerald-50 px-1.5 md:px-2 py-1 rounded-full">
                <ArrowUpRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
                <span>+12%</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-[11px] md:text-sm font-medium leading-snug">{card.title}</p>
              <h3 className="text-xl md:text-3xl font-bold text-slate-800 mt-1 break-words">{card.value}</h3>
              {'meta' in card && card.meta && (
                <p className="mt-1 text-[10px] md:text-xs font-medium text-slate-400 leading-snug">
                  {card.meta}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Growth Analysis</h3>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-slate-50 rounded text-xs font-medium text-slate-500">Last 30 Days</div>
            </div>
          </div>
          <div className="flex items-center justify-center h-full text-slate-300 border-2 border-dashed border-slate-50 rounded-xl">
             Chart Visualization Placeholder
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">User Distribution</h3>
          <div className="space-y-6">
            {['Beauty', 'Tech', 'Fashion', 'Gaming'].map((niche) => (
              <div key={niche} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{niche}</span>
                  <span className="text-slate-400">45%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for Tailwind classes
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
