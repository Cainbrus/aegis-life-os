import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import CalculatorVault from './components/CalculatorVault';
import ContextualHub from './components/ContextualHub';
import VoiceInterface from './components/VoiceInterface';
import AegisOnboarding from './components/AegisOnboarding';
import WipeMode, { WipeCompleteScreen } from './components/WipeMode';
import LandingPage from './components/LandingPage';
import './App.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Trap logging hook
const useTrapLogger = (trapActive) => {
  return useCallback(async (actionType, appName, details = {}) => {
    if (!trapActive) return;
    
    try {
      await axios.post(`${API}/trap/log-action`, {
        action_type: actionType,
        app_name: appName,
        details: details,
        coordinates: { x: Math.random() * 100, y: Math.random() * 100 },
        duration_ms: Math.floor(Math.random() * 5000) + 1000,
        search_terms: details.search_terms || []
      });
    } catch (error) {
      console.error("Failed to log trap action:", error);
    }
  }, [trapActive]);
};

// Silent photo capture hook
const useSilentPhotoCapture = (trapActive) => {
  return useCallback(async () => {
    if (!trapActive) return;
    
    try {
      const fakePhotoData = `trap_photo_${Date.now()}_${Math.random()}`;
      await axios.post(`${API}/trap/capture-photo`, {
        photo: fakePhotoData
      });
      
      console.log("Silent photo captured for evidence");
    } catch (error) {
      console.error("Failed to capture trap photo:", error);
    }
  }, [trapActive]);
};

