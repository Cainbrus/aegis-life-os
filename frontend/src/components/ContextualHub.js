import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LivingCityBackground, 
  MateAvatar, 
  MateAssistantPanel,
  SecurityStatusBar,
  WorkerAIIndicator
} from './LivingCityComponents';
import { playButtonClick, playNotification, playSuccess } from '../services/SoundService';

// =============================================
// AEGIS CONTEXTUAL HUB - "SCREEN A" FROM WIREFRAMES
// The adaptive, time-aware home screen with card feed
// =============================================

// Swipeable Card Component
const SwipeableCard = ({ children, onSwipeLeft, onSwipeRight, onDismiss }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };
  
  const onTouchMove = (e) => {
    if (!isDragging) return;
    const current = e.targetTouches[0].clientX;
    setTouchEnd(current);
    setOffset(current - touchStart);
  };
  
  const onTouchEnd = () => {
    setIsDragging(false);
    if (!touchStart || !touchEnd) {
      setOffset(0);
      return;
    }
    const distance = touchEnd - touchStart;
    const isLeftSwipe = distance < -minSwipeDistance;
    const isRightSwipe = distance > minSwipeDistance;
    
    if (isLeftSwipe && onSwipeLeft) {
      playButtonClick();
      onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
      playSuccess();
      onSwipeRight();
    }
    setOffset(0);
  };
  
  const onMouseDown = (e) => {
    setTouchEnd(null);
    setTouchStart(e.clientX);
    setIsDragging(true);
  };
  
  const onMouseMove = (e) => {
    if (!isDragging) return;
    setTouchEnd(e.clientX);
    setOffset(e.clientX - touchStart);
  };
  
  const onMouseUp = () => {
    onTouchEnd();
  };
  
  const onMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setOffset(0);
    }
  };
  
  return (
    <div
      className="relative transition-transform duration-200 ease-out touch-pan-y"
      style={{ transform: `translateX(${offset}px)` }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Swipe indicators */}
      {offset < -30 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 text-sm font-medium animate-pulse">
          ← Dismiss
        </div>
      )}
      {offset > 30 && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-green-400 text-sm font-medium animate-pulse">
          Done →
        </div>
      )}
      {children}
    </div>
  );
};

// Priority Card Component (from wireframe)
const PriorityCard = ({ 
  priority = 'medium', 
  icon, 
  title, 
  message, 
  actions = [], 
  onAction, 
  onDismiss,
  onMarkDone,
  type = 'default'
}) => {
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return { 
          border: 'border-l-4 border-l-red-500 border-red-500/30',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
          badge: 'bg-red-500/20 text-red-400',
          badgeText: 'HIGH PRIORITY'
        };
      case 'medium':
        return { 
          border: 'border-l-4 border-l-green-500 border-green-500/30',
          glow: 'shadow-[0_0_15px_rgba(34,197,94,0.1)]',
          badge: 'bg-green-500/20 text-green-400',
          badgeText: 'MEDIUM PRIORITY'
        };
      case 'low':
        return { 
          border: 'border-l-4 border-l-blue-500 border-blue-500/30',
          glow: 'shadow-[0_0_10px_rgba(59,130,246,0.1)]',
          badge: 'bg-blue-500/20 text-blue-400',
          badgeText: 'LOW PRIORITY'
        };
      default:
        return { 
          border: 'border-l-4 border-l-cyan-500 border-cyan-500/30',
          glow: '',
          badge: 'bg-cyan-500/20 text-cyan-400',
          badgeText: 'INFO'
        };
    }
  };
  
  const getTypeIcon = () => {
    switch (type) {
      case 'conflict': return '⚠️';
      case 'wellness': return '💚';
      case 'privacy': return '🔒';
      case 'security': return '🛡️';
      case 'calendar': return '📅';
      case 'finance': return '💰';
      case 'family': return '👨‍👩‍👧';
      case 'commute': return '🚗';
      default: return icon || '📋';
    }
  };
  
  const styles = getPriorityStyles();
  
  return (
    <SwipeableCard onSwipeLeft={onDismiss} onSwipeRight={onMarkDone}>
      <div className={`
        bg-slate-800/60 backdrop-blur-xl rounded-2xl 
        ${styles.border} ${styles.glow}
        p-4 transition-all duration-300 hover:bg-slate-800/80
        cursor-pointer
      `}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getTypeIcon()}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
              {styles.badgeText}
            </span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
            className="text-slate-500 hover:text-white transition-colors text-lg"
          >
            ×
          </button>
        </div>
        
        <h4 className="text-white font-bold text-lg mb-2">{title}</h4>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">{message}</p>
        
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  playButtonClick();
                  onAction?.(action.id); 
                }}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${action.primary 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/20' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                  }
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </SwipeableCard>
  );
};

