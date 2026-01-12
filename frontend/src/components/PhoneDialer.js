import React, { useState, useEffect } from 'react';
import { playButtonClick, playSuccess, playError } from '../services/SoundService';

// =============================================
// PHONE DIALER - Looks 100% like a real dialer
// Secret code unlocks the hidden vault
// =============================================

const PhoneDialer = ({ 
  onClose, 
  onVaultUnlock, 
  secretCode = '8675309',
  recentCalls = []
}) => {
  const [dialedNumber, setDialedNumber] = useState('');
  const [activeTab, setActiveTab] = useState('keypad'); // keypad, recent, contacts
  const [isCalling, setIsCalling] = useState(false);
  const [callingNumber, setCallingNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [showVaultTransition, setShowVaultTransition] = useState(false);

  // Format phone number for display
  const formatNumber = (num) => {
    if (num.length <= 4) return num;
    if (num.length <= 7) return `${num.slice(0, 3)} ${num.slice(3)}`;
    if (num.length <= 10) return `${num.slice(0, 4)} ${num.slice(4, 7)} ${num.slice(7)}`;
    return `+${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5, 8)} ${num.slice(8)}`;
  };

  // Handle number press
  const handleNumberPress = (num) => {
    playButtonClick();
    if (dialedNumber.length < 15) {
      setDialedNumber(prev => prev + num);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    playButtonClick();
    setDialedNumber(prev => prev.slice(0, -1));
  };

  // Handle call button
  const handleCall = () => {
    if (dialedNumber.length === 0) return;
    
    // Check if secret code
    if (dialedNumber === secretCode || dialedNumber === `*#${secretCode}#`) {
      // SECRET VAULT UNLOCK!
      playSuccess();
      setShowVaultTransition(true);
      setTimeout(() => {
        onVaultUnlock?.();
      }, 1500);
    } else {
      // Normal "call" - simulate calling
      playButtonClick();
      setCallingNumber(dialedNumber);
      setIsCalling(true);
      setCallDuration(0);
    }
  };

  // Simulate call duration
  useEffect(() => {
    let interval;
    if (isCalling) {
      interval = setInterval(() => {
        setCallDuration(prev => {
          // Auto-end call after 5 seconds for demo
          if (prev >= 5) {
            setIsCalling(false);
            setCallingNumber('');
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  // End call
  const handleEndCall = () => {
    playButtonClick();
    setIsCalling(false);
    setCallingNumber('');
    setCallDuration(0);
  };

  // Fake recent calls data
  const fakeRecentCalls = recentCalls.length > 0 ? recentCalls : [
    { name: 'Mum', number: '0412 345 678', time: '2 mins ago', type: 'incoming' },
    { name: 'Work - Sarah', number: '0498 765 432', time: '1 hour ago', type: 'outgoing' },
    { name: 'Pizza Hut', number: '13 11 66', time: '3 hours ago', type: 'outgoing' },
    { name: 'Unknown', number: '0411 222 333', time: 'Yesterday', type: 'missed' },
    { name: 'Dad', number: '0423 456 789', time: 'Yesterday', type: 'incoming' },
    { name: 'Dentist', number: '08 9123 4567', time: '2 days ago', type: 'outgoing' },
  ];

  // Vault unlock transition
  if (showVaultTransition) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="text-6xl mb-4">🔓</div>
          <div className="text-cyan-400 text-2xl font-bold">ACCESS GRANTED</div>
          <div className="text-slate-400 mt-2">Opening Secure Vault...</div>
          <div className="mt-4 w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-[loading_1.5s_ease-in-out]" 
                 style={{ animation: 'loading 1.5s ease-out forwards' }} />
          </div>
        </div>
        <style>{`
          @keyframes loading {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // Calling screen
  if (isCalling) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 to-slate-800 z-50 flex flex-col">
        {/* Calling info */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-6 animate-pulse">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">{formatNumber(callingNumber)}</h2>
          <p className="text-green-400 text-lg animate-pulse">
            {callDuration === 0 ? 'Calling...' : `00:0${callDuration}`}
          </p>
        </div>

        {/* Call controls */}
        <div className="pb-12 px-6">
          <div className="grid grid-cols-3 gap-6 mb-8">
            <button className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                <span className="text-2xl">🔇</span>
              </div>
              <span className="text-slate-400 text-xs">Mute</span>
            </button>
            <button className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                <span className="text-2xl">⌨️</span>
              </div>
              <span className="text-slate-400 text-xs">Keypad</span>
            </button>
            <button className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                <span className="text-2xl">🔊</span>
              </div>
              <span className="text-slate-400 text-xs">Speaker</span>
            </button>
          </div>
          
          {/* End call button */}
          <button 
            onClick={handleEndCall}
            className="w-full py-4 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-2xl mr-2">📞</span>
            <span className="text-white font-bold">End Call</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <button onClick={onClose} className="text-cyan-400 font-semibold">
          ← Back
        </button>
        <h1 className="text-white font-bold">Phone</h1>
        <div className="w-12"></div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-slate-800">
        {[
          { id: 'keypad', icon: '⌨️', label: 'Keypad' },
          { id: 'recent', icon: '🕐', label: 'Recent' },
          { id: 'contacts', icon: '👥', label: 'Contacts' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { playButtonClick(); setActiveTab(tab.id); }}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === tab.id 
                ? 'text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-slate-400'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'keypad' && (
          <div className="flex flex-col h-full">
            {/* Dialed number display */}
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center">
                <p className="text-white text-4xl font-light tracking-wider min-h-[48px]">
                  {formatNumber(dialedNumber) || '\u00A0'}
                </p>
                {dialedNumber && (
                  <button 
                    onClick={handleBackspace}
                    className="mt-4 text-slate-400 hover:text-white transition-colors"
                  >
                    ⌫ Delete
                  </button>
                )}
              </div>
            </div>

            {/* Number pad */}
            <div className="px-6 pb-8">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { num: '1', sub: '' },
                  { num: '2', sub: 'ABC' },
                  { num: '3', sub: 'DEF' },
                  { num: '4', sub: 'GHI' },
                  { num: '5', sub: 'JKL' },
                  { num: '6', sub: 'MNO' },
                  { num: '7', sub: 'PQRS' },
                  { num: '8', sub: 'TUV' },
                  { num: '9', sub: 'WXYZ' },
                  { num: '*', sub: '' },
                  { num: '0', sub: '+' },
                  { num: '#', sub: '' },
                ].map(({ num, sub }) => (
                  <button
                    key={num}
                    onClick={() => handleNumberPress(num)}
                    className="h-20 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 transition-all flex flex-col items-center justify-center group"
                  >
                    <span className="text-white text-3xl font-light group-active:scale-95 transition-transform">
                      {num}
                    </span>
                    {sub && (
                      <span className="text-slate-500 text-[10px] tracking-widest mt-1">
                        {sub}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Call button */}
              <button
                onClick={handleCall}
                disabled={dialedNumber.length === 0}
                className={`w-full py-5 rounded-full flex items-center justify-center transition-all ${
                  dialedNumber.length > 0
                    ? 'bg-green-500 hover:bg-green-600 active:scale-95'
                    : 'bg-slate-700 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl mr-2">📞</span>
                <span className="text-white font-bold text-lg">Call</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="p-4 space-y-2">
            {fakeRecentCalls.map((call, i) => (
              <button
                key={i}
                onClick={() => { 
                  playButtonClick(); 
                  setDialedNumber(call.number.replace(/\s/g, '')); 
                  setActiveTab('keypad'); 
                }}
                className="w-full flex items-center p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                  call.type === 'missed' ? 'bg-red-500/20' : 'bg-slate-700'
                }`}>
                  <span className="text-xl">
                    {call.type === 'incoming' ? '📥' : call.type === 'outgoing' ? '📤' : '📵'}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <div className={`font-semibold ${
                    call.type === 'missed' ? 'text-red-400' : 'text-white'
                  }`}>
                    {call.name}
                  </div>
                  <div className="text-slate-400 text-sm">{call.number}</div>
                </div>
                <div className="text-slate-500 text-xs">{call.time}</div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="p-4">
            <div className="text-center py-12 text-slate-500">
              <span className="text-4xl mb-4 block">👥</span>
              <p>Contacts synced from your phone</p>
              <p className="text-sm mt-2">Use keypad to dial directly</p>
            </div>
          </div>
        )}
      </div>

      {/* Hint for demo - subtle */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <p className="text-slate-700 text-[10px]">Demo: Try dialing a special number...</p>
      </div>
    </div>
  );
};

export default PhoneDialer;
