import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced behavioral tracking with micro-gestures
const useEnhancedBehavioralTracking = () => {
  const [behavioralData, setBehavioralData] = useState({
    micro_gestures: [],
    typing_patterns: [],
    motion_data: []
  });
  
  const lastKeyPress = useRef(null);
  const touchStartData = useRef(null);

  const trackMicroGesture = useCallback((event) => {
    const gesture = {
      x: event.clientX || event.touches?.[0]?.clientX || 0,
      y: event.clientY || event.touches?.[0]?.clientY || 0,
      pressure: event.force || event.touches?.[0]?.force || 0.5,
      velocity: Math.sqrt(
        Math.pow(event.movementX || 0, 2) + Math.pow(event.movementY || 0, 2)
      ),
      acceleration: 0, // Would calculate from velocity changes
      timestamp: Date.now(),
      gesture_type: event.type.includes('touch') ? 'touch' : 'mouse'
    };

    setBehavioralData(prev => ({
      ...prev,
      micro_gestures: [...prev.micro_gestures.slice(-20), gesture]
    }));
  }, []);

  const trackTypingPattern = useCallback((event) => {
    const now = Date.now();
    const pattern = {
      key: event.key.length === 1 ? event.key : 'special',
      press_duration: 0, // Will be updated on keyup
      flight_time: lastKeyPress.current ? now - lastKeyPress.current.timestamp : 0,
      pressure: event.force || 0.5,
      timestamp: now
    };

    if (event.type === 'keydown') {
      lastKeyPress.current = { timestamp: now, key: event.key };
    } else if (event.type === 'keyup' && lastKeyPress.current) {
      pattern.press_duration = now - lastKeyPress.current.timestamp;
      
      setBehavioralData(prev => ({
        ...prev,
        typing_patterns: [...prev.typing_patterns.slice(-15), pattern]
      }));
    }
  }, []);

  const trackMotionData = useCallback((event) => {
    if (event.accelerationIncludingGravity) {
      const motion = {
        accelerometer: [
          event.accelerationIncludingGravity.x || 0,
          event.accelerationIncludingGravity.y || 0,
          event.accelerationIncludingGravity.z || 0
        ],
        gyroscope: [
          event.rotationRate?.alpha || 0,
          event.rotationRate?.beta || 0,
          event.rotationRate?.gamma || 0
        ],
        grip_angle: Math.atan2(event.accelerationIncludingGravity.y, event.accelerationIncludingGravity.x) * 180 / Math.PI,
        device_orientation: screen.orientation?.type || 'portrait',
        timestamp: Date.now()
      };

      setBehavioralData(prev => ({
        ...prev,
        motion_data: [...prev.motion_data.slice(-10), motion]
      }));
    }
  }, []);

  useEffect(() => {
    // Mouse and touch tracking
    window.addEventListener('mousemove', trackMicroGesture);
    window.addEventListener('touchmove', trackMicroGesture);
    window.addEventListener('touchstart', trackMicroGesture);
    window.addEventListener('click', trackMicroGesture);
    
    // Keyboard tracking
    window.addEventListener('keydown', trackTypingPattern);
    window.addEventListener('keyup', trackTypingPattern);
    
    // Device motion tracking
    window.addEventListener('devicemotion', trackMotionData);
    
    return () => {
      window.removeEventListener('mousemove', trackMicroGesture);
      window.removeEventListener('touchmove', trackMicroGesture);
      window.removeEventListener('touchstart', trackMicroGesture);
      window.removeEventListener('click', trackMicroGesture);
      window.removeEventListener('keydown', trackTypingPattern);
      window.removeEventListener('keyup', trackTypingPattern);
      window.removeEventListener('devicemotion', trackMotionData);
    };
  }, [trackMicroGesture, trackTypingPattern, trackMotionData]);

  return behavioralData;
};

