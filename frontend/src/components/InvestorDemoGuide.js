// =============================================
// AEGIS INVESTOR DEMO GUIDE
// On-screen script and walkthrough for investor presentations
// =============================================

import React, { useState, useEffect } from 'react';
import { playButtonClick, playSuccess, playNotification } from '../services/SoundService';

// Complete demo script for investors
const DEMO_SCRIPT = [
  {
    id: 'intro',
    title: 'Welcome to Aegis',
    subtitle: 'Your Digital Mate & Life OS',
    duration: 8000,
    narration: "Imagine a phone that doesn't just store your data—it actively PROTECTS you. Not with passwords or fingerprints, but with intelligence. This is Aegis.",
    action: null,
    highlight: null
  },
  {
    id: 'invisible',
    title: 'Invisible Protection',
    subtitle: 'Looks like a normal phone',
    duration: 10000,
    narration: "What you see is a normal phone home screen. But look closer—every app shows what Aegis has done. Messages shows 'Spam blocked', Photos shows '2 hidden', Banking shows 'Secure'. Aegis is always working.",
    action: 'show_home',
    highlight: 'app_status'
  },
  {
    id: 'security_demo',
    title: 'Pattern Lock System',
    subtitle: '3 patterns, 3 modes',
    duration: 12000,
    narration: "We have 3 unlock patterns: OWNER (1-5-9-8-7) gives full access. DURESS (2-5-8) secretly alerts contacts while showing fake data. Wrong pattern? Photo captured, fake mode activated.",
    action: 'show_pattern',
    highlight: 'patterns'
  },
  {
    id: 'trap_mode',
    title: '🎭 The Trap Mode',
    subtitle: 'Our Secret Weapon',
    duration: 15000,
    narration: "Here's what makes Aegis unique—and potentially PATENTABLE. When someone unauthorized tries to access your phone, we don't just lock them out. We let them IN... to FAKE data. They see fake messages, fake photos, fake banking. Meanwhile, we capture their photo and location.",
    action: 'show_trap',
    highlight: 'trap_mode'
  },
  {
    id: 'financial',
    title: '💳 Financial Protection',
    subtitle: 'AI-powered fraud detection',
    duration: 10000,
    narration: "Click Banking to see our Financial Dashboard. Aegis monitors all transactions, detects suspicious activity, and can block unauthorized transfers in real-time. See that red notification? That's a blocked suspicious transaction.",
    action: 'click_banking',
    highlight: 'banking'
  },
  {
    id: 'family',
    title: '👨‍👩‍👧 Family Tracker',
    subtitle: 'Real-time safety monitoring',
    duration: 10000,
    narration: "The Family Tracker shows all family members on a live map with battery, last seen, and safety status. Parents can set geofences and get alerts when kids leave school or arrive home. All encrypted, all private.",
    action: 'click_family',
    highlight: 'family'
  },
  {
    id: 'emergency',
    title: '🆘 Emergency System',
    subtitle: 'Comprehensive safety features',
    duration: 12000,
    narration: "Our Emergency Setup includes: Auto-call 000, location sharing, crash detection, shake SOS, and a DURESS PHRASE—say 'Call my lawyer' and it secretly alerts contacts while appearing normal to anyone watching.",
    action: 'click_emergency',
    highlight: 'emergency'
  },
  {
    id: 'lost_phone',
    title: '📍 Lost Phone',
    subtitle: 'Beyond Find My iPhone',
    duration: 10000,
    narration: "Lost Phone goes beyond competitors: GPS tracking, sound alarm, show contact info to finder with reward offer, AND remote wipe after X failed attempts. Plus our Aegis Find Network uses OTHER Aegis users to locate your phone even when offline.",
    action: 'click_lost_phone',
    highlight: 'lost_phone'
  },
  {
    id: 'email',
    title: '📧 Smart Email',
    subtitle: 'AI threat detection',
    duration: 10000,
    narration: "Open Mail to see our Smart Email Inbox. Aegis scans all emails for phishing, scams, and threats—blocking them automatically. It also extracts reminders and important dates, adding them to your calendar.",
    action: 'click_mail',
    highlight: 'mail'
  },
  {
    id: 'vault',
    title: '🔐 Calculator Vault',
    subtitle: 'Hidden secure storage',
    duration: 10000,
    narration: "The Calculator app looks normal—but type 8675309 and it opens a secure vault. Store photos, documents, passwords. Even if someone knows about Aegis, they won't know your vault code.",
    action: 'show_vault',
    highlight: 'calculator'
  },
  {
    id: 'market',
    title: '📊 Market Opportunity',
    subtitle: '$150B mobile security market',
    duration: 12000,
    narration: "The mobile security market is $150B and growing. But existing solutions are REACTIVE—they respond after a breach. Aegis is PROACTIVE. We prevent breaches, protect privacy, and create a 'trap mode' that turns attackers into evidence.",
    action: null,
    highlight: null
  },
  {
    id: 'vision',
    title: '🚀 The Vision',
    subtitle: 'From app to OS',
    duration: 10000,
    narration: "Phase 1: Premium iOS/Android app ($9.99/month). Phase 2: Enterprise security suite. Phase 3: Aegis OS—a complete operating system built around proactive protection. We're not building an app. We're building the future of personal security.",
    action: null,
    highlight: null
  },
  {
    id: 'closing',
    title: '🤝 Let\'s Talk',
    subtitle: 'The opportunity is now',
    duration: 8000,
    narration: "Thank you for your time. Aegis isn't just another security app—it's a paradigm shift in how we think about personal protection. The 'trap mode' concept alone could be worth the investment. Questions?",
    action: null,
    highlight: null
  }
];

