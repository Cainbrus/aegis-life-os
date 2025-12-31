import React, { useState, useEffect, useRef, useCallback } from 'react';

// =============================================
// AEGIS LIVING CITY - ANIMATED BACKGROUND
// Data streams, particles, and the "alive" feel
// =============================================

// Animated data stream particle
const DataParticle = ({ delay, duration, startX, color }) => {
  return (
    <div
      className="absolute w-1 rounded-full opacity-60"
      style={{
        left: `${startX}%`,
        height: `${Math.random() * 30 + 10}px`,
        background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
        animation: `dataStream ${duration}s linear ${delay}s infinite`,
      }}
    />
  );
};

// The Living City Background - animated data streams
export const LivingCityBackground = ({ intensity = 'medium', children }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const particleCount = intensity === 'high' ? 40 : intensity === 'medium' ? 25 : 15;
    const colors = ['#00FFFF', '#06B6D4', '#8B5CF6', '#3B82F6', '#10B981'];
    
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
      startX: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    
    setParticles(newParticles);
  }, [intensity]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6,182,212,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6,182,212,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Data stream particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <DataParticle key={p.id} {...p} />
        ))}
      </div>
      
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes dataStream {
          0% { top: -50px; opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};


// =============================================
// MATE - THE AI MANAGER AVATAR
// The sleek cyan AI assistant
// =============================================

export const MateAvatar = ({ size = 'medium', speaking = false, mood = 'neutral', onClick }) => {
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
    xlarge: 'w-32 h-32',
  };

  const getMoodColor = () => {
    switch (mood) {
      case 'alert': return 'from-red-400 to-orange-500';
      case 'happy': return 'from-green-400 to-cyan-500';
      case 'thinking': return 'from-purple-400 to-blue-500';
      case 'protective': return 'from-cyan-400 to-blue-600';
      default: return 'from-cyan-400 to-blue-500';
    }
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} cursor-pointer group`}
      onClick={onClick}
    >
      {/* Outer glow ring */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getMoodColor()} opacity-30 blur-md group-hover:opacity-50 transition-opacity ${speaking ? 'animate-pulse' : ''}`} />
      
      {/* Main avatar body */}
      <div className={`absolute inset-1 rounded-full bg-gradient-to-br ${getMoodColor()} shadow-lg shadow-cyan-500/30`}>
        {/* Inner highlight */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        
        {/* Face/Eye area */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-1/2 h-1/6 bg-white/90 rounded-full ${speaking ? 'animate-bounce' : ''}`} 
               style={{ boxShadow: '0 0 20px rgba(255,255,255,0.8)' }} />
        </div>
        
        {/* Voxel particles around */}
        <div className="absolute -inset-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-sm opacity-60"
              style={{
                top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 40}%`,
                left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 50}%`,
                animation: `voxelFloat ${2 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes voxelFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-5px) scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
};


// =============================================
// MATE ASSISTANT PANEL
// Full MATE interaction interface
// =============================================

export const MateAssistantPanel = ({ isOpen, onClose, onChat }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'mate', text: "G'day! I'm MATE, your Digital Guardian. How can I help you today?", mood: 'happy' }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: message }]);
    setMessage('');
    setIsThinking(true);

    // Simulate AI response (or call actual API)
    setTimeout(() => {
      const responses = [
        { text: "I've scanned your system - all clear! 47 threats blocked today. 🛡️", mood: 'protective' },
        { text: "Your family is all safe. Sarah's at school, Mike's at work. Everyone's where they should be. 👨‍👩‍👧", mood: 'happy' },
        { text: "I noticed something suspicious earlier and activated Trap Mode. Got a photo of the intruder - check your security log.", mood: 'alert' },
        { text: "Based on your schedule, you should leave in 15 minutes to make your 3pm meeting. Traffic's looking good. 🚗", mood: 'thinking' },
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: 'mate', text: response.text, mood: response.mood }]);
      setIsThinking(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-3xl sm:rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <MateAvatar size="small" speaking={isThinking} mood={messages[messages.length - 1]?.mood} />
            <div>
              <h3 className="text-white font-bold">MATE</h3>
              <p className="text-cyan-400 text-xs">Your Digital Guardian</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'mate' && (
                <div className="mr-2 flex-shrink-0">
                  <MateAvatar size="small" mood={msg.mood} />
                </div>
              )}
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-cyan-600 text-white rounded-br-md' 
                  : 'bg-slate-700 text-slate-100 rounded-bl-md'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex items-center space-x-2">
              <MateAvatar size="small" speaking={true} mood="thinking" />
              <div className="bg-slate-700 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask MATE anything..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// =============================================
