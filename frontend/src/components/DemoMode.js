// =============================================
// AEGIS DEMO MODE
// Auto-plays through all features for investor demos
// "A Day in the Life with Aegis"
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import { playNotification, playSuccess, playButtonClick, playUnlock, playSosActivate } from '../services/SoundService';

// Demo scenarios - "A Day in the Life"
const DEMO_SCENARIOS = [
  {
    id: 'morning_wakeup',
    time: '6:30 AM',
    title: '🌅 Morning Wake-Up',
    notification: {
      type: 'urgent',
      icon: '⏰',
      title: 'Wake Up Early!',
      message: "Hey, I woke you up 20 mins early. There's a crash on your usual route - I found an alternative that adds 20 mins. Leave by 7:40 to make your 9am meeting.",
      actions: [
        { id: 'show_route', label: 'Show New Route', primary: true },
        { id: 'snooze', label: 'Snooze 5 mins' }
      ]
    },
    duration: 6000
  },
  {
    id: 'calendar_reminder',
    time: '9:45 AM',
    title: '📅 Meeting Prep',
    notification: {
      type: 'calendar',
      icon: '📅',
      title: 'Investor Meeting in 15 mins',
      message: "I've prepared your pitch deck and pulled up last week's notes. Sarah from the VC firm prefers data-heavy presentations.",
      actions: [
        { id: 'view_deck', label: 'View Deck', primary: true },
        { id: 'view_notes', label: 'See Notes' }
      ]
    },
    duration: 5000
  },
  {
    id: 'meeting_summary',
    time: '11:15 AM',
    title: '📝 Post-Meeting',
    notification: {
      type: 'suggestion',
      icon: '📝',
      title: 'Meeting Summary Ready',
      message: "I recorded and summarized your investor meeting. 4 action items identified. Sarah seemed interested in the trap mode feature - I flagged this for follow-up.",
      actions: [
        { id: 'view_summary', label: 'View Summary', primary: true },
        { id: 'dismiss', label: 'Later' }
      ]
    },
    duration: 5000
  },
  {
    id: 'privacy_cleanup',
    time: '12:30 PM',
    title: '🔒 Privacy Protection',
    notification: {
      type: 'privacy',
      icon: '🔒',
      title: 'Privacy Protected',
      message: "I noticed some sensitive browsing from this morning. I've cleared the history and moved 2 downloaded files to your secure vault.",
      actions: [
        { id: 'view_vault', label: 'Open Vault', primary: true },
        { id: 'dismiss', label: 'Thanks!' }
      ]
    },
    duration: 5000
  },
  {
    id: 'intruder_alert',
    time: '2:45 PM',
    title: '🚨 Security Alert',
    notification: {
      type: 'security',
      icon: '🚨',
      title: 'Intruder Detected!',
      message: "Someone tried to unlock your phone while you were away. I captured their photo, showed them fake data, and logged everything.",
      actions: [
        { id: 'view_photo', label: 'View Photo', primary: true },
        { id: 'view_log', label: 'See Activity Log' }
      ]
    },
    duration: 6000
  },
  {
    id: 'family_tracker',
    time: '3:30 PM',
    title: '👨‍👩‍👧 Family Safety',
    notification: {
      type: 'family',
      icon: '👧',
      title: 'Sophie Arrived Safely',
      message: "Sophie just arrived at school. Her phone battery is at 78%. All family members are in safe zones.",
      actions: [
        { id: 'view_map', label: 'Open Map', primary: true },
        { id: 'dismiss', label: 'Great!' }
      ]
    },
    duration: 4000
  },
  {
    id: 'financial_alert',
    time: '5:15 PM',
    title: '💰 Financial Intelligence',
    notification: {
      type: 'finance',
      icon: '💳',
      title: 'Unusual Transaction',
      message: "Your card was charged $847 at an electronics store in another city. This doesn't match your patterns. Should I freeze the card?",
      actions: [
        { id: 'freeze', label: 'Freeze Card', primary: true },
        { id: 'its_me', label: "It's Me" }
      ]
    },
    duration: 5000
  },
  {
    id: 'health_reminder',
    time: '8:00 PM',
    title: '💊 Health Check',
    notification: {
      type: 'health',
      icon: '💊',
      title: 'Evening Medication',
      message: "Time for your evening vitamins. You've maintained a 14-day streak! Based on your sleep patterns, I suggest taking them now before your usual wind-down.",
      actions: [
        { id: 'taken', label: 'Taken ✓', primary: true },
        { id: 'remind_later', label: 'Remind in 30m' }
      ]
    },
    duration: 5000
  },
  {
    id: 'goodnight',
    time: '10:30 PM',
    title: '🌙 Goodnight Mode',
    notification: {
      type: 'companion',
      icon: '🌙',
      title: 'Ready for Tomorrow',
      message: "Tomorrow looks busy - 3 meetings, a dentist appointment, and Sophie's recital. I've optimized your schedule and set your wake-up for 6:15 AM. Sleep well!",
      actions: [
        { id: 'view_schedule', label: 'View Tomorrow', primary: true },
        { id: 'goodnight', label: 'Goodnight Aegis' }
      ]
    },
    duration: 5000
  }
];

