-- Create notification_logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    notification_type TEXT NOT NULL, -- e.g. 'profile_hidden', 'campaign_hidden'
    status TEXT NOT NULL, -- 'success', 'failed'
    error_message TEXT,
    items JSONB, -- list of items attached to notification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view notification logs" ON public.notification_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- The Edge Function (service role) can insert
CREATE POLICY "Service role can insert notification logs" ON public.notification_logs
    FOR INSERT
    WITH CHECK (true);

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
