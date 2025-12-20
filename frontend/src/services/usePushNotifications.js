import { useState, useEffect, useCallback } from 'react';
import aegisPush, { requestNotificationPermission, sendPushNotification } from './PushNotificationService';

// =============================================
// USE PUSH NOTIFICATIONS HOOK
// Manages push notification state and sending
// =============================================

export const usePushNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setSupported('Notification' in window);
    
    // Get current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  const sendNotification = useCallback(async (options) => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    return sendPushNotification(options);
  }, [permission, requestPermission]);

  return {
    supported,
    permission,
    requestPermission,
    sendNotification,
    isEnabled: permission === 'granted'
  };
};

// =============================================
// NOTIFICATION PERMISSION PROMPT COMPONENT
// Shows a nice UI to request notification permission
// =============================================

export const NotificationPermissionPrompt = ({ onGranted, onDismissed }) => {
  const { supported, permission, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  if (!supported || permission === 'granted' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted && onGranted) {
      onGranted();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismissed) {
      onDismissed();
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-cyan-900/95 to-blue-900/95 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
        <div className="flex items-start space-x-3">
          <div className="text-3xl">🔔</div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg">Enable Notifications?</h3>
            <p className="text-sm text-slate-300 mt-1">
              Get alerts for emergencies, calendar reminders, and important updates even when the app is closed.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleEnable}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                Enable Notifications
              </button>
              <button
                onClick={handleDismiss}
                className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default usePushNotifications;
