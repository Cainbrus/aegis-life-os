import React, { useState, useEffect } from 'react';
import { LivingCityBackground, MateAvatar, MateAssistantPanel, WorkerAIIndicator } from './LivingCityComponents';

// =============================================
// SCREEN A: THE MAIN HUB
// Proactive & Alive - Card-based feed
// =============================================

const ProactiveCard = ({ type, title, message, icon, actions, priority, onAction, onDismiss }) => {
  const getPriorityStyle = () => {
    switch (priority) {
      case 'high':
        return { border: 'border-l-4 border-l-red-500', bg: 'bg-red-500/10' };
      case 'medium':
        return { border: 'border-l-4 border-l-green-500', bg: 'bg-green-500/10' };
      case 'low':
        return { border: 'border-l-4 border-l-blue-500', bg: 'bg-blue-500/10' };
      default:
        return { border: 'border-l-4 border-l-slate-500', bg: 'bg-slate-500/10' };
    }
  };

  const style = getPriorityStyle();

  return (
    <div 
      className={`${style.bg} ${style.border} rounded-2xl p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] relative overflow-hidden`}
    >
      {/* Dismiss button */}
      <button 
        onClick={onDismiss}
        className="absolute top-2 right-2 text-slate-500 hover:text-white w-6 h-6 flex items-center justify-center"
      >
        ×
      </button>

      <div className="flex items-start space-x-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold">{title}</h4>
            {priority === 'high' && (
              <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">
                HIGH PRIORITY
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">{message}</p>
          
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => onAction?.(action.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    action.primary
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90'
                      : 'border border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MainHub = ({ userName = 'Cain', onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mateOpen, setMateOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17 && hour < 21) setGreeting('Good evening');
    else setGreeting('Good night');
  }, [currentTime]);

  // Generate proactive cards
  useEffect(() => {
    const proactiveCards = [
      {
        id: 1,
        type: 'conflict',
        icon: '⚠️',
        title: 'Conflict Alert',
        message: "Your 'Project Phoenix' meeting at 4 PM clashes with the 'Dentist Appointment' I found in your email.",
        priority: 'high',
        actions: [
          { label: 'View Resolution Options', id: 'resolve', primary: true }
        ]
      },
      {
        id: 2,
        type: 'wellness',
        icon: '💚',
        title: 'Wellness Insight',
        message: "I've noticed low sleep for 3 nights. Medical profile shows no allergies to Panadol. Remember to take it easy before your 10 AM meeting.",
        priority: 'medium',
        actions: [
          { label: 'Snooze Notifications', id: 'snooze' }
        ]
      },
      {
        id: 3,
        type: 'privacy',
        icon: '🔒',
        title: 'Privacy Suggestion',
        message: "I've noticed a pattern of you deleting chats with 'Alex Johnson'. I can automate this.",
        priority: 'low',
        actions: [
          { label: 'Set Up Rule', id: 'setup_rule' }
        ]
      },
      {
        id: 4,
        type: 'security',
        icon: '🛡️',
        title: 'Security Summary',
        message: "47 threats blocked today. 3 spam calls filtered. 12 phishing emails caught. Your digital city is secure.",
        priority: 'low',
        actions: [
          { label: 'View Details', id: 'view_security' }
        ]
      },
      {
        id: 5,
        type: 'family',
        icon: '👨‍👩‍👧',
        title: 'Family Update',
        message: "Sarah arrived at school at 8:45 AM. Mike is at work. Everyone is where they should be.",
        priority: 'low',
        actions: [
          { label: 'View Family Map', id: 'family_map' }
        ]
      }
    ];
    setCards(proactiveCards);
  }, []);

  const dismissCard = (id) => {
    setCards(prev => prev.filter(card => card.id !== id));
  };

  const handleAction = (actionId) => {
    console.log('Action:', actionId);
    // Handle different actions
  };

  return (
    <LivingCityBackground intensity="medium">
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-6">
          <div>
            <p className="text-slate-400 text-sm">{greeting},</p>
            <h1 className="text-2xl font-bold text-white">{userName}</h1>
          </div>
          <button onClick={() => setMateOpen(true)}>
            <MateAvatar size="medium" mood="happy" />
          </button>
        </div>

        {/* Active Workers Bar */}
        <div className="px-4 py-2 flex items-center space-x-2 overflow-x-auto">
          <WorkerAIIndicator type="security" active={true} />
          <WorkerAIIndicator type="spam" active={true} />
          <WorkerAIIndicator type="calendar" active={true} />
        </div>

        {/* Proactive Feed */}
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <MateAvatar size="small" />
            <span className="text-sm text-cyan-400 font-medium">MATE's Proactive Feed</span>
          </div>

          {cards.map((card) => (
            <ProactiveCard
              key={card.id}
              {...card}
              onAction={handleAction}
              onDismiss={() => dismissCard(card.id)}
            />
          ))}

          {cards.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">✨</span>
              <p className="text-slate-400">All caught up! No proactive items right now.</p>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-4 left-4 right-4">
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-700">
            <div className="flex justify-around">
              <button 
                onClick={() => onNavigate?.('hub')}
                className="flex flex-col items-center text-cyan-400"
              >
                <span className="text-2xl mb-1">🏠</span>
                <span className="text-xs">Hub</span>
              </button>
              <button 
                onClick={() => onNavigate?.('plans')}
                className="flex flex-col items-center text-slate-400 hover:text-white"
              >
                <span className="text-2xl mb-1">📅</span>
                <span className="text-xs">Plans</span>
              </button>
              <button 
                onClick={() => onNavigate?.('vault')}
                className="flex flex-col items-center text-slate-400 hover:text-white"
              >
                <span className="text-2xl mb-1">🛡️</span>
                <span className="text-xs">Vault</span>
              </button>
              <button 
                onClick={() => onNavigate?.('settings')}
                className="flex flex-col items-center text-slate-400 hover:text-white"
              >
                <span className="text-2xl mb-1">⚙️</span>
                <span className="text-xs">Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* MATE Chat Panel */}
        <MateAssistantPanel 
          isOpen={mateOpen} 
          onClose={() => setMateOpen(false)}
        />
      </div>
    </LivingCityBackground>
  );
};


// =============================================
// SCREEN C: INTRUDER EVIDENCE FILE
// Security Incident Report
// =============================================

const IntruderEvidenceScreen = ({ incident, onBack, onArchive }) => {
  const defaultIncident = {
    timestamp: '9:41 PM - October 27, 2023',
    photo: null, // Would be actual photo
    location: '123 Main St, Sydney',
    coordinates: { lat: -33.8688, lng: 151.2093 },
    activityLog: [
      { time: '21:41:15', event: 'UNLOCK: Valid passcode entered.' },
      { time: '21:41:16', event: 'ANOMALY: Behavioral mismatch detected.' },
      { time: '21:41:17', event: 'ACTION: DECOY MODE ACTIVATED.' },
      { time: '21:41:25', event: "ATTEMPT: 'Messages' accessed. Served decoy." },
      { time: '21:41:38', event: "ATTEMPT: 'Photos' accessed. Served decoy." },
      { time: '21:41:55', event: "ATTEMPT: App search 'Bank of America'. Result hidden." },
      { time: '21:42:10', event: 'ACTION: Device locked by user.' },
    ]
  };

  const data = incident || defaultIncident;

  return (
    <LivingCityBackground intensity="low">
      <div className="min-h-screen">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-slate-700">
          <button onClick={onBack} className="text-cyan-400 mr-4">
            ← Back
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-white font-bold flex items-center justify-center">
              <span className="mr-2">🚨</span>
              SECURITY INCIDENT REPORT
            </h1>
            <p className="text-slate-400 text-sm">{data.timestamp}</p>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Intruder Photo */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border-2 border-red-500/50">
            <div className="aspect-square bg-slate-900 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
              {data.photo ? (
                <img src={data.photo} alt="Intruder" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <span className="text-6xl block mb-2">👤</span>
                  <span className="text-slate-500 text-sm">Evidence Photo Captured</span>
                </div>
              )}
            </div>
            <p className="text-center text-red-400 font-medium">
              📸 Evidence Photo Captured
            </p>
          </div>

          {/* Location */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center mb-3">
              <div className="text-center">
                <span className="text-4xl block mb-2">🗺️</span>
                <span className="text-red-400">📍</span>
              </div>
            </div>
            <p className="text-slate-300">
              <span className="text-slate-500">📍 Incident Location:</span><br />
              <span className="text-white font-medium">{data.location}</span>
            </p>
          </div>

          {/* Activity Log */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-3 flex items-center">
              <span className="mr-2">📋</span>
              ACTIVITY LOG
            </h3>
            <div className="bg-slate-900 rounded-xl p-3 max-h-64 overflow-y-auto">
              <div className="font-mono text-xs space-y-1">
                {data.activityLog.map((entry, i) => (
                  <div key={i} className={`${
                    entry.event.includes('ANOMALY') || entry.event.includes('DECOY') 
                      ? 'text-red-400' 
                      : entry.event.includes('ATTEMPT')
                        ? 'text-yellow-400'
                        : 'text-green-400'
                  }`}>
                    [{entry.time}] - {entry.event}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button 
              onClick={onArchive}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-bold"
            >
              Archive Report
            </button>
            <button 
              className="w-full py-3 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-700"
            >
              Share with Police
            </button>
          </div>
        </div>
      </div>
    </LivingCityBackground>
  );
};


// =============================================
// SCREEN D: LEARNING & CORRECTION POP-UP
// Friendly AI Learning Modal
// =============================================

const LearningCorrectionModal = ({ isOpen, onClose, onSelect, action }) => {
  if (!isOpen) return null;

  const defaultAction = action || {
    description: "I've moved the screenshot back to your gallery.",
    options: [
      { id: 'not_sensitive', label: "This wasn't a sensitive document." },
      { id: 'ask_first', label: "Just ask me before moving files for a while." },
      { id: 'never_move', label: "Don't automatically move screenshots anymore." },
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <MateAvatar size="medium" mood="thinking" />
            <span className="text-2xl ml-2">❓</span>
          </div>
          <h2 className="text-xl font-bold text-white">Help Me Learn</h2>
        </div>

        {/* Message */}
        <p className="text-slate-300 text-center mb-6">
          My apologies. {defaultAction.description} Can you tell me why my last action was incorrect?
        </p>

        {/* Options */}
        <div className="space-y-3">
          {defaultAction.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect?.(option.id)}
              className="w-full py-3 px-4 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-200 text-left hover:bg-slate-700 hover:border-cyan-500/50 transition-all"
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Escape link */}
        <div className="text-center mt-6">
          <button 
            onClick={onClose}
            className="text-slate-500 text-sm hover:text-cyan-400 underline"
          >
            It was correct, I just hit Undo by mistake.
          </button>
        </div>
      </div>
    </div>
  );
};


// =============================================
// SCREEN B: HIDDEN PLAN WORKSPACE
// Command Center Style
// =============================================

const HiddenPlanWorkspace = ({ plan, onBack }) => {
  const defaultPlan = plan || {
    title: "Sarah's Birthday Surprise",
    checklist: [
      { id: 1, text: 'Book restaurant', completed: false },
      { id: 2, text: 'Pick up gift from jeweler', completed: true },
      { id: 3, text: "Coordinate with Sarah's sister", completed: false },
    ],
    contacts: [
      { name: "Sarah's Sister", avatar: '👩' },
      { name: 'Jewelry Store', avatar: '💎' },
    ],
    files: [
      { name: 'Jewelry_Receipt.pdf', type: 'PDF' },
      { name: 'Gift_Ideas.docx', type: 'DOC' },
    ],
    mapDestination: 'Restaurant Location'
  };

  const [checklist, setChecklist] = useState(defaultPlan.checklist);

  const toggleItem = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <LivingCityBackground intensity="low">
      <div className="min-h-screen">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-slate-700">
          <button onClick={onBack} className="text-cyan-400 mr-4">
            ← Back
          </button>
          <h1 className="text-white font-bold flex-1">
            Project: {defaultPlan.title}
          </h1>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">
          {/* Checklist Widget */}
          <div className="col-span-2 sm:col-span-1 bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-3 flex items-center">
              <span className="mr-2">📋</span>
              Checklist
            </h3>
            <div className="space-y-2">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-all ${
                    item.completed ? 'bg-green-500/20' : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    item.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-slate-500'
                  }`}>
                    {item.completed && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={item.completed ? 'text-slate-400 line-through' : 'text-white'}>
                    {item.text}
                  </span>
                </button>
              ))}
              <button className="w-full p-2 text-cyan-400 text-sm hover:text-cyan-300">
                + Add item
              </button>
            </div>
          </div>

          {/* Key Contacts Widget */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-3 flex items-center">
              <span className="mr-2">👥</span>
              Key Contacts
            </h3>
            <div className="flex justify-around">
              {defaultPlan.contacts.map((contact, i) => (
                <button key={i} className="text-center group">
                  <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-2xl mb-2 group-hover:bg-cyan-500/20 transition-all">
                    {contact.avatar}
                  </div>
                  <span className="text-xs text-slate-400">{contact.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Files Widget */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-3 flex items-center">
              <span className="mr-2">📁</span>
              Files
            </h3>
            <div className="flex space-x-3">
              {defaultPlan.files.map((file, i) => (
                <button key={i} className="flex-1 text-center group">
                  <div className="aspect-square bg-slate-700 rounded-xl flex items-center justify-center mb-2 group-hover:bg-cyan-500/20 transition-all">
                    <span className="text-xs text-slate-400">{file.type}</span>
                  </div>
                  <span className="text-xs text-slate-400 truncate block">{file.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Map Widget */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-3 flex items-center">
              <span className="mr-2">🗺️</span>
              Location
            </h3>
            <div className="aspect-video bg-slate-700 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl block mb-1">📍</span>
                <span className="text-xs text-slate-400">{defaultPlan.mapDestination}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LivingCityBackground>
  );
};


export { 
  MainHub, 
  IntruderEvidenceScreen, 
  LearningCorrectionModal,
  HiddenPlanWorkspace,
  ProactiveCard 
};

export default MainHub;
