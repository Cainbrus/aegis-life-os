import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { playButtonClick, playNotification, playAppOpen, playAppClose, playSuccess, playError, playMessageReceived, playVaultUnlock, playSosActivate } from '../services/SoundService';
import { 
  LivingCityBackground, 
  MateAvatar, 
  MateAssistantPanel,
  SecurityStatusBar,
  WorkerAIIndicator,
  IntruderDetectionOverlay,
  OwnerCoreVisualization 
} from './LivingCityComponents';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// =============================================
// AEGIS INVISIBLE MODE - INVESTOR DEMO VERSION
// Aegis runs silently like a native phone
// Shows proactive notifications and calendar integration
// =============================================

// Notification popup component with animations
export const AegisNotification = ({ notification, onDismiss, onAction }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Animate in and play sound
    setTimeout(() => setIsVisible(true), 100);
    if (notification) {
      playNotification(notification.type || 'info');
    }
  }, [notification]);

  if (!notification) return null;

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'security':
        return { border: 'border-red-500', bg: 'bg-red-500/10', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]' };
      case 'urgent':
        return { border: 'border-orange-500', bg: 'bg-orange-500/10', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.4)]' };
      case 'emergency':
        return { border: 'border-red-600', bg: 'bg-red-600/20', glow: 'shadow-[0_0_50px_rgba(220,38,38,0.5)]' };
      case 'lost':
        return { border: 'border-yellow-500', bg: 'bg-yellow-500/10', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.4)]' };
      case 'destroy':
        return { border: 'border-red-700', bg: 'bg-red-900/30', glow: 'shadow-[0_0_60px_rgba(185,28,28,0.6)]' };
      case 'companion':
        return { border: 'border-pink-500', bg: 'bg-pink-500/10', glow: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]' };
      case 'finance':
        return { border: 'border-emerald-500', bg: 'bg-emerald-500/10', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]' };
      case 'health':
        return { border: 'border-rose-400', bg: 'bg-rose-400/10', glow: 'shadow-[0_0_30px_rgba(251,113,133,0.3)]' };
      case 'family':
        return { border: 'border-amber-500', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' };
      case 'privacy':
        return { border: 'border-purple-500', bg: 'bg-purple-500/10', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]' };
      case 'reminder':
        return { border: 'border-cyan-500', bg: 'bg-cyan-500/10', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]' };
      case 'suggestion':
        return { border: 'border-blue-500', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]' };
      case 'calendar':
        return { border: 'border-green-500', bg: 'bg-green-500/10', glow: 'shadow-[0_0_30px_rgba(34,197,94,0.3)]' };
      default:
        return { border: 'border-slate-500', bg: 'bg-slate-500/10', glow: '' };
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'security':
        return '🚨';
      case 'urgent':
        return '⚡';
      case 'emergency':
        return '🆘';
      case 'lost':
        return '📍';
      case 'destroy':
        return '💀';
      case 'companion':
        return '💙';
      case 'finance':
        return '💰';
      case 'health':
        return '💊';
      case 'family':
        return '👨‍👩‍👧';
      case 'privacy':
        return '🔒';
      case 'reminder':
        return '⏰';
      case 'suggestion':
        return '💡';
      case 'calendar':
        return '📅';
      default:
        return '🛡️';
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`fixed top-12 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-[60] transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
      <div className={`bg-slate-900/95 backdrop-blur-xl rounded-2xl border-2 ${styles.border} ${styles.bg} p-3 sm:p-4 ${styles.glow}`}>
        <div className="flex items-start space-x-2 sm:space-x-3">
          <div className="text-2xl sm:text-3xl animate-bounce">{notification.icon || getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm sm:text-lg truncate">{notification.title}</h3>
              <span className="text-[10px] sm:text-xs text-slate-400 ml-2 flex-shrink-0">{notification.time || 'Just now'}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2">{notification.message}</p>
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {notification.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { 
                      e.stopPropagation();
                      playButtonClick(); 
                      if (onAction) onAction(action.id, action); 
                    }}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      action.primary
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); playButtonClick(); onDismiss(); }}
            className="text-slate-500 hover:text-white transition-colors text-lg sm:text-xl flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

// Phone-like Calendar component - Enhanced
export const AegisCalendar = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', description: '' });

  const getDefaultEvents = useCallback(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return [
      { id: 1, title: '📊 Investor Demo', date: today.toISOString().split('T')[0], time: '10:00', description: 'Aegis Full Feature Showcase', priority: 'high' },
      { id: 2, title: '💼 Follow-up Call', date: tomorrow.toISOString().split('T')[0], time: '14:30', description: 'Technical due diligence', priority: 'high' },
      { id: 3, title: '🎂 Team Celebration', date: nextWeek.toISOString().split('T')[0], time: '18:00', description: 'Funding milestone party!', priority: 'medium' },
      { id: 4, title: '📝 Board Meeting', date: today.toISOString().split('T')[0], time: '15:00', description: 'Q1 Review', priority: 'high' },
      { id: 5, title: '🏋️ Gym Session', date: today.toISOString().split('T')[0], time: '07:00', description: 'Morning workout', priority: 'low' },
    ];
  }, []);

  useEffect(() => {
    playAppOpen();
    const loadEvents = async () => {
      try {
        const response = await axios.get(`${API}/calendar/events`);
        setEvents(response.data.events || getDefaultEvents());
      } catch (error) {
        setEvents(getDefaultEvents());
      }
    };
    loadEvents();
  }, [getDefaultEvents]);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const addEvent = async () => {
    if (!newEvent.title || !selectedDate) return;
    
    const event = {
      id: Date.now(),
      title: newEvent.title,
      date: selectedDate,
      time: newEvent.time,
      description: newEvent.description,
      priority: 'medium'
    };

    try {
      await axios.post(`${API}/calendar/events`, event);
    } catch (error) {
      // Continue anyway
    }

    setEvents([...events, event]);
    setNewEvent({ title: '', time: '', description: '' });
    setShowAddEvent(false);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }
    
    return days;
  };

  const getEventsForDate = (dateString) => {
    return events.filter(e => e.date === dateString);
  };

  const formatDateString = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-xl p-4 flex items-center justify-between border-b border-slate-700">
        <button onClick={onClose} className="text-cyan-400 font-medium flex items-center">
          <span className="mr-1">←</span> Back
        </button>
        <h1 className="text-xl font-bold">📅 Calendar</h1>
        <button 
          onClick={() => setShowAddEvent(true)}
          className="text-cyan-400 font-medium"
        >
          + Add
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between p-4 bg-slate-800/50">
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
          className="text-cyan-400 text-3xl px-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          ‹
        </button>
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
          className="text-cyan-400 text-3xl px-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs text-slate-500 py-3 bg-slate-800/30 border-b border-slate-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="font-medium">{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {getDaysInMonth(currentDate).map((day, idx) => {
          if (!day) return <div key={idx} className="h-14"></div>;
          
          const dateString = formatDateString(day);
          const dayEvents = getEventsForDate(dateString);
          const isToday = dateString === getTodayString();
          const isSelected = dateString === selectedDate;
          
          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(dateString)}
              className={`h-14 rounded-xl flex flex-col items-center justify-center transition-all ${
                isSelected ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg scale-105' :
                isToday ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' :
                'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span className="text-sm font-medium">{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex space-x-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 
                        event.priority === 'high' ? 'bg-red-400' : 'bg-cyan-400'
                      }`}
                    ></div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map(event => (
                <div 
                  key={event.id} 
                  className={`bg-slate-800/80 rounded-xl p-4 border-l-4 ${
                    event.priority === 'high' ? 'border-red-500' : 
                    event.priority === 'medium' ? 'border-yellow-500' : 'border-cyan-500'
                  } backdrop-blur-xl`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">{event.title}</h4>
                    {event.time && event.time !== '00:00' && (
                      <span className="text-cyan-400 text-sm font-mono bg-cyan-400/10 px-2 py-1 rounded">{event.time}</span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-slate-400 mt-2">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-slate-500">No events for this day</p>
              <button 
                onClick={() => setShowAddEvent(true)}
                className="mt-4 text-cyan-400 text-sm underline"
              >
                Add an event
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Add Event</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  placeholder="Event title"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Time</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddEvent(false)}
                className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addEvent}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Notification Manager - Enhanced with demo notifications
export const useAegisNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [demoNotificationsShown, setDemoNotificationsShown] = useState(0);

  // Demo notifications for investor presentations - memoized
  const demoNotifications = useMemo(() => [
    // === PROACTIVE LIFE MANAGEMENT ===
    {
      type: 'urgent',
      title: '⏰ Wake Up - Route Change!',
      message: 'Hey, I woke you up 20 mins early. There\'s a crash on your usual route - I found an alternative but it adds 20 mins. You need to leave by 7:40 to make your 9am meeting.',
      actions: [
        { id: 'directions', label: 'Show New Route', primary: true },
        { id: 'snooze', label: 'Snooze 5 mins' }
      ]
    },
    {
      type: 'calendar',
      title: '📝 Meeting Summary Ready',
      message: 'Your 10am Team Meeting just ended. I\'ve written up a summary, booked your follow-up for Thursday 2pm, and created your action items list. 4 tasks due before next meeting.',
      actions: [
        { id: 'view', label: 'View Summary', primary: true },
        { id: 'tasks', label: 'See Tasks' }
      ]
    },
    
    // === EMERGENCY & SAFETY ===
    {
      type: 'emergency',
      title: '🚨 CRASH DETECTED!',
      message: 'I detected a sudden impact. Are you OK? If no response in 30 seconds, I\'m calling 000 and sending your location + medical info to emergency services.',
      actions: [
        { id: 'im_ok', label: 'I\'m OK!', primary: true },
        { id: 'help', label: 'SEND HELP NOW' }
      ]
    },
    {
      type: 'lost',
      title: '📱 Lost Phone Mode Active',
      message: 'Your phone has been marked as lost. GPS is now ON and tracking. Anyone who finds it will see your contact info and reward offer. Location shared with your emergency contacts.',
      actions: [
        { id: 'track', label: 'Track Location', primary: true },
        { id: 'sound', label: 'Play Sound' }
      ]
    },
    {
      type: 'destroy',
      title: '💀 DESTROY CODE RECEIVED',
      message: 'Remote wipe initiated! Backing up data to your secret email... You have 60 seconds to cancel. After that, EVERYTHING will be wiped and phone reset to factory.',
      actions: [
        { id: 'cancel', label: '✋ CANCEL WIPE', primary: true },
        { id: 'confirm', label: 'Confirm Destruction' }
      ]
    },
    
    // === AI COMPANION ===
    {
      type: 'companion',
      title: '💙 Hey, You OK?',
      message: 'I noticed you\'ve been scrolling social media for 2 hours and your typing seems slower than usual. Feeling stressed? Want to talk about it?',
      actions: [
        { id: 'chat', label: 'Yeah, let\'s talk', primary: true },
        { id: 'fine', label: 'I\'m fine, thanks' }
      ]
    },
    {
      type: 'companion',
      title: '👋 Check In Reminder',
      message: 'You haven\'t talked to Mum in 12 days. Last time you chatted, she mentioned her doctor\'s appointment. Maybe send a quick message?',
      actions: [
        { id: 'message', label: 'Send Message', primary: true },
        { id: 'later', label: 'Remind Me Tomorrow' }
      ]
    },
    
    // === FINANCIAL INTELLIGENCE ===
    {
      type: 'finance',
      title: '💰 Spending Alert',
      message: 'Heads up! You\'ve spent $287 on food delivery this week - that\'s 65% more than your usual $175. Want me to help you track this?',
      actions: [
        { id: 'track', label: 'Show Breakdown', primary: true },
        { id: 'dismiss', label: 'Thanks for heads up' }
      ]
    },
    {
      type: 'finance',
      title: '🚨 Suspicious Transaction!',
      message: 'Your card was just charged $847 at "ELECTRONICS STORE" in ROMANIA. This doesn\'t look right. I\'ve temporarily frozen the card.',
      actions: [
        { id: 'block', label: 'Report Fraud', primary: true },
        { id: 'allow', label: 'It was me' }
      ]
    },
    {
      type: 'finance',
      title: '📅 Bill Due Tomorrow',
      message: 'Your electricity bill ($156.80) is due tomorrow. I found the email from last week. Want me to set up auto-pay so you never miss one?',
      actions: [
        { id: 'pay', label: 'Pay Now', primary: true },
        { id: 'autopay', label: 'Set Up Auto-Pay' }
      ]
    },
    
    // === HEALTH & WELLNESS ===
    {
      type: 'health',
      title: '💊 Medication Time',
      message: 'Time to take your Metformin (500mg). You\'ve been consistent for 14 days straight - keep it up! 💪',
      actions: [
        { id: 'taken', label: 'I\'ve Taken It', primary: true },
        { id: 'snooze', label: 'Remind in 30 mins' }
      ]
    },
    {
      type: 'health',
      title: '🧘 Wellness Check-In',
      message: 'Hey! How are you feeling today? Taking a moment to check in on yourself is important. Rate your mood?',
      actions: [
        { id: 'great', label: '😊 Great', primary: true },
        { id: 'okay', label: '😐 Okay' },
        { id: 'rough', label: '😔 Rough' }
      ]
    },
    
    // === FAMILY MODE ===
    {
      type: 'family',
      title: '👧 Sophie Left School',
      message: 'Sophie just left the school zone. She\'s heading towards home - ETA 15 minutes. Everything looks normal.',
      actions: [
        { id: 'track', label: 'Track Live', primary: true },
        { id: 'call', label: 'Call Sophie' }
      ]
    },
    {
      type: 'family',
      title: '👴 Dad Fall Detected',
      message: 'ALERT: Possible fall detected at Dad\'s house. He hasn\'t moved for 2 minutes. Should I call him or send emergency services?',
      actions: [
        { id: 'call', label: 'Call Dad', primary: true },
        { id: 'emergency', label: 'Send Help Now' }
      ]
    },
    {
      type: 'family',
      title: '🏠 Sophie Left Safe Zone',
      message: 'Sophie left the "Home" safe zone 10 minutes ago. Current location: Shopping Centre (2.3km away). This is unusual for this time.',
      actions: [
        { id: 'track', label: 'Track Location', primary: true },
        { id: 'call', label: 'Call Her' }
      ]
    },
    
    // === SECURITY & PRIVACY ===
    {
      type: 'security',
      title: '📸 Intruder Photo Captured!',
      message: 'Someone entered the wrong unlock pattern 3 times. I\'ve secretly taken their photo and saved it. The phone is now in decoy mode showing fake data.',
      actions: [
        { id: 'view', label: 'View Photo', primary: true },
        { id: 'wipe', label: 'Remote Wipe' }
      ]
    },
    {
      type: 'privacy',
      title: '🔒 Privacy Protection',
      message: 'I noticed some adult content in your browser history. I\'ve already deleted it to keep your device clean. You\'re welcome 😉',
      actions: [
        { id: 'thanks', label: 'Thanks Aegis!', primary: true },
        { id: 'settings', label: 'Adjust Settings' }
      ]
    },
    {
      type: 'security',
      title: '⚠️ Unknown Contact Detected',
      message: 'You received a message from an unknown number asking for personal info. Want me to delete it or move it to your Hidden Folder for review?',
      actions: [
        { id: 'delete', label: 'Delete It', primary: true },
        { id: 'hide', label: 'Move to Hidden' }
      ]
    },
    {
      type: 'suggestion',
      title: '🎉 Party Content Secured',
      message: 'I found photos and messages about the party this weekend. I\'ve moved them all to your Hidden Folder so no one sees them accidentally.',
      actions: [
        { id: 'view', label: 'View in Vault', primary: true },
        { id: 'ok', label: 'Perfect, thanks!' }
      ]
    },
    {
      type: 'security',
      title: '🎭 Decoy App Triggered',
      message: 'Someone opened your fake "Banking" app and tried to log in. I captured their face and fingerprint attempt. Phone appears normal to them.',
      actions: [
        { id: 'evidence', label: 'View Evidence', primary: true },
        { id: 'alert', label: 'Alert Authorities' }
      ]
    },
    
    // === SMART HOME & LIFE ===
    {
      type: 'calendar',
      title: '📋 Action Items Reminder',
      message: 'You have 2 tasks due tomorrow from your Monday meeting: "Send proposal draft" and "Review budget numbers". Want me to block time for these?',
      actions: [
        { id: 'block', label: 'Block 2 Hours', primary: true },
        { id: 'later', label: 'Remind Me Later' }
      ]
    },
    {
      type: 'urgent',
      title: '🚗 Traffic Alert',
      message: 'Leave NOW if you want to make your 2pm client meeting. Accident on M1 - I\'ve found a route through back roads that saves 15 mins.',
      actions: [
        { id: 'navigate', label: 'Start Navigation', primary: true },
        { id: 'call', label: 'Call to Reschedule' }
      ]
    },
    {
      type: 'privacy',
      title: '🛡️ Sensitive Photo Detected',
      message: 'Someone just sent you a photo that looks private. I\'ve automatically moved it to your secure vault. Only you can access it.',
      actions: [
        { id: 'view', label: 'View in Vault', primary: true },
        { id: 'ok', label: 'Good looking out!' }
      ]
    },
    {
      type: 'security',
      title: '🚨 Suspicious App Blocked',
      message: 'An app tried to access your camera in the background. I blocked it. This doesn\'t seem right - want me to uninstall it?',
      actions: [
        { id: 'uninstall', label: 'Uninstall It', primary: true },
        { id: 'allow', label: 'It\'s OK, Allow' }
      ]
    },
    {
      type: 'suggestion',
      title: '💡 Smart Cleanup',
      message: 'I noticed you have 47 screenshots of conversations. Want me to move the sensitive ones to your Hidden Folder and delete the rest?',
      actions: [
        { id: 'cleanup', label: 'Yes, Clean Up', primary: true },
        { id: 'later', label: 'Maybe Later' }
      ]
    },
    {
      type: 'calendar',
      title: '☕ Morning Briefing',
      message: 'Good morning! You have 3 meetings today. First one at 10am. Weather is rainy - leave 10 mins early. Also, Mum\'s birthday is in 2 days.',
      actions: [
        { id: 'details', label: 'Full Schedule', primary: true },
        { id: 'gift', label: 'Gift Ideas for Mum' }
      ]
    },
    {
      type: 'privacy',
      title: '🔐 Late Night Activity Hidden',
      message: 'I see you were browsing some things at 2am last night. Don\'t worry - I\'ve cleared the history and moved any downloads to your vault.',
      actions: [
        { id: 'thanks', label: 'You\'re the best!', primary: true },
        { id: 'view', label: 'Show me what' }
      ]
    },
    
    // === SPECIAL SECURITY ===
    {
      type: 'security',
      title: '📴 Fake Shutdown Active',
      message: 'Phone appears OFF to anyone looking, but I\'m still tracking location and recording audio. 3 recordings captured in the last hour.',
      actions: [
        { id: 'listen', label: 'Listen to Recordings', primary: true },
        { id: 'stop', label: 'End Fake Shutdown' }
      ]
    },
    {
      type: 'emergency',
      title: '🆘 SOS ACTIVATED!',
      message: 'Emergency shake detected! Sending your location to all emergency contacts NOW. Live tracking enabled. Help is on the way.',
      actions: [
        { id: 'cancel', label: 'FALSE ALARM - Cancel', primary: true },
        { id: 'call', label: 'Call 000' }
      ]
    }
  ], []);

  useEffect(() => {
    // Check for real notifications periodically
    const checkNotifications = async () => {
      try {
        const response = await axios.get(`${API}/notifications/pending`);
        if (response.data.notifications && response.data.notifications.length > 0) {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
      } catch (error) {
        // Silent fail
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Demo: Show notifications periodically for investor demos
  // Each notification type shows ONCE only - no repeats!
  useEffect(() => {
    // Only show ONE notification total for demo (the first critical one)
    // User can trigger more by clicking apps
    if (demoNotificationsShown >= 1) return; // Already showed one, stop
    
    const criticalNotifications = demoNotifications.filter(n => 
      n.type === 'security' && n.title.includes('Intruder')
    );
    
    // Show first notification after 20 seconds, then STOP
    const demoTimer = setTimeout(() => {
      if (criticalNotifications.length > 0) {
        setNotifications(prev => [...prev, { 
          ...criticalNotifications[0], 
          id: Date.now() 
        }]);
        setDemoNotificationsShown(1); // Mark as shown, no more auto notifications
      }
    }, 20000);

    return () => clearTimeout(demoTimer);
  }, [demoNotificationsShown, demoNotifications]);

  // Update current notification when notifications list changes
  useEffect(() => {
    // Use timeout to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      if (notifications.length > 0 && !currentNotification) {
        setCurrentNotification(notifications[0]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [notifications, currentNotification]);

  const dismissNotification = useCallback(() => {
    setNotifications(prev => prev.slice(1));
    setCurrentNotification(null);
  }, []);

  const handleAction = useCallback(async (actionId) => {
    try {
      await axios.post(`${API}/notifications/action`, {
        notification_id: currentNotification?.id,
        action_id: actionId
      });
    } catch (error) {
      // Silent fail
    }
    dismissNotification();
  }, [currentNotification, dismissNotification]);

  const triggerNotification = useCallback((notification) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
  }, []);

  return {
    currentNotification,
    dismissNotification,
    handleAction,
    triggerNotification
  };
};

// The "Invisible" home screen - looks like a normal iOS/Android phone
export const InvisibleHomeScreen = ({ onOpenCalculator, onOpenCalendar, onOpenApp, onOpenChat, onOpenSettings, onOpenEmergency, onOpenLostPhone }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shakeCount, setShakeCount] = useState(0);
  const [sosTriggered, setSosTriggered] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // SOS Shake Detection (simulated with rapid taps for demo)
  useEffect(() => {
    if (shakeCount >= 5) {
      setSosTriggered(true);
      setShakeCount(0);
      // In real app, this would send emergency alerts
    }
    
    // Reset shake count after 2 seconds of no shakes
    const resetTimer = setTimeout(() => setShakeCount(0), 2000);
    return () => clearTimeout(resetTimer);
  }, [shakeCount]);

  const handleSosArea = () => {
    setShakeCount(prev => prev + 1);
  };
  
  const timeString = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const dateString = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  // Phone apps - each one demos an Aegis feature when tapped!
  const apps = [
    { name: 'Messages', icon: '💬', color: 'bg-green-500', badge: 3, action: 'messages', aegisFeature: 'Spam blocked' },
    { name: 'Phone', icon: '📞', color: 'bg-green-600', action: 'phone_app', aegisFeature: '🔐 Vault' },
    { name: 'Photos', icon: '🖼️', color: 'bg-gradient-to-br from-pink-500 to-yellow-500', action: 'photos', aegisFeature: '2 hidden' },
    { name: 'Banking', icon: '🏦', color: 'bg-emerald-600', action: 'finance', aegisFeature: 'Secure', isAegis: true },
    { name: 'Health', icon: '💊', color: 'bg-rose-500', action: 'health', aegisFeature: '2 reminders', isAegis: true },
    { name: 'Family', icon: '👨‍👩‍👧', color: 'bg-amber-500', action: 'family', aegisFeature: 'All safe', isAegis: true },
    { name: 'Emergency', icon: '🆘', color: 'bg-gradient-to-br from-red-500 to-orange-600', action: 'emergency', aegisFeature: 'Setup', isAegis: true },
    { name: 'Lost Phone', icon: '📍', color: 'bg-gradient-to-br from-yellow-500 to-orange-500', action: 'lost_phone', aegisFeature: 'Ready', isAegis: true },
    { name: 'Calendar', icon: '📅', color: 'bg-white text-red-500', action: 'calendar', aegisFeature: 'Optimized' },
    { name: 'Mail', icon: '✉️', color: 'bg-blue-400', badge: 5, action: 'mail', aegisFeature: '7 filtered' },
    { name: 'Notes', icon: '📝', color: 'bg-yellow-400', action: 'notes', aegisFeature: 'Encrypted' },
    { name: 'Aegis', icon: '🛡️', color: 'bg-gradient-to-br from-cyan-500 to-blue-600', action: 'chat', isAegis: true, aegisFeature: 'Chat' },
  ];

  // SOS Triggered Screen
  if (sosTriggered) {
    return (
      <div className="min-h-screen bg-red-900 text-white flex flex-col items-center justify-center p-6">
        <div className="text-8xl mb-4 animate-pulse">🆘</div>
        <h1 className="text-3xl font-black mb-4">SOS ACTIVATED!</h1>
        <p className="text-center text-red-200 mb-6">
          Sending your location to emergency contacts...
          <br />Live tracking enabled.
        </p>
        <div className="w-full max-w-xs space-y-3">
          <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
            <span>📍 Location sent</span>
            <span className="text-green-400">✓</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
            <span>📱 Alerting Sarah (Wife)</span>
            <span className="text-green-400">✓</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
            <span>🏥 Sharing medical info</span>
            <span className="text-green-400">✓</span>
          </div>
        </div>
        <button
          onClick={() => setSosTriggered(false)}
          className="mt-8 bg-white/20 hover:bg-white/30 px-8 py-4 rounded-xl font-bold transition-colors"
        >
          ✋ FALSE ALARM - Cancel
        </button>
        <button
          onClick={() => setSosTriggered(false)}
          className="mt-4 bg-red-600 hover:bg-red-500 px-8 py-4 rounded-xl font-bold transition-colors"
        >
          📞 Call 000 Now
        </button>
      </div>
    );
  }

  return (
    <LivingCityBackground intensity="medium">
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* SOS Trigger Area - Tap 5 times rapidly */}
      <div 
        className="absolute top-0 right-0 w-20 h-20 z-50"
        onClick={handleSosArea}
      />
      
      {/* Shake counter indicator (subtle) */}
      {shakeCount > 0 && shakeCount < 5 && (
        <div className="absolute top-4 right-4 z-50 bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
          SOS: {shakeCount}/5
        </div>
      )}

      <div className="relative z-10">
        {/* Status bar with Worker AI indicators */}
        <div className="flex items-center justify-between px-4 py-2 text-xs">
          <div className="flex items-center space-x-2">
            <WorkerAIIndicator type="security" active={true} count={2} />
          </div>
          <div className="flex items-center space-x-2">
            <span>📶</span>
            <span>📡</span>
            <span className="flex items-center">
              <span className="text-green-400">🔋</span>
              <span className="ml-1">87%</span>
            </span>
          </div>
        </div>

        {/* Security Status Bar */}
        <div className="px-4 mb-4">
          <SecurityStatusBar 
            threatsBlocked={47}
            status="protected"
            workers={['security', 'spam', 'messages']}
          />
        </div>

        {/* Time display - Prominent like iOS lock screen */}
        <div className="text-center py-8">
          <div className="text-6xl font-extralight tracking-tight text-white drop-shadow-lg">
            {timeString}
          </div>
          <div className="text-lg text-slate-300 mt-3 font-light">{dateString}</div>
        </div>

        {/* App grid */}
        <div className="grid grid-cols-4 gap-5 px-6 py-4">
          {apps.map((app, idx) => (
            <button
              key={idx}
              onClick={() => {
                playAppOpen();
                // Handle all app actions
                switch(app.action) {
                  case 'calculator': onOpenCalculator(); break;
                  case 'calendar': onOpenCalendar(); break;
                  case 'chat': onOpenChat && onOpenChat(); break;
                  case 'settings': onOpenSettings && onOpenSettings(); break;
                  case 'emergency': onOpenEmergency && onOpenEmergency(); break;
                  case 'lost_phone': onOpenLostPhone && onOpenLostPhone(); break;
                  case 'finance': onOpenApp('finance'); break;
                  case 'health': onOpenApp('health'); break;
                  case 'family': onOpenApp('family'); break;
                  case 'photos': onOpenApp('photos'); break;
                  case 'messages': onOpenApp('messages'); break;
                  case 'phone': onOpenApp('phone_app'); break;
                  case 'mail': onOpenApp('mail'); break;
                  case 'notes': onOpenApp('notes'); break;
                  default: onOpenApp(app.name); break;
                }
              }}
              className="flex flex-col items-center group"
            >
              <div className={`w-16 h-16 ${app.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-200 relative`}>
                {app.icon}
                {/* Badge for notifications */}
                {app.badge && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {app.badge}
                  </div>
                )}
                {/* Aegis protection indicator */}
                {app.isAegis && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <span className="text-[8px]">🛡️</span>
                  </div>
                )}
              </div>
              <span className="text-xs mt-2 text-slate-300 font-medium">{app.name}</span>
              {/* Aegis feature subtitle */}
              {app.aegisFeature && (
                <span className="text-[10px] text-cyan-400/70">{app.aegisFeature}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="px-6 mt-4">
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center">
            <span className="text-slate-400 mr-2">🔍</span>
            <span className="text-slate-400 text-sm">Search</span>
          </div>
        </div>

        {/* Floating MATE Avatar - Click to open chat */}
        <button
          onClick={() => onOpenChat && onOpenChat()}
          className="fixed bottom-24 right-4 z-40 group"
        >
          <div className="relative">
            <MateAvatar size="large" mood="happy" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-[10px] text-white font-bold">AI</span>
            </div>
          </div>
        </button>

        {/* Dock */}
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6">
          <div className="bg-slate-800/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-700/50">
            <div className="flex justify-around">
              <button 
                onClick={() => { playAppOpen(); onOpenApp('Phone'); }}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-lg hover:scale-110 transition-transform"
              >
                📞
              </button>
              <button 
                onClick={() => onOpenApp('Safari')}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-lg hover:scale-110 transition-transform"
              >
                🧭
              </button>
              <button 
                onClick={() => onOpenApp('Messages')}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-lg hover:scale-110 transition-transform relative"
              >
                💬
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-white">
                  3
                </div>
              </button>
              <button 
                onClick={() => onOpenApp('Music')}
                className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform"
              >
                🎵
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </LivingCityBackground>
  );
};

// EMERGENCY MEDICAL SCREEN - Shows when crash detected or emergency triggered
export const EmergencyMedicalScreen = ({ userInfo, onCancel }) => {
  const [countdown, setCountdown] = useState(30);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (countdown > 0 && !calling) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !calling) {
      setCalling(true);
    }
  }, [countdown, calling]);

  const defaultUser = {
    name: 'John Smith',
    bloodType: 'O+',
    allergies: 'Penicillin, Peanuts',
    medications: 'Metformin 500mg',
    conditions: 'Type 2 Diabetes',
    emergencyContact: 'Sarah Smith (Wife)',
    emergencyPhone: '0412 345 678',
    doctorName: 'Dr. James Wilson',
    doctorPhone: '02 9876 5432',
    address: '42 Example Street, Sydney NSW 2000'
  };

  const user = userInfo || defaultUser;

  return (
    <div className="min-h-screen bg-red-900 text-white relative overflow-hidden">
      {/* Pulsing emergency background */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-800 to-red-950 animate-pulse"></div>
      
      <div className="relative z-10 p-4">
        {/* EMERGENCY HEADER */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2 animate-bounce">🆘</div>
          <h1 className="text-3xl font-black text-white">EMERGENCY</h1>
          {!calling ? (
            <p className="text-red-200 mt-2">Calling 000 in {countdown} seconds...</p>
          ) : (
            <p className="text-green-400 mt-2 font-bold animate-pulse">📞 CALLING 000 NOW...</p>
          )}
        </div>

        {/* MEDICAL INFO CARD */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 mb-4 border-2 border-white/30">
          <h2 className="text-xl font-bold text-center mb-4 text-yellow-300">⚕️ MEDICAL INFORMATION</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between border-b border-white/20 pb-2">
              <span className="text-red-200">NAME:</span>
              <span className="font-bold text-2xl">{user.name}</span>
            </div>
            <div className="flex justify-between border-b border-white/20 pb-2">
              <span className="text-red-200">BLOOD TYPE:</span>
              <span className="font-bold text-xl text-yellow-300">{user.bloodType}</span>
            </div>
            <div className="border-b border-white/20 pb-2">
              <span className="text-red-200">ALLERGIES:</span>
              <p className="font-bold text-orange-300">{user.allergies}</p>
            </div>
            <div className="border-b border-white/20 pb-2">
              <span className="text-red-200">CURRENT MEDICATIONS:</span>
              <p className="font-bold">{user.medications}</p>
            </div>
            <div className="border-b border-white/20 pb-2">
              <span className="text-red-200">MEDICAL CONDITIONS:</span>
              <p className="font-bold text-yellow-300">{user.conditions}</p>
            </div>
          </div>
        </div>

        {/* EMERGENCY CONTACTS */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 mb-4 border-2 border-green-500/50">
          <h2 className="text-lg font-bold text-center mb-3 text-green-300">📞 EMERGENCY CONTACTS</h2>
          
          <div className="space-y-3">
            <button className="w-full bg-green-600 hover:bg-green-500 rounded-xl p-3 flex items-center justify-between transition-colors">
              <div className="text-left">
                <p className="font-bold">{user.emergencyContact}</p>
                <p className="text-green-200 text-sm">{user.emergencyPhone}</p>
              </div>
              <span className="text-2xl">📞</span>
            </button>
            
            <button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl p-3 flex items-center justify-between transition-colors">
              <div className="text-left">
                <p className="font-bold">{user.doctorName}</p>
                <p className="text-blue-200 text-sm">{user.doctorPhone}</p>
              </div>
              <span className="text-2xl">🏥</span>
            </button>
          </div>
        </div>

        {/* LOCATION */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 mb-4 border-2 border-cyan-500/50">
          <h2 className="text-lg font-bold text-center mb-2 text-cyan-300">📍 CURRENT LOCATION</h2>
          <p className="text-center">{user.address}</p>
          <p className="text-center text-cyan-300 text-sm mt-1">GPS: -33.8688° S, 151.2093° E</p>
        </div>

        {/* CANCEL BUTTON */}
        {!calling && (
          <button
            onClick={onCancel}
            className="w-full bg-gray-700 hover:bg-gray-600 rounded-xl p-4 font-bold text-lg transition-colors"
          >
            ✋ I'M OK - CANCEL EMERGENCY
          </button>
        )}
      </div>
    </div>
  );
};

// LOST PHONE SCREEN - Shows when phone is marked as lost
export const LostPhoneScreen = ({ ownerInfo, onUnlock }) => {
  const defaultOwner = {
    message: 'This phone belongs to me. Please help me get it back!',
    contactName: 'John Smith',
    contactEmail: 'john.smith@email.com',
    contactPhone: '0412 345 678',
    reward: '$50 reward for safe return'
  };

  const owner = ownerInfo || defaultOwner;

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-600 via-orange-700 to-red-800 text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
      </div>

      <div className="relative z-10 p-6 flex flex-col items-center justify-center min-h-screen">
        {/* LOST PHONE ICON */}
        <div className="text-8xl mb-4 animate-bounce">📱</div>
        
        <h1 className="text-4xl font-black text-center mb-2">LOST PHONE</h1>
        <p className="text-yellow-200 text-center mb-6">Please help return this phone to its owner</p>

        {/* OWNER MESSAGE */}
        <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 mb-6 w-full max-w-sm border-2 border-white/30">
          <p className="text-center text-lg italic">"{owner.message}"</p>
        </div>

        {/* CONTACT INFO */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 mb-4 w-full max-w-sm border-2 border-green-400/50">
          <h2 className="text-lg font-bold text-center mb-4 text-green-300">📞 CONTACT OWNER</h2>
          
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-yellow-200 text-sm">Owner Name</p>
              <p className="font-bold text-xl">{owner.contactName}</p>
            </div>
            
            <button className="w-full bg-green-600 hover:bg-green-500 rounded-xl p-3 flex items-center justify-center space-x-2 transition-colors">
              <span className="text-xl">📞</span>
              <span className="font-bold">{owner.contactPhone}</span>
            </button>
            
            <button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl p-3 flex items-center justify-center space-x-2 transition-colors">
              <span className="text-xl">✉️</span>
              <span className="font-bold">{owner.contactEmail}</span>
            </button>
          </div>
        </div>

        {/* REWARD */}
        <div className="bg-green-500/30 backdrop-blur-xl rounded-2xl p-4 mb-6 w-full max-w-sm border-2 border-green-400">
          <p className="text-center font-bold text-xl text-green-200">🎁 {owner.reward}</p>
        </div>

        {/* GPS STATUS */}
        <div className="flex items-center space-x-2 text-yellow-300">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm">GPS TRACKING ACTIVE - Location shared with owner</span>
        </div>

        {/* Hidden unlock for owner */}
        <button
          onClick={onUnlock}
          className="mt-8 text-white/30 text-xs underline"
        >
          Owner? Enter pattern to unlock
        </button>
      </div>
    </div>
  );
};

export default {
  AegisNotification,
  AegisCalendar,
  useAegisNotifications,
  InvisibleHomeScreen,
  EmergencyMedicalScreen,
  LostPhoneScreen
};
