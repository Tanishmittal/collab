import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Loader2, ArrowLeft, MapPin, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface CampaignIntro {
  id: string;
  brand: string;
  city: string;
  niche: string;
  budget: number;
  deliverables: string[];
}

const isUnreadForUser = (message: Message, userId: string) =>
  message.receiver_id === userId && !message.read;

const getInitial = (label?: string | null) => (label?.trim()?.charAt(0) || "U").toUpperCase();

interface ChatThreadProps {
  applicationId?: string | null;
  campaignId: string;
  campaignLabel?: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
  onMessageSent?: (message: { content: string; created_at: string; campaign_id: string; application_id: string | null; sender_id: string; receiver_id: string; }) => void;
  hideIntro?: boolean;
}

const ChatThread = ({ applicationId, campaignId, campaignLabel, otherUserId, otherUserName, otherUserAvatar, onBack, onMessageSent, hideIntro }: ChatThreadProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [campaignIntro, setCampaignIntro] = useState<CampaignIntro | null>(null);
  const [showCampaignIntro, setShowCampaignIntro] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("campaign_id", campaignId)
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data as Message[]);
      // Mark unread messages as read
      const unread = (data as Message[]).filter((message) => isUnreadForUser(message, user!.id));
      if (unread.length > 0) {
        await Promise.all(
          unread.map((message) => supabase.from("messages").update({ read: true }).eq("id", message.id))
        );
      }
    }
  }, [campaignId, otherUserId, user]);

  useEffect(() => {
    if (!user) return;
    fetchMessages();

    const channel = supabase
      .channel(`chat-${applicationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          const isParticipantMessage =
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id);

          if (!isParticipantMessage) {
            return;
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Mark as read if we're the receiver
          if (msg.receiver_id === user.id && !msg.read) {
            supabase.from("messages").update({ read: true }).eq("id", msg.id).then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId, campaignId, fetchMessages, otherUserId, user]);

  useEffect(() => {
    if (!campaignId || !user) return;

    const fetchCampaignIntroState = async () => {
      const [{ data: campaign }, { data: earliestMessage }] = await Promise.all([
        supabase
          .from("campaigns")
          .select("id, brand, city, niche, budget, deliverables")
          .eq("id", campaignId)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("sender_id, receiver_id, created_at")
          .eq("campaign_id", campaignId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      setCampaignIntro((campaign as CampaignIntro | null) ?? null);

      if (!earliestMessage) {
        setShowCampaignIntro(true);
        return;
      }

      const firstThreadMatchesCurrentConversation =
        (earliestMessage.sender_id === user.id && earliestMessage.receiver_id === otherUserId) ||
        (earliestMessage.sender_id === otherUserId && earliestMessage.receiver_id === user.id);

      setShowCampaignIntro(firstThreadMatchesCurrentConversation);
    };

    void fetchCampaignIntroState();
  }, [campaignId, otherUserId, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    const payload = {
      campaign_id: campaignId,
      application_id: applicationId,
      sender_id: user.id,
      receiver_id: otherUserId,
      content: newMessage.trim().slice(0, 1000),
    };
    const { data, error } = await supabase.from("messages").insert(payload).select("*").single();
    if (!error) {
      setNewMessage("");
      if (data) {
        onMessageSent?.({
          content: data.content,
          created_at: data.created_at,
          campaign_id: data.campaign_id,
          application_id: data.application_id,
          sender_id: data.sender_id,
          receiver_id: data.receiver_id,
        });
      }
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground md:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-700">
            {otherUserAvatar ? (
              <img src={otherUserAvatar} alt={otherUserName} className="h-full w-full object-cover" />
            ) : (
              getInitial(otherUserName)
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{otherUserName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {campaignLabel ? `Regarding ${campaignLabel}` : "Campaign conversation"}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {!hideIntro && showCampaignIntro && campaignIntro && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Campaign</p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900">{campaignIntro.brand}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {campaignIntro.city}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {campaignIntro.niche}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                  <IndianRupee size={14} />
                  {campaignIntro.budget.toLocaleString()}
                </div>
              </div>
              {campaignIntro.deliverables.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {campaignIntro.deliverables.map((deliverable) => (
                    <span
                      key={deliverable}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600"
                    >
                      {deliverable}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No messages yet. Start the campaign conversation.
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                {!isMine && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    {otherUserAvatar ? (
                      <img src={otherUserAvatar} alt={otherUserName} className="h-full w-full object-cover" />
                    ) : (
                      getInitial(otherUserName)
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    isMine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-slate-100 text-foreground"
                  }`}
                >
                  <p>{msg.content}</p>
                  <span className={`mt-1 block text-[10px] ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {isMine && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                    {getInitial(user?.user_metadata?.display_name || user?.email || "U")}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="shrink-0 border-t bg-white p-3">
        <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={1000}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending}>
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatThread;
