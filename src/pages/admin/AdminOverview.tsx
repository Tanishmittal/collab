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
          { count: brandCount },
          { count: influencerCount },
          { count: campaignCount },
          { count: bookingCount },
          { data: bookingData }
        ] = await Promise.all([
          supabase.from('brand_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('influencer_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('bookings').select('*', { count: 'exact', head: true }),
          supabase.from('bookings').select('total_amount').eq('status', 'completed')
        ]);

        const totalRevenue = bookingData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

        setStats({
          totalUsers: (brandCount || 0) + (influencerCount || 0),
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
    { title: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active Campaigns', value: stats?.activeCampaigns, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Bookings', value: stats?.totalBookings, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Platform Revenue', value: `$${stats?.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", card.bg)}>
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold leading-none bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                <span>+12%</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{card.title}</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{card.value}</h3>
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
