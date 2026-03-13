import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatThread from "@/components/ChatThread";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  applicationId: string;
  campaignId: string;
  campaignBrand: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (user) fetchConversations();
  }, [user, authLoading]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    // Get all messages involving this user
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!messages || messages.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Group by application_id
    const grouped = new Map<string, any[]>();
    for (const msg of messages) {
      const key = msg.application_id;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(msg);
    }

    const convos: Conversation[] = [];
    for (const [appId, msgs] of grouped) {
      const latest = msgs[0]; // already sorted desc
      const otherUserId = latest.sender_id === user.id ? latest.receiver_id : latest.sender_id;
      const unreadCount = msgs.filter((m: any) => m.receiver_id === user.id && !m.read).length;

      // Get other user's name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", otherUserId)
        .maybeSingle();

      // Get campaign brand
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("brand")
        .eq("id", latest.campaign_id)
        .maybeSingle();

      convos.push({
        applicationId: appId,
        campaignId: latest.campaign_id,
        campaignBrand: campaign?.brand || "Campaign",
        otherUserId,
        otherUserName: profile?.display_name || "User",
        lastMessage: latest.content,
        lastMessageTime: latest.created_at,
        unreadCount,
      });
    }

    setConversations(convos);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="minimal" title="Messages" />
        <div className="container max-w-4xl py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="minimal" title="Messages" />
      <div className="container max-w-4xl py-8">
        <h1 className="font-display font-bold text-2xl text-foreground mb-6">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Conversation list */}
          <div className="lg:col-span-2 space-y-2">
            {conversations.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <MessageSquare size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">No conversations yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Messages will appear here when you chat with brands or influencers.
                  </p>
                </CardContent>
              </Card>
            ) : (
              conversations.map((convo, i) => (
                <motion.div
                  key={convo.applicationId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={`glass-card cursor-pointer transition-colors hover:bg-muted/30 ${
                      selectedConvo?.applicationId === convo.applicationId ? "ring-2 ring-primary/50" : ""
                    }`}
                    onClick={() => setSelectedConvo(convo)}
                  >
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {convo.otherUserName}
                          </span>
                          {convo.unreadCount > 0 && (
                            <Badge variant="default" className="text-[10px] h-5 px-1.5">
                              {convo.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {convo.campaignBrand}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {convo.lastMessage}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground shrink-0 ml-2" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Chat area */}
          <div className="lg:col-span-3">
            {selectedConvo ? (
              <ChatThread
                applicationId={selectedConvo.applicationId}
                campaignId={selectedConvo.campaignId}
                otherUserId={selectedConvo.otherUserId}
                otherUserName={selectedConvo.otherUserName}
              />
            ) : (
              <Card className="glass-card h-[350px] flex items-center justify-center">
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
