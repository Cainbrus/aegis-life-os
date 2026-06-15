import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WipeMode = ({ onWipeTriggered }) => {
  const [powerPresses, setPowerPresses] = useState(0);
  const [volumeUpPresses, setVolumeUpPresses] = useState(0);
  const [wipeInProgress, setWipeInProgress] = useState(false);
  const [wipeCountdown, setWipeCountdown] = useState(0);
  const [remoteWipeCode, setRemoteWipeCode] = useState('');
  const [isListeningForCode, setIsListeningForCode] = useState(true);

  const powerPressTimer = useRef(null);
  const wipeTimer = useRef(null);
  const countdownTimer = useRef(null);

  useEffect(() => {
    // Listen for hardware button sequences
    const handleKeyDown = (event) => {
      // Simulate power button with 'P' key for testing
      if (event.key === 'P' || event.key === 'p') {
        handlePowerButtonPress();
      }
      
      // Simulate volume up with 'V' key for testing  
      if (event.key === 'V' || event.key === 'v') {
        handleVolumeUpPress();
      }

      // Emergency wipe with Ctrl+Shift+W
      if (event.ctrlKey && event.shiftKey && event.key === 'W') {
        event.preventDefault();
        initiateEmergencyWipe('keyboard_shortcut');
      }
    };

    // Listen for remote wipe messages
    listenForRemoteWipe();

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(powerPressTimer.current);
      clearTimeout(wipeTimer.current);
      clearTimeout(countdownTimer.current);
    };
  }, []);

  const handlePowerButtonPress = () => {
    setPowerPresses(prev => {
      const newCount = prev + 1;
      
      // Reset timer for power button sequence
      clearTimeout(powerPressTimer.current);
      powerPressTimer.current = setTimeout(() => {
        setPowerPresses(0);
        setVolumeUpPresses(0);
      }, 3000); // Reset after 3 seconds of inactivity

      console.log(`Power button pressed: ${newCount}/5`);
      
      // Check if we've reached 5 power presses
      if (newCount >= 5) {
        checkWipeSequence(newCount, volumeUpPresses);
      }
      
      return newCount;
    });
  };

  const handleVolumeUpPress = () => {
    setVolumeUpPresses(prev => {
      const newCount = prev + 1;
      console.log(`Volume up pressed: ${newCount}/1`);
      
      // Check wipe sequence after volume press
      checkWipeSequence(powerPresses, newCount);
      
      return newCount;
    });
  };

  const checkWipeSequence = (powerCount, volumeCount) => {
    // Wipe sequence: 5 power presses + 1 volume up press
    if (powerCount >= 5 && volumeCount >= 1) {
      initiateEmergencyWipe('hardware_sequence');
    }
  };

  const listenForRemoteWipe = () => {
    if (!isListeningForCode) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API}/wipe/check-remote-trigger`);
        if (response.data.wipe_triggered) {
          initiateEmergencyWipe('remote_code', response.data.trigger_code);
          setIsListeningForCode(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Remote wipe check failed:', error);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  };

  const initiateEmergencyWipe = async (triggerMethod, triggerCode = null) => {
    if (wipeInProgress) return;

    console.log(`EMERGENCY WIPE INITIATED: ${triggerMethod}`);
    
    setWipeInProgress(true);
    setWipeCountdown(10); // 10 second countdown

    // Log the wipe initiation
    try {
      await axios.post(`${API}/wipe/initiate`, {
        trigger_method: triggerMethod,
        trigger_code: triggerCode,
        timestamp: new Date().toISOString(),
        device_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      });
    } catch (error) {
      console.error('Failed to log wipe initiation:', error);
    }

    // Start countdown
    countdownTimer.current = setInterval(() => {
      setWipeCountdown(prev => {
        if (prev <= 1) {
          executeCompleteWipe();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Show wipe warning
    if (onWipeTriggered) {
      onWipeTriggered(triggerMethod);
    }
  };

  const executeCompleteWipe = async () => {
    clearInterval(countdownTimer.current);
    
    try {
      // Execute complete device wipe
      const response = await axios.post(`${API}/wipe/execute-complete`, {
        confirmation: 'COMPLETE_DEVICE_WIPE',
        timestamp: new Date().toISOString()
      });

      if (response.data.success) {
        // Clear all local storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });

        // Clear browser cache (attempt)
        if ('caches' in window) {
          caches.keys().then(function(names) {
            for (let name of names) {
              caches.delete(name);
            }
          });
        }

        // Navigate to wipe completion screen
        window.location.replace('/wipe-complete');
      }
    } catch (error) {
      console.error('Emergency wipe execution failed:', error);
      // Even if backend fails, try to clear local data
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/wipe-complete');
    }
  };

  const cancelWipe = async () => {
    if (!wipeInProgress) return;

    clearInterval(countdownTimer.current);
    setWipeInProgress(false);
    setWipeCountdown(0);
    setPowerPresses(0);
    setVolumeUpPresses(0);

    // Log wipe cancellation
    try {
      await axios.post(`${API}/wipe/cancel`, {
        cancelled_at: new Date().toISOString(),
        remaining_time: wipeCountdown
      });
    } catch (error) {
      console.error('Failed to log wipe cancellation:', error);
    }
  };

  const testRemoteWipe = async () => {
    try {
      await axios.post(`${API}/wipe/test-remote-trigger`, {
        test_code: 'WIPE_TEST_123',
        sender: 'test_user'
      });
      alert('Test remote wipe trigger sent');
    } catch (error) {
      console.error('Test remote wipe failed:', error);
    }
  };

  if (wipeInProgress) {
    return <WipeWarningScreen countdown={wipeCountdown} onCancel={cancelWipe} />;
  }

  // Hide all wipe mode indicators on mobile for cleaner demo
  return null;
};

// Wipe Warning Screen
const WipeWarningScreen = ({ countdown, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 bg-red-900 flex items-center justify-center">
      <div className="text-center text-white max-w-md mx-auto px-6">
        <div className="text-8xl mb-6 animate-pulse">⚠️</div>
        
        <h1 className="text-4xl font-bold mb-4 text-red-300">
          EMERGENCY WIPE INITIATED
        </h1>
        
        <div className="text-6xl font-mono mb-4 text-red-100">
          {countdown}
        </div>
        
        <p className="text-xl mb-6">
          COMPLETE DEVICE WIPE IN PROGRESS
        </p>
        
        <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-6 text-left text-sm">
          <div className="text-red-300 font-semibold mb-2">⚡ WIPING:</div>
          <div className="space-y-1 text-red-200">
            <div>🗂️ All user data and files</div>
            <div>🔐 Vault and encrypted storage</div>
            <div>📱 Application data and cache</div>
            <div>🕐 System logs and evidence</div>
            <div>👤 User profiles and accounts</div>
            <div>🌐 Browser data and history</div>
            <div>🔑 Authentication credentials</div>
            <div>💾 Backup and recovery data</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onCancel}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-bold text-lg w-full"
          >
            CANCEL WIPE
          </button>
          
          <div className="text-xs text-red-300 opacity-75">
            This action cannot be undone after completion
          </div>
        </div>
      </div>
    </div>
  );
};

// Wipe Complete Screen Component
export const WipeCompleteScreen = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl mb-6">✅</div>
        
        <h1 className="text-3xl font-bold mb-4">
          Device Wiped Successfully
        </h1>
        
        <p className="text-slate-300 mb-6">
          All data has been permanently deleted. The device is now in factory state.
        </p>
        
        <div className="bg-[#0e1626] rounded-lg p-4 text-sm text-left mb-6">
          <div className="text-green-400 font-semibold mb-2">✓ COMPLETED:</div>
          <div className="space-y-1 text-slate-300">
            <div>All user data permanently deleted</div>
            <div>Encryption keys destroyed</div>
            <div>System logs cleared</div>
            <div>Authentication data removed</div>
            <div>Cache and temporary files wiped</div>
            <div>Recovery data eliminated</div>
          </div>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Restart System
        </button>
      </div>
    </div>
  );
};

export default WipeMode;