import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function AdminHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const filteredLogs = logs.filter(log => 
    (log.recipient_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.notification_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.error_message || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notification History</h2>
          <p className="text-slate-500">Track moderation emails and delivery status</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-slate-200"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Clock className="h-10 w-10 text-blue-500 animate-pulse mb-4" />
          <p className="text-slate-500 font-medium">Loading history...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100 italic text-slate-400">
          No logs found matching your criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600">Date & Time</th>
                  <th className="p-4 font-semibold text-slate-600">Recipient</th>
                  <th className="p-4 font-semibold text-slate-600">Type</th>
                  <th className="p-4 font-semibold text-slate-600">Status</th>
                  <th className="p-4 font-semibold text-slate-600">Details / Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      <div className="flex flex-col">
                        <span>{log.recipient_email}</span>
                        {log.user_id && <span className="text-[10px] text-slate-400 font-normal">ID: {log.user_id.split('-')[0]}...</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize text-[10px] bg-slate-50">
                        {(log.notification_type || 'unknown').replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Sent</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-600 font-medium">
                            <XCircle className="h-4 w-4" />
                            <span>Failed</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {log.error_message ? (
                        <div className="flex items-start gap-2 text-rose-500 text-xs bg-rose-50 p-2 rounded-md border border-rose-100 max-w-xs">
                          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="break-words line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                            {log.error_message}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No errors</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
