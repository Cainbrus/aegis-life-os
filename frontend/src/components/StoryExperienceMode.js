// =============================================
// AEGIS STORY EXPERIENCE MODE
// Realistic walkthrough of phone protection
// Shows the full journey of how Aegis protects you
// =============================================

import React, { useState, useEffect, useRef } from 'react';
import { playButtonClick, playNotification, playLock, playUnlock, playSuccess } from '../services/SoundService';

// Story scenes that walk through a realistic scenario
const STORY_SCENES = [
  {
    id: 'using_phone',
    title: "You're using your phone",
    description: 'Browsing, checking messages...',
    duration: 3000,
    type: 'owner_using'
  },
  {
    id: 'put_down',
    title: 'You put your phone down',
    description: 'Going to the bathroom / Getting coffee...',
    duration: 2500,
    type: 'transition',
    sound: 'lock'
  },
  {
    id: 'phone_idle',
    title: 'Phone is idle...',
    description: 'Aegis is watching silently',
    duration: 2000,
    type: 'idle'
  },
  {
    id: 'someone_picks_up',
    title: '⚠️ Someone picks up your phone!',
    description: 'Your partner / coworker / stranger',
    duration: 2500,
    type: 'alert',
    sound: 'alert'
  },
  {
    id: 'wrong_pattern',
    title: '🔓 They try to unlock...',
    description: 'Entering the wrong pattern',
    duration: 2500,
    type: 'intruder_attempt'
  },
  {
    id: 'photo_captured',
    title: '📸 PHOTO CAPTURED!',
    description: 'Aegis silently photographs the intruder',
    duration: 3000,
    type: 'capture',
    sound: 'capture'
  },
  {
    id: 'fake_mode_active',
    title: '🎭 FAKE MODE ACTIVATED',
    description: 'Showing decoy data to protect your privacy',
    duration: 2500,
    type: 'fake_mode'
  },
  {
    id: 'intruder_browsing',
    title: 'Intruder browses fake data',
    description: "They see fake messages, photos, apps...",
    duration: 3000,
    type: 'fake_browsing'
  },
  {
    id: 'intruder_leaves',
    title: 'They put the phone down',
    description: "Didn't find what they were looking for",
    duration: 2000,
    type: 'transition'
  },
  {
    id: 'you_return',
    title: '👤 You return',
    description: 'Picking up your phone',
    duration: 2000,
    type: 'owner_return'
  },
  {
    id: 'owner_unlock',
    title: '🔓 You unlock with YOUR pattern',
    description: 'Using the owner pattern (1-5-9-8-7)',
    duration: 2500,
    type: 'owner_unlock',
    sound: 'unlock'
  },
  {
    id: 'protection_summary',
    title: '🛡️ While you were away...',
    description: 'Aegis shows you everything that happened',
    duration: 4000,
    type: 'summary',
    sound: 'success'
  }
];