// Enhanced TrapApp Component
const TrapApp = ({ appName, onClose, logAction, capturePhoto }) => {
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppData();
    
    // Log app opening
    logAction("app_opened", appName, {
      opened_at: new Date().toISOString()
    });

    // Capture photo when app opens
    setTimeout(() => {
      capturePhoto();
    }, 2000);

    return () => {
      logAction("app_closed", appName, {
        closed_at: new Date().toISOString()
      });
    };
  }, [appName, logAction, capturePhoto]);

  const loadAppData = async () => {
    try {
      const response = await axios.get(`${API}/apps/${appName}/data`);
      setAppData(response.data);
    } catch (error) {
      console.error("Failed to load app data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = (interactionType, details = {}) => {
    logAction(interactionType, appName, details);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📱</div>
          <div className="text-xl">Loading {appName}...</div>
        </div>
      </div>
    );
  }

  const renderAppContent = () => {
    if (!appData?.data) return <div className="text-center text-slate-400">No data available</div>;

    const data = appData.data;

    switch (appName) {
      case "messages":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">📨 Messages</h2>
            
            {data.recent_messages?.map((msg, idx) => (
              <div 
                key={idx} 
                className="bg-slate-700 rounded-lg p-4 cursor-pointer hover:bg-slate-600"
                onClick={() => handleInteraction("message_tap", { from: msg.from, content_length: msg.content?.length })}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold">{msg.from}</div>
                  <div className="text-xs text-slate-400">{msg.time}</div>
                </div>
                <div className="text-sm text-slate-300">{msg.content}</div>
                {!msg.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
              </div>
            ))}
          </div>
        );

      case "photos":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">📸 Photos</h2>
            <div className="text-slate-300 mb-4">{data.photo_count} photos</div>
            
            <div className="grid grid-cols-2 gap-4">
              {data.recent_photos?.map((photo, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-700 rounded-lg p-4 cursor-pointer hover:bg-slate-600"
                  onClick={() => handleInteraction("photo_view", { photo_id: photo.id, location: photo.location })}
                >
                  <div className="aspect-square bg-slate-600 rounded mb-2 flex items-center justify-center">
                    📷
                  </div>
                  <div className="text-xs text-slate-400">{photo.filename}</div>
                  <div className="text-xs text-slate-500">{photo.date}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "banking":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">💳 Banking</h2>
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
              <div className="text-sm opacity-75">Available Balance</div>
              <div 
                className="text-3xl font-bold cursor-pointer"
                onClick={() => handleInteraction("balance_view", { balance: data.account_balance })}
              >
                {data.account_balance}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              {data.recent_transactions?.map((tx, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-700 rounded-lg p-3 cursor-pointer hover:bg-slate-600"
                  onClick={() => handleInteraction("transaction_view", { description: tx.description, amount: tx.amount })}
                >
                  <div className="flex justify-between">
                    <div>{tx.description}</div>
                    <div className={tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                      {tx.amount}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">{tx.date}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <div className="text-6xl mb-4">📱</div>
            <div className="text-xl mb-2">{appName.charAt(0).toUpperCase() + appName.slice(1)}</div>
            <div className="text-slate-400">App functionality coming soon</div>
            <button 
              onClick={() => handleInteraction("generic_tap", { area: "main_content" })}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Explore
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* App Header */}
      <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onClose}
            className="text-2xl hover:text-blue-400"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold capitalize">{appName}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleInteraction("search_tap", { app: appName })}
            className="text-xl hover:text-blue-400"
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

// Pattern Authentication Component
const DualPatternAuth = ({ onAuthSuccess, authStatus }) => {
  const [currentPattern, setCurrentPattern] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPatternSetup, setShowPatternSetup] = useState(false);
  const [setupPatterns, setSetupPatterns] = useState({
    primary_pattern: "",
    owner_pattern: "",
    duress_pattern: "2-5-8"
  });
  const [authResult, setAuthResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pattern grid: 3x3 numbered 1-9
  const patternGrid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ];

  const handleDotStart = (dotNumber) => {
    if (loading) return;
    setIsDrawing(true);
    setCurrentPattern([dotNumber]);
    setAuthResult(null);
  };

  const handleDotEnter = (dotNumber) => {
    if (!isDrawing) return;
    if (!currentPattern.includes(dotNumber)) {
      setCurrentPattern(prev => [...prev, dotNumber]);
    }
  };

  const handleDotEnd = () => {
    setIsDrawing(false);
    if (currentPattern.length >= 4) {
      handlePatternSubmit();
    }
  };

  const handlePatternClear = () => {
    setCurrentPattern([]);
    setAuthResult(null);
  };

  const handlePatternSubmit = async () => {
    if (currentPattern.length < 4) {
      setAuthResult({
        success: false,
        message: "Pattern must connect at least 4 dots"
      });
      return;
    }
    
    setLoading(true);
    try {
      const patternString = currentPattern.join("-");
      const response = await axios.post(`${API}/auth/pattern`, {
        pattern: patternString,
        pattern_type: "auto_detect"
      });

      setAuthResult(response.data);
      
      if (response.data.success) {
        onAuthSuccess(response.data);
        setCurrentPattern([]);
      }
    } catch (error) {
      console.error("Pattern authentication failed:", error);
      setAuthResult({
        success: false,
        message: "Authentication failed"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPatterns = async () => {
    if (setupPatterns.primary_pattern.split("-").length < 4 || setupPatterns.owner_pattern.split("-").length < 4) {
      alert("Patterns must connect at least 4 dots");
      return;
    }

    if (setupPatterns.primary_pattern === setupPatterns.owner_pattern) {
      alert("Primary and Owner patterns must be different");
      return;
    }

    try {
      const response = await axios.post(`${API}/auth/setup-dual-patterns`, setupPatterns);
      
      if (response.data.success) {
        setShowPatternSetup(false);
        setSetupPatterns({ primary_pattern: "", owner_pattern: "", duress_pattern: "2-5-8" });
        alert("Dual Pattern authentication configured successfully!");
      }
    } catch (error) {
      console.error("Pattern setup failed:", error);
      alert("Failed to setup patterns");
    }
  };

  const getAuthStatusDisplay = () => {
    switch (authStatus?.security_state) {
      case "STATE_LOCKED":
        return { icon: "🔒", text: "Device Locked", color: "text-red-500", instruction: "Draw Primary Pattern to unlock" };
      case "STATE_PHONE_UNLOCKED":
        return { icon: "📱", text: "Phone Unlocked", color: "text-green-500", instruction: "Full access granted" };
      case "STATE_OWNER_PRESENT":
        return { icon: "✅", text: "Owner Authenticated", color: "text-green-500", instruction: "Full access granted" };
      default:
        return { icon: "❓", text: "Unknown", color: "text-gray-500", instruction: "Please authenticate" };
    }
  };

  const statusDisplay = getAuthStatusDisplay();

  const isConnected = (dot1, dot2) => {
    const index1 = currentPattern.indexOf(dot1);
    const index2 = currentPattern.indexOf(dot2);
    return index1 !== -1 && index2 !== -1 && Math.abs(index1 - index2) === 1;
  };

  if (showPatternSetup) {
    return (
      <div className="dual-pattern-setup bg-slate-800 rounded-lg p-6 border border-slate-700 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">🔐 Setup Dual Pattern Authentication</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Primary Pattern (unlocks phone) - Example: 1-2-3-6-9
            </label>
            <input
              type="text"
              value={setupPatterns.primary_pattern}
              onChange={(e) => setSetupPatterns(prev => ({...prev, primary_pattern: e.target.value}))}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              placeholder="e.g., 1-2-5-8-9"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Owner Pattern (real data access) - Example: 1-5-9-8-7
            </label>
            <input
              type="text"
              value={setupPatterns.owner_pattern}
              onChange={(e) => setSetupPatterns(prev => ({...prev, owner_pattern: e.target.value}))}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              placeholder="e.g., 7-5-3-2-1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Duress Pattern (emergency) - Example: 2-5-8
            </label>
            <input
              type="text"
              value={setupPatterns.duress_pattern}
              onChange={(e) => setSetupPatterns(prev => ({...prev, duress_pattern: e.target.value}))}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              placeholder="Emergency pattern"
            />
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSetupPatterns}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
          >
            Setup Patterns
          </button>
          <button
            onClick={() => setShowPatternSetup(false)}
            className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dual-pattern-auth bg-slate-800 rounded-lg p-6 border border-slate-700 max-w-md mx-auto">
      <div className={`text-center mb-6 ${statusDisplay.color}`}>
        <div className="text-4xl mb-2">{statusDisplay.icon}</div>
        <div className="text-lg font-semibold">{statusDisplay.text}</div>
        <div className="text-sm text-slate-400 mt-1">{statusDisplay.instruction}</div>
      </div>

      {/* Pattern Display */}
      <div className="pattern-display bg-slate-900 rounded-lg p-4 mb-6 text-center">
        <div className="text-lg font-medium text-white mb-2">
          {currentPattern.length > 0 ? `Connected: ${currentPattern.length} dots` : "Draw your pattern"}
        </div>
        {currentPattern.length > 0 && (
          <div className="text-sm text-slate-400">
            Pattern: {currentPattern.join(" → ")}
          </div>
        )}
      </div>

      {/* 3x3 Pattern Grid */}
      <div className="pattern-grid mb-6">
        <div className="grid grid-cols-3 gap-8 max-w-xs mx-auto">
          {patternGrid.flat().map((dotNumber) => {
            const isSelected = currentPattern.includes(dotNumber);
            const isLast = currentPattern[currentPattern.length - 1] === dotNumber;
            
            return (
              <div
                key={dotNumber}
                className={`
                  w-16 h-16 rounded-full border-2 flex items-center justify-center cursor-pointer
                  transition-all duration-200 select-none
                  ${isSelected 
                    ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/50' 
                    : 'bg-slate-700 border-slate-500 text-slate-300 hover:border-slate-400'
                  }
                  ${isLast ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}
                `}
                onMouseDown={() => handleDotStart(dotNumber)}
                onMouseEnter={() => handleDotEnter(dotNumber)}
                onMouseUp={handleDotEnd}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleDotStart(dotNumber);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const element = document.elementFromPoint(touch.clientX, touch.clientY);
                  const dotNum = element?.getAttribute('data-dot');
                  if (dotNum) handleDotEnter(parseInt(dotNum));
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleDotEnd();
                }}
                data-dot={dotNumber}
              >
                <span className="text-lg font-bold">{dotNumber}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handlePatternClear}
          disabled={loading || currentPattern.length === 0}
          className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white px-4 py-2 rounded font-medium"
        >
          Clear
        </button>
        <button
          onClick={handlePatternSubmit}
          disabled={currentPattern.length < 4 || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded font-medium"
        >
          {loading ? "..." : "Submit"}
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
          onClick={() => setShowPatternSetup(true)}
          className="text-blue-400 hover:text-blue-300 text-sm underline"
        >
          Setup/Change Patterns
        </button>
      </div>
      
      <div className="text-center mt-2 text-xs text-slate-500">
        Tip: Connect at least 4 dots in your pattern
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
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  const [wipeTriggered, setWipeTriggered] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(null); // null = loading, true = show landing, false = skip landing

  // Determine if trap mode is active
  const trapActive = authStatus?.security_state === "STATE_PHONE_UNLOCKED" && authStatus?.trap_mode;
  const ownerMode = authStatus?.security_state === "STATE_OWNER_PRESENT";

  // Initialize trap logging and photo capture
  const logAction = useTrapLogger(trapActive);
  const capturePhoto = useSilentPhotoCapture(trapActive);

  useEffect(() => {
    checkOnboardingStatus();
    loadAuthStatus();
    const interval = setInterval(loadAuthStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get(`${API}/onboarding/status`);
      const isComplete = response.data.onboarding_complete;
      setOnboardingComplete(isComplete);
      // If onboarding is complete, skip the landing page
      if (isComplete) {
        setShowLandingPage(false);
      } else {
        setShowLandingPage(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setOnboardingComplete(false);
      setShowLandingPage(true); // Show landing for new users
    }
  };

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

  const handleWipeTriggered = (triggerMethod) => {
    console.log(`EMERGENCY WIPE TRIGGERED: ${triggerMethod}`);
    setWipeTriggered(true);
    
    // Log the wipe trigger
    logAction("emergency_wipe_triggered", "wipe_system", {
      trigger_method: triggerMethod,
      timestamp: new Date().toISOString(),
      security_state: authStatus?.security_state
    });
  };

  const handleGetStarted = () => {
    setShowLandingPage(false);
    checkOnboardingStatus();
  };

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
  };

  const handleVoiceCommand = (command, response) => {
    // Handle voice commands that control the interface
    if (response?.action === 'open_app' && response?.app) {
      handleAppOpen(response.app);
    }
    
    // Log voice interaction
    logAction("voice_command_processed", "voice_interface", {
      command: command,
      response_received: !!response,
      timestamp: new Date().toISOString()
    });
  };

  const handleDuressDetected = (phrase) => {
    // CRITICAL: This is a silent emergency - log but don't alert user
    logAction("duress_detected", "voice_interface", {
      phrase: phrase,
      timestamp: new Date().toISOString(),
      security_state: authStatus?.security_state
    });
    
    console.log('EMERGENCY: Duress phrase detected - silent protocols activated');
  };

  const handleVaultAccess = (isAccessed) => {
    if (isAccessed) {
      logAction("phantom_folder_accessed", "vault", {
        access_method: "calculator_handshake",
        timestamp: new Date().toISOString()
      });
    }
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

  // Show loading while checking status
  if (showLandingPage === null) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛡️</div>
          <div className="text-xl">Initializing Aegis...</div>
        </div>
      </div>
    );
  }

  // Show landing page for new visitors (onboarding not complete)
  if (showLandingPage) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Show wipe complete screen if at /wipe-complete
  if (window.location.pathname === '/wipe-complete') {
    return <WipeCompleteScreen />;
  }

  // Show onboarding if not completed (after clicking "Initialize" from landing)
  if (onboardingComplete === false) {
    return <AegisOnboarding onComplete={handleOnboardingComplete} />;
  }

  // Show Pattern interface if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto px-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🛡️</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              Aegis Life OS
            </h1>
            <p className="text-slate-400">Pattern Authentication System</p>
          </div>
          
          <DualPatternAuth onAuthSuccess={handleAuthSuccess} authStatus={authStatus} />
        </div>
      </div>
    );
  }

  // Show specific app if opened
  if (currentApp) {
    if (currentApp === 'calculator') {
      return (
        <CalculatorVault 
          onClose={() => setCurrentApp(null)}
          onVaultAccess={handleVaultAccess}
        />
      );
    }
    
    return (
      <TrapApp 
        appName={currentApp}
        onClose={() => setCurrentApp(null)}
        logAction={logAction}
        capturePhoto={capturePhoto}
      />
    );
  }

  // Main interface - Now uses dynamic contextual hub
  return (
    <>
      <ContextualHub 
        authStatus={authStatus}
        onAppOpen={handleAppOpen}
        trapActive={trapActive}
        ownerMode={ownerMode}
      />
      
      {/* Voice Interface - Always active for ambient listening */}
      <VoiceInterface
        ownerMode={ownerMode}
        onVoiceCommand={handleVoiceCommand}
        onDuressDetected={handleDuressDetected}
      />

      {/* Emergency Wipe Mode - Always monitoring for triggers */}
      <WipeMode onWipeTriggered={handleWipeTriggered} />
    </>
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