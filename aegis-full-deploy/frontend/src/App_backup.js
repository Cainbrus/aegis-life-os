import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Trap Action Logger - Silently logs everything
const useTrapLogger = (trapActive) => {
  const logAction = useCallback(async (actionType, appName, details = {}) => {
    if (!trapActive) return;
    
    try {
      await axios.post(`${API}/trap/log-action`, {
        action_type: actionType,
        app_name: appName,
        details: details,
        coordinates: details.coordinates,
        duration_ms: details.duration || 0,
        search_terms: details.searchTerms || []
      });
    } catch (error) {
      // Silent fail - never let intruder know logging failed
      console.error("Trap logging failed:", error);
    }
  }, [trapActive]);

  return logAction;
};

// Silent Photo Capture - Invisible to intruder
const useSilentPhotoCapture = (trapActive) => {
  const capturePhoto = useCallback(async () => {
    if (!trapActive) return;
    
    try {
      // In a real implementation, this would:
      // 1. Access front camera without showing UI
      // 2. Take photo silently
      // 3. Convert to base64
      // 4. Send to trap system
      
      // Simulated photo capture
      const fakePhotoData = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."; // Simulated
      
      await axios.post(`${API}/trap/capture-photo`, {
        photo: fakePhotoData
      });
      
      console.log("📸 TRAP: Silent photo captured"); // Only visible in console
    } catch (error) {
      console.error("Silent photo capture failed:", error);
    }
  }, [trapActive]);

  return capturePhoto;
};

