import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Landing Page Component
const LandingPage = ({ onGetStarted }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBetaSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/api/beta/signup`, { email });
      setTimeout(onGetStarted, 2000);
    } catch (error) {
      console.error('Signup failed:', error);
      onGetStarted(); // Continue anyway for demo
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-6 py-16">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🛡️</div>
            <div className="text-2xl font-bold">Aegis</div>
          </div>
        </header>

        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl font-bold mb-8">
            Meet Your
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block">
              Digital Mate
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-12">
            Aegis isn't just an operating system—it's your <strong>Hierarchical Proactive Intelligence</strong> 
            that learns, protects, and anticipates your digital life.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg"
            >
              Experience Aegis Now
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-800 bg-opacity-50 rounded-xl p-8 border border-slate-700">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-2xl font-bold mb-4">Proactive Intelligence</h3>
            <p className="text-slate-300">
              Your AI workforce anticipates your needs and automates your digital life.
            </p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 rounded-xl p-8 border border-slate-700">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold mb-4">Unbreakable Security</h3>
            <p className="text-slate-300">
              Behavioral authentication and trap modes protect from threats and coercion.
            </p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 rounded-xl p-8 border border-slate-700">
            <div className="text-5xl mb-4">🎭</div>
            <h3 className="text-2xl font-bold mb-4">Perfect Deception</h3>
            <p className="text-slate-300">
              Intruders see fake data while Aegis collects evidence silently.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">Join the Digital Evolution</h2>
          <form onSubmit={handleBetaSignup} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email for early access"
                className="flex-1 px-6 py-4 rounded-lg text-black"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-900 text-white px-8 py-4 rounded-lg font-semibold"
              >
                {loading ? 'Joining...' : 'Start Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Pattern Authentication Component
const PatternAuth = ({ onAuthSuccess }) => {
  const [currentPattern, setCurrentPattern] = useState([]);
  const [authResult, setAuthResult] = useState(null);

  const patternGrid = [
    [1, 2, 3],
    [4, 5, 6], 
    [7, 8, 9]
  ];

  const handleDotClick = (dotNumber) => {
    if (!currentPattern.includes(dotNumber)) {
      setCurrentPattern(prev => [...prev, dotNumber]);
    }
  };

  const handleSubmit = async () => {
    if (currentPattern.length < 4) {
      setAuthResult({ success: false, message: "Pattern must connect at least 4 dots" });
      return;
    }

    try {
      const patternString = currentPattern.join("-");
      const response = await axios.post(`${API}/api/auth/pattern`, {
        pattern: patternString,
        pattern_type: "auto_detect"
      });

      setAuthResult(response.data);
      if (response.data.success) {
        onAuthSuccess(response.data);
      }
    } catch (error) {
      setAuthResult({ success: false, message: "Authentication failed" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-3xl font-bold mb-2">Aegis Authentication</h1>
          <p className="text-slate-400">Draw your pattern to unlock</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="text-center mb-6">
            <div className="text-lg font-medium">
              {currentPattern.length > 0 ? `Connected: ${currentPattern.length} dots` : "Draw your pattern"}
            </div>
            {currentPattern.length > 0 && (
              <div className="text-sm text-slate-400 mt-2">
                Pattern: {currentPattern.join(" → ")}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-6">
            {patternGrid.flat().map((dotNumber) => (
              <button
                key={dotNumber}
                onClick={() => handleDotClick(dotNumber)}
                className={`
                  w-16 h-16 rounded-full border-2 flex items-center justify-center
                  ${currentPattern.includes(dotNumber)
                    ? 'bg-blue-500 border-blue-400 text-white'
                    : 'bg-slate-700 border-slate-500 text-slate-300 hover:border-slate-400'
                  }
                `}
              >
                <span className="font-bold">{dotNumber}</span>
              </button>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setCurrentPattern([])}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded"
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={currentPattern.length < 4}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded"
            >
              Submit
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
        </div>

        <div className="text-center mt-4 text-xs text-slate-500">
          Default patterns: 1-2-3-6-9 (normal), 1-5-9-8-7 (owner), 2-5-8 (emergency)
        </div>
      </div>
    </div>
  );
};

// Main App Component
const AegisApp = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  const handleGetStarted = () => setShowLanding(false);
  
  const handleAuthSuccess = (authResult) => {
    setAuthStatus(authResult);
    setIsAuthenticated(true);
  };

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (!isAuthenticated) {
    return <PatternAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">
              {authStatus?.mode === 'doge_mode' ? "My Phone" : "Aegis Life OS"}
            </h1>
            <p className="text-slate-400">
              {authStatus?.mode === 'owner_mode' ? "Your Digital Mate - Full Access" : "Standard Phone Access"}
            </p>
          </div>
          <div className="text-sm">
            Mode: {authStatus?.mode || 'unknown'}
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { name: "Messages", icon: "💬", color: "bg-blue-600" },
            { name: "Photos", icon: "📸", color: "bg-green-600" },
            { name: "Calendar", icon: "📅", color: "bg-red-600" },
            { name: "Settings", icon: "⚙️", color: "bg-gray-600" }
          ].map((app, idx) => (
            <button
              key={idx}
              className={`${app.color} rounded-lg p-4 text-center hover:opacity-90`}
            >
              <div className="text-3xl mb-2">{app.icon}</div>
              <div className="text-sm font-medium">{app.name}</div>
            </button>
          ))}
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🛡️ System Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700 rounded p-3">
              <div className="text-slate-400 text-sm">Security State</div>
              <div className="text-white font-medium">{authStatus?.security_state}</div>
            </div>
            <div className="bg-slate-700 rounded p-3">
              <div className="text-slate-400 text-sm">Mode</div>
              <div className="text-white font-medium">{authStatus?.mode}</div>
            </div>
          </div>
          
          {authStatus?.mode === 'owner_mode' && (
            <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded">
              <div className="text-green-300 text-sm">
                🤖 <strong>Digital Mate Active:</strong> Full Aegis intelligence available
              </div>
            </div>
          )}
          
          {authStatus?.trap_mode && (
            <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded">
              <div className="text-yellow-300 text-sm">
                🎭 <strong>Doge Mode:</strong> Showing decoy data for protection
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  return <AegisApp />;
}

export default App;