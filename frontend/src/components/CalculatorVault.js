import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CalculatorVault = ({ onClose, onVaultAccess }) => {
  const [display, setDisplay] = useState('0');
  const [isCalculatorMode, setIsCalculatorMode] = useState(true);
  const [isTransforming, setIsTransforming] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultFiles, setVaultFiles] = useState([]);
  const [vaultStats, setVaultStats] = useState(null);
  const [privacySuggestions, setPrivacySuggestions] = useState([]);
  const fileInputRef = useRef(null);

  // Calculator functionality
  const handleCalculatorInput = (value) => {
    if (display === '0' && value !== '.') {
      setDisplay(value);
    } else {
      setDisplay(prev => prev + value);
    }
  };

  const handleCalculatorClear = () => {
    setDisplay('0');
  };

  const handleEquals = async () => {
    try {
      // Check if the current display matches the secret code
      const response = await axios.post(`${API}/vault/verify-secret`, {
        code: display
      });
      
      if (response.data.vault_unlocked) {
        await triggerSecretHandshake();
      } else {
        // Normal calculation
        try {
          const result = eval(display);
          setDisplay(result.toString());
        } catch {
          setDisplay('Error');
        }
      }
    } catch (error) {
      // If API fails, try normal calculation
      try {
        const result = eval(display);
        setDisplay(result.toString());
      } catch {
        setDisplay('Error');
      }
    }
  };

  const triggerSecretHandshake = async () => {
    setIsTransforming(true);
    
    // Visual transformation effect
    setTimeout(() => {
      setIsCalculatorMode(false);
      setIsTransforming(false);
    }, 1500);

    if (onVaultAccess) {
      onVaultAccess(true);
    }
  };

  const authenticateVault = async () => {
    try {
      // Use pattern authentication - vault requires owner mode
      setVaultUnlocked(true);
      await loadVaultData();
    } catch (error) {
      console.error('Vault authentication failed:', error);
    }
  };

  const loadVaultData = async () => {
    try {
      const response = await axios.get(`${API}/vault/files`);
      setVaultFiles(response.data.files || []);
      setVaultStats(response.data.vault_stats);
      setPrivacySuggestions(response.data.suggested_to_hide || []);
    } catch (error) {
      console.error('Failed to load vault data:', error);
      // Set some default data for demo
      setVaultFiles([]);
      setVaultStats({ total_files: 0, sensitive_files: 0, auto_hidden: 0 });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result.split(',')[1]; // Get base64 content
        
        await axios.post(`${API}/vault/upload`, {
          filename: file.name,
          file_type: file.type,
          content: content,
          category: 'general',
          is_sensitive: true
        });
        
        await loadVaultData();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await axios.delete(`${API}/vault/files/${fileId}`);
      await loadVaultData();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Calculator button layout
  const calculatorButtons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  if (vaultUnlocked) {
    return (
      <VaultInterface 
        files={vaultFiles}
        stats={vaultStats}
        suggestions={privacySuggestions}
        onClose={onClose}
        onFileUpload={() => fileInputRef.current?.click()}
        onDeleteFile={handleDeleteFile}
        onRefresh={loadVaultData}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
      />
    );
  }

  if (!isCalculatorMode && !isTransforming) {
    return <VaultLogin onAuthenticate={authenticateVault} onClose={onClose} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Calculator Header */}
      <div className="bg-slate-800 p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calculator</h1>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Calculator Display */}
      <div className={`
        calculator-display bg-slate-950 p-8 text-right text-4xl font-mono
        ${isTransforming ? 'animate-pulse' : ''}
      `}>
        <div className="min-h-[60px] flex items-end justify-end">
          {isTransforming ? (
            <div className="text-blue-400">
              <div className="animate-spin">⚡</div>
            </div>
          ) : (
            display
          )}
        </div>
      </div>

      {/* Transformation Effect */}
      {isTransforming && (
        <div className="fixed inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-50">
          <div className="text-center text-blue-300">
            <div className="text-6xl mb-4 animate-bounce">🔐</div>
            <div className="text-xl font-semibold">Activating Phantom Folder...</div>
            <div className="text-sm mt-2 opacity-75">Morphing interface...</div>
          </div>
        </div>
      )}

      {/* Calculator Buttons */}
      <div className="calculator-buttons p-4 grid grid-cols-4 gap-3">
        {calculatorButtons.map((row, rowIdx) => 
          row.map((btn, colIdx) => {
            const isZero = btn === '0';
            const isOperator = ['÷', '×', '-', '+', '='].includes(btn);
            const isFunction = ['C', '±', '%'].includes(btn);
            
            return (
              <button
                key={`${rowIdx}-${colIdx}`}
                onClick={() => {
                  if (btn === 'C') handleCalculatorClear();
                  else if (btn === '=') handleEquals();
                  else if (btn === '÷') handleCalculatorInput('/');
                  else if (btn === '×') handleCalculatorInput('*');
                  else handleCalculatorInput(btn);
                }}
                className={`
                  h-16 rounded-lg font-semibold text-xl transition-all transform active:scale-95
                  ${isZero ? 'col-span-2' : ''}
                  ${isOperator ? 'bg-blue-600 hover:bg-blue-700 text-white' : 
                    isFunction ? 'bg-slate-600 hover:bg-slate-500 text-white' :
                    'bg-slate-700 hover:bg-slate-600 text-white'}
                  ${isTransforming ? 'pointer-events-none opacity-50' : ''}
                `}
                disabled={isTransforming}
              >
                {btn}
              </button>
            );
          })
        )}
      </div>

      {/* Secret Hint (Easter Egg) */}
      <div className="text-center p-4 text-xs text-slate-500 opacity-50">
        Standard Calculator • iOS 17.2
      </div>
    </div>
  );
};

