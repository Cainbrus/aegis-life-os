import React, { createContext, useContext, useState, useEffect } from 'react';

// =============================================
// APP MODE CONTEXT
// Controls Demo Mode vs User Mode
// Demo Mode: Full investor experience
// User Mode: Clean, simple security app
// =============================================

const AppModeContext = createContext();

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within AppModeProvider');
  }
  return context;
};

export const AppModeProvider = ({ children }) => {
  // Check localStorage for saved mode
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const saved = localStorage.getItem('digitalmate_demo_mode');
    return saved === null ? true : saved === 'true'; // Default to demo mode for now
  });

  // App branding
  const [appName] = useState('Digital Mate');
  const [tagline] = useState('Your Phone\'s Bodyguard');

  // Save mode preference
  useEffect(() => {
    localStorage.setItem('digitalmate_demo_mode', isDemoMode.toString());
  }, [isDemoMode]);

  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev);
  };

  const value = {
    isDemoMode,
    setIsDemoMode,
    toggleDemoMode,
    appName,
    tagline,
    // Feature flags based on mode
    features: {
      // Core features - always enabled
      trapMode: true,
      invisibleVault: true,
      patternAuth: true,
      intruderEvidence: true,
      // Demo/Advanced features - only in demo mode
      hubView: isDemoMode,
      mateAssistant: isDemoMode,
      storyMode: isDemoMode,
      investorGuide: isDemoMode,
      website: isDemoMode,
      proactiveBriefings: isDemoMode,
      familyTracker: isDemoMode,
      healthDashboard: isDemoMode,
      financeDashboard: isDemoMode,
      smartEmail: isDemoMode,
    }
  };

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
};

// Simple toggle component for settings
export const DemoModeToggle = ({ className = '' }) => {
  const { isDemoMode, toggleDemoMode } = useAppMode();

  return (
    <div className={`flex items-center justify-between p-4 bg-slate-800 rounded-xl ${className}`}>
      <div>
        <p className="text-white font-medium">Demo Mode</p>
        <p className="text-slate-400 text-sm">
          {isDemoMode ? 'Full features for investors' : 'Simple security app'}
        </p>
      </div>
      <button
        onClick={toggleDemoMode}
        className={`w-14 h-8 rounded-full transition-all relative ${
          isDemoMode ? 'bg-cyan-500' : 'bg-slate-600'
        }`}
      >
        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
          isDemoMode ? 'left-7' : 'left-1'
        }`} />
      </button>
    </div>
  );
};

export default AppModeContext;