// Floating Bottom Navigation (from wireframe)
const FloatingBottomNav = ({ activeTab = 'home', onTabChange }) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'plans', icon: '📅', label: 'Plans' },
    { id: 'vault', icon: '🛡️', label: 'Vault' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];
  
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div className="bg-slate-800/70 backdrop-blur-2xl rounded-3xl border border-slate-700/50 p-2 shadow-2xl shadow-black/30">
        <div className="flex justify-around">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { playButtonClick(); onTabChange?.(tab.id); }}
              className={`
                flex flex-col items-center py-2 px-4 rounded-2xl transition-all
                ${activeTab === tab.id 
                  ? 'bg-cyan-500/20 shadow-lg shadow-cyan-500/20' 
                  : 'hover:bg-slate-700/50'
                }
              `}
            >
              <span className={`text-xl ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] mt-1 font-medium ${
                activeTab === tab.id ? 'text-cyan-400' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="absolute -bottom-1 w-8 h-1 bg-cyan-400 rounded-full" 
                     style={{ boxShadow: '0 0 10px rgba(6,182,212,0.8)' }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Quick Action Apps Grid (context-aware)
const QuickActionGrid = ({ apps, onOpenApp, contextMode }) => {
  return (
    <div className="mb-6">
      <h3 className="text-slate-400 text-sm font-medium mb-3 flex items-center px-1">
        <span className="mr-2">⚡</span>
        {contextMode === 'morning' ? 'Morning Essentials' : 
         contextMode === 'work' ? 'Work Tools' : 
         contextMode === 'evening' ? 'Evening Favorites' : 'Quick Actions'}
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {apps.slice(0, 8).map((app) => (
          <button
            key={app.id}
            onClick={() => { playButtonClick(); onOpenApp?.(app.id); }}
            className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-3 border border-slate-700/50 
                       hover:border-cyan-500/50 transition-all hover:scale-105 active:scale-95
                       hover:bg-slate-800/80 group"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{app.icon}</div>
            <div className="text-[10px] text-slate-400 truncate">{app.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};


// Main Contextual Hub Component
const ContextualHub = ({ 
  onOpenApp, 
  onOpenMate, 
  onOpenVault,
  onOpenSettings,
  trapActive = false,
  userData = {},
  protectionStats = { threatsBlocked: 47 },
  onTabChange
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mateOpen, setMateOpen] = useState(false);
  const [activeWorkers, setActiveWorkers] = useState(['security', 'spam']);
  const [briefings, setBriefings] = useState([]);
  const [greeting, setGreeting] = useState('');
  const [contextMode, setContextMode] = useState('morning');
  const [activeTab, setActiveTab] = useState('home');
  const feedRef = useRef(null);

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

  // Generate contextual briefings (proactive AI insights)
  useEffect(() => {
    const generateBriefings = () => {
      const baseBriefings = [];
      
      // Time-based contextual cards
      if (contextMode === 'morning') {
        baseBriefings.push({
          id: 'morning-brief',
          priority: 'medium',
          type: 'calendar',
          title: '☀️ Your Morning Briefing',
          message: "Traffic looks clear for your usual commute. You have 3 meetings today - first one at 10am. Weather is sunny, 24°C.",
          actions: [
            { id: 'calendar', label: 'View Schedule', primary: true },
            { id: 'weather', label: 'Weather' }
          ]
        });
      } else if (contextMode === 'evening') {
        baseBriefings.push({
          id: 'evening-brief',
          priority: 'low',
          type: 'wellness',
          title: '🌙 Wind Down Mode',
          message: "Work notifications silenced. Your family is all home safe. Screen time today: 4h 23m.",
          actions: [
            { id: 'family', label: 'Family Status', primary: true },
            { id: 'entertainment', label: 'Entertainment' }
          ]
        });
      }
      
      // Conflict alert (always show for demo)
      baseBriefings.push({
        id: 'conflict-1',
        priority: 'high',
        type: 'conflict',
        title: '⚠️ CONFLICT ALERT',
        message: "Your 'Project Phoenix' meeting at 4 PM clashes with the 'Dentist Appointment' I found in your email.",
        actions: [
          { id: 'resolve_conflict', label: 'View Resolution Options', primary: true }
        ]
      });
      
      // Wellness insight
      baseBriefings.push({
        id: 'wellness-1',
        priority: 'medium',
        type: 'wellness',
        title: '💚 WELLNESS INSIGHT',
        message: "I've noticed low sleep for 3 nights. Medical profile shows no allergies to Panadol. Remember to take it easy before your 10 AM meeting.",
        actions: [
          { id: 'snooze_wellness', label: 'Snooze Notifications' }
        ]
      });
      
      // Privacy suggestion
      baseBriefings.push({
        id: 'privacy-1',
        priority: 'low',
        type: 'privacy',
        title: '🔒 PRIVACY SUGGESTION',
        message: "I've noticed a pattern of you deleting chats with 'Alex Johnson'. I can automate this.",
        actions: [
          { id: 'setup_rule', label: 'Set Up Rule' }
        ]
      });
      
      // Security summary
      baseBriefings.push({
        id: 'security-1',
        priority: 'low',
        type: 'security',
        title: '🛡️ Daily Protection Summary',
        message: `${protectionStats.threatsBlocked} threats blocked today. 12 spam calls intercepted. Your digital city is secure.`,
        actions: [
          { id: 'view_security', label: 'View Details' }
        ]
      });
      
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

  // Context-aware quick apps
  const getContextApps = () => {
    const baseApps = [
      { id: 'security', icon: '🛡️', label: 'Security' },
      { id: 'family', icon: '👨‍👩‍👧', label: 'Family' },
    ];

    switch (contextMode) {
      case 'morning':
        return [
          { id: 'calendar', icon: '📅', label: 'Calendar' },
          { id: 'email', icon: '📧', label: 'Email' },
          { id: 'weather', icon: '⛅', label: 'Weather' },
          { id: 'news', icon: '📰', label: 'News' },
          ...baseApps,
        ];
      case 'work':
        return [
          { id: 'calendar', icon: '📅', label: 'Meetings' },
          { id: 'email', icon: '📧', label: 'Email' },
          { id: 'slack', icon: '💬', label: 'Slack' },
          { id: 'drive', icon: '📁', label: 'Drive' },
          ...baseApps,
        ];
      case 'evening':
        return [
          { id: 'entertainment', icon: '🎬', label: 'Netflix' },
          { id: 'food', icon: '🍕', label: 'Food' },
          { id: 'music', icon: '🎵', label: 'Music' },
          { id: 'messages', icon: '💬', label: 'Messages' },
          ...baseApps,
        ];
      default:
        return [
          { id: 'calendar', icon: '📅', label: 'Calendar' },
          { id: 'messages', icon: '💬', label: 'Messages' },
          { id: 'photos', icon: '📸', label: 'Photos' },
          { id: 'browser', icon: '🌐', label: 'Browser' },
          ...baseApps,
        ];
    }
  };

  const handleDismissBriefing = useCallback((id) => {
    setBriefings(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleMarkDone = useCallback((id) => {
    setBriefings(prev => prev.filter(b => b.id !== id));
    playSuccess();
  }, []);

  const handleBriefingAction = useCallback((actionId) => {
    console.log('Action:', actionId);
    playButtonClick();
    
    switch(actionId) {
      case 'calendar':
      case 'view_calendar':
        onOpenApp?.('calendar');
        break;
      case 'email':
      case 'emails':
        onOpenApp?.('email');
        break;
      case 'family':
        onOpenApp?.('family');
        break;
      case 'view_security':
        onOpenApp?.('security');
        break;
      case 'resolve_conflict':
        // Could open a conflict resolution modal
        playNotification('info');
        break;
      default:
        break;
    }
  }, [onOpenApp]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    
    switch(tabId) {
      case 'vault':
        onOpenVault?.();
        break;
      case 'settings':
        onOpenSettings?.();
        break;
      case 'plans':
        onOpenApp?.('calendar');
        break;
      default:
        break;
    }
    
    onTabChange?.(tabId);
  }, [onOpenApp, onOpenVault, onOpenSettings, onTabChange]);

  return (
    <LivingCityBackground intensity={trapActive ? 'high' : 'medium'}>
      <div className="min-h-screen pb-24">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            {activeWorkers.slice(0, 2).map((worker, i) => (
              <WorkerAIIndicator key={i} type={worker} active={true} count={2} />
            ))}
          </div>
          <div className="text-slate-400 text-sm flex items-center space-x-2">
            {trapActive && <span className="text-red-400 animate-pulse">🎭 DECOY</span>}
            <span className="text-white font-mono">{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Greeting Section (from wireframe) */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">{formatDate(currentTime)}</p>
              <h1 className="text-3xl font-black text-white mt-1">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{userData.name || 'Cain'}</span>
              </h1>
            </div>
            {/* MATE Avatar (from wireframe - top right, glowing cyan) */}
            <button 
              onClick={() => setMateOpen(true)}
              className="relative group"
            >
              <MateAvatar size="medium" mood={trapActive ? 'alert' : 'happy'} />
              <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl group-hover:bg-cyan-400/30 transition-all" />
            </button>
          </div>
        </div>

        {/* Security Status Bar */}
        <div className="px-4 mb-6">
          <SecurityStatusBar 
            threatsBlocked={protectionStats.threatsBlocked}
            status={trapActive ? 'decoy' : 'protected'}
            workers={activeWorkers}
          />
        </div>

        {/* Quick Actions */}
        <div className="px-4">
          <QuickActionGrid 
            apps={getContextApps()} 
            onOpenApp={onOpenApp}
            contextMode={contextMode}
          />
        </div>

        {/* MATE's Proactive Briefing Feed (main content from wireframe) */}
        <div className="px-4" ref={feedRef}>
          <div className="flex items-center space-x-2 mb-4">
            <MateAvatar size="small" mood="thinking" />
            <span className="text-sm text-cyan-400 font-medium">MATE's Briefing</span>
            <span className="text-xs text-slate-500">• Swipe cards to dismiss or mark done</span>
          </div>
          
          <div className="space-y-4">
            {briefings.map((briefing) => (
              <PriorityCard
                key={briefing.id}
                priority={briefing.priority}
                type={briefing.type}
                title={briefing.title}
                message={briefing.message}
                actions={briefing.actions}
                onAction={handleBriefingAction}
                onDismiss={() => handleDismissBriefing(briefing.id)}
                onMarkDone={() => handleMarkDone(briefing.id)}
              />
            ))}
            
            {briefings.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✨</div>
                <h3 className="text-white font-bold text-lg">All Caught Up!</h3>
                <p className="text-slate-400 text-sm mt-2">No pending briefings. MATE is watching over you.</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating MATE button */}
        <button
          onClick={() => setMateOpen(true)}
          className="fixed bottom-24 right-4 z-40 group"
        >
          <div className="relative">
            <MateAvatar size="large" mood={trapActive ? 'protective' : 'neutral'} />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-pulse">
              <span className="text-[10px] text-white font-bold">!</span>
            </div>
          </div>
        </button>

        {/* MATE Chat Panel */}
        <MateAssistantPanel 
          isOpen={mateOpen} 
          onClose={() => setMateOpen(false)}
        />

        {/* Floating Bottom Nav (from wireframe) */}
        <FloatingBottomNav 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
        />
      </div>
    </LivingCityBackground>
  );
};

export default ContextualHub;
