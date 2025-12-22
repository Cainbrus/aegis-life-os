// =============================================
// AEGIS DEMO MODE - FULL FEATURE SHOWCASE
// Auto-plays through all features for investor demos
// Actually SHOWS each feature working, not just notifications
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import { playNotification, playSuccess, playButtonClick, playAppOpen } from '../services/SoundService';

// Demo scenarios with screen actions
const DEMO_SCENARIOS = [
  {
    id: 'morning_wakeup',
    time: '6:30 AM',
    title: '🌅 Morning Wake-Up',
    description: 'Aegis wakes you early due to traffic',
    notification: {
      type: 'urgent',
      icon: '⏰',
      title: 'Wake Up Early!',
      message: "There's a crash on your usual route. I found an alternative. Leave by 7:40 to make your 9am meeting.",
    },
    action: 'notification', // Just show notification
    duration: 5000
  },
  {
    id: 'meeting_summary',
    time: '11:15 AM', 
    title: '📝 Meeting Summary',
    description: 'AI-generated meeting notes & action items',
    notification: {
      type: 'suggestion',
      icon: '📝',
      title: 'Meeting Summary Ready',
      message: "I recorded and summarized your meeting. 4 action items identified.",
    },
    action: 'open_meeting_summary', // Opens Meeting Summary screen
    duration: 8000
  },
  {
    id: 'privacy_cleanup',
    time: '12:30 PM',
    title: '🔒 Privacy Protection',
    description: 'Auto-deletes sensitive browsing history',
    notification: {
      type: 'privacy',
      icon: '🔒',
      title: 'Privacy Protected',
      message: "I cleared sensitive browsing history and moved 2 files to your secure vault.",
    },
    action: 'notification',
    duration: 5000
  },
  {
    id: 'financial_alert',
    time: '2:15 PM',
    title: '💰 Financial Dashboard',
    description: 'Spending tracking & unusual activity alerts',
    notification: {
      type: 'finance',
      icon: '💳',
      title: 'Spending Alert',
      message: "You've spent $847 today. Tap to see your financial dashboard.",
    },
    action: 'open_finance', // Opens Financial Dashboard
    duration: 8000
  },
  {
    id: 'intruder_alert',
    time: '3:30 PM',
    title: '🚨 Intruder Detection',
    description: 'Someone tried to unlock - photo captured',
    notification: {
      type: 'security',
      icon: '🚨',
      title: 'Intruder Detected!',
      message: "Someone tried to unlock your phone. I captured their photo and showed them fake data.",
    },
    action: 'show_intruder', // Shows intruder alert
    duration: 6000
  },
  {
    id: 'family_tracker',
    time: '4:00 PM',
    title: '👨‍👩‍👧 Family Tracker',
    description: 'Real-time family location & safety',
    notification: {
      type: 'family',
      icon: '👧',
      title: 'Sophie Arrived Safely',
      message: "Sophie just arrived at school. All family members in safe zones.",
    },
    action: 'open_family', // Opens Family Tracker
    duration: 8000
  },
  {
    id: 'health_reminder',
    time: '8:00 PM',
    title: '💊 Health Dashboard',
    description: 'Medication tracking & wellness stats',
    notification: {
      type: 'health',
      icon: '💊',
      title: 'Evening Medication',
      message: "Time for your vitamins. You have a 14-day streak!",
    },
    action: 'open_health', // Opens Health Dashboard
    duration: 8000
  },
  {
    id: 'calculator_vault',
    time: '9:00 PM',
    title: '🔢 Secret Vault',
    description: 'Hidden vault accessed via calculator',
    notification: {
      type: 'security',
      icon: '🔐',
      title: 'Secure Vault',
      message: "Your private files are protected. Access via Calculator with code 8675309.",
    },
    action: 'open_calculator', // Opens Calculator (vault access)
    duration: 6000
  },
  {
    id: 'goodnight',
    time: '10:30 PM',
    title: '🌙 Goodnight',
    description: 'Tomorrow\'s schedule prepared',
    notification: {
      type: 'companion',
      icon: '🌙',
      title: 'Ready for Tomorrow',
      message: "Tomorrow: 3 meetings, dentist at 2pm. I've optimized your schedule. Sleep well!",
    },
    action: 'notification',
    duration: 5000
  }
];

