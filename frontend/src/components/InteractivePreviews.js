import React, { useState } from 'react';
import { playButtonClick, playNotification, playSuccess } from '../services/SoundService';

// =============================================
// INTERACTIVE PREVIEW SYSTEM
// Shows actual content when "View" buttons are clicked
// Makes the demo fully interactive for investors
// =============================================

// Generic Preview Modal
export const PreviewModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Intruder Photo Preview - Shows captured intruder photo with details
export const IntruderPhotoPreview = ({ isOpen, onClose }) => {
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Simulated intruder data
  const intruderData = {
    timestamp: new Date().toISOString(),
    location: 'Melbourne, VIC, Australia',
    coordinates: '-37.8136, 144.9631',
    device: 'Front Camera',
    failedAttempts: 3,
    actionsRecorded: [
      { time: '2 mins ago', action: 'Tried pattern: 1-2-3-4-5', icon: '🔢' },
      { time: '2 mins ago', action: 'Tried pattern: 1-4-7-8-9', icon: '🔢' },
      { time: '1 min ago', action: 'Tried pattern: 2-5-8-9-6', icon: '🔢' },
      { time: '1 min ago', action: 'Photo captured automatically', icon: '📸' },
      { time: '1 min ago', action: 'Decoy mode activated', icon: '🎭' },
    ]
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden border border-red-500/30 shadow-2xl">
        {/* Header */}
        <div className="bg-red-900/50 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold flex items-center">
              <span className="mr-2">🚨</span> Intruder Detected
            </h2>
            <p className="text-red-300 text-sm">Evidence captured for your records</p>
          </div>
          <button onClick={onClose} className="text-white text-2xl hover:text-red-300">×</button>
        </div>

        {/* Photo Area */}
        <div className="p-4">
          <div className="bg-slate-800 rounded-2xl overflow-hidden mb-4">
            {/* Simulated intruder photo - silhouette with timestamp */}
            <div className="aspect-[3/4] bg-gradient-to-b from-slate-700 to-slate-800 flex items-center justify-center relative">
              <div className="text-center">
                <div className="text-8xl mb-2 opacity-80">👤</div>
                <p className="text-slate-400 text-sm">Intruder Photo Captured</p>
              </div>
              {/* Timestamp overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-xs text-white">
                <div className="flex justify-between">
                  <span>📅 {new Date(intruderData.timestamp).toLocaleString()}</span>
                  <span className="text-red-400">● REC</span>
                </div>
              </div>
              {/* Camera frame overlay */}
              <div className="absolute inset-4 border-2 border-red-500/30 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-red-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-red-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-red-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-red-500"></div>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-slate-800/50 rounded-xl p-3 mb-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">📍 Location Captured</span>
              <span className="text-cyan-400 text-xs">{intruderData.coordinates}</span>
            </div>
            <p className="text-white font-medium">{intruderData.location}</p>
          </div>

          {/* Activity Log */}
          <div className="bg-slate-800/50 rounded-xl p-3 mb-4 border border-slate-700">
            <h3 className="text-slate-400 text-sm mb-2">📋 Activity Log</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {intruderData.actionsRecorded.map((action, i) => (
                <div key={i} className="flex items-center text-sm bg-slate-900/50 rounded-lg p-2">
                  <span className="mr-2">{action.icon}</span>
                  <span className="text-slate-300 flex-1">{action.action}</span>
                  <span className="text-slate-500 text-xs">{action.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button 
              onClick={() => { playSuccess(); setShowExportOptions(true); }}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium"
            >
              📤 Export Evidence for Police
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { playButtonClick(); alert('Remote wipe initiated! All sensitive data will be erased.'); }}
                className="py-3 bg-red-600 text-white rounded-xl font-medium text-sm"
              >
                💣 Remote Wipe
              </button>
              <button 
                onClick={() => { playButtonClick(); alert('Location tracking enabled. You can now track this device.'); }}
                className="py-3 bg-orange-600 text-white rounded-xl font-medium text-sm"
              >
                📍 Track Device
              </button>
            </div>
          </div>
        </div>

        {/* Export Options Modal */}
        {showExportOptions && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-white font-bold text-lg mb-4">Export Evidence</h3>
              <p className="text-slate-400 text-sm mb-4">
                Generate a police-ready evidence package including photos, location data, and activity logs.
              </p>
              <div className="space-y-2">
                <button className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm">
                  📧 Email to Yourself
                </button>
                <button className="w-full py-3 bg-green-600 text-white rounded-xl text-sm">
                  📁 Save to Vault
                </button>
                <button className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm">
                  📄 Generate PDF Report
                </button>
                <button 
                  onClick={() => setShowExportOptions(false)}
                  className="w-full py-3 bg-slate-700 text-white rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Conflict Resolution Preview - Shows calendar conflict details
export const ConflictPreview = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const conflict = {
    event1: {
      title: 'Project Phoenix Meeting',
      time: '4:00 PM - 5:00 PM',
      location: 'Conference Room B',
      attendees: ['Sarah M.', 'John D.', 'Emily R.'],
      priority: 'high'
    },
    event2: {
      title: 'Dentist Appointment',
      time: '4:30 PM - 5:30 PM',
      location: 'City Dental Clinic',
      source: 'Found in email',
      priority: 'medium'
    },
    suggestions: [
      { action: 'Reschedule dentist to tomorrow 10 AM', confidence: 95 },
      { action: 'Join meeting remotely from dental office', confidence: 70 },
      { action: 'Send delegate to meeting', confidence: 60 },
    ]
  };

  return (
    <PreviewModal isOpen={isOpen} onClose={onClose} title="⚠️ Schedule Conflict">
      <div className="p-4 space-y-4">
        {/* Event 1 */}
        <div className="bg-red-900/30 rounded-xl p-4 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-400 text-xs font-bold">HIGH PRIORITY</span>
            <span className="text-slate-400 text-xs">{conflict.event1.time}</span>
          </div>
          <h3 className="text-white font-bold text-lg">{conflict.event1.title}</h3>
          <p className="text-slate-400 text-sm">📍 {conflict.event1.location}</p>
          <p className="text-slate-400 text-sm">👥 {conflict.event1.attendees.join(', ')}</p>
        </div>

        {/* Conflict indicator */}
        <div className="flex items-center justify-center">
          <div className="bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/30">
            <span className="text-yellow-400 text-sm font-bold">⚡ OVERLAPS WITH</span>
          </div>
        </div>

        {/* Event 2 */}
        <div className="bg-orange-900/30 rounded-xl p-4 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-400 text-xs font-bold">MEDIUM PRIORITY</span>
            <span className="text-slate-400 text-xs">{conflict.event2.time}</span>
          </div>
          <h3 className="text-white font-bold text-lg">{conflict.event2.title}</h3>
          <p className="text-slate-400 text-sm">📍 {conflict.event2.location}</p>
          <p className="text-cyan-400 text-xs">✨ {conflict.event2.source}</p>
        </div>

        {/* AI Suggestions */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-cyan-400 font-bold text-sm mb-3">🤖 MATE's Suggestions</h4>
          <div className="space-y-2">
            {conflict.suggestions.map((suggestion, i) => (
              <button 
                key={i}
                onClick={() => { playSuccess(); onClose(); }}
                className="w-full flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all"
              >
                <span className="text-white text-sm">{suggestion.action}</span>
                <span className="text-green-400 text-xs font-bold">{suggestion.confidence}%</span>
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-slate-700 text-white rounded-xl font-medium"
        >
          I'll Handle It Myself
        </button>
      </div>
    </PreviewModal>
  );
};

// Wellness Insight Preview
export const WellnessPreview = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const wellnessData = {
    sleepData: [
      { day: 'Mon', hours: 5.5, quality: 'Poor' },
      { day: 'Tue', hours: 6, quality: 'Fair' },
      { day: 'Wed', hours: 5, quality: 'Poor' },
    ],
    insights: [
      'Sleep quality has dropped 30% this week',
      'Screen time before bed increased by 45 mins',
      'Late caffeine consumption detected (8 PM coffee)'
    ],
    recommendations: [
      'Enable "Wind Down" mode at 9 PM',
      'Try the 4-7-8 breathing exercise',
      'Set a reminder for no caffeine after 2 PM'
    ]
  };

  return (
    <PreviewModal isOpen={isOpen} onClose={onClose} title="💚 Wellness Insight">
      <div className="p-4 space-y-4">
        {/* Sleep Summary */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-slate-400 text-sm mb-3">Sleep This Week</h4>
          <div className="flex justify-between">
            {wellnessData.sleepData.map((day, i) => (
              <div key={i} className="text-center">
                <div className={`h-20 w-8 rounded-full flex items-end justify-center mb-2 ${
                  day.quality === 'Poor' ? 'bg-red-500/30' : 'bg-yellow-500/30'
                }`}>
                  <div 
                    className={`w-full rounded-full ${
                      day.quality === 'Poor' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ height: `${(day.hours / 8) * 100}%` }}
                  ></div>
                </div>
                <span className="text-white text-sm font-bold">{day.hours}h</span>
                <span className="text-slate-500 text-xs block">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-500/30">
          <h4 className="text-yellow-400 font-bold text-sm mb-2">⚠️ Observations</h4>
          <ul className="space-y-2">
            {wellnessData.insights.map((insight, i) => (
              <li key={i} className="text-slate-300 text-sm flex items-start">
                <span className="mr-2">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/30">
          <h4 className="text-green-400 font-bold text-sm mb-2">💡 Recommendations</h4>
          <div className="space-y-2">
            {wellnessData.recommendations.map((rec, i) => (
              <button 
                key={i}
                onClick={() => { playSuccess(); }}
                className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all text-left"
              >
                <span className="text-white text-sm">{rec}</span>
                <span className="text-green-400">+</span>
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-xl font-medium"
        >
          Enable All Recommendations
        </button>
      </div>
    </PreviewModal>
  );
};

// Privacy Suggestion Preview
export const PrivacyPreview = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const privacyData = {
    pattern: {
      contact: 'Alex Johnson',
      frequency: '12 chats deleted this month',
      lastAction: '2 hours ago'
    },
    suggestedRule: {
      name: 'Auto-delete Alex Johnson chats',
      trigger: 'After 24 hours',
      action: 'Move to Phantom Folder then delete'
    }
  };

  return (
    <PreviewModal isOpen={isOpen} onClose={onClose} title="🔒 Privacy Suggestion">
      <div className="p-4 space-y-4">
        {/* Pattern Detected */}
        <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/30">
          <h4 className="text-purple-400 font-bold text-sm mb-2">🔍 Pattern Detected</h4>
          <p className="text-white mb-2">
            You frequently delete conversations with <strong>{privacyData.pattern.contact}</strong>
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{privacyData.pattern.frequency}</span>
            <span className="text-slate-500">Last: {privacyData.pattern.lastAction}</span>
          </div>
        </div>

        {/* Suggested Automation */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-cyan-400 font-bold text-sm mb-3">🤖 Suggested Automation</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
              <span className="text-slate-400 text-sm">Rule Name</span>
              <span className="text-white text-sm">{privacyData.suggestedRule.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
              <span className="text-slate-400 text-sm">Trigger</span>
              <span className="text-white text-sm">{privacyData.suggestedRule.trigger}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
              <span className="text-slate-400 text-sm">Action</span>
              <span className="text-white text-sm">{privacyData.suggestedRule.action}</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">
            ✨ This means: Chats with Alex will automatically be saved to your hidden vault and then deleted from your visible messages after 24 hours.
          </p>
        </div>

        <div className="space-y-2">
          <button 
            onClick={() => { playSuccess(); onClose(); }}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
          >
            Enable This Rule
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-700 text-white rounded-xl font-medium"
          >
            Customize Rule
          </button>
        </div>
      </div>
    </PreviewModal>
  );
};

// Security Summary Preview
export const SecurityPreview = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const securityData = {
    threatsBlocked: 47,
    spamCalls: 12,
    phishingLinks: 8,
    maliciousApps: 3,
    locationHides: 24,
    timeline: [
      { time: '10 mins ago', event: 'Blocked spam call from +61 400 XXX XXX', type: 'call' },
      { time: '1 hour ago', event: 'Detected phishing link in SMS', type: 'phishing' },
      { time: '2 hours ago', event: 'Hidden location from suspicious app', type: 'location' },
      { time: '5 hours ago', event: 'Blocked 3 tracking cookies', type: 'tracking' },
    ]
  };

  return (
    <PreviewModal isOpen={isOpen} onClose={onClose} title="🛡️ Security Dashboard">
      <div className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-900/30 rounded-xl p-4 text-center border border-green-500/30">
            <p className="text-3xl font-black text-green-400">{securityData.threatsBlocked}</p>
            <p className="text-slate-400 text-xs">Threats Blocked</p>
          </div>
          <div className="bg-blue-900/30 rounded-xl p-4 text-center border border-blue-500/30">
            <p className="text-3xl font-black text-blue-400">{securityData.spamCalls}</p>
            <p className="text-slate-400 text-xs">Spam Calls Blocked</p>
          </div>
          <div className="bg-red-900/30 rounded-xl p-4 text-center border border-red-500/30">
            <p className="text-3xl font-black text-red-400">{securityData.phishingLinks}</p>
            <p className="text-slate-400 text-xs">Phishing Links</p>
          </div>
          <div className="bg-purple-900/30 rounded-xl p-4 text-center border border-purple-500/30">
            <p className="text-3xl font-black text-purple-400">{securityData.locationHides}</p>
            <p className="text-slate-400 text-xs">Location Hides</p>
          </div>
        </div>

        {/* Security Timeline */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-slate-400 text-sm mb-3">📋 Recent Activity</h4>
          <div className="space-y-3">
            {securityData.timeline.map((item, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  item.type === 'call' ? 'bg-yellow-500' :
                  item.type === 'phishing' ? 'bg-red-500' :
                  item.type === 'location' ? 'bg-purple-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-white text-sm">{item.event}</p>
                  <p className="text-slate-500 text-xs">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="bg-green-900/30 rounded-xl p-4 border border-green-500/30 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-400 font-bold">Your Digital City is Secure</p>
          <p className="text-slate-400 text-sm">All systems operational</p>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium"
        >
          View Full Report
        </button>
      </div>
    </PreviewModal>
  );
};

export default {
  PreviewModal,
  IntruderPhotoPreview,
  ConflictPreview,
  WellnessPreview,
  PrivacyPreview,
  SecurityPreview
};
