import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const CalculatorVault = ({ onClose, onVaultAccess }) => {
  const [display, setDisplay] = useState('0');
  const [isCalculatorMode, setIsCalculatorMode] = useState(true);
  const [isTransforming, setIsTransforming] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [secretCode, setSecretCode] = useState('8675309'); // Default secret handshake
  const [vaultData, setVaultData] = useState(null);

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
      if (display === secretCode) {
        await triggerSecretHandshake();
      } else {
        // Normal calculation
        const result = eval(display);
        setDisplay(result.toString());
      }
    } catch (error) {
      setDisplay('Error');
    }
  };

  const triggerSecretHandshake = async () => {
    setIsTransforming(true);
    
    // Visual transformation effect
    setTimeout(() => {
      setIsCalculatorMode(false);
      setIsTransforming(false);
    }, 1500);

    // Log the vault access attempt
    try {
      await axios.post(`${API}/vault/access-attempt`, {
        action: 'secret_handshake_triggered',
        code_used: secretCode,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log vault access:', error);
    }
  };

  const authenticateVault = async (authMethod = 'pattern') => {
    try {
      const response = await axios.post(`${API}/vault/authenticate`, {
        method: authMethod,
        timestamp: new Date().toISOString()
      });

      if (response.data.success) {
        setVaultUnlocked(true);
        loadVaultData();
        onVaultAccess(true);
      }
    } catch (error) {
      console.error('Vault authentication failed:', error);
    }
  };

  const loadVaultData = async () => {
    try {
      const response = await axios.get(`${API}/vault/data`);
      setVaultData(response.data);
    } catch (error) {
      console.error('Failed to load vault data:', error);
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

  if (vaultUnlocked && vaultData) {
    return <VaultInterface vaultData={vaultData} onClose={onClose} />;
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
                  else if (!isOperator && !isFunction) handleCalculatorInput(btn);
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
              onClick={() => onAuthenticate('biometric')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all"
            >
              🔐 Authenticate with Face ID
            </button>

            <button
              onClick={() => onAuthenticate('pattern')}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 px-4 rounded-lg font-medium transition-all"
            >
              🔢 Use Pattern Lock
            </button>

            <button
              onClick={onClose}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-all"
            >
              Cancel
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
const VaultInterface = ({ vaultData, onClose }) => {
  const [activeTab, setActiveTab] = useState('files');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Vault Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🔒</div>
          <div>
            <h1 className="text-xl font-semibold">Phantom Folder</h1>
            <p className="text-xs text-slate-400">Secure Vault Active</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
        >
          Exit Vault
        </button>
      </div>

      {/* Vault Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 px-4">
        <div className="flex space-x-6">
          {[
            { id: 'files', label: 'Secure Files', icon: '📄' },
            { id: 'apps', label: 'Hidden Apps', icon: '📱' },
            { id: 'plans', label: 'Hidden Plans', icon: '🧠' },
            { id: 'quarantine', label: 'Quarantine Bin', icon: '🛡️' }
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
            </button>
          ))}
        </div>
      </div>

      {/* Vault Content */}
      <div className="p-6">
        {activeTab === 'files' && <SecureFilesTab />}
        {activeTab === 'apps' && <HiddenAppsTab />}
        {activeTab === 'plans' && <HiddenPlansTab />}
        {activeTab === 'quarantine' && <QuarantineBinTab />}
      </div>
    </div>
  );
};

// Individual Vault Tabs
const SecureFilesTab = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Encrypted Files</h2>
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
        + Add File
      </button>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {['passport_scan.pdf', 'private_keys.txt', 'family_photos_backup.zip', 'medical_records.pdf'].map((file, idx) => (
        <div key={idx} className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-all cursor-pointer">
          <div className="text-3xl mb-2">📄</div>
          <div className="text-sm font-medium truncate">{file}</div>
          <div className="text-xs text-slate-400 mt-1">Encrypted</div>
        </div>
      ))}
    </div>
  </div>
);

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

const HiddenPlansTab = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">AI Hidden Plans</h2>
      <div className="text-sm text-slate-400">Proactive Intelligence Cache</div>
    </div>
    
    <div className="space-y-3">
      {[
        { title: 'Career Transition Plan', status: 'Active', confidence: 'High' },
        { title: 'Investment Strategy Backup', status: 'Monitoring', confidence: 'Medium' },
        { title: 'Emergency Contact Protocol', status: 'Standby', confidence: 'High' },
        { title: 'Digital Legacy Plan', status: 'Draft', confidence: 'Low' }
      ].map((plan, idx) => (
        <div key={idx} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">{plan.title}</div>
            <div className={`text-xs px-2 py-1 rounded ${
              plan.status === 'Active' ? 'bg-green-900 text-green-300' :
              plan.status === 'Monitoring' ? 'bg-yellow-900 text-yellow-300' :
              'bg-slate-700 text-slate-300'
            }`}>
              {plan.status}
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Confidence: {plan.confidence} • Last updated: 2 days ago
          </div>
        </div>
      ))}
    </div>
  </div>
);

const QuarantineBinTab = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Quarantine Bin</h2>
      <div className="text-sm text-slate-400">AI-flagged content</div>
    </div>
    
    <div className="space-y-3">
      {[
        { type: 'Suspicious Email', item: 'phishing@fake-bank.com', risk: 'High', date: '2 hours ago' },
        { type: 'Malicious Link', item: 'malware-site.com/download', risk: 'Critical', date: '1 day ago' },
        { type: 'Tracking Pixel', item: 'ad-tracker.jpg', risk: 'Medium', date: '3 days ago' }
      ].map((item, idx) => (
        <div key={idx} className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="text-red-400">⚠️</div>
              <div className="font-medium">{item.type}</div>
            </div>
            <div className={`text-xs px-2 py-1 rounded ${
              item.risk === 'Critical' ? 'bg-red-800 text-red-200' :
              item.risk === 'High' ? 'bg-orange-800 text-orange-200' :
              'bg-yellow-800 text-yellow-200'
            }`}>
              {item.risk} Risk
            </div>
          </div>
          <div className="text-sm text-slate-300 mb-1">{item.item}</div>
          <div className="text-xs text-slate-400">{item.date}</div>
        </div>
      ))}
    </div>
  </div>
);

export default CalculatorVault;