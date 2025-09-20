import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Utility function to simulate mouse movement tracking
const useMouseTracking = () => {
  const [mouseData, setMouseData] = useState([]);
  const mouseRef = useRef([]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const movement = {
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now(),
        velocity: Math.sqrt(
          Math.pow(event.movementX || 0, 2) + Math.pow(event.movementY || 0, 2)
        )
      };
      
      mouseRef.current.push(movement);
      
      // Keep only last 50 movements
      if (mouseRef.current.length > 50) {
        mouseRef.current = mouseRef.current.slice(-50);
      }
      
      setMouseData([...mouseRef.current]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return mouseData;
};

// Utility function to simulate typing pattern tracking
const useTypingTracking = () => {
  const [typingData, setTypingData] = useState([]);
  const typingRef = useRef([]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const keyEvent = {
        key: event.key,
        timestamp: Date.now(),
        duration: 0
      };
      typingRef.current.push(keyEvent);
    };

    const handleKeyUp = (event) => {
      const lastEvent = typingRef.current[typingRef.current.length - 1];
      if (lastEvent && lastEvent.key === event.key) {
        lastEvent.duration = Date.now() - lastEvent.timestamp;
      }
      
      // Keep only last 20 key events
      if (typingRef.current.length > 20) {
        typingRef.current = typingRef.current.slice(-20);
      }
      
      setTypingData([...typingRef.current]);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return typingData;
};

// Main Aegis HPI OS Interface Component
const AegisInterface = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [securityState, setSecurityState] = useState("UNKNOWN_USER");
  const [userGoal, setUserGoal] = useState("");
  const [goalResult, setGoalResult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const mouseData = useMouseTracking();
  const typingData = useTypingTracking();

  // Load initial system status
  useEffect(() => {
    loadSystemStatus();
    loadSecurityEvents();
  }, []);

  // Auto-authenticate when enough behavioral data is collected
  useEffect(() => {
    if (mouseData.length > 10 && typingData.length > 5) {
      performBehavioralAuthentication();
    }
  }, [mouseData.length, typingData.length]);

  const loadSystemStatus = async () => {
    try {
      const response = await axios.get(`${API}/system/status`);
      setSystemStatus(response.data);
      setSecurityState(response.data.security_state);
    } catch (error) {
      console.error("Failed to load system status:", error);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      const response = await axios.get(`${API}/system/security-events`);
      setSecurityEvents(response.data.events || []);
    } catch (error) {
      console.error("Failed to load security events:", error);
    }
  };

  const performBehavioralAuthentication = async () => {
    try {
      const behavioralData = {
        mouse_movements: mouseData.slice(-10),
        typing_patterns: typingData.slice(-5),
        is_owner: true // Simulate owner for demo
      };

      const response = await axios.post(`${API}/auth/behavioral`, behavioralData);
      setSecurityState(response.data.security_state);
      
      if (response.data.authenticated) {
        loadUserData();
      }
      
      loadSecurityEvents();
    } catch (error) {
      console.error("Behavioral authentication failed:", error);
    }
  };

  const loadUserData = async () => {
    try {
      // Load messages
      const messagesResponse = await axios.get(`${API}/agents/messages`);
      setMessages(messagesResponse.data.messages || []);

      // Load calendar events
      const calendarResponse = await axios.get(`${API}/agents/calendar`);
      setCalendarEvents(calendarResponse.data.events || []);

      // Load photos
      const photosResponse = await axios.get(`${API}/agents/photos`);
      setPhotos(photosResponse.data.photos || []);
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const processUserGoal = async () => {
    if (!userGoal.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/orchestrator/goal`, {
        input: userGoal
      });
      
      setGoalResult(response.data);
      setUserGoal("");
      
      // Refresh data after goal processing
      setTimeout(loadUserData, 1000);
    } catch (error) {
      console.error("Failed to process user goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSecurityStateColor = () => {
    switch (securityState) {
      case "STATE_OWNER_PRESENT": return "text-green-500";
      case "STATE_UNKNOWN_USER": return "text-yellow-500";
      case "STATE_CODE_RED": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getSecurityStateIcon = () => {
    switch (securityState) {
      case "STATE_OWNER_PRESENT": return "🔒";
      case "STATE_UNKNOWN_USER": return "⚠️";
      case "STATE_CODE_RED": return "🚨";
      default: return "❓";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Aegis HPI OS
            </h1>
            <p className="text-slate-400 mt-2">Hierarchical Proactive Intelligence Operating System</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${getSecurityStateColor()}`}>
              <span className="text-2xl">{getSecurityStateIcon()}</span>
              <div>
                <div className="text-sm font-medium">Security State</div>
                <div className="text-xs">
                  {securityState.replace("STATE_", "").replace("_", " ")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Behavioral Authentication Status */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🧠 L1 Behavioral Authentication
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700 rounded p-4">
              <div className="text-sm text-slate-400">Mouse Movements</div>
              <div className="text-2xl font-bold text-blue-400">{mouseData.length}</div>
              <div className="text-xs text-slate-500">patterns collected</div>
            </div>
            <div className="bg-slate-700 rounded p-4">
              <div className="text-sm text-slate-400">Typing Patterns</div>
              <div className="text-2xl font-bold text-purple-400">{typingData.length}</div>
              <div className="text-xs text-slate-500">keystrokes analyzed</div>
            </div>
          </div>
          
          {securityState === "STATE_OWNER_PRESENT" && (
            <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded">
              <div className="text-green-300 text-sm">✅ Owner Authenticated - Full Access Granted</div>
            </div>
          )}
          
          {securityState === "STATE_UNKNOWN_USER" && (
            <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded">
              <div className="text-yellow-300 text-sm">⚠️ Unknown User - Decoy Mode Active</div>
            </div>
          )}
        </div>

        {/* L2 AI Orchestrator */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🤖 L2 AI Orchestrator - Strategic AI
          </h2>
          
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              placeholder="Tell me what you want to accomplish... (e.g., 'Schedule a meeting with Sarah tomorrow at 2pm')"
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && processUserGoal()}
            />
            <button
              onClick={processUserGoal}
              disabled={loading || !userGoal.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-6 py-2 rounded font-medium transition-colors"
            >
              {loading ? "Processing..." : "Execute"}
            </button>
          </div>

          {goalResult && (
            <div className="bg-slate-700 rounded p-4">
              <h3 className="font-semibold mb-2">Goal Processing Result:</h3>
              <div className="text-sm space-y-2">
                <div><strong>Parsed Intents:</strong> {goalResult.parsed_intents?.join(", ") || "None"}</div>
                <div><strong>Execution Plan:</strong> {goalResult.execution_plan?.length || 0} steps</div>
                <div><strong>Status:</strong> <span className="text-green-400">{goalResult.goal_status}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* L3 App Agents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Messages Agent */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              💬 L3 Messages Agent
            </h3>
            <div className="space-y-2">
              {messages.length > 0 ? (
                messages.slice(0, 3).map((msg, idx) => (
                  <div key={idx} className="bg-slate-700 rounded p-3 text-sm">
                    <div className="font-medium text-blue-400">{msg.from || "Unknown"}</div>
                    <div className="text-slate-300">{msg.content}</div>
                    {msg.decoy && <div className="text-yellow-400 text-xs mt-1">🎭 Decoy Data</div>}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm">No messages loaded</div>
              )}
            </div>
          </div>

          {/* Calendar Agent */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              📅 L3 Calendar Agent
            </h3>
            <div className="space-y-2">
              {calendarEvents.length > 0 ? (
                calendarEvents.slice(0, 3).map((event, idx) => (
                  <div key={idx} className="bg-slate-700 rounded p-3 text-sm">
                    <div className="font-medium text-purple-400">{event.title}</div>
                    <div className="text-slate-300">{event.location}</div>
                    {event.decoy && <div className="text-yellow-400 text-xs mt-1">🎭 Decoy Data</div>}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm">No events loaded</div>
              )}
            </div>
          </div>

          {/* Photos Agent */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              📸 L3 Photos Agent
            </h3>
            <div className="space-y-2">
              {photos.length > 0 ? (
                photos.slice(0, 3).map((photo, idx) => (
                  <div key={idx} className="bg-slate-700 rounded p-3 text-sm">
                    <div className="font-medium text-green-400">{photo.filename}</div>
                    <div className="text-slate-300">{photo.location}</div>
                    {photo.decoy && <div className="text-yellow-400 text-xs mt-1">🎭 Decoy Data</div>}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm">No photos loaded</div>
              )}
            </div>
          </div>
        </div>

        {/* Phantom Folder (L0) */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🔐 L0 Phantom Folder - Encrypted Partition
          </h2>
          
          {securityState === "STATE_OWNER_PRESENT" ? (
            <div className="space-y-4">
              <div className="bg-slate-700 rounded p-4">
                <div className="text-green-400 mb-2">✅ Phantom Folder Accessible</div>
                <div className="text-sm text-slate-300">
                  Encrypted partition is unlocked and ready for sensitive data storage.
                  All files are encrypted with AES-256 and hidden from standard file system.
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-700 rounded p-3">
                  <div className="text-slate-400">Encryption Status</div>
                  <div className="text-green-400 font-medium">Active (AES-256)</div>
                </div>
                <div className="bg-slate-700 rounded p-3">
                  <div className="text-slate-400">Partition Status</div>
                  <div className="text-green-400 font-medium">Mounted & Secure</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-700 rounded p-4">
              <div className="text-yellow-400 mb-2">🔒 Phantom Folder Locked</div>
              <div className="text-sm text-slate-300">
                Owner authentication required to access encrypted partition.
                Phantom folder remains hidden and inaccessible.
              </div>
            </div>
          )}
        </div>

        {/* Security Events Log */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🛡️ Security Events Log
          </h2>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {securityEvents.length > 0 ? (
              securityEvents.map((event, idx) => (
                <div key={idx} className="bg-slate-700 rounded p-3 text-sm flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {event.event_type?.replace(/_/g, " ").toUpperCase()}
                    </div>
                    <div className="text-slate-400">{event.state || event.severity || "N/A"}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-sm">No security events recorded</div>
            )}
          </div>
        </div>

        {/* System Architecture Overview */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">🏗️ Aegis HPI Architecture</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-2xl mb-2">🔒</div>
              <div className="font-medium">L1 Kernel Guardian</div>
              <div className="text-xs text-slate-400 mt-1">Security Foundation</div>
            </div>
            
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-medium">L2 AI Orchestrator</div>
              <div className="text-xs text-slate-400 mt-1">Strategic Intelligence</div>
            </div>
            
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <div className="font-medium">L3 App Agents</div>
              <div className="text-xs text-slate-400 mt-1">Domain Specialists</div>
            </div>
            
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium">L4+ Specialists</div>
              <div className="text-xs text-slate-400 mt-1">Function Solvers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div className="App">
      <AegisInterface />
    </div>
  );
};

export default App;