// Trap App Interface - Shows fake but convincing data
const TrapApp = ({ appName, onClose, logAction, capturePhoto }) => {
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAppData();
    capturePhoto(); // Take photo when app opens
    
    // Log app opening
    logAction("app_open", appName, {
      opened_at: new Date().toISOString()
    });
  }, [appName, logAction, capturePhoto]);

  const loadAppData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/trap/app/${appName}?action=view`);
      setAppData(response.data);
    } catch (error) {
      console.error("Failed to load app data:", error);
      setAppData({ data: { message: "Loading..." } });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    // Log search attempt
    logAction("search", appName, {
      searchTerms: [searchTerm],
      query: searchTerm
    });
    
    try {
      await axios.post(`${API}/trap/search`, {
        terms: [searchTerm],
        app: appName
      });
      
      // Show fake "no results" to frustrate them
      alert("No results found for your search.");
    } catch (error) {
      alert("Search temporarily unavailable.");
    }
  };

  const handleItemClick = (item, itemType) => {
    // Log what they're interested in
    logAction("item_click", appName, {
      item_type: itemType,
      item_data: item,
      interest_level: "high"
    });
    
    // Take another photo when they show interest
    capturePhoto();
  };

  const renderAppContent = () => {
    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (!appData || !appData.data) {
      return <div className="text-center py-8">App temporarily unavailable</div>;
    }

    const data = appData.data;

    switch (appName) {
      case "messages":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Recent Messages</h3>
            {data.recent_messages?.map((msg, idx) => (
              <div 
                key={idx} 
                className="bg-slate-700 rounded p-3 cursor-pointer hover:bg-slate-600"
                onClick={() => handleItemClick(msg, "message")}
              >
                <div className="font-medium text-blue-400">{msg.from}</div>
                <div className="text-slate-300 text-sm">{msg.content}</div>
                <div className="text-xs text-slate-500 mt-1">{msg.time}</div>
                {!msg.read && <div className="text-xs text-green-400">● Unread</div>}
              </div>
            ))}
          </div>
        );

      case "photos":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Recent Photos ({data.photo_count})</h3>
            <div className="grid grid-cols-2 gap-3">
              {data.recent_photos?.map((photo, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-700 rounded p-3 cursor-pointer hover:bg-slate-600"
                  onClick={() => handleItemClick(photo, "photo")}
                >
                  <div className="aspect-square bg-slate-600 rounded mb-2 flex items-center justify-center">
                    <span className="text-4xl">📸</span>
                  </div>
                  <div className="text-sm font-medium">{photo.filename}</div>
                  <div className="text-xs text-slate-400">{photo.location}</div>
                  <div className="text-xs text-slate-500">{photo.date}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Albums</h4>
              <div className="flex flex-wrap gap-2">
                {data.recent_albums?.map((album, idx) => (
                  <button 
                    key={idx}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    onClick={() => handleItemClick({ album }, "album")}
                  >
                    {album}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "contacts":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Favorites</h3>
            {data.favorites?.map((contact, idx) => (
              <div 
                key={idx}
                className="bg-slate-700 rounded p-3 cursor-pointer hover:bg-slate-600"
                onClick={() => handleItemClick(contact, "contact")}
              >
                <div className="font-medium text-green-400">{contact.name}</div>
                <div className="text-slate-300 text-sm">{contact.phone}</div>
                <div className="text-slate-400 text-xs">{contact.email}</div>
              </div>
            ))}
          </div>
        );

      case "calendar":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
            {data.upcoming_events?.map((event, idx) => (
              <div 
                key={idx}
                className="bg-slate-700 rounded p-3 cursor-pointer hover:bg-slate-600"
                onClick={() => handleItemClick(event, "calendar_event")}
              >
                <div className="font-medium text-purple-400">{event.title}</div>
                <div className="text-slate-300 text-sm">{event.time}</div>
                <div className="text-slate-400 text-xs">{event.location}</div>
              </div>
            ))}
          </div>
        );

      case "settings":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
            
            <div className="bg-slate-700 rounded p-4">
              <div className="space-y-2">
                <div><strong>Name:</strong> {data.account_info?.name}</div>
                <div><strong>Email:</strong> {data.account_info?.email}</div>
                <div><strong>Phone:</strong> {data.account_info?.phone}</div>
                <div><strong>Storage:</strong> {data.account_info?.storage_used}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Recent Activity</h4>
              {data.recent_activity?.map((activity, idx) => (
                <div key={idx} className="text-sm text-slate-400">• {activity}</div>
              ))}
            </div>
            
            <div className="space-y-2">
              <button 
                className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
                onClick={() => {
                  logAction("security_access_attempt", "settings", { 
                    attempted_action: "factory_reset",
                    suspicious: true 
                  });
                  alert("This action requires owner authentication.");
                }}
              >
                Factory Reset
              </button>
              <button 
                className="w-full bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded text-sm"
                onClick={() => {
                  logAction("security_access_attempt", "settings", { 
                    attempted_action: "change_password",
                    suspicious: true 
                  });
                  alert("Password change requires verification.");
                }}
              >
                Change Password
              </button>
            </div>
          </div>
        );

      case "banking":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Account Overview</h3>
            
            <div className="bg-green-900 border border-green-700 rounded p-4">
              <div className="text-green-300 text-lg font-bold">Balance: {data.account_balance}</div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Recent Transactions</h4>
              {data.recent_transactions?.map((transaction, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-700 rounded p-3 mb-2 cursor-pointer hover:bg-slate-600"
                  onClick={() => handleItemClick(transaction, "transaction")}
                >
                  <div className="flex justify-between">
                    <span>{transaction.description}</span>
                    <span className={transaction.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                      {transaction.amount}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{transaction.date}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📱</div>
            <div>App data loading...</div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50">
      {/* App Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onClose}
            className="text-blue-400 hover:text-blue-300"
          >
            ← Back
          </button>
          <h2 className="text-xl font-semibold capitalize">{appName}</h2>
        </div>
        
        {/* Search Bar */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm"
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
          >
            🔍
          </button>
        </div>
      </div>
      
      {/* App Content */}
      <div className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
        {renderAppContent()}
      </div>
    </div>
  );
};

// Dual PIN Interface (unchanged from previous)
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
        return { icon: "📱", text: "Phone Unlocked", color: "text-green-500", instruction: "Full access granted" }; // Lie to intruder
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
              Primary PIN (unlocks phone)
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
              Owner PIN (real data access)
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
              Duress PIN (emergency)
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
      <div className={`text-center mb-6 ${statusDisplay.color}`}>
        <div className="text-4xl mb-2">{statusDisplay.icon}</div>
        <div className="text-lg font-semibold">{statusDisplay.text}</div>
        <div className="text-sm text-slate-400 mt-1">{statusDisplay.instruction}</div>
      </div>

      <div className="pin-display bg-slate-900 rounded-lg p-4 mb-6 text-center">
        <div className="text-2xl font-mono text-white">
          {currentPin.replace(/./g, '●') || "Enter PIN"}
        </div>
      </div>

      <div className="pin-keypad grid grid-cols-3 gap-3 mb-6">
        {pinButtons.flat().map((btn, idx) => (
          <button
            key={idx}
            onClick={() => btn !== '*' && btn !== '#' ? handlePinInput(btn) : null}
            disabled={loading}
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
          disabled={currentPin.length < 4 || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded font-medium"
        >
          {loading ? "..." : "Enter"}
        </button>
      </div>

      {authResult && (
        <div className={`mt-4 p-3 rounded ${
          authResult.success 
            ? 'bg-green-900 border border-green-700 text-green-300'
            : 'bg-red-900 border border-red-700 text-red-300'
        }`}>
          <div className="text-sm">{authResult.message}</div>
        </div>
      )}

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

// Main Trap-Enabled Interface
const AegisTrapSystem = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [currentApp, setCurrentApp] = useState(null);
  const [trapStatus, setTrapStatus] = useState(null);
  const [trapEvidence, setTrapEvidence] = useState(null);

  // Determine if trap mode is active
  const trapActive = authStatus?.security_state === "STATE_PHONE_UNLOCKED" && authStatus?.trap_mode;
  const ownerMode = authStatus?.security_state === "STATE_OWNER_PRESENT";

  // Initialize trap logging and photo capture
  const logAction = useTrapLogger(trapActive);
  const capturePhoto = useSilentPhotoCapture(trapActive);

  useEffect(() => {
    loadAuthStatus();
    const interval = setInterval(loadAuthStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Take photo periodically in trap mode
  useEffect(() => {
    if (trapActive) {
      const photoInterval = setInterval(() => {
        capturePhoto();
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(photoInterval);
    }
  }, [trapActive, capturePhoto]);

  // Load trap status for owner
  useEffect(() => {
    if (ownerMode) {
      loadTrapStatus();
      loadTrapEvidence();
    }
  }, [ownerMode]);

  const loadAuthStatus = async () => {
    try {
      const response = await axios.get(`${API}/auth/status`);
      setAuthStatus(response.data);
      
      const isAuth = response.data.security_state !== "STATE_LOCKED";
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        loadSystemStatus();
      }
    } catch (error) {
      console.error("Failed to load auth status:", error);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await axios.get(`${API}/system/trap-status`);
      setSystemStatus(response.data);
    } catch (error) {
      console.error("Failed to load system status:", error);
    }
  };

  const loadTrapStatus = async () => {
    try {
      const response = await axios.get(`${API}/trap/status`);
      setTrapStatus(response.data);
    } catch (error) {
      console.error("Failed to load trap status:", error);
    }
  };

  const loadTrapEvidence = async () => {
    try {
      const response = await axios.get(`${API}/trap/evidence`);
      setTrapEvidence(response.data);
    } catch (error) {
      console.error("Failed to load trap evidence:", error);
    }
  };

  const handleAuthSuccess = (authResult) => {
    setAuthStatus(authResult);
    setIsAuthenticated(true);
    loadSystemStatus();
  };

  const handleAppOpen = (appName) => {
    // Log app opening attempt
    logAction("app_launch_attempt", appName, {
      launched_at: new Date().toISOString()
    });
    
    setCurrentApp(appName);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      setIsAuthenticated(false);
      setAuthStatus(null);
      setSystemStatus(null);
      setCurrentApp(null);
      setTrapStatus(null);
      setTrapEvidence(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Show PIN interface if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto px-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🛡️</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              Aegis Life OS
            </h1>
            <p className="text-slate-400">Perfect Trap System</p>
          </div>
          
          <DualPinAuth onAuthSuccess={handleAuthSuccess} authStatus={authStatus} />
        </div>
      </div>
    );
  }

  // Show specific app if opened
  if (currentApp) {
    return (
      <TrapApp 
        appName={currentApp}
        onClose={() => setCurrentApp(null)}
        logAction={logAction}
        capturePhoto={capturePhoto}
      />
    );
  }

  // Main interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {trapActive ? "My Phone" : "Aegis Life OS"}
            </h1>
            <p className="text-slate-400 mt-2">
              {trapActive ? "Welcome! Full access granted" : "Your Digital Mate - Owner Mode"}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {ownerMode && (
              <div className="text-green-400 text-sm">
                🔓 Owner Mode - Real Data
              </div>
            )}
            
            {trapActive && (
              <div className="text-green-400 text-sm">
                📱 Phone Unlocked
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
            >
              Lock
            </button>
          </div>
        </div>

        {/* Owner-Only Trap Status */}
        {ownerMode && trapStatus && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-red-300">🚨 TRAP EVIDENCE COLLECTION</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-red-800 rounded p-3">
                <div className="text-red-300 text-lg font-bold">{trapStatus.actions_logged}</div>
                <div className="text-red-400 text-sm">Actions Logged</div>
              </div>
              <div className="bg-red-800 rounded p-3">
                <div className="text-red-300 text-lg font-bold">{trapStatus.photos_captured}</div>
                <div className="text-red-400 text-sm">Photos Captured</div>
              </div>
              <div className="bg-red-800 rounded p-3">
                <div className="text-red-300 text-lg font-bold">{trapStatus.apps_accessed?.length || 0}</div>
                <div className="text-red-400 text-sm">Apps Accessed</div>
              </div>
              <div className="bg-red-800 rounded p-3">
                <div className="text-red-300 text-lg font-bold">{Math.floor(trapStatus.duration_seconds / 60)}</div>
                <div className="text-red-400 text-sm">Minutes Active</div>
              </div>
            </div>
            
            {trapStatus.apps_accessed && trapStatus.apps_accessed.length > 0 && (
              <div>
                <div className="text-red-300 font-medium mb-2">Apps They Accessed:</div>
                <div className="flex flex-wrap gap-2">
                  {trapStatus.apps_accessed.map((app, idx) => (
                    <span key={idx} className="bg-red-800 px-2 py-1 rounded text-sm">
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* App Grid - Looks normal to intruder, shows trap data */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {[
            { name: "Messages", icon: "💬", color: "bg-blue-600" },
            { name: "Photos", icon: "📸", color: "bg-green-600" },
            { name: "Contacts", icon: "👥", color: "bg-purple-600" },
            { name: "Calendar", icon: "📅", color: "bg-red-600" },
            { name: "Settings", icon: "⚙️", color: "bg-gray-600" },
            { name: "Banking", icon: "💳", color: "bg-yellow-600" },
            { name: "Notes", icon: "📝", color: "bg-orange-600" },
            { name: "Camera", icon: "📷", color: "bg-pink-600" }
          ].map((app, idx) => (
            <button
              key={idx}
              onClick={() => handleAppOpen(app.name.toLowerCase())}
              className={`${app.color} hover:opacity-90 rounded-lg p-4 text-center transition-all transform hover:scale-105 active:scale-95`}
            >
              <div className="text-3xl mb-2">{app.icon}</div>
              <div className="text-sm font-medium">{app.name}</div>
            </button>
          ))}
        </div>

        {/* System Status - Different for trap vs owner */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">
            {trapActive ? "📱 System Information" : "🛡️ Aegis System Status"}
          </h2>
          
          {systemStatus && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">System</div>
                <div className="text-white font-medium">
                  {trapActive ? "iOS 17.2" : systemStatus.system}
                </div>
              </div>
              
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Status</div>
                <div className="text-green-400 font-medium">
                  {trapActive ? "Normal Operation" : "Owner Authenticated"}
                </div>
              </div>
              
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Storage</div>
                <div className="text-white font-medium">
                  {trapActive ? "32.1 GB Available" : systemStatus.data_mode}
                </div>
              </div>
              
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Security</div>
                <div className="text-green-400 font-medium">
                  {trapActive ? "Protected" : "Iron-Clad"}
                </div>
              </div>
            </div>
          )}
          
          {ownerMode && systemStatus?.trap_system && (
            <div className="mt-4 p-3 bg-blue-900 border border-blue-700 rounded">
              <div className="text-blue-300 text-sm">
                🛡️ <strong>Trap System:</strong> {systemStatus.trap_system.mode} - 
                Evidence collection {systemStatus.trap_system.evidence_collection}
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
      <AegisTrapSystem />
    </div>
  );
};

export default App;