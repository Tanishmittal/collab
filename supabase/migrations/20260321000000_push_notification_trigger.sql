-- Create a trigger function that calls our notify-user edge function
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- We call the edge function asynchronously
  -- Requires 'pg_net' extension to be enabled (already is by default in Supabase)
  PERFORM
    net.http_post(
      url := (SELECT value FROM JSONB_EACH_TEXT(current_setting('app.settings.supabase_url', true)::jsonb) WHERE key = 'supabase_url') || '/functions/v1/notify-user',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', NEW.body,
        'data', jsonb_build_object(
          'action_url', NEW.action_url,
          'notification_id', NEW.id
        )
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the trigger to the notifications table
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_notification();
