import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const AegisOnboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userConsent, setUserConsent] = useState(false);
  const [setupData, setSetupData] = useState({
    primaryPattern: '',
    ownerPattern: '',
    duressPattern: '2-5-8',
    customWakeName: 'Mate',
    duressPhrase: 'help me please',
    calculatorCode: '8675309'
  });
  const [behavioralBaseline, setBehavioralBaseline] = useState({
    swipeData: [],
    tapData: [],
    pressureData: []
  });
  const [isCompleting, setIsCompleting] = useState(false);

  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Aegis',
      subtitle: 'Your Hierarchical Proactive Intelligence Guardian'
    },
    {
      id: 'constitution',
      title: 'The Aegis Constitution',
      subtitle: 'Our Privacy-First Promise'
    },

    {
      id: 'pattern_setup',
      title: 'Dual Pattern Security',
      subtitle: 'Set your authentication patterns'
    },
    {
      id: 'voice_setup',
      title: 'Voice Interface',
      subtitle: 'Personalize your digital mate'
    },
    {
      id: 'secret_setup',
      title: 'Secret Features',
      subtitle: 'Configure hidden access methods'
    },
    {
      id: 'completion',
      title: 'You\'re All Set!',
      subtitle: 'Aegis is ready to protect and assist you'
    }
  ];

  const currentStepData = onboardingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setIsCompleting(true);
    
    try {
      // Set up dual patterns
      await axios.post(`${API}/auth/setup-dual-patterns`, {
        primary_pattern: setupData.primaryPattern,
        owner_pattern: setupData.ownerPattern,
        duress_pattern: setupData.duressPattern
      });

      // Save onboarding data
      await axios.post(`${API}/onboarding/complete`, {
        ...setupData,
        behavioral_baseline: behavioralBaseline,
        completion_timestamp: new Date().toISOString()
      });

      onComplete();
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      alert('Setup failed. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const recordBehavioralData = (type, data) => {
    setBehavioralBaseline(prev => ({
      ...prev,
      [type]: [...prev[type], { ...data, timestamp: Date.now() }]
    }));
  };

  const renderWelcome = () => (
    <div className="text-center space-y-6">
      <div className="text-8xl mb-6">🛡️</div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Welcome to Aegis
      </h1>
      <p className="text-xl text-slate-300 max-w-2xl mx-auto">
        More than an operating system - Aegis is your <strong>Digital Mate</strong>, 
        a proactive intelligence that learns, protects, and anticipates your needs.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {[
          { icon: '🧠', title: 'Proactive Intelligence', desc: 'Anticipates and automates your digital life' },
          { icon: '🔒', title: 'Advanced Security', desc: 'Multi-layer protection against digital threats' },
          { icon: '🎭', title: 'Perfect Deception', desc: 'Trap mode fools intruders with convincing fake data' }
        ].map((feature, idx) => (
          <div key={idx} className="bg-slate-800 rounded-lg p-6">
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConstitution = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">⚖️</div>
        <h2 className="text-3xl font-bold mb-4">The Aegis Constitution</h2>
        <p className="text-slate-300">
          Before we begin, you must understand and agree to these fundamental principles:
        </p>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 max-w-4xl mx-auto">
        <div className="space-y-4">
          {[
            {
              principle: "Privacy First",
              description: "Your data belongs to you. Aegis processes everything locally and never shares your personal information without explicit consent."
            },
            {
              principle: "Proactive Protection", 
              description: "Aegis actively monitors for threats and takes preventive action, learning your preferences to minimize interruptions."
            },
            {
              principle: "Transparent Intelligence",
              description: "You have full visibility and control over what Aegis learns and automates. You can review and modify all AI decisions."
            },
            {
              principle: "Dual Authentication",
              description: "Two-layer security protects you from coercion. The trap mode ensures your safety even under duress."
            },
            {
              principle: "Emergency Protocols",
              description: "Aegis includes silent duress detection and emergency response capabilities for your physical safety."
            }
          ].map((item, idx) => (
            <div key={idx} className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-300">{item.principle}</h4>
              <p className="text-sm text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <label className="flex items-center justify-center space-x-3 text-lg">
          <input
            type="checkbox"
            checked={userConsent}
            onChange={(e) => setUserConsent(e.target.checked)}
            className="w-5 h-5 text-blue-600"
          />
          <span>I understand and agree to the Aegis Constitution</span>
        </label>
      </div>
    </div>
  );

  const renderBehavioralTraining = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">👆</div>
        <h2 className="text-3xl font-bold mb-4">Behavioral Baseline Training</h2>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Aegis learns your unique interaction patterns to distinguish you from intruders. 
          Complete these simple exercises to establish your behavioral baseline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BehavioralTest
          title="Swipe Patterns"
          icon="👆"
          instruction="Swipe in different directions 5 times"
          onData={(data) => recordBehavioralData('swipeData', data)}
          targetCount={5}
        />
        <BehavioralTest
          title="Tap Rhythm"
          icon="👇"
          instruction="Tap this area 10 times naturally"
          onData={(data) => recordBehavioralData('tapData', data)}
          targetCount={10}
        />
        <BehavioralTest
          title="Pressure Sensitivity"
          icon="✋"
          instruction="Press and hold 5 times with varying pressure"
          onData={(data) => recordBehavioralData('pressureData', data)}
          targetCount={5}
        />
      </div>

      <div className="text-center">
        <div className="text-sm text-slate-400">
          Total interactions recorded: {
            behavioralBaseline.swipeData.length + 
            behavioralBaseline.tapData.length + 
            behavioralBaseline.pressureData.length
          } / 20
        </div>
      </div>
    </div>
  );

  const renderPatternSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-3xl font-bold mb-4">Dual Pattern Security</h2>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Set up your dual authentication patterns. The Primary Pattern activates trap mode, 
          while the Owner Pattern grants full access to real data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-blue-300">🎭 Primary Pattern (Trap Mode)</h3>
          <p className="text-sm text-slate-400 mb-4">
            Used when you want intruders to see fake but convincing data. Activates surveillance.
          </p>
          <input
            type="text"
            placeholder="e.g., 1-2-3-6-9"
            value={setupData.primaryPattern}
            onChange={(e) => setSetupData(prev => ({...prev, primaryPattern: e.target.value}))}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          <div className="text-xs text-slate-500 mt-2">Example: L-shape pattern</div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-green-300">👑 Owner Pattern (Full Access)</h3>
          <p className="text-sm text-slate-400 mb-4">
            Grants access to real data and activates proactive intelligence features.
          </p>
          <input
            type="text"
            placeholder="e.g., 1-5-9-8-7"
            value={setupData.ownerPattern}
            onChange={(e) => setSetupData(prev => ({...prev, ownerPattern: e.target.value}))}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          <div className="text-xs text-slate-500 mt-2">Example: Z-shape pattern</div>
        </div>
      </div>

      <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 max-w-2xl mx-auto">
        <h4 className="font-semibold text-red-300 mb-2">🚨 Duress Pattern</h4>
        <p className="text-sm text-red-200 mb-3">
          Emergency pattern that silently alerts contacts and activates trap mode.
        </p>
        <input
          type="text"
          value={setupData.duressPattern}
          onChange={(e) => setSetupData(prev => ({...prev, duressPattern: e.target.value}))}
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
        />
      </div>
    </div>
  );

  const renderVoiceSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🎤</div>
        <h2 className="text-3xl font-bold mb-4">Voice Interface Setup</h2>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Personalize your voice interface and set up emergency vocal protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="font-semibold mb-3">🤖 Custom Wake Name</h3>
          <p className="text-sm text-slate-400 mb-4">
            Choose what to call your digital assistant (e.g., "Hey Mate", "Hey Aegis").
          </p>
          <input
            type="text"
            value={setupData.customWakeName}
            onChange={(e) => setSetupData(prev => ({...prev, customWakeName: e.target.value}))}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          <button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
            Test Wake Word
          </button>
        </div>

        <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-red-300">🆘 Vocal Duress Phrase</h3>
          <p className="text-sm text-red-200 mb-4">
            A phrase that silently triggers emergency protocols when spoken naturally.
          </p>
          <input
            type="text"
            value={setupData.duressPhrase}
            onChange={(e) => setSetupData(prev => ({...prev, duressPhrase: e.target.value}))}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          />
          <div className="text-xs text-red-300 mt-2">
            ⚠️ Choose something you might naturally say in distress
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecretSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🔢</div>
        <h2 className="text-3xl font-bold mb-4">Secret Access Methods</h2>
        <p className="text-slate-300 max-w-2xl mx-auto">
          Configure hidden entry points to your secure vault and phantom folder.
        </p>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="font-semibold mb-3">🧮 Calculator Secret Handshake</h3>
        <p className="text-sm text-slate-400 mb-4">
          Enter this code in the calculator app to access your Phantom Folder. 
          The calculator will transform into the vault interface.
        </p>
        <input
          type="text"
          value={setupData.calculatorCode}
          onChange={(e) => setSetupData(prev => ({...prev, calculatorCode: e.target.value}))}
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
        />
        <div className="text-xs text-slate-500 mt-2">
          Default: 8675309 (Jenny's number) - Choose something memorable
        </div>
      </div>

      <div className="text-center">
        <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 inline-block">
          <div className="text-blue-300 font-semibold mb-2">🎭 Perfect Deception Ready</div>
          <div className="text-sm text-blue-200">
            Your trap mode will show convincing fake data while secretly collecting evidence
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompletion = () => (
    <div className="text-center space-y-6">
      <div className="text-8xl mb-6">🎉</div>
      <h1 className="text-4xl font-bold text-green-400">Aegis is Ready!</h1>
      <p className="text-xl text-slate-300 max-w-2xl mx-auto">
        Your Hierarchical Proactive Intelligence system is now configured and ready to 
        protect, assist, and learn from your digital interactions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-6">
          <h3 className="font-semibold text-green-300 mb-3">✅ Configured Features</h3>
          <div className="space-y-2 text-sm text-green-200">
            <div>🔐 Dual Pattern Authentication</div>
            <div>🎤 Voice Interface with "{setupData.customWakeName}"</div>
            <div>🧮 Calculator Secret Handshake</div>
            <div>🆘 Emergency Duress Protocols</div>
            <div>👆 Behavioral Baseline Established</div>
            <div>🧠 Proactive Intelligence Active</div>
          </div>
        </div>

        <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-6">
          <h3 className="font-semibold text-blue-300 mb-3">🚀 What's Next</h3>
          <div className="space-y-2 text-sm text-blue-200">
            <div>• Aegis will learn your patterns</div>
            <div>• Proactive suggestions will improve</div>
            <div>• Trap mode protection is active</div>
            <div>• Voice commands are ready</div>
            <div>• Emergency protocols are armed</div>
            <div>• Your digital mate is ready to help</div>
          </div>
        </div>
      </div>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1: return userConsent;
      case 2: return setupData.primaryPattern && setupData.ownerPattern;
      case 3: return setupData.customWakeName && setupData.duressPhrase;
      case 4: return setupData.calculatorCode;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-slate-400">
              Step {currentStep + 1} of {onboardingSteps.length}
            </div>
            <div className="text-sm text-slate-400">
              {currentStepData.title}
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="w-full max-w-6xl">
            {currentStep === 0 && renderWelcome()}
            {currentStep === 1 && renderConstitution()}
            {currentStep === 2 && renderBehavioralTraining()}
            {currentStep === 3 && renderPatternSetup()}
            {currentStep === 4 && renderVoiceSetup()}
            {currentStep === 5 && renderSecretSetup()}
            {currentStep === 6 && renderCompletion()}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white px-6 py-3 rounded font-medium"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isCompleting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded font-medium"
          >
            {isCompleting ? 'Completing Setup...' : 
             currentStep === onboardingSteps.length - 1 ? 'Launch Aegis' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Behavioral Test Component
const BehavioralTest = ({ title, icon, instruction, onData, targetCount }) => {
  const [interactions, setInteractions] = useState([]);
  const [isActive, setIsActive] = useState(false);

  const handleInteraction = (event) => {
    if (interactions.length >= targetCount) return;

    const interactionData = {
      type: title.toLowerCase().replace(' ', '_'),
      x: event.clientX,
      y: event.clientY,
      pressure: event.pressure || 0.5,
      timestamp: Date.now()
    };

    const newInteractions = [...interactions, interactionData];
    setInteractions(newInteractions);
    onData(interactionData);

    if (newInteractions.length >= targetCount) {
      setIsActive(false);
    }
  };

  const isComplete = interactions.length >= targetCount;

  return (
    <div className={`
      bg-slate-800 rounded-lg p-6 text-center transition-all
      ${isComplete ? 'border-2 border-green-500' : 'border-2 border-transparent'}
    `}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{instruction}</p>
      
      <div
        className={`
          w-full h-32 rounded-lg flex items-center justify-center cursor-pointer transition-all
          ${isComplete ? 'bg-green-900 bg-opacity-50' : 'bg-slate-700 hover:bg-slate-600'}
        `}
        onMouseDown={handleInteraction}
        onTouchStart={handleInteraction}
      >
        {isComplete ? (
          <div className="text-green-300">✓ Complete</div>
        ) : (
          <div className="text-slate-400">
            {interactions.length} / {targetCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default AegisOnboarding;