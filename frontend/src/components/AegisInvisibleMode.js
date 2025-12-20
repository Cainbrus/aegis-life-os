import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// =============================================
// AEGIS INVISIBLE MODE
// After learning, Aegis runs silently
// Only shows notifications and calculator vault
// =============================================

// Notification popup component
export const AegisNotification = ({ notification, onDismiss, onAction }) => {
  if (!notification) return null;

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'security':
        return 'border-red-500 bg-red-500/10';
      case 'privacy':
        return 'border-purple-500 bg-purple-500/10';
      case 'reminder':
        return 'border-cyan-500 bg-cyan-500/10';
      case 'suggestion':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-slate-500 bg-slate-500/10';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'security':
        return '🚨';
      case 'privacy':
        return '🔒';
      case 'reminder':
        return '📅';
      case 'suggestion':
        return '💡';
      default:
        return '📣';
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
      <div className={`bg-slate-900/95 backdrop-blur-xl rounded-2xl border-2 ${getTypeStyles()} p-4 shadow-2xl`}>
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{getIcon()}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{notification.title}</h3>
              <span className="text-xs text-slate-400">{notification.time || 'Just now'}</span>
            </div>
            <p className="text-sm text-slate-300 mt-1">{notification.message}</p>
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex space-x-2 mt-3">
                {notification.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAction(action.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      action.primary
                        ? 'bg-cyan-500 text-white hover:bg-cyan-600'
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
            onClick={onDismiss}
            className="text-slate-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

// Phone-like Calendar component
export const AegisCalendar = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', description: '' });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await axios.get(`${API}/calendar/events`);
      setEvents(response.data.events || []);
    } catch (error) {
      // Load mock events
      setEvents([
        { id: 1, title: 'Team Meeting', date: getTodayString(), time: '10:00', description: 'Weekly sync' },
        { id: 2, title: 'Dentist Appointment', date: getTomorrowString(), time: '14:30', description: 'Regular checkup' },
        { id: 3, title: 'Mom\'s Birthday', date: getNextWeekString(), time: '00:00', description: 'Don\'t forget gift!' },
      ]);
    }
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getNextWeekString = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  };

  const addEvent = async () => {
    if (!newEvent.title || !selectedDate) return;
    
    const event = {
      id: Date.now(),
      title: newEvent.title,
      date: selectedDate,
      time: newEvent.time,
      description: newEvent.description
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
    
    // Add empty slots for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days in month
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
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 p-4 flex items-center justify-between">
        <button onClick={onClose} className="text-cyan-400">← Back</button>
        <h1 className="text-xl font-bold">Calendar</h1>
        <button 
          onClick={() => setShowAddEvent(true)}
          className="text-cyan-400"
        >
          + Add
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between p-4 bg-slate-800/50">
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
          className="text-cyan-400 text-2xl"
        >
          ‹
        </button>
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
          className="text-cyan-400 text-2xl"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs text-slate-500 py-2 bg-slate-800/30">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {getDaysInMonth(currentDate).map((day, idx) => {
          if (!day) return <div key={idx} className="h-12"></div>;
          
          const dateString = formatDateString(day);
          const dayEvents = getEventsForDate(dateString);
          const isToday = dateString === getTodayString();
          const isSelected = dateString === selectedDate;
          
          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(dateString)}
              className={`h-12 rounded-lg flex flex-col items-center justify-center transition-all ${
                isSelected ? 'bg-cyan-500 text-white' :
                isToday ? 'bg-cyan-500/20 text-cyan-400' :
                'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span className="text-sm">{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex space-x-1 mt-1">
                  {dayEvents.slice(0, 3).map((_, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-cyan-400'}`}></div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <div className="p-4 border-t border-slate-700">
          <h3 className="text-lg font-semibold mb-3">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map(event => (
                <div key={event.id} className="bg-slate-800 rounded-lg p-4 border-l-4 border-cyan-500">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{event.title}</h4>
                    {event.time && event.time !== '00:00' && (
                      <span className="text-cyan-400 text-sm">{event.time}</span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No events for this day</p>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Event</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  placeholder="Event title"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Time</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddEvent(false)}
                className="flex-1 bg-slate-700 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addEvent}
                className="flex-1 bg-cyan-500 text-white py-2 rounded-lg"
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

// Notification Manager - handles all notification logic
export const useAegisNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    // Check for notifications periodically
    const checkNotifications = async () => {
      try {
        const response = await axios.get(`${API}/notifications/pending`);
        if (response.data.notifications && response.data.notifications.length > 0) {
          setNotifications(response.data.notifications);
        }
      } catch (error) {
        // Silent fail
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show notifications one at a time
    if (notifications.length > 0 && !currentNotification) {
      setCurrentNotification(notifications[0]);
    }
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

  // Trigger a notification manually
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

// The "Invisible" home screen - looks like a normal phone
export const InvisibleHomeScreen = ({ onOpenCalculator, onOpenCalendar, onOpenApp }) => {
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  // Normal-looking phone apps
  const apps = [
    { name: 'Messages', icon: '💬', color: 'bg-green-500' },
    { name: 'Phone', icon: '📞', color: 'bg-green-600' },
    { name: 'Camera', icon: '📷', color: 'bg-gray-600' },
    { name: 'Photos', icon: '🖼️', color: 'bg-gradient-to-br from-pink-500 to-yellow-500' },
    { name: 'Safari', icon: '🧭', color: 'bg-blue-500' },
    { name: 'Mail', icon: '✉️', color: 'bg-blue-400' },
    { name: 'Calendar', icon: '📅', color: 'bg-white', action: 'calendar' },
    { name: 'Notes', icon: '📝', color: 'bg-yellow-400' },
    { name: 'Music', icon: '🎵', color: 'bg-gradient-to-br from-pink-500 to-red-500' },
    { name: 'Settings', icon: '⚙️', color: 'bg-gray-500' },
    { name: 'Calculator', icon: '🔢', color: 'bg-gray-700', action: 'calculator' },
    { name: 'Clock', icon: '🕐', color: 'bg-black' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white relative">
      {/* Wallpaper effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/2 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl -translate-x-1/2"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-2 text-xs">
          <span>{currentTime}</span>
          <div className="flex items-center space-x-1">
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Time display */}
        <div className="text-center py-12">
          <div className="text-6xl font-light">{currentTime}</div>
          <div className="text-lg text-slate-400 mt-2">{currentDate}</div>
        </div>

        {/* App grid */}
        <div className="grid grid-cols-4 gap-4 px-6 py-8">
          {apps.map((app, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (app.action === 'calculator') onOpenCalculator();
                else if (app.action === 'calendar') onOpenCalendar();
                else onOpenApp(app.name);
              }}
              className="flex flex-col items-center"
            >
              <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                {app.icon}
              </div>
              <span className="text-xs mt-2 text-slate-300">{app.name}</span>
            </button>
          ))}
        </div>

        {/* Dock */}
        <div className="fixed bottom-8 left-6 right-6">
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-4">
            <div className="flex justify-around">
              <button className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-2xl">
                📞
              </button>
              <button className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl">
                🧭
              </button>
              <button className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-2xl">
                💬
              </button>
              <button className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center text-2xl">
                🎵
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  AegisNotification,
  AegisCalendar,
  useAegisNotifications,
  InvisibleHomeScreen
};
