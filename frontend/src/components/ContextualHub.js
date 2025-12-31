import React, { useState, useEffect, useMemo } from 'react';
import { 
  LivingCityBackground, 
  MateAvatar, 
  MateAssistantPanel,
  SecurityStatusBar,
  ProactiveBriefingFeed,
  WorkerAIIndicator,
  ContextualCard
} from './LivingCityComponents';

// =============================================
// AEGIS CONTEXTUAL HUB
// The adaptive, time-aware home screen
// =============================================

const ContextualHub = ({ 
  onOpenApp, 
  onOpenMate, 
  trapActive = false,
  userData = {},
  protectionStats = { threatsBlocked: 47 }
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mateOpen, setMateOpen] = useState(false);
  const [activeWorkers, setActiveWorkers] = useState(['security', 'spam']);
  const [briefings, setBriefings] = useState([]);
  const [greeting, setGreeting] = useState('');
  const [contextMode, setContextMode] = useState('morning');

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Determine context based on time
  useEffect(() => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 9) {
      setContextMode('morning');
      setGreeting('Good Morning');
    } else if (hour >= 9 && hour < 12) {
      setContextMode('work');
      setGreeting('Stay Focused');
    } else if (hour >= 12 && hour < 14) {
      setContextMode('midday');
      setGreeting('Good Afternoon');
    } else if (hour >= 14 && hour < 18) {
      setContextMode('work');
      setGreeting('Keep It Up');
    } else if (hour >= 18 && hour < 22) {
      setContextMode('evening');
      setGreeting('Good Evening');
    } else {
      setContextMode('night');
      setGreeting('Rest Well');
    }
  }, [currentTime]);

  // Generate contextual briefings
  useEffect(() => {
    const generateBriefings = () => {
      const baseBriefings = [
        {
          type: 'suggestion',
          title: '🛡️ Daily Protection Summary',
          message: `${protectionStats.threatsBlocked} threats blocked today. Your digital city is secure.`,
          actions: [{ label: 'View Details', id: 'view_security' }]
        }
      ];

      if (contextMode === 'morning') {
        baseBriefings.unshift({
          type: 'morning',
          title: '☀️ Your Morning Briefing',
          message: 'Traffic looks clear for your usual commute. 2 important emails overnight.',
          actions: [
            { label: 'View Emails', id: 'emails', primary: true },
            { label: 'Check Calendar', id: 'calendar' }
          ]
        });
      } else if (contextMode === 'work') {
        baseBriefings.unshift({
          type: 'work',
          title: '📊 Focus Mode Active',
          message: 'Social media notifications paused. Next meeting in 2 hours.',
          actions: [
            { label: 'View Schedule', id: 'calendar', primary: true },
            { label: 'Disable Focus', id: 'disable_focus' }
          ]
        });
      } else if (contextMode === 'evening') {
        baseBriefings.unshift({
          type: 'evening',
          title: '🌙 Wind Down Mode',
          message: 'Work notifications silenced. Family is all home safe.',
          actions: [
            { label: 'Family Status', id: 'family', primary: true },
            { label: 'Entertainment', id: 'entertainment' }
          ]
        });
      }

      // Add a random contextual alert occasionally
      if (Math.random() > 0.5) {
        baseBriefings.push({
          type: 'alert',
          title: '⚠️ Scheduling Conflict Detected',
          message: 'Your 3pm meeting conflicts with dentist appointment. Should I reschedule?',
          actions: [
            { label: 'Resolve', id: 'resolve_conflict', primary: true },
            { label: 'Ignore', id: 'ignore' }
          ]
        });
      }

      setBriefings(baseBriefings);
    };

    generateBriefings();
  }, [contextMode, protectionStats.threatsBlocked]);

  // Simulate worker AI activity
  useEffect(() => {
    const workerInterval = setInterval(() => {
      const allWorkers = ['security', 'spam', 'photos', 'calendar', 'messages', 'finance'];
      const activeCount = Math.floor(Math.random() * 3) + 2;
      const shuffled = allWorkers.sort(() => 0.5 - Math.random());
      setActiveWorkers(shuffled.slice(0, activeCount));
    }, 5000);
    return () => clearInterval(workerInterval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Quick action apps based on context
  const getContextApps = () => {
    const baseApps = [
      { id: 'security', icon: '🛡️', label: 'Security', color: 'cyan' },
      { id: 'family', icon: '👨‍👩‍👧', label: 'Family', color: 'amber' },
    ];

    switch (contextMode) {
      case 'morning':
        return [
          { id: 'calendar', icon: '📅', label: 'Calendar', color: 'green' },
          { id: 'email', icon: '📧', label: 'Email', color: 'blue' },
          { id: 'weather', icon: '⛅', label: 'Weather', color: 'cyan' },
          { id: 'news', icon: '📰', label: 'News', color: 'purple' },
          ...baseApps,
        ];
      case 'work':
        return [
          { id: 'calendar', icon: '📅', label: 'Meetings', color: 'green' },
          { id: 'email', icon: '📧', label: 'Email', color: 'blue' },
          { id: 'slack', icon: '💬', label: 'Slack', color: 'purple' },
          { id: 'drive', icon: '📁', label: 'Drive', color: 'yellow' },
          ...baseApps,
        ];
      case 'evening':
        return [
          { id: 'entertainment', icon: '🎬', label: 'Netflix', color: 'red' },
          { id: 'food', icon: '🍕', label: 'Food', color: 'orange' },
          { id: 'music', icon: '🎵', label: 'Music', color: 'green' },
          { id: 'messages', icon: '💬', label: 'Messages', color: 'blue' },
          ...baseApps,
        ];
      default:
        return [
          { id: 'calendar', icon: '📅', label: 'Calendar', color: 'green' },
          { id: 'messages', icon: '💬', label: 'Messages', color: 'blue' },
          { id: 'photos', icon: '📸', label: 'Photos', color: 'purple' },
          { id: 'browser', icon: '🌐', label: 'Browser', color: 'cyan' },
          ...baseApps,
        ];
    }
  };

  const contextApps = getContextApps();

  return (
    <LivingCityBackground intensity={trapActive ? 'high' : 'medium'}>
      <div className="min-h-screen p-4 pb-24">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            {activeWorkers.slice(0, 2).map((worker, i) => (
              <WorkerAIIndicator key={i} type={worker} active={true} count={2} />
            ))}
          </div>
          <div className="text-slate-400 text-sm">
            {trapActive && <span className="text-red-400 mr-2">🎭 DECOY</span>}
            <span className="text-white font-mono">{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Greeting Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white mb-1">
                {greeting}, {userData.name || 'Cain'}
              </h1>
              <p className="text-slate-400">{formatDate(currentTime)}</p>
            </div>
            <button onClick={() => setMateOpen(true)}>
              <MateAvatar size="medium" mood={trapActive ? 'alert' : 'happy'} />
            </button>
          </div>
        </div>

        {/* Security Status */}
        <div className="mb-6">
          <SecurityStatusBar 
            threatsBlocked={protectionStats.threatsBlocked}
            status={trapActive ? 'decoy' : 'protected'}
            workers={activeWorkers}
          />
        </div>

        {/* Context-Aware Quick Actions */}
        <div className="mb-6">
          <h3 className="text-slate-400 text-sm font-medium mb-3 flex items-center">
            <span className="mr-2">⚡</span>
            {contextMode === 'morning' ? 'Morning Essentials' : 
             contextMode === 'work' ? 'Work Tools' : 
             contextMode === 'evening' ? 'Evening Favorites' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {contextApps.slice(0, 8).map((app) => (
              <button
                key={app.id}
                onClick={() => onOpenApp?.(app.id)}
                className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50 hover:border-${app.color}-500/50 transition-all hover:scale-105 active:scale-95`}
              >
                <div className="text-3xl mb-2">{app.icon}</div>
                <div className="text-xs text-slate-400 truncate">{app.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* MATE's Proactive Briefing */}
        <div className="mb-6">
          <ProactiveBriefingFeed 
            briefings={briefings}
            onAction={(actionId) => {
              console.log('Action:', actionId);
              if (actionId === 'calendar') onOpenApp?.('calendar');
              if (actionId === 'emails' || actionId === 'email') onOpenApp?.('email');
              if (actionId === 'family') onOpenApp?.('family');
              if (actionId === 'view_security') onOpenApp?.('security');
            }}
            onDismiss={(index) => {
              setBriefings(prev => prev.filter((_, i) => i !== index));
            }}
          />
        </div>

        {/* MATE Chat Panel */}
        <MateAssistantPanel 
          isOpen={mateOpen} 
          onClose={() => setMateOpen(false)}
        />

        {/* Floating MATE button */}
        <button
          onClick={() => setMateOpen(true)}
          className="fixed bottom-20 right-4 z-40"
        >
          <div className="relative">
            <MateAvatar size="large" mood={trapActive ? 'protective' : 'neutral'} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">!</span>
            </div>
          </div>
        </button>
      </div>
    </LivingCityBackground>
  );
};

export default ContextualHub;
