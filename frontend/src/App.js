import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Dual PIN Authentication Component
const DualPinAuth = ({ onAuthSuccess, authStatus }) => {
  const [currentPin, setCurrentPin] = useState("");
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [setupPins, setSetupPins] = useState({
    primary_pin: "",
    owner_pin: "",
    duress_pin: "0000"
  });
  const [authResult, setAuthResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePinInput = (digit) => {
    if (currentPin.length < 8) {
      setCurrentPin(prev => prev + digit);
    }
  };

  const handlePinClear = () => {
    setCurrentPin("");
    setAuthResult(null);
  };

  const handlePinSubmit = async () => {
    if (currentPin.length < 4) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/pin`, {
        pin: currentPin,
        pin_type: "auto_detect"
      });

      setAuthResult(response.data);
      
      if (response.data.success) {
        onAuthSuccess(response.data);
        setCurrentPin("");
      }
    } catch (error) {
      console.error("PIN authentication failed:", error);
      setAuthResult({
        success: false,
        message: "Authentication failed"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPins = async () => {
    if (setupPins.primary_pin.length < 4 || setupPins.owner_pin.length < 4) {
      alert("PINs must be at least 4 digits");
      return;
    }

    if (setupPins.primary_pin === setupPins.owner_pin) {
      alert("Primary and Owner PINs must be different");
      return;
    }

    try {
      const response = await axios.post(`${API}/auth/setup-dual-pins`, setupPins);
      
      if (response.data.success) {
        setShowPinSetup(false);
        setSetupPins({ primary_pin: "", owner_pin: "", duress_pin: "0000" });
        alert("Dual PIN authentication configured successfully!");
      }
    } catch (error) {
      console.error("PIN setup failed:", error);
      alert("Failed to setup PINs");
    }
  };

  const getAuthStatusDisplay = () => {
    switch (authStatus?.security_state) {
      case "STATE_LOCKED":
        return { icon: "🔒", text: "Device Locked", color: "text-red-500", instruction: "Enter Primary PIN to unlock" };
      case "STATE_PHONE_UNLOCKED":
        return { icon: "⚠️", text: "Phone Unlocked", color: "text-yellow-500", instruction: "Enter Owner PIN for full access" };
      case "STATE_OWNER_PRESENT":
        return { icon: "✅", text: "Owner Authenticated", color: "text-green-500", instruction: "Full access granted" };
      default:
        return { icon: "❓", text: "Unknown", color: "text-gray-500", instruction: "Please authenticate" };
    }
  };

  const statusDisplay = getAuthStatusDisplay();

  const pinButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'], 
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  if (showPinSetup) {
    return (
      <div className="dual-pin-setup bg-slate-800 rounded-lg p-6 border border-slate-700 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">🔐 Setup Dual PIN Authentication</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Primary PIN (unlocks phone, shows decoy data)
            </label>
            <input
              type="password"
              value={setupPins.primary_pin}
              onChange={(e) => setSetupPins(prev => ({...prev, primary_pin: e.target.value}))}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              placeholder="Enter 4+ digits"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Owner PIN (switches to real data)
            </label>
            <input
              type="password"
              value={setupPins.owner_pin}
              onChange={(e) => setSetupPins(prev => ({...prev, owner_pin: e.target.value}))}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              placeholder="Enter 4+ digits"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Duress PIN (silent emergency)
            </label>
            <input
              type="password"
              value={setupPins.duress_pin}
              onChange={(e) => setSetupPins(prev => ({...prev, duress_pin: e.target.value}))}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              placeholder="Emergency PIN"
            />
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSetupPins}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
          >
            Setup PINs
          </button>
          <button
            onClick={() => setShowPinSetup(false)}
            className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dual-pin-auth bg-slate-800 rounded-lg p-6 border border-slate-700 max-w-md mx-auto">
      {/* Status Display */}
      <div className={`text-center mb-6 ${statusDisplay.color}`}>
        <div className="text-4xl mb-2">{statusDisplay.icon}</div>
        <div className="text-lg font-semibold">{statusDisplay.text}</div>
        <div className="text-sm text-slate-400 mt-1">{statusDisplay.instruction}</div>
      </div>

      {/* PIN Display */}
      <div className="pin-display bg-slate-900 rounded-lg p-4 mb-6 text-center">
        <div className="text-2xl font-mono text-white">
          {currentPin.replace(/./g, '●') || "Enter PIN"}
        </div>
        {authStatus?.failed_attempts > 0 && (
          <div className="text-red-400 text-sm mt-2">
            Failed attempts: {authStatus.failed_attempts}/{authStatus.max_attempts}
          </div>
        )}
        {authStatus?.locked_out && (
          <div className="text-red-500 text-sm mt-2">
            🚨 Locked out for {authStatus.remaining_lockout} seconds
          </div>
        )}
      </div>

      {/* PIN Keypad */}
      <div className="pin-keypad grid grid-cols-3 gap-3 mb-6">
        {pinButtons.flat().map((btn, idx) => (
          <button
            key={idx}
            onClick={() => btn !== '*' && btn !== '#' ? handlePinInput(btn) : null}
            disabled={authStatus?.locked_out || loading}
            className={`h-12 rounded-lg font-semibold text-lg transition-colors ${
              btn === '*' || btn === '#' 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-slate-700 hover:bg-slate-600 text-white active:bg-slate-500'
            }`}
          >
            {btn}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handlePinClear}
          disabled={loading}
          className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded font-medium"
        >
          Clear
        </button>
        <button
          onClick={handlePinSubmit}
          disabled={currentPin.length < 4 || loading || authStatus?.locked_out}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded font-medium"
        >
          {loading ? "..." : "Enter"}
        </button>
      </div>

      {/* Auth Result */}
      {authResult && (
        <div className={`mt-4 p-3 rounded ${
          authResult.success 
            ? 'bg-green-900 border border-green-700 text-green-300'
            : 'bg-red-900 border border-red-700 text-red-300'
        }`}>
          <div className="text-sm">{authResult.message}</div>
          {authResult.decoy_mode && (
            <div className="text-xs mt-1">🎭 Decoy mode active - Enter owner PIN for real data</div>
          )}
          {authResult.next_step && (
            <div className="text-xs mt-1">Next: {authResult.next_step}</div>
          )}
        </div>
      )}

      {/* Setup Link */}
      <div className="text-center mt-4">
        <button
          onClick={() => setShowPinSetup(true)}
          className="text-blue-400 hover:text-blue-300 text-sm underline"
        >
          Setup/Change PINs
        </button>
      </div>
    </div>
  );
};

// Main Aegis Interface with Dual Auth
const AegisLifeOSDualAuth = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [agentData, setAgentData] = useState({ messages: [] });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  // Load auth status on mount
  useEffect(() => {
    loadAuthStatus();
    const interval = setInterval(loadAuthStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAuthStatus = async () => {
    try {
      const response = await axios.get(`${API}/auth/status`);
      setAuthStatus(response.data);
      
      const isAuth = response.data.security_state !== "STATE_LOCKED";
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        loadSystemStatus();
        loadSecureAgentData();
      }
    } catch (error) {
      console.error("Failed to load auth status:", error);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await axios.get(`${API}/system/dual-auth-status`);
      setSystemStatus(response.data);
    } catch (error) {
      console.error("Failed to load system status:", error);
    }
  };

  const loadSecureAgentData = async () => {
    try {
      const messagesResponse = await axios.get(`${API}/agents/secure/messages?context=evening`);
      setAgentData({
        messages: messagesResponse.data.messages || []
      });
    } catch (error) {
      console.error("Failed to load secure agent data:", error);
    }
  };

  const handleAuthSuccess = (authResult) => {
    setAuthStatus(authResult);
    setIsAuthenticated(true);
    loadSystemStatus();
    loadSecureAgentData();
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      setIsAuthenticated(false);
      setAuthStatus(null);
      setAgentData({ messages: [] });
      setSystemStatus(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getDataModeDisplay = () => {
    if (!authStatus) return { text: "Locked", color: "text-red-500", icon: "🔒" };
    
    switch (authStatus.security_state) {
      case "STATE_PHONE_UNLOCKED":
        return { text: "Decoy Mode", color: "text-yellow-500", icon: "🎭" };
      case "STATE_OWNER_PRESENT":
        return { text: "Real Data", color: "text-green-500", icon: "✅" };
      default:
        return { text: "Locked", color: "text-red-500", icon: "🔒" };
    }
  };

  const dataMode = getDataModeDisplay();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto px-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🛡️</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              Aegis Life OS
            </h1>
            <p className="text-slate-400">Dual PIN Protection System</p>
            <p className="text-sm text-slate-500 mt-2">Two PINs, Total Protection</p>
          </div>
          
          <DualPinAuth onAuthSuccess={handleAuthSuccess} authStatus={authStatus} />
          
          <div className="mt-8 text-center text-sm text-slate-500">
            <div className="mb-2">🔐 <strong>Dual Authentication:</strong></div>
            <div>1️⃣ Primary PIN → Phone unlock (decoy data)</div>
            <div>2️⃣ Owner PIN → Real data access</div>
            <div>🚨 Duress PIN → Silent emergency</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header with Auth Status */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Aegis Life OS
            </h1>
            <p className="text-slate-400 mt-2">Your Digital Mate - Dual Authentication Active</p>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Data Mode Display */}
            <div className={`flex items-center space-x-2 ${dataMode.color}`}>
              <span className="text-2xl">{dataMode.icon}</span>
              <div>
                <div className="text-sm font-medium">Data Mode</div>
                <div className="text-xs">{dataMode.text}</div>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Authentication Status Panel */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🔐 Dual PIN Authentication Status
          </h2>
          
          {systemStatus && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-700 rounded p-4">
                <div className="text-sm text-slate-400">Phone Status</div>
                <div className={`text-lg font-bold ${
                  systemStatus.authentication_status.phone_unlocked ? 'text-green-400' : 'text-red-400'
                }`}>
                  {systemStatus.authentication_status.phone_unlocked ? 'Unlocked' : 'Locked'}
                </div>
              </div>
              
              <div className="bg-slate-700 rounded p-4">
                <div className="text-sm text-slate-400">Owner Auth</div>
                <div className={`text-lg font-bold ${
                  systemStatus.authentication_status.owner_authenticated ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {systemStatus.authentication_status.owner_authenticated ? 'Verified' : 'Pending'}
                </div>
              </div>
              
              <div className="bg-slate-700 rounded p-4">
                <div className="text-sm text-slate-400">Data Access</div>
                <div className={`text-lg font-bold ${
                  systemStatus.authentication_status.owner_authenticated ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {systemStatus.data_mode}
                </div>
              </div>
              
              <div className="bg-slate-700 rounded p-4">
                <div className="text-sm text-slate-400">Failed Attempts</div>
                <div className={`text-lg font-bold ${
                  systemStatus.authentication_status.failed_attempts > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {systemStatus.authentication_status.failed_attempts}/{systemStatus.authentication_status.max_attempts}
                </div>
              </div>
            </div>
          )}
          
          {authStatus?.security_state === "STATE_PHONE_UNLOCKED" && (
            <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded">
              <div className="text-yellow-300 text-sm">
                🎭 <strong>Decoy Mode Active:</strong> Showing fake data for privacy protection. 
                Enter your Owner PIN for real data access.
              </div>
            </div>
          )}
          
          {authStatus?.security_state === "STATE_OWNER_PRESENT" && (
            <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded">
              <div className="text-green-300 text-sm">
                ✅ <strong>Owner Authenticated:</strong> Full access granted. Real data is now visible.
              </div>
            </div>
          )}
        </div>

        {/* L3 Messages Agent - Dual Auth Aware */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            💬 L3 Messages Agent
            <span className={`ml-2 text-xs px-2 py-1 rounded ${
              authStatus?.security_state === "STATE_OWNER_PRESENT" 
                ? 'bg-green-600 text-green-100' 
                : 'bg-yellow-600 text-yellow-100'
            }`}>
              {authStatus?.security_state === "STATE_OWNER_PRESENT" ? 'Real Data' : 'Decoy Data'}
            </span>
          </h2>
          
          <div className="space-y-3">
            {agentData.messages.length > 0 ? (
              agentData.messages.map((msg, idx) => (
                <div key={idx} className="bg-slate-700 rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-blue-400">{msg.from}</div>
                    <div className="flex items-center space-x-2">
                      {msg.type && (
                        <span className="text-xs bg-slate-600 px-2 py-1 rounded">{msg.type}</span>
                      )}
                      {msg.priority === 'urgent' && (
                        <span className="text-xs bg-red-600 px-2 py-1 rounded">URGENT</span>
                      )}
                      {msg.priority === 'high' && (
                        <span className="text-xs bg-orange-600 px-2 py-1 rounded">HIGH</span>
                      )}
                    </div>
                  </div>
                  <div className="text-slate-300">{msg.content}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-center py-8">
                No messages in current context
              </div>
            )}
          </div>
          
          {authStatus?.security_state === "STATE_PHONE_UNLOCKED" && (
            <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded">
              <div className="text-yellow-300 text-sm">
                🔒 Enter Owner PIN to see your real messages and important notifications
              </div>
            </div>
          )}
        </div>

        {/* System Architecture Status */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">🏗️ Aegis Dual Auth Architecture</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-3xl mb-2">🔐</div>
              <div className="font-medium">Dual PIN Auth</div>
              <div className="text-xs text-green-400 mt-1">Primary + Owner PINs</div>
            </div>
            
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-3xl mb-2">🎭</div>
              <div className="font-medium">Decoy System</div>
              <div className="text-xs text-yellow-400 mt-1">Privacy Protection</div>
            </div>
            
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-3xl mb-2">🚨</div>
              <div className="font-medium">Duress Mode</div>
              <div className="text-xs text-red-400 mt-1">Silent Emergency</div>
            </div>
            
            <div className="bg-slate-700 rounded p-4 text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <div className="font-medium">L1 Guardian</div>
              <div className="text-xs text-blue-400 mt-1">Constitutional Rules</div>
            </div>
          </div>
          
          {systemStatus && (
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400">System</div>
                <div className="text-white font-medium">{systemStatus.system}</div>
                <div className="text-blue-400 text-xs">{systemStatus.version}</div>
              </div>
              
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400">Philosophy</div>
                <div className="text-white font-medium">Computer Butter</div>
                <div className="text-green-400 text-xs">Iron-Clad Security</div>
              </div>
              
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400">Auth State</div>
                <div className="text-white font-medium">
                  {systemStatus.security_state.replace("STATE_", "").replace("_", " ")}
                </div>
                <div className="text-purple-400 text-xs">Dual PIN System</div>
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
      <AegisLifeOSDualAuth />
    </div>
  );
};

export default App;