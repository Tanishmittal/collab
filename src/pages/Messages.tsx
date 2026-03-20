import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatThread from "@/components/ChatThread";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  conversationKey: string;
  applicationId: string | null;
  campaignId: string;
  campaignBrand: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const hasLoadedRef = useRef(false);

  const mergeConversationFromMessage = useCallback(async (message: MessageRow) => {
    if (!user) return;

    const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
    const conversationKey = `${message.campaign_id}:${otherUserId}`;

    const [{ data: profile }, { data: influencerProfile }, { data: brandProfile }, { data: campaign }] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("user_id", otherUserId).maybeSingle(),
      supabase.from("influencer_profiles").select("avatar_url").eq("user_id", otherUserId).maybeSingle(),
      supabase.from("brand_profiles").select("logo_url").eq("user_id", otherUserId).maybeSingle(),
      supabase.from("campaigns").select("brand").eq("id", message.campaign_id).maybeSingle(),
    ]);

    setConversations((current) => {
      const existing = current.find((convo) => convo.conversationKey === conversationKey);
      const nextUnreadCount =
        message.receiver_id === user.id && !message.read
          ? (existing?.unreadCount || 0) + 1
          : existing?.unreadCount || 0;

      const nextConversation: Conversation = {
        conversationKey,
        applicationId: message.application_id,
        campaignId: message.campaign_id,
        campaignBrand: campaign?.brand || existing?.campaignBrand || "Campaign",
        otherUserId,
        otherUserName: profile?.display_name || existing?.otherUserName || "User",
        otherUserAvatar: influencerProfile?.avatar_url || brandProfile?.logo_url || existing?.otherUserAvatar || null,
        lastMessage: message.content,
        lastMessageTime: message.created_at,
        unreadCount: nextUnreadCount,
      };

      return [nextConversation, ...current.filter((convo) => convo.conversationKey !== conversationKey)];
    });
  }, [user]);

  const fetchConversations = useCallback(async (showLoading = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (showLoading && !hasLoadedRef.current) {
      setLoading(true);
    }

    try {
      // Get all messages involving this user
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!messages || messages.length === 0) {
        setConversations([]);
        setSelectedConvo(null);
        return;
      }

      // Group by campaign + participant so each thread is campaign-specific
      const grouped = new Map<string, MessageRow[]>();
      for (const msg of messages) {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const key = `${msg.campaign_id}:${otherUserId}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(msg);
      }

      const convos: Conversation[] = [];
      for (const [conversationKey, msgs] of grouped) {
        const latest = msgs[0]; // already sorted desc
        const otherUserId = latest.sender_id === user.id ? latest.receiver_id : latest.sender_id;
        const unreadCount = msgs.filter((m) => m.receiver_id === user.id && !m.read).length;

        // Get other user's name
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", otherUserId)
          .maybeSingle();

        const [{ data: influencerProfile }, { data: brandProfile }] = await Promise.all([
          supabase
            .from("influencer_profiles")
            .select("logo_url")
            .eq("user_id", otherUserId)
            .maybeSingle(),
          supabase
            .from("brand_profiles")
            .select("avatar_url")
            .eq("user_id", otherUserId)
            .maybeSingle(),
        ]);

        // Get campaign brand
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("brand")
          .eq("id", latest.campaign_id)
          .maybeSingle();

        convos.push({
          conversationKey,
          applicationId: latest.application_id,
          campaignId: latest.campaign_id,
          campaignBrand: campaign?.brand || "Campaign",
          otherUserId,
          otherUserName: profile?.display_name || "User",
          otherUserAvatar: influencerProfile?.avatar_url || brandProfile?.logo_url || null,
          lastMessage: latest.content,
          lastMessageTime: latest.created_at,
          unreadCount,
        });
      }

      setConversations(convos);
      setSelectedConvo((current) => {
        const selectedConversationId = searchParams.get("convo");

        if (selectedConversationId) {
          return convos.find((convo) => convo.conversationKey === selectedConversationId) || null;
        }

        if (convos.length === 0) return null;
        if (current) {
          return convos.find((convo) => convo.conversationKey === current.conversationKey) || convos[0];
        }
        return convos[0];
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [searchParams, user]);

  useEffect(() => {
    const selectedConversationId = searchParams.get("convo");

    if (!selectedConversationId) {
      setSelectedConvo(null);
      return;
    }

    setSelectedConvo((current) => {
      if (current?.conversationKey === selectedConversationId) {
        return current;
      }

      return conversations.find((convo) => convo.conversationKey === selectedConversationId) || null;
    });
  }, [conversations, searchParams]);

  const openConversation = (conversation: Conversation) => {
    setSelectedConvo(conversation);
    setSearchParams({ convo: conversation.conversationKey });
  };

  const closeConversation = () => {
    setSelectedConvo(null);
    setSearchParams({});
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (user) {
      void fetchConversations(true);
    }
  }, [user, authLoading, navigate, fetchConversations]);

  // Setup realtime subscription for messages
  useEffect(() => {
    if (!user) return;

    // Cancel previous subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:user:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new as MessageRow;
          if (message.sender_id !== user.id && message.receiver_id !== user.id) {
            return;
          }

          void mergeConversationFromMessage(message);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  }, [mergeConversationFromMessage, user]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background md:h-full md:min-h-full">
        <div className="md:hidden">
          <Navbar variant="minimal" title="All conversations" />
        </div>
        <div className="space-y-4 px-4 py-4 md:px-6 md:py-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background md:h-[calc(100vh-5rem)] md:min-h-0">
      {!selectedConvo ? (
        <div className="fixed inset-x-0 top-0 z-30 md:hidden">
          <Navbar variant="minimal" title="All conversations" />
        </div>
      ) : null}
      <div
        className={`flex flex-1 flex-col overflow-hidden md:min-h-0 ${
          selectedConvo
            ? "px-0 pb-16 pt-0 md:px-6 md:pb-6 md:pt-6"
            : "px-0 pb-16 pt-0 md:px-6 md:pb-6 md:pt-6"
        }`}
      >
        <h1 className="mb-4 hidden font-display text-2xl font-bold text-foreground md:block">Messages</h1>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden md:min-h-0 md:flex-row md:gap-6">
          {/* Conversation list */}
          <div
            className={`${
              selectedConvo
                ? "hidden md:flex"
                : "fixed inset-x-0 top-14 bottom-16 flex flex-col px-4 py-4 md:static md:inset-auto md:px-0 md:py-0"
            } md:min-h-0 md:w-[360px] md:shrink-0`}
          >
            {conversations.length === 0 ? (
              <Card className="glass-card md:h-full">
                <CardContent className="p-8 text-center">
                  <MessageSquare size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">No campaign conversations yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Conversations will appear here once a brand or creator starts chatting with you about a campaign.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1 pb-2">
                {conversations.map((convo, i) => (
                  <motion.div
                    key={convo.conversationKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className={`glass-card cursor-pointer transition-colors hover:bg-muted/30 ${
                        selectedConvo?.conversationKey === convo.conversationKey ? "ring-2 ring-primary/50" : ""
                      }`}
                      onClick={() => openConversation(convo)}
                    >
                      <CardContent className="flex items-center justify-between p-3.5">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                            {convo.otherUserAvatar ? (
                              <img
                                src={convo.otherUserAvatar}
                                alt={convo.otherUserName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              convo.otherUserName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-foreground">
                                {convo.campaignBrand}
                              </span>
                              {convo.unreadCount > 0 && (
                                <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                                  {convo.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {convo.otherUserName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {convo.lastMessage}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="ml-2 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Chat area */}
          <div
            className={`${
              selectedConvo
                ? "fixed inset-x-0 top-0 bottom-16 z-20 flex bg-white md:static md:inset-auto md:z-auto md:bg-transparent"
                : "hidden md:flex"
            } min-h-0 flex-1 flex-col overflow-hidden`}
          >
            {selectedConvo ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:rounded-[1.5rem] md:border md:border-gray-200 md:bg-white md:shadow-sm">
                <ChatThread
                  applicationId={selectedConvo.applicationId}
                  campaignId={selectedConvo.campaignId}
                  campaignLabel={selectedConvo.campaignBrand}
                  otherUserId={selectedConvo.otherUserId}
                  otherUserName={selectedConvo.otherUserName}
                  otherUserAvatar={selectedConvo.otherUserAvatar}
                  onBack={closeConversation}
                  onMessageSent={mergeConversationFromMessage}
                />
              </div>
            ) : (
              <Card className="glass-card flex h-full min-h-[320px] items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