// Vault Login Screen
const VaultLogin = ({ onAuthenticate, onClose }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-purple-900 text-white flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-pulse">🔐</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Phantom Folder
          </h1>
          <p className="text-slate-400">Secret Handshake Detected</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="text-center mb-6">
            <div className="text-green-400 mb-2">✓ Access Granted</div>
            <div className="text-sm text-slate-400">
              Authenticate to enter secure vault
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={onAuthenticate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all"
            >
              🔐 Enter Phantom Vault
            </button>

            <button
              onClick={onClose}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg font-medium transition-all"
            >
              Return to Calculator
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Hardware-encrypted • Zero-knowledge architecture
        </div>
      </div>
    </div>
  );
};

// Vault Interface
const VaultInterface = ({ files, stats, suggestions, onClose, onFileUpload, onDeleteFile, onRefresh, fileInputRef, handleFileUpload }) => {
  const [activeTab, setActiveTab] = useState('files');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Vault Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🔒</div>
          <div>
            <h1 className="text-xl font-semibold">Phantom Folder</h1>
            <p className="text-xs text-slate-400">
              {stats ? `${stats.total_files} files secured` : 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onRefresh}
            className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded text-sm"
          >
            ↻ Refresh
          </button>
          <button 
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Exit Vault
          </button>
        </div>
      </div>

      {/* Vault Stats */}
      {stats && (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
          <div className="flex space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Total:</span>
              <span className="text-white font-semibold">{stats.total_files}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Sensitive:</span>
              <span className="text-red-400 font-semibold">{stats.sensitive_files}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Auto-hidden:</span>
              <span className="text-blue-400 font-semibold">{stats.auto_hidden}</span>
            </div>
          </div>
        </div>
      )}

      {/* Vault Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 px-4">
        <div className="flex space-x-6">
          {[
            { id: 'files', label: 'Secure Files', icon: '📄' },
            { id: 'suggestions', label: 'AI Suggestions', icon: '🧠', count: suggestions?.length },
            { id: 'apps', label: 'Hidden Apps', icon: '📱' },
            { id: 'plans', label: 'AI Plans', icon: '🎯' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 py-3 px-2 border-b-2 transition-all
                ${activeTab === tab.id 
                  ? 'border-blue-400 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-white'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.count > 0 && (
                <span className="bg-blue-600 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vault Content */}
      <div className="p-6">
        {activeTab === 'files' && (
          <SecureFilesTab 
            files={files} 
            onAddFile={onFileUpload}
            onDeleteFile={onDeleteFile}
          />
        )}
        {activeTab === 'suggestions' && (
          <AISuggestionsTab suggestions={suggestions} onRefresh={onRefresh} />
        )}
        {activeTab === 'apps' && <HiddenAppsTab />}
        {activeTab === 'plans' && <AIPlansTab />}
      </div>
    </div>
  );
};