const InvestorDemoGuide = ({ onClose, onAction }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showScript, setShowScript] = useState(true);

  const step = DEMO_SCRIPT[currentStep];

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const timer = setTimeout(() => {
      if (currentStep < DEMO_SCRIPT.length - 1) {
        setCurrentStep(prev => prev + 1);
        playSuccess();
      } else {
        setIsPlaying(false);
      }
    }, step?.duration || 8000);

    return () => clearTimeout(timer);
  }, [isPlaying, isPaused, currentStep, step]);

  // Execute action when step changes
  useEffect(() => {
    if (step?.action && onAction) {
      onAction(step.action);
    }
  }, [currentStep, step, onAction]);

  const startDemo = () => {
    setCurrentStep(0);
    setIsPlaying(true);
    setIsPaused(false);
    playButtonClick();
  };

  const nextStep = () => {
    if (currentStep < DEMO_SCRIPT.length - 1) {
      setCurrentStep(prev => prev + 1);
      playButtonClick();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      playButtonClick();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    playButtonClick();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* Floating control panel */}
      <div className="flex justify-center mb-4">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 pointer-events-auto max-w-2xl w-full mx-4">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="text-white font-bold">Investor Demo Guide</h3>
                <p className="text-cyan-400 text-xs">Step {currentStep + 1} of {DEMO_SCRIPT.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowScript(!showScript)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  showScript ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {showScript ? '📖 Script' : '📖'}
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Current step info */}
          <div className="px-4 py-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                {currentStep + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-lg">{step?.title}</h4>
                <p className="text-cyan-400 text-sm">{step?.subtitle}</p>
              </div>
            </div>

            {/* Script narration */}
            {showScript && (
              <div className="mt-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                <p className="text-slate-300 text-sm leading-relaxed">
                  <span className="text-cyan-400 font-medium">Say: </span>
                  "{step?.narration}"
                </p>
              </div>
            )}

            {/* Action hint */}
            {step?.action && (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-amber-400 text-sm">👆 Action:</span>
                <span className="text-slate-400 text-sm">{step.action.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="px-4">
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / DEMO_SCRIPT.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Controls */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ⏮️
              </button>
              
              {isPlaying ? (
                <button
                  onClick={togglePause}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isPaused 
                      ? 'bg-green-600 text-white hover:bg-green-500' 
                      : 'bg-amber-600 text-white hover:bg-amber-500'
                  }`}
                >
                  {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
              ) : (
                <button
                  onClick={startDemo}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  ▶️ Auto-Play
                </button>
              )}
              
              <button
                onClick={nextStep}
                disabled={currentStep === DEMO_SCRIPT.length - 1}
                className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ⏭️
              </button>
            </div>

            {/* Quick jump */}
            <div className="flex items-center space-x-1">
              {DEMO_SCRIPT.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentStep(idx); playButtonClick(); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep 
                      ? 'bg-cyan-500 w-4' 
                      : idx < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Floating launcher button
export const DemoGuideLauncher = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-3 rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center space-x-2 border border-cyan-400/30"
    >
      <span className="text-xl">🎯</span>
      <span className="font-bold">INVESTOR DEMO</span>
    </button>
  );
};

export default InvestorDemoGuide;
