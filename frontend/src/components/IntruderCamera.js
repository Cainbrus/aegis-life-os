// =============================================
// AEGIS INTRUDER CAMERA SYSTEM
// Captures photos when wrong person tries to unlock
// Uses real device camera API
// =============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSosActivate, playNotification } from '../services/SoundService';

// Hook to capture intruder photos silently
export const useIntruderCapture = () => {
  const [lastCapture, setLastCapture] = useState(null);
  const [captures, setCaptures] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  // Check camera permission
  const checkPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      setHasPermission(result.state === 'granted');
      return result.state === 'granted';
    } catch {
      // Permissions API not supported, try to access camera
      return true;
    }
  }, []);

  // Capture intruder photo silently
  const captureIntruder = useCallback(async (reason = 'wrong_pattern') => {
    if (isCapturing) return null;
    
    setIsCapturing(true);
    
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      await video.play();

      // Wait for video to stabilize
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create canvas and capture
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      
      // Mirror the image (front camera is mirrored)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);

      // Stop the camera
      stream.getTracks().forEach(track => track.stop());

      // Get image as data URL
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      // Get location if available
      let location = null;
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
      } catch {
        location = null;
      }

      // Create capture record
      const capture = {
        id: `intruder_${Date.now()}`,
        timestamp: new Date().toISOString(),
        image: imageData,
        reason,
        location,
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenSize: `${window.screen.width}x${window.screen.height}`
        }
      };

      setLastCapture(capture);
      setCaptures(prev => [...prev, capture]);
      setHasPermission(true);

      // Play alert sound (silent for actual intruder, but audible in demo)
      // In production, this would be silent
      console.log('🚨 Intruder photo captured:', capture.id);

      return capture;
    } catch (error) {
      console.log('Camera capture failed:', error.message);
      setHasPermission(false);
      
      // Return placeholder for demo
      const placeholderCapture = {
        id: `intruder_${Date.now()}`,
        timestamp: new Date().toISOString(),
        image: null,
        reason,
        error: error.message,
        placeholder: true
      };
      
      setLastCapture(placeholderCapture);
      setCaptures(prev => [...prev, placeholderCapture]);
      
      return placeholderCapture;
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  // Clear all captures
  const clearCaptures = useCallback(() => {
    setCaptures([]);
    setLastCapture(null);
  }, []);

  return {
    captureIntruder,
    lastCapture,
    captures,
    isCapturing,
    hasPermission,
    checkPermission,
    clearCaptures
  };
};

// Intruder Alert Screen (shows to owner after unlock)
export const IntruderAlertScreen = ({ captures, onDismiss, onViewAll }) => {
  const [showPhoto, setShowPhoto] = useState(false);

  useEffect(() => {
    playNotification('security');
  }, []);

  if (!captures || captures.length === 0) return null;

  const latestCapture = captures[captures.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-red-900/90 to-slate-900 rounded-3xl max-w-sm w-full border border-red-500/50 shadow-2xl shadow-red-500/30 overflow-hidden animate-pulse-once">
        {/* Header */}
        <div className="bg-red-600 p-4 flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🚨</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Intruder Detected!</h2>
            <p className="text-red-200 text-sm">Someone tried to access your phone</p>
          </div>
        </div>

        {/* Photo Preview */}
        <div className="p-4">
          {latestCapture.image ? (
            <div 
              className="relative rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setShowPhoto(true)}
            >
              <img 
                src={latestCapture.image} 
                alt="Intruder" 
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                <span className="text-white text-sm">Tap to enlarge</span>
              </div>
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                📸 CAPTURED
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl p-6 text-center">
              <span className="text-4xl mb-2 block">📷</span>
              <p className="text-slate-400 text-sm">Camera was blocked</p>
              <p className="text-slate-500 text-xs">Intruder may have covered the camera</p>
            </div>
          )}

          {/* Details */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Time:</span>
              <span className="text-white">{new Date(latestCapture.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Reason:</span>
              <span className="text-red-400">Wrong unlock pattern</span>
            </div>
            {latestCapture.location && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Location:</span>
                <span className="text-white">📍 Captured</span>
              </div>
            )}
            {captures.length > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total attempts:</span>
                <span className="text-red-400 font-bold">{captures.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 space-y-2">
          {captures.length > 1 && (
            <button
              onClick={onViewAll}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
            >
              View All {captures.length} Attempts
            </button>
          )}
          <button
            onClick={onDismiss}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:opacity-90 transition-all"
          >
            Dismiss & Secure
          </button>
        </div>
      </div>

      {/* Full Photo Modal */}
      {showPhoto && latestCapture.image && (
        <div 
          className="fixed inset-0 z-60 bg-black flex items-center justify-center p-4"
          onClick={() => setShowPhoto(false)}
        >
          <img 
            src={latestCapture.image} 
            alt="Intruder" 
            className="max-w-full max-h-full rounded-lg"
          />
          <button 
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setShowPhoto(false)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

// Silent Camera Capture Component (invisible, captures on mount)
export const SilentCameraCapture = ({ onCapture, reason = 'intruder' }) => {
  const videoRef = useRef(null);
  const [capturing, setCapturing] = useState(true);

  useEffect(() => {
    let stream = null;

    const capture = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          // Wait briefly then capture
          await new Promise(resolve => setTimeout(resolve, 500));

          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0);

          const imageData = canvas.toDataURL('image/jpeg', 0.8);

          if (onCapture) {
            onCapture({
              id: `capture_${Date.now()}`,
              timestamp: new Date().toISOString(),
              image: imageData,
              reason
            });
          }
        }
      } catch (error) {
        console.log('Silent capture failed:', error);
        if (onCapture) {
          onCapture({
            id: `capture_${Date.now()}`,
            timestamp: new Date().toISOString(),
            image: null,
            reason,
            error: error.message
          });
        }
      } finally {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setCapturing(false);
      }
    };

    capture();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onCapture, reason]);

  if (!capturing) return null;

  // Invisible video element for capture
  return (
    <video 
      ref={videoRef}
      style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
      playsInline
      muted
    />
  );
};

export default IntruderAlertScreen;