// Demo Mode Controller
export const DemoModeController = ({ onTriggerNotification, onDismissNotification, onOpenScreen, isActive, onToggle }) => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Auto-advance through scenarios
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const scenario = DEMO_SCENARIOS[currentScenario];
    
    // Dismiss previous notification first
    if (onDismissNotification) {
      onDismissNotification();
    }
    
    // Small delay before showing new notification
    const showTimer = setTimeout(() => {
      // Trigger the notification
      if (onTriggerNotification && scenario) {
        playNotification(scenario.notification.type);
        onTriggerNotification(scenario.notification);
      }
    }, 300);

    // Move to next scenario after duration
    const advanceTimer = setTimeout(() => {
      if (currentScenario < DEMO_SCENARIOS.length - 1) {
        setCurrentScenario(prev => prev + 1);
      } else {
        // Demo complete - dismiss last notification
        if (onDismissNotification) {
          onDismissNotification();
        }
        setIsPlaying(false);
        setCurrentScenario(0);
        playSuccess();
      }
    }, scenario?.duration || 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(advanceTimer);
    };
  }, [isPlaying, isPaused, currentScenario, onTriggerNotification, onDismissNotification]);

  const startDemo = () => {
    setCurrentScenario(0);
    setIsPlaying(true);
    setIsPaused(false);
    playButtonClick();
  };

  const stopDemo = () => {
    // Dismiss notification when stopping
    if (onDismissNotification) {
      onDismissNotification();
    }
    setIsPlaying(false);
    setCurrentScenario(0);
    playButtonClick();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    playButtonClick();
  };

  const skipToScenario = (index) => {
    setCurrentScenario(index);
    if (!isPlaying) setIsPlaying(true);
    setIsPaused(false);
    playButtonClick();
  };

  if (!showControls && !isPlaying) {
    return (
      <button
        onClick={() => setShowControls(true)}
        className="fixed bottom-20 right-4 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center space-x-2"
      >
        <span>🎬</span>
        <span className="text-sm font-medium">Demo Mode</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎬</span>
            <span className="text-white font-bold">Demo Mode</span>
          </div>
          <button 
            onClick={() => { setShowControls(false); stopDemo(); }}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        {isPlaying && (
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Scenario {currentScenario + 1} of {DEMO_SCENARIOS.length}</span>
              <span>{DEMO_SCENARIOS[currentScenario]?.time}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${((currentScenario + 1) / DEMO_SCENARIOS.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Current Scenario */}
        {isPlaying && (
          <div className="p-3">
            <div className="bg-slate-800/80 rounded-xl p-3">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{DEMO_SCENARIOS[currentScenario]?.notification.icon}</span>
                <span className="text-white font-medium text-sm">
                  {DEMO_SCENARIOS[currentScenario]?.title}
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                {isPaused ? '⏸️ Paused' : '▶️ Playing...'}
              </p>
            </div>
          </div>
        )}

        {/* Scenario List */}
        <div className="max-h-48 overflow-y-auto p-3 pt-0">
          <div className="space-y-1">
            {DEMO_SCENARIOS.map((scenario, idx) => (
              <button
                key={scenario.id}
                onClick={() => skipToScenario(idx)}
                className={`w-full flex items-center space-x-2 p-2 rounded-lg text-left transition-all ${
                  currentScenario === idx && isPlaying
                    ? 'bg-purple-500/20 border border-purple-500/50'
                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-sm">{scenario.notification.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{scenario.title}</p>
                  <p className="text-slate-500 text-[10px]">{scenario.time}</p>
                </div>
                {currentScenario === idx && isPlaying && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 border-t border-slate-700 flex space-x-2">
          {!isPlaying ? (
            <button
              onClick={startDemo}
              className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center space-x-2"
            >
              <span>▶️</span>
              <span>Start Demo</span>
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                className="flex-1 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-all"
              >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              <button
                onClick={stopDemo}
                className="flex-1 py-2 bg-red-600/80 text-white rounded-lg font-medium hover:bg-red-600 transition-all"
              >
                ⏹️ Stop
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Quick Demo Button (for recording)
export const QuickDemoButton = ({ onTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);

  const triggerScenario = (scenario) => {
    playNotification(scenario.notification.type);
    onTrigger(scenario.notification);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isOpen && (
        <div className="absolute bottom-14 left-0 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700 shadow-2xl p-2 w-64 max-h-80 overflow-y-auto">
          <p className="text-xs text-slate-400 px-2 py-1 border-b border-slate-700 mb-2">Quick Trigger:</p>
          {DEMO_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => triggerScenario(scenario)}
              className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
            >
              <span>{scenario.notification.icon}</span>
              <span className="text-white text-xs">{scenario.title}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <span className="text-xl">{isOpen ? '✕' : '⚡'}</span>
      </button>
    </div>
  );
};

export default DemoModeController;
export { DEMO_SCENARIOS };
