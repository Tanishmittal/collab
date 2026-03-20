import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  actionUrl?: string | null;
  metadata?: Json;
}

export const createNotification = async ({
  userId,
  type,
  title,
  body = null,
  actionUrl = null,
  metadata = {},
}: CreateNotificationInput) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    action_url: actionUrl,
    metadata,
  });

  if (error) {
    throw error;
  }
};
