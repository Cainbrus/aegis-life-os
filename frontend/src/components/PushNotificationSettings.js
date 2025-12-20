// =============================================
// AEGIS PUSH NOTIFICATION SETTINGS
// UI component for managing push notifications
// =============================================

import React from 'react';
import usePushNotifications from '../hooks/usePushNotifications';

const PushNotificationSettings = ({ isAuthenticated = false, onClose }) => {
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    sendTestNotification,
    hasPermission
  } = usePushNotifications(isAuthenticated);

  if (!isSupported) {
    return (
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="text-center">
          <div className="text-4xl mb-4">🔕</div>
          <h3 className="text-lg font-semibold text-white mb-2">Push Notifications Not Supported</h3>
          <p className="text-slate-400 text-sm">
            Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🔔</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Push Notifications</h3>
            <p className="text-sm text-slate-400">Get alerts even when the app is closed</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status */}
      <div className="mb-6">
        <div className={`p-4 rounded-xl ${
          hasPermission 
            ? 'bg-green-500/20 border border-green-500/30' 
            : permission === 'denied'
              ? 'bg-red-500/20 border border-red-500/30'
              : 'bg-slate-700/50 border border-slate-600/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              hasPermission ? 'bg-green-400 animate-pulse' : 
              permission === 'denied' ? 'bg-red-400' : 'bg-yellow-400'
            }`}></div>
            <div>
              <div className="font-medium text-white">
                {hasPermission ? 'Notifications Enabled' : 
                 permission === 'denied' ? 'Notifications Blocked' : 'Notifications Not Enabled'}
              </div>
              <div className="text-sm text-slate-400">
                {hasPermission 
                  ? 'You will receive real-time alerts from Aegis' 
                  : permission === 'denied'
                    ? 'Please enable notifications in your browser settings'
                    : 'Enable to receive security alerts and updates'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      {hasPermission && (
        <div className="mb-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Subscription Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSubscribed 
                ? 'bg-cyan-500/20 text-cyan-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {isSubscribed ? 'Active' : 'Pending'}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!hasPermission && permission !== 'denied' && (
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Enabling...
              </>
            ) : (
              <>
                <span>🔔</span>
                Enable Push Notifications
              </>
            )}
          </button>
        )}

        {hasPermission && (
          <button
            onClick={sendTestNotification}
            disabled={isLoading}
            className="w-full py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>🧪</span>
            Send Test Notification
          </button>
        )}

        {permission === 'denied' && (
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-3">
              To enable notifications, click the lock icon in your browser's address bar and allow notifications.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-all"
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>

      {/* Notification Types */}
      {hasPermission && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-4">You'll receive alerts for:</h4>
          <div className="space-y-3">
            {[
              { icon: '🚨', label: 'Security Alerts', desc: 'Intruder detection, suspicious activity' },
              { icon: '🆘', label: 'Emergency Notifications', desc: 'Crash detection, SOS triggers' },
              { icon: '📅', label: 'Calendar Reminders', desc: 'Upcoming events, schedule conflicts' },
              { icon: '👨‍👩‍👧', label: 'Family Updates', desc: 'Location alerts, check-ins' },
              { icon: '💰', label: 'Financial Alerts', desc: 'Spending updates, unusual activity' },
              { icon: '💊', label: 'Health Reminders', desc: 'Medication, wellness check-ins' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <div className="text-white text-sm font-medium">{item.label}</div>
                  <div className="text-slate-400 text-xs">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Compact notification toggle for inline use
export const PushNotificationToggle = ({ isAuthenticated = false }) => {
  const {
    isSupported,
    hasPermission,
    isLoading,
    requestPermission
  } = usePushNotifications(isAuthenticated);

  if (!isSupported) return null;

  return (
    <button
      onClick={hasPermission ? undefined : requestPermission}
      disabled={isLoading || hasPermission}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
        hasPermission
          ? 'bg-green-500/20 text-green-400 cursor-default'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 cursor-pointer'
      }`}
    >
      <span>{hasPermission ? '🔔' : '🔕'}</span>
      <span>{hasPermission ? 'Notifications On' : 'Enable Notifications'}</span>
      {isLoading && (
        <div className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-300 rounded-full animate-spin"></div>
      )}
    </button>
  );
};

export default PushNotificationSettings;