// WORKER AI VISUALIZATION
// Shows AI workers doing their jobs
// =============================================

export const WorkerAIIndicator = ({ type, active = true, count = 3 }) => {
  const getWorkerConfig = () => {
    switch (type) {
      case 'security':
        return { icon: '🛡️', color: 'cyan', label: 'Security Scan' };
      case 'spam':
        return { icon: '🚫', color: 'red', label: 'Spam Blocked' };
      case 'photos':
        return { icon: '📸', color: 'purple', label: 'Organizing' };
      case 'calendar':
        return { icon: '📅', color: 'green', label: 'Syncing' };
      case 'messages':
        return { icon: '💬', color: 'blue', label: 'Processing' };
      case 'finance':
        return { icon: '💰', color: 'emerald', label: 'Monitoring' };
      default:
        return { icon: '⚡', color: 'cyan', label: 'Working' };
    }
  };

  const config = getWorkerConfig();
  const colorClass = `bg-${config.color}-500`;

  if (!active) return null;

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 rounded-full border border-slate-700">
      {/* Animated worker dots */}
      <div className="flex -space-x-1">
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${colorClass} opacity-80`}
            style={{
              animation: `workerPulse 1s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-slate-400">{config.label}</span>
      <style>{`
        @keyframes workerPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
};


// =============================================
// CONTEXTUAL HUB CARDS
// Dynamic cards that change based on context
// =============================================

export const ContextualCard = ({ type, data, onAction, onDismiss }) => {
  const getCardStyle = () => {
    switch (type) {
      case 'morning':
        return { gradient: 'from-orange-500/20 to-yellow-500/20', border: 'border-orange-500/30', icon: '🌅' };
      case 'commute':
        return { gradient: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', icon: '🚗' };
      case 'work':
        return { gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30', icon: '💼' };
      case 'evening':
        return { gradient: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500/30', icon: '🌙' };
      case 'alert':
        return { gradient: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30', icon: '⚠️' };
      case 'suggestion':
        return { gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', icon: '💡' };
      default:
        return { gradient: 'from-slate-500/20 to-slate-600/20', border: 'border-slate-500/30', icon: '📋' };
    }
  };

  const style = getCardStyle();

  return (
    <div className={`bg-gradient-to-r ${style.gradient} rounded-2xl border ${style.border} p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{style.icon}</span>
          <div>
            <h4 className="text-white font-bold">{data.title}</h4>
            <p className="text-slate-300 text-sm mt-1">{data.message}</p>
            {data.actions && (
              <div className="flex flex-wrap gap-2 mt-3">
                {data.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => onAction?.(action.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      action.primary
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-slate-500 hover:text-white">×</button>
        )}
      </div>
    </div>
  );
};


// =============================================
// PROACTIVE BRIEFING FEED
// The AI's suggestions and insights
// =============================================

export const ProactiveBriefingFeed = ({ briefings = [], onAction, onDismiss }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 px-1">
        <MateAvatar size="small" />
        <span className="text-sm text-cyan-400 font-medium">MATE's Briefing</span>
      </div>
      <div className="space-y-3">
        {briefings.map((briefing, i) => (
          <ContextualCard
            key={i}
            type={briefing.type}
            data={briefing}
            onAction={onAction}
            onDismiss={() => onDismiss?.(i)}
          />
        ))}
      </div>
    </div>
  );
};


// =============================================
// INTRUDER DETECTION SEQUENCE
// Dramatic visual when an intruder is detected
// =============================================

export const IntruderDetectionOverlay = ({ isActive, intruderPhoto, onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (isActive) {
      setPhase(1);
      setTimeout(() => setPhase(2), 1000);
      setTimeout(() => setPhase(3), 2000);
      setTimeout(() => {
        setPhase(4);
        onComplete?.();
      }, 3500);
    } else {
      setPhase(0);
    }
  }, [isActive, onComplete]);

  if (!isActive && phase === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Red scan lines */}
      {phase >= 1 && (
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-70"
            style={{
              animation: 'scanLine 1s ease-in-out infinite',
            }}
          />
        </div>
      )}
      
      {/* Alert text */}
      {phase >= 2 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-red-500 text-6xl font-black tracking-wider mb-4" style={{ textShadow: '0 0 30px rgba(239,68,68,0.8)' }}>
              INTRUDER
            </div>
            <div className="text-red-400 text-xl tracking-widest">
              BEHAVIORAL ANOMALY DETECTED
            </div>
          </div>
        </div>
      )}
      
      {/* Photo capture flash */}
      {phase >= 3 && (
        <div className="absolute inset-0 bg-white animate-flash" />
      )}
      
      {/* Decoy mode activating */}
      {phase >= 4 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
          <div className="text-center">
            <div className="text-cyan-400 text-4xl font-bold mb-4">
              🛡️ DECOY MODE ACTIVATED
            </div>
            <div className="text-slate-400 text-lg">
              Evidence secured. Displaying sanitized data.
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};


