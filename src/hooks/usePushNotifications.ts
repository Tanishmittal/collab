import { useEffect, useCallback, useRef } from 'react';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const initialized = useRef(false);

  const registerPush = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return;
      }

      await PushNotifications.register();
    } catch (err) {
      console.error('Error during push registration:', err);
    }
  }, []);

  const updateToken = useCallback(async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('user_id', user.id);

      if (error) throw error;
      console.log('FCM token updated successfully');
    } catch (err) {
      console.error('Error updating FCM token:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user || initialized.current) return;

    initialized.current = true;
    
    // 1. Native Push Listeners
    let registrationListener: any;
    let registrationErrorListener: any;
    let notificationReceivedListener: any;
    let notificationActionPerformedListener: any;

    if (Capacitor.isNativePlatform()) {
      const addListeners = async () => {
        registrationListener = await PushNotifications.addListener('registration', (token: Token) => {
          console.log('Push registration success');
          updateToken(token.value);
        });

        registrationErrorListener = await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        notificationReceivedListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
            toast({
              title: notification.title || 'New Notification',
              description: notification.body,
            });
          },
        );

        notificationActionPerformedListener = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: ActionPerformed) => {
            console.log('Push action performed: ' + JSON.stringify(action));
            const actionUrl = action.notification.data?.action_url;
            if (actionUrl) {
              console.log('Navigating to:', actionUrl);
              navigate(actionUrl);
            }
          },
        );
      };

      addListeners();
      registerPush();
    }

    // 2. Web Realtime Fallback (Internal App Alerts)
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          // Only show toast if we're not on a native platform (where push handles it)
          // or if the app is foregrounded.
          console.log('Realtime notification received:', payload);
          toast({
            title: payload.new.title || 'New Alert',
            description: payload.new.body,
            onClick: () => {
              if (payload.new.action_url) navigate(payload.new.action_url);
            }
          });
        }
      )
      .subscribe();

    return () => {
      if (registrationListener) registrationListener.remove();
      if (registrationErrorListener) registrationErrorListener.remove();
      if (notificationReceivedListener) notificationReceivedListener.remove();
      if (notificationActionPerformedListener) notificationActionPerformedListener.remove();
      supabase.removeChannel(channel);
      initialized.current = false;
    };
  }, [user, registerPush, updateToken, toast, navigate]);

  return { registerPush };
};
