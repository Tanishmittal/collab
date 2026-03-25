import React, { useState } from 'react';
import { 
  Megaphone, 
  Send, 
  Users, 
  UserCheck, 
  Building2, 
  MapPin, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Segment = 'all' | 'influencers' | 'brands';

export default function AdminBroadcast() {
  const [segment, setSegment] = useState<Segment>('all');
  const [city, setCity] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!title || !body) {
      toast({
        title: "Missing Content",
        description: "Please provide both a title and a message body.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('notify-user', {
        body: { 
          segment, 
          city: city || undefined, 
          title, 
          body 
        }
      });

      if (error) throw error;

      toast({
        title: "Broadcast Successful",
        description: `Sent to ${data.sent} users. ${data.failed} failed.`,
      });

      // Reset form
      setTitle('');
      setBody('');
      setCity('');
    } catch (err) {
      console.error('Broadcast error:', err);
      toast({
        title: "Broadcast Failed",
        description: "There was an error sending the notifications.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Compose Form */}
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">New Broadcast</h3>
              <p className="text-xs text-slate-400">Reach your audience instantly via push</p>
            </div>
          </div>

          {/* Targeting */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Recipient Segment</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSegment('all')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                  segment === 'all' ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                <Users className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">All Users</span>
              </button>
              <button
                onClick={() => setSegment('influencers')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                  segment === 'influencers' ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                <UserCheck className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Creators</span>
              </button>
              <button
                onClick={() => setSegment('brands')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                  segment === 'brands' ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                <Building2 className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Brands</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
              Location Filter
              <span className="text-[10px] font-normal text-slate-400 italic">Optional</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="e.g. Lucknow, Delhi..."
                className="pl-10 h-11 border-slate-200"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Notification Title</label>
              <Input
                placeholder="Short & Catchy"
                className="h-11 border-slate-200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Message Body</label>
              <Textarea
                placeholder="What do you want to tell them?"
                className="min-h-[120px] border-slate-200 resize-none"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={200}
              />
              <div className="text-[10px] text-slate-400 text-right">{body.length}/200 characters</div>
            </div>
          </div>

          <Button 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 shadow-lg shadow-blue-200 transition-all uppercase tracking-widest text-xs"
            onClick={handleSend}
            disabled={sending || !title || !body}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Broadcast
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-[10px] text-amber-700 leading-tight">
              Push notifications are sent immediately to all matched users. This action cannot be reversed.
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="hidden lg:flex flex-col items-center justify-center space-y-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Preview</h3>
        
        <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl flex flex-col overflow-hidden">
           {/* Phone Top Bar */}
           <div className="h-10 w-full flex items-center justify-between px-8 pt-2">
              <span className="text-[10px] text-white font-bold">9:41</span>
              <div className="flex gap-2">
                 <div className="h-2 w-2 rounded-full bg-white/40" />
                 <div className="h-2 w-4 rounded-sm bg-white" />
              </div>
           </div>

           {/* Notification Card */}
           <div className="mt-8 px-4 animate-in fade-in slide-in-from-top-4 duration-1000">
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                       <div className="h-5 w-5 bg-blue-600 rounded flex items-center justify-center">
                          <CheckCircle2 className="text-white h-3 w-3" />
                       </div>
                       <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">Influgal</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Now</span>
                 </div>
                 <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {title || "Your Notification Title"}
                 </h4>
                 <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                    {body || "Your message body will appear here as the user sees it on their lock screen."}
                 </p>
              </div>
           </div>

           {/* Phone Indicators */}
           <div className="mt-auto h-20 w-full flex items-center justify-center gap-1 opacity-20">
              <div className="h-1 w-1 rounded-full bg-white" />
              <div className="h-1 w-1 rounded-full bg-white" />
              <div className="h-1 w-1 rounded-full bg-white" />
           </div>
           <div className="h-1 w-20 bg-white/20 rounded-full mx-auto mb-4" />
        </div>
        
        <div className="flex items-center gap-4 text-slate-400">
           <div className="flex items-center gap-1 text-xs">
              <Smartphone className="h-4 w-4" />
              <span>iOS 18+</span>
           </div>
           <div className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-4 w-4" />
              <span>Push Enabled</span>
           </div>
        </div>
      </div>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