// =============================================
// THE OWNER CORE VISUALIZATION
// The central energy sphere (Level 1)
// =============================================

export const OwnerCoreVisualization = ({ size = 'medium', pulseIntensity = 'normal' }) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Outer glow layers */}
      <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
      <div className="absolute inset-2 rounded-full bg-cyan-400/20 blur-lg animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute inset-4 rounded-full bg-cyan-300/30 blur-md animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Core sphere */}
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan-300 via-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50">
        {/* Inner highlight */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
      </div>
      
      {/* Energy rings */}
      <div className="absolute inset-0">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-cyan-400/30"
            style={{
              animation: `ownerRing ${3 + i}s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes ownerRing {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};


// =============================================
// SECURITY STATUS BAR
// Shows current protection status
// =============================================

export const SecurityStatusBar = ({ threatsBlocked = 47, status = 'protected', workers = [] }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'protected':
        return { color: 'cyan', text: 'PROTECTED', icon: '🛡️' };
      case 'scanning':
        return { color: 'blue', text: 'SCANNING', icon: '🔍' };
      case 'alert':
        return { color: 'red', text: 'ALERT', icon: '🚨' };
      case 'decoy':
        return { color: 'yellow', text: 'DECOY MODE', icon: '🎭' };
      default:
        return { color: 'slate', text: 'UNKNOWN', icon: '❓' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full bg-${config.color}-500 animate-pulse`} />
          <span className={`text-${config.color}-400 font-bold text-sm`}>
            {config.icon} {config.text}
          </span>
        </div>
        <div className="text-right">
          <div className="text-white font-bold">{threatsBlocked}</div>
          <div className="text-slate-500 text-xs">threats blocked</div>
        </div>
      </div>
      
      {/* Active workers */}
      {workers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
          {workers.map((worker, i) => (
            <WorkerAIIndicator key={i} type={worker} active={true} />
          ))}
        </div>
      )}
    </div>
  );
};


export default {
  LivingCityBackground,
  MateAvatar,
  MateAssistantPanel,
  WorkerAIIndicator,
  ContextualCard,
  ProactiveBriefingFeed,
  IntruderDetectionOverlay,
  OwnerCoreVisualization,
  SecurityStatusBar,
};