// Story Experience Component
const StoryExperienceMode = ({ onClose }) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef(null);

  const scene = STORY_SCENES[currentScene];
  const totalScenes = STORY_SCENES.length;
  const progress = ((currentScene + 1) / totalScenes) * 100;

  // Handle scene advancement
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!isPlaying || isComplete) return;

    // Play sound for current scene
    if (scene?.sound) {
      switch(scene.sound) {
        case 'lock': playLock(); break;
        case 'alert': playNotification('security'); break;
        case 'capture': playNotification('emergency'); break;
        case 'unlock': playUnlock(); break;
        case 'success': playSuccess(); break;
        default: break;
      }
    }

    // Set timer to advance to next scene
    timerRef.current = setTimeout(() => {
      if (currentScene < totalScenes - 1) {
        setCurrentScene(currentScene + 1);
      } else {
        setIsComplete(true);
        setIsPlaying(false);
        playSuccess();
      }
    }, scene?.duration || 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentScene, isPlaying, isComplete, scene, totalScenes]);

  const handleRestart = () => {
    setCurrentScene(0);
    setIsPlaying(true);
    setIsComplete(false);
    playButtonClick();
  };

  const handlePause = () => {
    setIsPlaying(false);
    playButtonClick();
  };

  const handleResume = () => {
    setIsPlaying(true);
    playButtonClick();
  };

  // Render phone screen based on scene type
  const renderPhoneScreen = () => {
    switch(scene?.type) {
      case 'owner_using':
        return (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 h-full p-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">📱</div>
              <p className="text-slate-300">Normal phone use</p>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-6">
              {['💬', '📷', '🎵', '📧', '🌐', '📅', '⚙️', '📝'].map((icon, i) => (
                <div key={i} className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-2xl">
                  {icon}
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'transition':
        return (
          <div className="bg-black h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">🌙</div>
              <p className="text-slate-500">Screen off</p>
            </div>
          </div>
        );
      
      case 'idle':
        return (
          <div className="bg-black h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🛡️</div>
              <p className="text-cyan-500/50 text-sm animate-pulse">Aegis watching...</p>
            </div>
          </div>
        );
      
      case 'alert':
        return (
          <div className="bg-gradient-to-b from-red-900/50 to-black h-full flex items-center justify-center animate-pulse">
            <div className="text-center">
              <div className="text-6xl mb-4">👤</div>
              <p className="text-red-400 font-bold">MOTION DETECTED</p>
              <p className="text-slate-400 text-sm">Someone picked up your phone</p>
            </div>
          </div>
        );
      
      case 'intruder_attempt':
        return (
          <div className="bg-slate-900 h-full p-4">
            <div className="text-center mb-6">
              <p className="text-slate-400 text-sm">Draw pattern to unlock</p>
            </div>
            <div className="grid grid-cols-3 gap-6 w-48 mx-auto">
              {[1,2,3,4,5,6,7,8,9].map(num => (
                <div 
                  key={num} 
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center
                    ${[1,2,3,6].includes(num) ? 'bg-red-500/50 border-red-500 animate-pulse' : 'border-slate-600'}`}
                >
                  {[1,2,3,6].includes(num) && <span className="text-red-300">●</span>}
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <p className="text-red-400 animate-pulse">Wrong pattern!</p>
            </div>
          </div>
        );
      
      case 'capture':
        return (
          <div className="bg-black h-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white animate-ping opacity-50"></div>
            <div className="text-center z-10">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-red-400 font-bold animate-pulse">CAPTURING...</p>
              <div className="mt-4 text-slate-400 text-xs">
                <p>Time: {new Date().toLocaleTimeString()}</p>
                <p>Location: Saved</p>
              </div>
            </div>
          </div>
        );
      
      case 'fake_mode':
        return (
          <div className="bg-gradient-to-b from-amber-900/30 to-slate-900 h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎭</div>
              <p className="text-amber-400 font-bold text-lg">FAKE MODE</p>
              <p className="text-slate-400 text-sm mt-2">Showing decoy data</p>
              <div className="mt-4 flex justify-center space-x-2">
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded">Fake Messages</span>
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded">Fake Photos</span>
              </div>
            </div>
          </div>
        );
      
      case 'fake_browsing':
        return (
          <div className="bg-slate-900 h-full p-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-4">
              <p className="text-red-400 text-xs text-center">🎭 FAKE MODE ACTIVE - All data is decoy</p>
            </div>
            <div className="space-y-2">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-400 text-sm font-medium">📱 Work Group</p>
                <p className="text-slate-500 text-xs">Meeting postponed to next week</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-400 text-sm font-medium">👤 John</p>
                <p className="text-slate-500 text-xs">Hey, are you free tomorrow?</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-400 text-sm font-medium">🏦 Bank</p>
                <p className="text-slate-500 text-xs">Your statement is ready</p>
              </div>
            </div>
            <p className="text-center text-slate-600 text-xs mt-4">* None of this is real</p>
          </div>
        );
      
      case 'owner_return':
        return (
          <div className="bg-gradient-to-b from-cyan-900/30 to-slate-900 h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">👤</div>
              <p className="text-cyan-400">Owner detected</p>
              <p className="text-slate-400 text-sm mt-2">Unlock to see what happened</p>
            </div>
          </div>
        );
      
      case 'owner_unlock':
        return (
          <div className="bg-slate-900 h-full p-4">
            <div className="text-center mb-6">
              <p className="text-cyan-400 text-sm">Draw YOUR pattern</p>
            </div>
            <div className="grid grid-cols-3 gap-6 w-48 mx-auto">
              {[1,2,3,4,5,6,7,8,9].map(num => (
                <div 
                  key={num} 
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${[1,5,9,8,7].includes(num) ? 'bg-cyan-500/50 border-cyan-500' : 'border-slate-600'}`}
                >
                  {[1,5,9,8,7].includes(num) && <span className="text-cyan-300">●</span>}
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <p className="text-green-400">✓ Owner verified</p>
            </div>
          </div>
        );
      
      case 'summary':
        return (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 h-full p-4 overflow-y-auto">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🛡️</div>
              <h2 className="text-white font-bold text-lg">While you were away...</h2>
              <p className="text-slate-400 text-sm">Aegis protected your phone</p>
            </div>
            
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center text-3xl">
                  📸
                </div>
                <div className="flex-1">
                  <p className="text-red-400 font-bold">Intruder Detected!</p>
                  <p className="text-slate-400 text-xs">Photo captured</p>
                  <p className="text-slate-500 text-xs">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="bg-slate-800 rounded-lg p-3 flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300 text-sm">Wrong pattern detected</span>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300 text-sm">Intruder photo captured</span>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300 text-sm">Fake data shown to intruder</span>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300 text-sm">Real data protected</span>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-cyan-400 text-sm">Your privacy is secure 🔒</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl z-10"
      >
        ✕
      </button>

      <div className="max-w-lg w-full">
        {/* Scene title */}
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${
            scene?.type === 'alert' || scene?.type === 'capture' ? 'text-red-400' :
            scene?.type === 'fake_mode' || scene?.type === 'fake_browsing' ? 'text-amber-400' :
            scene?.type === 'summary' || scene?.type === 'owner_unlock' ? 'text-cyan-400' : 'text-white'
          }`}>
            {scene?.title}
          </h2>
          <p className="text-slate-400">{scene?.description}</p>
        </div>

        {/* Phone mockup */}
        <div className="relative mx-auto" style={{ width: '280px' }}>
          <div className="bg-slate-800 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-700">
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10"></div>
            <div className="bg-black rounded-[2rem] overflow-hidden" style={{ height: '500px' }}>
              {renderPhoneScreen()}
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Scene {currentScene + 1} of {totalScenes}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex justify-center space-x-4">
          {isComplete ? (
            <>
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-all"
              >
                🔄 Watch Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-all"
              >
                ✓ Done
              </button>
            </>
          ) : (
            <>
              {isPlaying ? (
                <button
                  onClick={handlePause}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-all"
                >
                  ⏸️ Pause
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  ▶️ Resume
                </button>
              )}
              <button
                onClick={handleRestart}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                🔄 Restart
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Button to launch story mode from home screen
export const StoryModeButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-32 left-2 z-30 bg-cyan-600/80 text-white px-2 py-1 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center space-x-1 text-xs backdrop-blur-sm"
    >
      <span>🎬</span>
      <span className="font-bold">DEMO</span>
    </button>
  );
};

export default StoryExperienceMode;