// Demo Mode Controller - Full Feature Showcase
export const DemoModeController = ({ 
  onTriggerNotification, 
  onDismissNotification,
  onOpenScreen, // Function to open specific screens
  isActive, 
  onToggle 
}) => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Execute the demo action for current scenario
  const executeScenarioAction = useCallback((scenario) => {
    // First show notification
    if (onTriggerNotification && scenario.notification) {
      playNotification(scenario.notification.type);
      onTriggerNotification(scenario.notification);
    }

    // Then open the relevant screen after a short delay
    setTimeout(() => {
      if (onDismissNotification) {
        onDismissNotification();
      }
      
      if (onOpenScreen) {
        switch(scenario.action) {
          case 'open_meeting_summary':
            playAppOpen();
            onOpenScreen('meeting_summary');
            break;
          case 'open_finance':
            playAppOpen();
            onOpenScreen('finance');
            break;
          case 'open_family':
            playAppOpen();
            onOpenScreen('family');
            break;
          case 'open_health':
            playAppOpen();
            onOpenScreen('health');
            break;
          case 'open_calculator':
            playAppOpen();
            onOpenScreen('calculator');
            break;
          case 'show_intruder':
            onOpenScreen('intruder');
            break;
          default:
            // Just notification, no screen to open
            break;
        }
      }
    }, 2000); // Show notification for 2 seconds, then open screen
  }, [onTriggerNotification, onDismissNotification, onOpenScreen]);

  // Auto-advance through scenarios
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const scenario = DEMO_SCENARIOS[currentScenario];
    
    // Execute this scenario's action
    executeScenarioAction(scenario);

    // Move to next scenario after duration
    const advanceTimer = setTimeout(() => {
      // Close any open screens before next scenario
      if (onOpenScreen) {
        onOpenScreen('close_all');
      }
      
      if (currentScenario < DEMO_SCENARIOS.length - 1) {
        setCurrentScenario(prev => prev + 1);
      } else {
        // Demo complete
        if (onDismissNotification) {
          onDismissNotification();
        }
        setIsPlaying(false);
        setCurrentScenario(0);
        playSuccess();
      }
    }, scenario?.duration || 6000);

    return () => {
      clearTimeout(advanceTimer);
    };
  }, [isPlaying, isPaused, currentScenario, executeScenarioAction, onDismissNotification, onOpenScreen]);

  const startDemo = () => {
    // Close any open screens first
    if (onOpenScreen) {
      onOpenScreen('close_all');
    }
    setCurrentScenario(0);
    setIsPlaying(true);
    setIsPaused(false);
    playButtonClick();
  };

  const stopDemo = () => {
    if (onDismissNotification) {
      onDismissNotification();
    }
    if (onOpenScreen) {
      onOpenScreen('close_all');
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
    if (onOpenScreen) {
      onOpenScreen('close_all');
    }
    if (onDismissNotification) {
      onDismissNotification();
    }
    setCurrentScenario(index);
    if (!isPlaying) setIsPlaying(true);
    setIsPaused(false);
    playButtonClick();
  };

  // Collapsed button when not showing controls
  if (!showControls && !isPlaying) {
    return (
      <button
        onClick={() => setShowControls(true)}
        className="fixed bottom-4 right-2 z-30 bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-sm text-white px-3 py-2 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center space-x-2 text-sm"
      >
        <span>🎬</span>
        <span className="font-bold text-xs">DEMO</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-2 z-40 w-72 sm:w-80">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎬</span>
            <div>
              <span className="text-white font-bold">Investor Demo</span>
              {isPlaying && (
                <p className="text-purple-200 text-xs">A Day in the Life with Aegis</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => { setShowControls(false); stopDemo(); }}
            className="text-white/80 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        {isPlaying && (
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-white">{DEMO_SCENARIOS[currentScenario]?.title}</span>
              <span>{DEMO_SCENARIOS[currentScenario]?.time}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentScenario + 1) / DEMO_SCENARIOS.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-slate-400 text-xs">{DEMO_SCENARIOS[currentScenario]?.description}</p>
          </div>
        )}

        {/* Scenario List */}
        <div className="max-h-52 overflow-y-auto p-3">
          <div className="space-y-1">
            {DEMO_SCENARIOS.map((scenario, idx) => (
              <button
                key={scenario.id}
                onClick={() => skipToScenario(idx)}
                className={`w-full flex items-center space-x-2 p-2 rounded-lg text-left transition-all ${
                  currentScenario === idx && isPlaying
                    ? 'bg-purple-500/30 border border-purple-500/50'
                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-lg">{scenario.notification.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{scenario.title}</p>
                  <p className="text-slate-500 text-[10px]">{scenario.time} • {scenario.description}</p>
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
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center space-x-2 text-lg"
            >
              <span>▶️</span>
              <span>START DEMO</span>
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

// Quick Demo Button - triggers individual scenarios
export const QuickDemoButton = ({ onTrigger, onOpenScreen }) => {
  const [isOpen, setIsOpen] = useState(false);

  const triggerScenario = (scenario) => {
    playNotification(scenario.notification.type);
    if (onTrigger) {
      onTrigger(scenario.notification);
    }
    
    // Also open the screen if applicable
    setTimeout(() => {
      if (onOpenScreen && scenario.action !== 'notification') {
        switch(scenario.action) {
          case 'open_meeting_summary':
            onOpenScreen('meeting_summary');
            break;
          case 'open_finance':
            onOpenScreen('finance');
            break;
          case 'open_family':
            onOpenScreen('family');
            break;
          case 'open_health':
            onOpenScreen('health');
            break;
          case 'open_calculator':
            onOpenScreen('calculator');
            break;
          case 'show_intruder':
            onOpenScreen('intruder');
            break;
          default:
            break;
        }
      }
    }, 1500);
    
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isOpen && (
        <div className="absolute bottom-14 left-0 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700 shadow-2xl p-2 w-72 max-h-96 overflow-y-auto">
          <p className="text-xs text-purple-400 font-bold px-2 py-1 border-b border-slate-700 mb-2">
            ⚡ Quick Feature Demo
          </p>
          {DEMO_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => triggerScenario(scenario)}
              className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
            >
              <span className="text-lg">{scenario.notification.icon}</span>
              <div className="flex-1">
                <span className="text-white text-xs font-medium">{scenario.title}</span>
                <p className="text-slate-500 text-[10px]">{scenario.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <span className="text-xl">{isOpen ? '✕' : '⚡'}</span>
      </button>
    </div>
  );
};

export default DemoModeController;
export { DEMO_SCENARIOS };
