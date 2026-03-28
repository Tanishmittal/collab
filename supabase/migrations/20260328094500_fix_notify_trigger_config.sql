CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://wospdshufpjpsjbdefzu.supabase.co/functions/v1/notify-user',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', NEW.body,
        'action_url', NEW.action_url,
        'data', jsonb_build_object(
          'action_url', NEW.action_url,
          'notification_id', NEW.id
        )
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