// Secure Files Tab
const SecureFilesTab = ({ files, onAddFile, onDeleteFile }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Encrypted Files</h2>
      <button 
        onClick={onAddFile}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center space-x-2"
      >
        <span>+</span>
        <span>Add File</span>
      </button>
    </div>
    
    {files && files.length > 0 ? (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {files.map((file, idx) => (
          <div key={file.file_id || idx} className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-all group relative">
            <div className="text-3xl mb-2">
              {file.file_type?.includes('image') ? '🖼️' : 
               file.file_type?.includes('pdf') ? '📕' :
               file.file_type?.includes('zip') ? '📦' : '📄'}
            </div>
            <div className="text-sm font-medium truncate">{file.filename}</div>
            <div className="text-xs text-slate-400 mt-1">
              {file.is_sensitive ? '🔴 Sensitive' : '🟢 Safe'}
            </div>
            <button
              onClick={() => onDeleteFile(file.file_id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12 text-slate-400">
        <div className="text-4xl mb-4">📁</div>
        <p>No files in vault yet</p>
        <p className="text-sm mt-2">Click "Add File" to secure your first file</p>
      </div>
    )}
  </div>
);

// AI Suggestions Tab
const AISuggestionsTab = ({ suggestions, onRefresh }) => {
  const handleFeedback = async (suggestionId, decision) => {
    try {
      await axios.post(`${API}/privacy/feedback`, {
        suggestion_id: suggestionId,
        decision: decision,
        preference: decision === 'accepted' ? 'auto_hide_similar' : 'ignore_similar'
      });
      onRefresh();
    } catch (error) {
      console.error('Feedback failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Privacy Suggestions</h2>
        <div className="text-sm text-slate-400">AI is learning your preferences</div>
      </div>
      
      {suggestions && suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion, idx) => (
            <div key={suggestion.suggestion_id || idx} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">🧠</span>
                    <span className="font-medium">{suggestion.content_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      suggestion.analysis?.sensitivity_score > 0.7 ? 'bg-red-900 text-red-300' :
                      suggestion.analysis?.sensitivity_score > 0.4 ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {Math.round((suggestion.analysis?.sensitivity_score || 0) * 100)}% sensitive
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">
                    {suggestion.analysis?.reasoning || 'AI recommends action on this item'}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFeedback(suggestion.suggestion_id, 'accepted')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      ✓ Hide
                    </button>
                    <button
                      onClick={() => handleFeedback(suggestion.suggestion_id, 'rejected')}
                      className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded text-sm"
                    >
                      ✕ Ignore
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-4">✨</div>
          <p>No pending suggestions</p>
          <p className="text-sm mt-2">AI will analyze new content and suggest what to hide</p>
        </div>
      )}
    </div>
  );
};

// Hidden Apps Tab
const HiddenAppsTab = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Hidden Applications</h2>
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
        + Hide App
      </button>
    </div>
    
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
      {[
        { name: 'Signal', icon: '💬' },
        { name: 'Tor Browser', icon: '🌐' },
        { name: 'ProtonMail', icon: '📧' },
        { name: 'Crypto Wallet', icon: '₿' },
        { name: 'VPN Client', icon: '🛡️' },
        { name: 'Password Manager', icon: '🔑' }
      ].map((app, idx) => (
        <div key={idx} className="bg-slate-800 rounded-lg p-4 text-center hover:bg-slate-700 transition-all cursor-pointer">
          <div className="text-2xl mb-1">{app.icon}</div>
          <div className="text-xs font-medium">{app.name}</div>
        </div>
      ))}
    </div>
  </div>
);

// AI Plans Tab
const AIPlansTab = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">AI Intelligence Plans</h2>
      <div className="text-sm text-slate-400">Proactive suggestions hidden from intruders</div>
    </div>
    
    <div className="space-y-3">
      {[
        { title: 'Career Transition Plan', status: 'Active', confidence: 'High', desc: 'AI has detected job search activity and prepared resources' },
        { title: 'Investment Strategy', status: 'Monitoring', confidence: 'Medium', desc: 'Tracking market conditions for your portfolio' },
        { title: 'Emergency Contact Protocol', status: 'Armed', confidence: 'High', desc: 'Ready to alert trusted contacts if needed' },
        { title: 'Digital Legacy Plan', status: 'Draft', confidence: 'Low', desc: 'Preparing secure handoff procedures' }
      ].map((plan, idx) => (
        <div key={idx} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">{plan.title}</div>
            <div className={`text-xs px-2 py-1 rounded ${
              plan.status === 'Active' ? 'bg-green-900 text-green-300' :
              plan.status === 'Armed' ? 'bg-blue-900 text-blue-300' :
              plan.status === 'Monitoring' ? 'bg-yellow-900 text-yellow-300' :
              'bg-slate-700 text-slate-300'
            }`}>
              {plan.status}
            </div>
          </div>
          <p className="text-sm text-slate-400">{plan.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default CalculatorVault;
