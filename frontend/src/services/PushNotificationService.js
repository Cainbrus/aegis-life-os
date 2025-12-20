// =============================================
// AEGIS PUSH NOTIFICATION SERVICE
// Real browser push notifications
// Works even when app is in background
// =============================================

class AegisPushService {
  constructor() {
    this.permission = 'default';
    this.supported = 'Notification' in window;
    this.serviceWorkerReady = false;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.supported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Check if we have permission
  hasPermission() {
    return this.permission === 'granted';
  }

  // Send a push notification
  async send(options) {
    if (!this.supported || this.permission !== 'granted') {
      console.log('Cannot send notification - no permission');
      return false;
    }

    const {
      title = 'Aegis Alert',
      body = '',
      icon = '/favicon.ico',
      badge = '/favicon.ico',
      tag = 'aegis-notification',
      vibrate = [200, 100, 200],
      requireInteraction = false,
      actions = [],
      data = {},
      silent = false
    } = options;

    try {
      // Try to use service worker for persistent notifications
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon,
          badge,
          tag,
          vibrate,
          requireInteraction,
          actions,
          data,
          silent
        });
      } else {
        // Fallback to basic notification
        new Notification(title, {
          body,
          icon,
          tag,
          silent
        });
      }
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Predefined notification types
  async sendAlert(message, type = 'info') {
    const configs = {
      security: {
        title: '🚨 Security Alert',
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true
      },
      emergency: {
        title: '🆘 EMERGENCY',
        vibrate: [500, 200, 500, 200, 500],
        requireInteraction: true
      },
      calendar: {
        title: '📅 Calendar Reminder',
        vibrate: [200, 100, 200]
      },
      family: {
        title: '👨‍👩‍👧 Family Alert',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true
      },
      finance: {
        title: '💰 Financial Alert',
        vibrate: [200, 100, 200]
      },
      health: {
        title: '💊 Health Reminder',
        vibrate: [150, 100, 150]
      },
      info: {
        title: '🛡️ Aegis',
        vibrate: [100]
      }
    };

    const config = configs[type] || configs.info;
    return this.send({
      ...config,
      body: message
    });
  }

  // Schedule a notification for later
  scheduleNotification(options, delayMs) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await this.send(options);
        resolve(result);
      }, delayMs);
    });
  }
}

// Create singleton instance
const aegisPush = new AegisPushService();

// Export for use in React components
export const requestNotificationPermission = () => aegisPush.requestPermission();
export const hasNotificationPermission = () => aegisPush.hasPermission();
export const sendPushNotification = (options) => aegisPush.send(options);
export const sendAlert = (message, type) => aegisPush.sendAlert(message, type);
export const scheduleNotification = (options, delay) => aegisPush.scheduleNotification(options, delay);

export default aegisPush;