// Context detection hook
const useContextDetection = () => {
  const [currentContext, setCurrentContext] = useState('morning');

  useEffect(() => {
    const updateContext = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 10) {
        setCurrentContext('morning');
      } else if (hour >= 10 && hour < 17) {
        setCurrentContext('work');
      } else if (hour >= 17 && hour < 22) {
        setCurrentContext('evening');
      } else {
        setCurrentContext('night');
      }
    };

    updateContext();
    const interval = setInterval(updateContext, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  return currentContext;
};

// Calculator component with secret handshake
const CalculatorHandshake = ({ onPhantomAccess }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [showHandshake, setShowHandshake] = useState(false);

  const handleCalculatorInput = async (input) => {
    let newEquation;
    
    if (input === 'C') {
      setDisplay('0');
      setEquation('');
      return;
    }
    
    if (input === '=') {
      newEquation = equation;
    } else {
      newEquation = equation + input;
      setEquation(newEquation);
      setDisplay(newEquation || '0');
    }

    if (input === '=' && equation) {
      try {
        const response = await axios.post(`${API}/phantom/calculator`, {
          input: equation
        });

        if (response.data.handshake_detected) {
          setShowHandshake(true);
          setDisplay('🔒 Phantom Detected');
          
          if (response.data.vault_access) {
            onPhantomAccess(response.data.vault_name);
          }
        } else {
          setDisplay(response.data.calculator_result?.toString() || 'Error');
        }
      } catch (error) {
        setDisplay('Error');
      }
    }
  };

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  return (
    <div className="calculator bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="calculator-display bg-slate-900 p-4 rounded mb-4 text-right text-2xl font-mono text-white">
        {display}
      </div>
      
      {showHandshake && (
        <div className="handshake-detected bg-yellow-900 border border-yellow-700 rounded p-2 mb-4 text-yellow-300 text-sm">
          🔐 Secret handshake detected! Owner authentication required for access.
        </div>
      )}
      
      <div className="calculator-buttons grid grid-cols-4 gap-2">
        {buttons.flat().map((btn, idx) => (
          <button
            key={idx}
            onClick={() => handleCalculatorInput(btn)}
            className={`p-3 rounded font-medium transition-colors ${
              btn === '=' ? 'bg-blue-600 hover:bg-blue-700 text-white col-span-2' :
              ['C', '±', '%', '÷', '×', '-', '+'].includes(btn) ? 'bg-slate-600 hover:bg-slate-500 text-white' :
              'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

// Contextual Card Component
const ContextualCard = ({ card, onAction }) => {
  const getCardIcon = (type) => {
    const icons = {
      weather: '🌤️',
      calendar: '📅', 
      briefing: '📋',
      conflict: '⚠️',
      suggestion: '💡',
      security: '🛡️',
      health: '❤️',
      productivity: '⚡'
    };
    return icons[type] || '📌';
  };

  const getPriorityColor = (priority) => {
    if (priority >= 3) return 'border-red-500';
    if (priority >= 2) return 'border-yellow-500';
    return 'border-blue-500';
  };

  return (
    <div className={`contextual-card bg-slate-800 rounded-lg p-4 border-l-4 ${getPriorityColor(card.priority)} mb-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getCardIcon(card.card_type)}</span>
          <div>
            <h3 className="font-semibold text-white">{card.title}</h3>
            <p className="text-slate-300 text-sm mt-1">{card.content}</p>
          </div>
        </div>
        
        {card.expires_at && (
          <div className="text-xs text-slate-500">
            Expires: {new Date(card.expires_at).toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {card.action_buttons && card.action_buttons.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {card.action_buttons.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onAction(card.id, action)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {action.text || action.action}
            </button>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
        <span>Relevance: {Math.round(card.context_relevance * 100)}%</span>
        <span>{new Date(card.created_at).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

// Voice Interface Component
const VoiceInterface = ({ onVoiceCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [wakeWord, setWakeWord] = useState('mate');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        
        if (transcript.toLowerCase().includes(wakeWord.toLowerCase())) {
          onVoiceCommand({
            wake_word: wakeWord,
            command_text: transcript,
            voice_print_match: 0.8, // Simulated
            timestamp: new Date().toISOString()
          });
        }
      };
    }
  }, [wakeWord, onVoiceCommand]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  return (
    <div className="voice-interface bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">🎤 Voice Interface</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={wakeWord}
            onChange={(e) => setWakeWord(e.target.value)}
            placeholder="Wake word"
            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
            style={{ width: '80px' }}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleListening}
          className={`flex items-center space-x-2 px-4 py-2 rounded font-medium transition-colors ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <span>{isListening ? '🔴' : '🎤'}</span>
          <span>{isListening ? 'Stop Listening' : 'Start Listening'}</span>
        </button>
        
        <div className={`flex items-center space-x-2 ${isListening ? 'text-green-400' : 'text-slate-500'}`}>
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
          <span className="text-sm">
            {isListening ? `Listening for "${wakeWord}"...` : 'Voice assistant inactive'}
          </span>
        </div>
      </div>
      
      <div className="mt-3 p-2 bg-slate-700 rounded text-sm text-slate-300">
        <strong>Duress Protocol:</strong> Safe words are monitored for emergency situations
      </div>
    </div>
  );
};

// Main Aegis Life OS Interface
const AegisLifeOSInterface = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [securityState, setSecurityState] = useState("UNKNOWN_USER");
  const [userGoal, setUserGoal] = useState("");
  const [goalResult, setGoalResult] = useState(null);
  const [contextualCards, setContextualCards] = useState([]);
  const [agentData, setAgentData] = useState({
    messages: [],
    calendar: [],
    photos: []
  });
  const [intruderEvidence, setIntruderEvidence] = useState([]);
  const [phantomAccess, setPhantomAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  
  const behavioralData = useEnhancedBehavioralTracking();
  const currentContext = useContextDetection();

  // Load system status
  useEffect(() => {
    loadSystemStatus();
    loadContextualCards();
  }, []);

  // Auto-authenticate when sufficient behavioral data
  useEffect(() => {
    if (behavioralData.micro_gestures.length > 8 && 
        behavioralData.typing_patterns.length > 4) {
      performEnhancedAuthentication();
    }
  }, [behavioralData.micro_gestures.length, behavioralData.typing_patterns.length]);

  // Load contextual agent data based on context
  useEffect(() => {
    if (securityState === "STATE_OWNER_PRESENT" || securityState === "STATE_UNKNOWN_USER") {
      loadContextualAgentData();
    }
  }, [currentContext, securityState]);

  const loadSystemStatus = async () => {
    try {
      const response = await axios.get(`${API}/system/contextual-status`);
      setSystemStatus(response.data);
      setSecurityState(response.data.security_state);
    } catch (error) {
      console.error("Failed to load system status:", error);
    }
  };

  const loadContextualCards = async () => {
    try {
      const response = await axios.get(`${API}/cards/contextual`);
      setContextualCards(response.data.cards || []);
    } catch (error) {
      console.error("Failed to load contextual cards:", error);
    }
  };

  const loadContextualAgentData = async () => {
    try {
      const agents = ['messages', 'calendar'];
      const promises = agents.map(agent => 
        axios.get(`${API}/agents/contextual/${agent}?context=${currentContext}`)
      );
      
      const responses = await Promise.all(promises);
      
      setAgentData({
        messages: responses[0].data.messages || [],
        calendar: responses[1].data.events || [],
        photos: []
      });
    } catch (error) {
      console.error("Failed to load contextual agent data:", error);
    }
  };

  const performEnhancedAuthentication = async () => {
    try {
      const enhancedBehavioralData = {
        micro_gestures: behavioralData.micro_gestures,
        typing_patterns: behavioralData.typing_patterns,
        motion_data: behavioralData.motion_data,
        session_context: currentContext
      };

      const response = await axios.post(`${API}/auth/behavioral-enhanced`, enhancedBehavioralData);
      setSecurityState(response.data.security_state);
      
      if (response.data.authenticated) {
        loadContextualAgentData();
        if (response.data.security_state === "STATE_OWNER_PRESENT") {
          loadIntruderEvidence();
        }
      }
      
      loadSystemStatus();
    } catch (error) {
      console.error("Enhanced behavioral authentication failed:", error);
    }
  };

  const processProactiveGoal = async () => {
    if (!userGoal.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/orchestrator/proactive-goal`, {
        input: userGoal,
        context: currentContext
      });
      
      setGoalResult(response.data);
      setUserGoal("");
      
      // Refresh contextual data
      setTimeout(() => {
        loadContextualAgentData();
        loadContextualCards();
      }, 1000);
    } catch (error) {
      console.error("Failed to process proactive goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceCommand = async (voiceData) => {
    try {
      const response = await axios.post(`${API}/voice/command`, voiceData);
      
      if (response.data.duress_activated) {
        // Never show duress activation to user - completely silent
        console.log("Voice command processed");
      } else {
        console.log("Voice command result:", response.data);
      }
    } catch (error) {
      console.error("Voice command failed:", error);
    }
  };

  const handlePhantomAccess = async (vaultName) => {
    try {
      const response = await axios.get(`${API}/phantom/vault/${vaultName}`);
      setPhantomAccess(response.data);
    } catch (error) {
      console.error("Phantom vault access failed:", error);
    }
  };

  const loadIntruderEvidence = async () => {
    try {
      const response = await axios.get(`${API}/evidence/intruder`);
      setIntruderEvidence(response.data.evidence || []);
    } catch (error) {
      console.error("Failed to load intruder evidence:", error);
    }
  };

  const handleCardAction = async (cardId, action) => {
    console.log("Card action:", cardId, action);
    // Implementation would depend on the specific action
  };

  const getSecurityStateDisplay = () => {
    const states = {
      "STATE_OWNER_PRESENT": { icon: "🔒", text: "Owner Present", color: "text-green-500" },
      "STATE_UNKNOWN_USER": { icon: "⚠️", text: "Unknown User", color: "text-yellow-500" },
      "STATE_INTRUDER_DETECTED": { icon: "🚨", text: "Intruder Detected", color: "text-red-500" },
      "STATE_CODE_RED": { icon: "🔴", text: "Code Red", color: "text-red-600" }
    };
    
    return states[securityState] || { icon: "❓", text: "Unknown", color: "text-gray-500" };
  };

  const getContextDisplay = () => {
    const contexts = {
      morning: { icon: "🌅", text: "Morning Mode", color: "text-orange-400" },
      work: { icon: "💼", text: "Work Mode", color: "text-blue-400" },
      evening: { icon: "🌇", text: "Evening Mode", color: "text-purple-400" },
      night: { icon: "🌙", text: "Night Mode", color: "text-indigo-400" }
    };
    
    return contexts[currentContext] || { icon: "⏰", text: "Unknown", color: "text-gray-400" };
  };

  const securityDisplay = getSecurityStateDisplay();
  const contextDisplay = getContextDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Aegis Life OS
            </h1>
            <p className="text-slate-400 mt-2">Your Digital Mate - Computer Butter Technology</p>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Context Display */}
            <div className={`flex items-center space-x-2 ${contextDisplay.color}`}>
              <span className="text-2xl">{contextDisplay.icon}</span>
              <div>
                <div className="text-sm font-medium">Context</div>
                <div className="text-xs">{contextDisplay.text}</div>
              </div>
            </div>
            
            {/* Security State */}
            <div className={`flex items-center space-x-2 ${securityDisplay.color}`}>
              <span className="text-2xl">{securityDisplay.icon}</span>
              <div>
                <div className="text-sm font-medium">Security</div>
                <div className="text-xs">{securityDisplay.text}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Behavioral Authentication */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🧠 Enhanced Behavioral Guard - Living Password System
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-700 rounded p-4">
              <div className="text-sm text-slate-400">Micro-Gestures</div>
              <div className="text-2xl font-bold text-blue-400">{behavioralData.micro_gestures.length}</div>
              <div className="text-xs text-slate-500">pressure, velocity, touch patterns</div>
            </div>
            <div className="bg-slate-700 rounded p-4">
              <div className="text-sm text-slate-400">Typing Cadence</div>
              <div className="text-2xl font-bold text-purple-400">{behavioralData.typing_patterns.length}</div>
              <div className="text-xs text-slate-500">rhythm, flight time, pressure</div>
            </div>
            <div className="bg-slate-700 rounded p-4">
              <div className="text-sm text-slate-400">Motion Dynamics</div>
              <div className="text-2xl font-bold text-green-400">{behavioralData.motion_data.length}</div>
              <div className="text-xs text-slate-500">grip angle, device orientation</div>
            </div>
          </div>
          
          {securityState === "STATE_OWNER_PRESENT" && (
            <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded">
              <div className="text-green-300 text-sm">✅ Owner Authenticated - Full Aegis Partnership Active</div>
            </div>
          )}
          
          {securityState === "STATE_INTRUDER_DETECTED" && (
            <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded">
              <div className="text-red-300 text-sm">🚨 Intruder Detected - Evidence Collection Active</div>
            </div>
          )}
          
          {securityState === "STATE_UNKNOWN_USER" && (
            <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded">
              <div className="text-yellow-300 text-sm">⚠️ Unknown User - Enhanced Decoy Mode Protecting Privacy</div>
            </div>
          )}
        </div>

        {/* Proactive Intelligence Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* L2 Proactive AI Orchestrator */}
          <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              🤖 L2 Proactive AI Orchestrator - Strategic Intelligence
            </h2>
            
            <div className="flex space-x-4 mb-4">
              <input
                type="text"
                value={userGoal}
                onChange={(e) => setUserGoal(e.target.value)}
                placeholder={`Tell me what you want to accomplish in ${currentContext} mode... (e.g., 'Plan my productive morning routine')`}
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && processProactiveGoal()}
              />
              <button
                onClick={processProactiveGoal}
                disabled={loading || !userGoal.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-6 py-2 rounded font-medium transition-colors"
              >
                {loading ? "Processing..." : "Execute"}
              </button>
            </div>

            {goalResult && (
              <div className="bg-slate-700 rounded p-4 mb-4">
                <h3 className="font-semibold mb-2">🎯 Proactive Goal Processing:</h3>
                <div className="text-sm space-y-2">
                  <div><strong>Parsed Intents:</strong> {goalResult.parsed_intents?.join(", ") || "None"}</div>
                  <div><strong>Execution Plan:</strong> {goalResult.execution_plan?.length || 0} coordinated steps</div>
                  <div><strong>Context:</strong> <span className="text-blue-400">{goalResult.context_type}</span></div>
                  <div><strong>Priority Score:</strong> {goalResult.priority_score?.toFixed(2)}</div>
                  <div><strong>Status:</strong> <span className="text-green-400">{goalResult.goal_status}</span></div>
                  {goalResult.proactive_suggestions && goalResult.proactive_suggestions.length > 0 && (
                    <div><strong>Proactive Suggestions:</strong> {goalResult.proactive_suggestions.join(", ")}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contextual Cards */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              📋 Proactive Briefings
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {contextualCards.length > 0 ? (
                contextualCards.map((card, idx) => (
                  <ContextualCard 
                    key={card.id || idx} 
                    card={card} 
                    onAction={handleCardAction}
                  />
                ))
              ) : (
                <div className="text-slate-400 text-sm">No proactive briefings available</div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced L3 Contextual Agents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Messages Agent */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              💬 L3 Messages Agent
              <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">{currentContext}</span>
            </h3>
            <div className="space-y-2">
              {agentData.messages.length > 0 ? (
                agentData.messages.slice(0, 3).map((msg, idx) => (
                  <div key={idx} className="bg-slate-700 rounded p-3 text-sm">
                    <div className="font-medium text-blue-400">{msg.from || "Unknown"}</div>
                    <div className="text-slate-300">{msg.content}</div>
                    <div className="flex justify-between items-center mt-1">
                      {msg.type && <span className="text-xs bg-slate-600 px-2 py-1 rounded">{msg.type}</span>}
                      {msg.decoy && <div className="text-yellow-400 text-xs">🎭 Decoy</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm">No messages in current context</div>
              )}
            </div>
          </div>

          {/* Calendar Agent */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              📅 L3 Calendar Agent
              <span className="ml-2 text-xs bg-purple-600 px-2 py-1 rounded">{currentContext}</span>
            </h3>
            <div className="space-y-2">
              {agentData.calendar.length > 0 ? (
                agentData.calendar.slice(0, 3).map((event, idx) => (
                  <div key={idx} className="bg-slate-700 rounded p-3 text-sm">
                    <div className="font-medium text-purple-400">{event.title}</div>
                    <div className="text-slate-300">{event.location}</div>
                    <div className="flex justify-between items-center mt-1">
                      {event.type && <span className="text-xs bg-slate-600 px-2 py-1 rounded">{event.type}</span>}
                      {event.decoy && <div className="text-yellow-400 text-xs">🎭 Decoy</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm">No events in current context</div>
              )}
            </div>
          </div>

          {/* Calculator & Phantom Folder */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                🔐 Phantom Folder Access
              </h3>
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded text-sm"
              >
                {showCalculator ? "Hide" : "Calculator"}
              </button>
            </div>
            
            {showCalculator ? (
              <CalculatorHandshake onPhantomAccess={handlePhantomAccess} />
            ) : (
              <div className="text-center p-8">
                <div className="text-4xl mb-2">🧮</div>
                <div className="text-slate-400 text-sm">Open calculator for phantom access</div>
                <div className="text-xs text-slate-500 mt-2">Secret handshake required</div>
              </div>
            )}
            
            {phantomAccess && (
              <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded">
                <div className="text-green-300 text-sm">
                  ✅ Phantom Vault "{phantomAccess.vault_name}" accessed
                  <br />Files: {phantomAccess.file_count}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voice Interface & Intruder Evidence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Voice Interface */}
          <VoiceInterface onVoiceCommand={handleVoiceCommand} />
          
          {/* Intruder Evidence (Owner Only) */}
          {securityState === "STATE_OWNER_PRESENT" && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                🔍 Intruder Evidence Collection
              </h3>
              
              {intruderEvidence.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {intruderEvidence.slice(0, 3).map((evidence, idx) => (
                    <div key={idx} className="bg-slate-700 rounded p-3 text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-red-400">Session {idx + 1}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(evidence.session_start).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-300">
                        Actions logged: {evidence.actions_logged?.length || 0}
                      </div>
                      <div className="text-slate-300">
                        Duration: {evidence.duration_seconds}s
                      </div>
                      <div className="text-slate-300">
                        Behavioral deviation: {(evidence.behavioral_deviation * 100).toFixed(1)}%
                      </div>
                      {evidence.photo_evidence && (
                        <div className="text-green-400 text-xs mt-1">📸 Photo evidence captured</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-sm">No intruder activity detected</div>
              )}
            </div>
          )}
        </div>

        {/* System Architecture & Status */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">🏗️ Aegis Life OS Architecture Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-2xl mb-2">🔒</div>
              <div className="font-medium">L1 Enhanced Kernel</div>
              <div className="text-xs text-slate-400 mt-1">Behavioral Guard Active</div>
              <div className="text-xs text-green-400">Constitutional Rules: 6</div>
            </div>
            
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-medium">L2 Proactive Orchestrator</div>
              <div className="text-xs text-slate-400 mt-1">Strategic Intelligence</div>
              <div className="text-xs text-blue-400">Context: {currentContext}</div>
            </div>
            
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <div className="font-medium">L3 Contextual Agents</div>
              <div className="text-xs text-slate-400 mt-1">Domain Specialists</div>
              <div className="text-xs text-purple-400">Messages, Calendar, Photos</div>
            </div>
            
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium">L4+ Specialists</div>
              <div className="text-xs text-slate-400 mt-1">Function Solvers</div>
              <div className="text-xs text-yellow-400">Voice, Vision, Analysis</div>
            </div>
          </div>
          
          {systemStatus && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400">System</div>
                <div className="text-white font-medium">{systemStatus.system}</div>
                <div className="text-blue-400 text-xs">{systemStatus.tagline}</div>
              </div>
              
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400">Philosophy</div>
                <div className="text-white font-medium">{systemStatus.philosophy}</div>
                <div className="text-green-400 text-xs">Seamless & Adaptive</div>
              </div>
              
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400">Behavioral Guard</div>
                <div className="text-white font-medium">Enhanced Mode</div>
                <div className="text-yellow-400 text-xs">Micro-gesture Analysis</div>
              </div>
              
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400">Intruder Detection</div>
                <div className="text-white font-medium">{systemStatus.intruder_detection}</div>
                <div className="text-red-400 text-xs">Evidence Collection</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div className="App">
      <AegisLifeOSInterface />
    </div>
  );
};

export default App;