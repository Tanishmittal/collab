CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment TEXT NOT NULL CHECK (segment IN ('all', 'influencers', 'brands')),
  city TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_broadcasts" ON public.admin_broadcasts;
CREATE POLICY "Admins can view admin_broadcasts"
ON public.admin_broadcasts
FOR SELECT
USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_created_at
ON public.admin_broadcasts(created_at DESC);
