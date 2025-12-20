// =============================================
// AEGIS PUSH NOTIFICATIONS HOOK
// Manages browser push notification permissions
// and subscriptions for real-time alerts
// =============================================

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import aegisPush, {
  requestNotificationPermission,
  hasNotificationPermission,
  sendPushNotification,
  sendAlert
} from '../services/PushNotificationService';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const usePushNotifications = (isAuthenticated = false) => {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const granted = await requestNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      
      if (granted) {
        // Get subscription after permission granted
        await subscribeToNotifications();
      }
      
      return granted;
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      setError('Failed to request notification permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribeToNotifications = useCallback(async () => {
    if (!isSupported || permission !== 'granted') {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription or create new one
      let pushSubscription = await registration.pushManager.getSubscription();
      
      if (!pushSubscription) {
        // Create new subscription
        // Note: In production, you'd use a VAPID public key from your server
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            // This is a placeholder VAPID key - in production, generate your own
            'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
          )
        });
      }

      setSubscription(pushSubscription);

      // Send subscription to backend
      await sendSubscriptionToServer(pushSubscription);

      return pushSubscription;
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      setError('Failed to subscribe to notifications');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission]);

  // Send subscription to backend
  const sendSubscriptionToServer = async (pushSubscription) => {
    try {
      await axios.post(`${API}/notifications/subscribe`, {
        subscription: pushSubscription.toJSON(),
        timestamp: new Date().toISOString()
      });
      console.log('Push subscription sent to server');
    } catch (err) {
      console.error('Failed to send subscription to server:', err);
      // Don't throw - notifications will still work locally
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    setIsLoading(true);
    setError(null);

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Notify backend
      await axios.post(`${API}/notifications/unsubscribe`, {
        endpoint: subscription.endpoint
      });

      return true;
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      setError('Failed to unsubscribe from notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    if (permission !== 'granted') {
      console.log('Permission not granted for notifications');
      return false;
    }

    return sendPushNotification({
      title: '🛡️ Aegis Test Notification',
      body: 'Push notifications are working! Your Digital Mate is ready.',
      tag: 'aegis-test',
      vibrate: [200, 100, 200]
    });
  }, [permission]);

  // Send Aegis-specific notifications
  const sendAegisAlert = useCallback(async (message, type = 'info') => {
    if (permission !== 'granted') {
      console.log('Permission not granted for notifications');
      return false;
    }

    return sendAlert(message, type);
  }, [permission]);

  // Auto-initialize when authenticated
  useEffect(() => {
    if (isAuthenticated && isSupported && permission === 'default') {
      // Don't auto-request - let user initiate
      console.log('Push notifications available - waiting for user to enable');
    }
  }, [isAuthenticated, isSupported, permission]);

  return {
    // State
    permission,
    isSupported,
    isSubscribed: !!subscription,
    isLoading,
    error,
    
    // Actions
    requestPermission,
    subscribeToNotifications,
    unsubscribe,
    sendTestNotification,
    sendAegisAlert,
    
    // Utilities
    hasPermission: permission === 'granted'
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default usePushNotifications;
