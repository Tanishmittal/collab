import { useEffect, useCallback } from 'react';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

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
    if (!Capacitor.isNativePlatform() || !user) return;

    // Add listeners
    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      updateToken(token.value);
    });

    const registrationErrorListener = PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    const notificationReceivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
        toast({
          title: notification.title || 'New Notification',
          description: notification.body,
        });
      },
    );

    const notificationActionPerformedListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        // Handle navigation or other actions here
      },
    );

    // Initial registration
    registerPush();

    return () => {
      registrationListener.remove();
      registrationErrorListener.remove();
      notificationReceivedListener.remove();
      notificationActionPerformedListener.remove();
    };
  }, [user, registerPush, updateToken, toast]);

  return { registerPush };
};
