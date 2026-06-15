// =============================================
// AEGIS PROTECTION SUMMARY
// "While You Were Away" screen showing what
// Aegis protected while owner was gone
// =============================================

import React, { useState, useEffect } from 'react';
import { playSuccess, playNotification } from '../services/SoundService';

// Protection Summary Modal - Shows when owner returns
export const ProtectionSummaryModal = ({ summary, onDismiss, onViewDetails }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    playNotification('security');
  }, []);

  if (!summary || (!summary.totalCleanups && !summary.intruderAttempts)) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onDismiss}
      ></div>

      {/* Modal */}
      <div className={`relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-sm w-full border border-blue-500/30 shadow-2xl shadow-blue-500/20 transform transition-all duration-500 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Shield Icon Animation */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-4xl">🛡️</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold animate-bounce">
              ✓
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-2">
          While You Were Away...
        </h2>
        <p className="text-blue-400 text-center text-sm mb-6">
          Aegis kept your phone protected
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {summary.totalCleanups > 0 && (
            <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700">
              <p className="text-2xl font-bold text-green-400">{summary.totalCleanups}</p>
              <p className="text-xs text-slate-400">Items Secured</p>
            </div>
          )}
          {summary.intruderAttempts > 0 && (
            <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-red-500/30">
              <p className="text-2xl font-bold text-red-400">{summary.intruderAttempts}</p>
              <p className="text-xs text-slate-400">Intruder Attempts</p>
            </div>
          )}
        </div>

        {/* Recent Actions */}
        {summary.cleanupItems && summary.cleanupItems.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Protection Actions:</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {summary.cleanupItems.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-sm bg-slate-800/50 rounded-lg p-2">
                  <span>{item.icon}</span>
                  <span className="text-slate-300 flex-1">{item.description}</span>
                  <span className="text-green-400">✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intruder Alert */}
        {summary.intruderAttempts > 0 && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📸</span>
              <div>
                <p className="text-red-400 font-medium text-sm">Intruder Photo Captured</p>
                <p className="text-slate-400 text-xs">Someone tried to access your phone</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {summary.intruderAttempts > 0 && (
            <button
              onClick={() => { playSuccess(); onViewDetails && onViewDetails('intruder'); }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors"
            >
              View Intruder Photos
            </button>
          )}
          <button
            onClick={() => { playSuccess(); onDismiss(); }}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-all"
          >
            Got It, Thanks Aegis!
          </button>
        </div>
      </div>
    </div>
  );
};

// Intruder Photos Viewer
export const IntruderPhotosViewer = ({ photos, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-red-900/50 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold">🚨 Intruder Detection</h2>
          <p className="text-red-300 text-sm">{photos.length} attempt(s) captured</p>
        </div>
        <button
          onClick={onClose}
          className="text-white text-2xl hover:text-red-300"
        >
          ✕
        </button>
      </div>

      {/* Photo Display */}
      <div className="flex-1 flex items-center justify-center p-4">
        {currentPhoto.image ? (
          <img 
            src={currentPhoto.image} 
            alt="Intruder" 
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-slate-400">Camera was blocked</p>
            <p className="text-slate-500 text-sm">Intruder covered the camera</p>
          </div>
        )}
      </div>

      {/* Photo Info */}
      <div className="bg-[#0e1626] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">
            {new Date(currentPhoto.timestamp).toLocaleString()}
          </span>
          <span className="text-red-400 text-sm">
            Photo {currentIndex + 1} of {photos.length}
          </span>
        </div>
        
        {/* Navigation */}
        {photos.length > 1 && (
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex-1 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentIndex(Math.min(photos.length - 1, currentIndex + 1))}
              disabled={currentIndex === photos.length - 1}
              className="flex-1 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button className="py-2 bg-red-600 text-white rounded-lg text-sm font-medium">
            🚔 Report to Police
          </button>
          <button className="py-2 bg-slate-700 text-white rounded-lg text-sm font-medium">
            📤 Share Evidence
          </button>
        </div>
      </div>
    </div>
  );
};

// Mini Protection Badge (shows in corner)
export const ProtectionBadge = ({ isProtected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed top-4 right-4 z-40 p-2 rounded-full shadow-lg transition-all ${
        isProtected 
          ? 'bg-green-500/20 border border-green-500/50' 
          : 'bg-slate-800/80 border border-slate-700'
      }`}
    >
      <div className="relative">
        <span className="text-xl">{isProtected ? '🛡️' : '🔓'}</span>
        {isProtected && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        )}
      </div>
    </button>
  );
};

// Lock Screen with Protection Status
export const ProtectedLockScreen = ({ onUnlock, protectionSummary }) => {
  const [showSummary, setShowSummary] = useState(false);
  
  useEffect(() => {
    // Show summary after a short delay if there's protection data
    if (protectionSummary && (protectionSummary.totalCleanups > 0 || protectionSummary.intruderAttempts > 0)) {
      setTimeout(() => setShowSummary(true), 500);
    }
  }, [protectionSummary]);

  return (
    <>
      {/* Lock screen content would go here */}
      
      {/* Protection Summary Modal */}
      {showSummary && (
        <ProtectionSummaryModal
          summary={protectionSummary}
          onDismiss={() => setShowSummary(false)}
        />
      )}
    </>
  );
};

export default ProtectionSummaryModal;
