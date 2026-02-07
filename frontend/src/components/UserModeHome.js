import React, { useState, useCallback } from 'react';
import { playButtonClick, playSuccess } from '../services/SoundService';

// =============================================
// USER MODE HOME SCREEN
// Clean, simple security app for real users
// Focus: Trap Mode, Invisible Vault, Protection Status
// Secret: Tap title 7 times to unlock Demo Mode
// =============================================

const UserModeHome = ({ 
  onOpenPhone,
  onOpenSettings,
  onOpenVault,
  protectionStats = { threatsBlocked: 0, intrudersDetected: 0 },
  trapActive = false,
  onViewIntruderEvidence,
  onSecretDemoActivate
}) => {
  const [currentTime] = useState(new Date());
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [showSecretHint, setShowSecretHint] = useState(false);

  // Secret gesture: Tap title 7 times to unlock Demo Mode
  const handleSecretTap = useCallback(() => {
    const newCount = secretTapCount + 1;
    setSecretTapCount(newCount);
    
    if (newCount >= 5 && newCount < 7) {
      setShowSecretHint(true);
      setTimeout(() => setShowSecretHint(false), 2000);
    }
    
    if (newCount >= 7) {
      playSuccess();
      onSecretDemoActivate?.();
      setSecretTapCount(0);
    }
    
    // Reset after 3 seconds of no taps
    setTimeout(() => setSecretTapCount(0), 3000);
  }, [secretTapCount, onSecretDemoActivate]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div>
          <h1 
            onClick={handleSecretTap}
            className="text-2xl font-black text-white cursor-default select-none"
          >
            Digital Mate
          </h1>
          <p className="text-slate-400 text-sm">Your Phone's Bodyguard</p>
        </div>
        <div className="text-right">
          <p className="text-white font-mono text-lg">{formatTime(currentTime)}</p>
          <button 
            onClick={onOpenSettings}
            className="text-slate-400 text-sm hover:text-white"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Secret Developer Mode Hint */}
      {showSecretHint && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-slate-700/90 rounded-lg text-sm text-slate-300 animate-pulse">
          {7 - secretTapCount} more taps to unlock developer mode...
        </div>
      )}

      {/* Protection Status Card */}
      <div className={`rounded-3xl p-6 mb-6 ${
        trapActive 
          ? 'bg-gradient-to-br from-red-900/50 to-orange-900/50 border border-red-500/30' 
          : 'bg-gradient-to-br from-green-900/50 to-cyan-900/50 border border-green-500/30'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${trapActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <span className={`font-bold text-lg ${trapActive ? 'text-red-400' : 'text-green-400'}`}>
              {trapActive ? '🎭 DECOY MODE ACTIVE' : '🛡️ PROTECTED'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-cyan-400">{protectionStats.threatsBlocked}</p>
            <p className="text-slate-400 text-sm">Threats Blocked</p>
          </div>
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-orange-400">{protectionStats.intrudersDetected}</p>
            <p className="text-slate-400 text-sm">Intruders Caught</p>
          </div>
        </div>

        {trapActive && (
          <button 
            onClick={onViewIntruderEvidence}
            className="mt-4 w-full py-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 font-medium"
          >
            📸 View Intruder Evidence
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        {/* Invisible Vault */}
        <button
          onClick={() => { playButtonClick(); onOpenPhone(); }}
          className="w-full bg-slate-800/80 rounded-2xl p-5 border border-slate-700 hover:border-cyan-500/50 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-2xl">
              👻
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-lg">Invisible Vault</h3>
              <p className="text-slate-400 text-sm">Dial secret code to access</p>
            </div>
          </div>
          <span className="text-slate-500 group-hover:text-cyan-400 text-2xl">→</span>
        </button>

        {/* Trap Mode Status */}
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-2xl">
              🎭
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">Trap Mode</h3>
              <p className="text-slate-400 text-sm">
                {trapActive 
                  ? 'Active - showing fake data to intruder' 
                  : 'Ready - will activate on wrong pattern'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${trapActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700">
          <h3 className="text-white font-bold mb-4">🛡️ Active Protection</h3>
          <div className="space-y-3">
            {[
              { name: 'Behavioral Guard', status: 'Learning your patterns', icon: '🧠' },
              { name: 'Intruder Detection', status: 'Monitoring access', icon: '👁️' },
              { name: 'Evidence Capture', status: 'Ready to record', icon: '📸' },
              { name: 'Location Tracking', status: 'Available if stolen', icon: '📍' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span>{feature.icon}</span>
                  <span className="text-slate-300">{feature.name}</span>
                </div>
                <span className="text-slate-500 text-sm">{feature.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="mt-8 text-center">
        <p className="text-slate-600 text-xs">
          💡 Tip: Open Phone app and dial your secret code to access the Invisible Vault
        </p>
      </div>
    </div>
  );
};

export default UserModeHome;
