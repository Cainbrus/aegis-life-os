import React, { useState } from 'react';
import axios from 'axios';
import AegisLogo, { AegisLogoCompact } from './AegisLogo';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Hero background image
const HERO_IMAGE = "https://images.unsplash.com/photo-1682159672286-40790338349b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxkaWdpdGFsJTIwaGFuZHNoYWtlJTIwaHVtYW4lMjByb2JvdHxlbnwwfHx8fDE3NjYyMDEzOTh8MA&ixlib=rb-4.1.0&q=85";

const LandingPage = ({ onGetStarted }) => {
  const [email, setEmail] = useState('');
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBetaSignup = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/beta/signup`, {
        email,
        timestamp: new Date().toISOString(),
        source: 'landing_page'
      });
      
      setIsSignedUp(true);
      setTimeout(() => {
        onGetStarted();
      }, 3000);
    } catch (error) {
      console.error('Beta signup failed:', error);
      // Still proceed for demo
      setIsSignedUp(true);
      setTimeout(() => {
        onGetStarted();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  if (isSignedUp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AegisLogo size={150} />
          <h1 className="text-3xl font-bold mb-4 mt-6">Welcome to Aegis!</h1>
          <p className="text-slate-300 mb-6">
            Your Digital Mate is being initialized...
          </p>
          <div className="animate-spin text-4xl mb-4">⚡</div>
          <div className="text-sm text-slate-400">
            Launching your personalized AI experience
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      {/* Neural Network Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="absolute top-32 left-32 w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-20 right-20 w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-sm">
          <AegisLogoCompact size={45} />
          <div className="text-sm text-slate-400 font-mono">
            {new Date().toLocaleTimeString()} | AI STATUS: ACTIVE
          </div>
        </header>

        <div className="container mx-auto px-6 py-16 max-w-6xl">
          {/* Hero Section with AI Animation */}
          <div className="text-center mb-20">
            <h1 className="text-6xl md:text-8xl font-bold mb-8 font-mono">
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                HIERARCHICAL
              </span>
              <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent" style={{animationDelay: '0.5s'}}>
                PROACTIVE
              </span>
              <span className="block bg-gradient-to-r from-cyan-400 via-green-500 to-blue-500 bg-clip-text text-transparent" style={{animationDelay: '1s'}}>
                INTELLIGENCE
              </span>
            </h1>
            
            <div className="relative">
              <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-12 leading-relaxed">
                <span className="text-cyan-400 font-mono">[SYSTEM INITIALIZED]</span> Your Digital Mate - 
                An advanced AI workforce that learns, protects, and evolves with your digital life.
              </p>
              
              {/* Scanning Line Effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan"></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={onGetStarted}
                className="ai-button bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 border border-cyan-400/50 shadow-lg shadow-cyan-500/25"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>INITIALIZE AEGIS</span>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </span>
              </button>
            </div>
          </div>

          {/* AI Technology Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="ai-card bg-slate-800/50 rounded-xl p-8 border border-cyan-500/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-5xl mb-4 text-cyan-400">🧠</div>
                <h3 className="text-2xl font-bold mb-4 text-cyan-300 font-mono">L1-L4 AI WORKFORCE</h3>
                <p className="text-slate-300 leading-relaxed">
                  Hierarchical agents: <span className="text-cyan-400">Owner</span> → 
                  <span className="text-blue-400"> Manager</span> → 
                  <span className="text-purple-400"> Workers</span> → 
                  <span className="text-pink-400"> Specialists</span>
                </p>
                <div className="mt-4 flex items-center text-sm text-cyan-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  NEURAL NETWORK ACTIVE
                </div>
              </div>
            </div>

            <div className="ai-card bg-slate-800/50 rounded-xl p-8 border border-purple-500/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-5xl mb-4 text-purple-400">🔒</div>
                <h3 className="text-2xl font-bold mb-4 text-purple-300 font-mono">QUANTUM SECURITY</h3>
                <p className="text-slate-300 leading-relaxed">
                  Multi-layer defense: Behavioral auth + Pattern locks + Emergency protocols + Perfect deception modes.
                </p>
                <div className="mt-4 flex items-center text-sm text-purple-400">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2"></div>
                  THREAT DETECTION ONLINE
                </div>
              </div>
            </div>

            <div className="ai-card bg-slate-800/50 rounded-xl p-8 border border-pink-500/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-5xl mb-4 text-pink-400">🎭</div>
                <h3 className="text-2xl font-bold mb-4 text-pink-300 font-mono">ADAPTIVE DECEPTION</h3>
                <p className="text-slate-300 leading-relaxed">
                  Intruders experience convincing fake reality while AI collects evidence and protects real data.
                </p>
                <div className="mt-4 flex items-center text-sm text-pink-400">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></div>
                  TRAP SYSTEMS ARMED
                </div>
              </div>
            </div>
          </div>

          {/* AI Architecture Visualization */}
          <div className="bg-slate-800/30 border border-cyan-500/20 rounded-xl p-8 mb-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5"></div>
            <h2 className="text-4xl font-bold mb-12 text-center font-mono">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                AI ARCHITECTURE MATRIX
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              <div className="text-center p-6 border border-cyan-500/30 rounded-lg bg-slate-900/50">
                <div className="text-4xl mb-4 text-cyan-400">👑</div>
                <h4 className="text-xl font-semibold mb-3 text-cyan-300 font-mono">L1 OWNER</h4>
                <p className="text-sm text-slate-400">Constitutional oversight & system governance</p>
                <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-cyan-400 h-2 rounded-full w-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="text-center p-6 border border-blue-500/30 rounded-lg bg-slate-900/50">
                <div className="text-4xl mb-4 text-blue-400">🎯</div>
                <h4 className="text-xl font-semibold mb-3 text-blue-300 font-mono">L2 MANAGER</h4>
                <p className="text-sm text-slate-400">Task coordination & resource allocation</p>
                <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full w-3/4 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                </div>
              </div>
              
              <div className="text-center p-6 border border-purple-500/30 rounded-lg bg-slate-900/50">
                <div className="text-4xl mb-4 text-purple-400">📱</div>
                <h4 className="text-xl font-semibold mb-3 text-purple-300 font-mono">L3 WORKERS</h4>
                <p className="text-sm text-slate-400">Application-specific processing agents</p>
                <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-purple-400 h-2 rounded-full w-5/6 animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
              
              <div className="text-center p-6 border border-pink-500/30 rounded-lg bg-slate-900/50">
                <div className="text-4xl mb-4 text-pink-400">🔬</div>
                <h4 className="text-xl font-semibold mb-3 text-pink-300 font-mono">L4 SPECIALISTS</h4>
                <p className="text-sm text-slate-400">Advanced analysis & prediction systems</p>
                <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-pink-400 h-2 rounded-full w-2/3 animate-pulse" style={{animationDelay: '1.5s'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section with Terminal Effect */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="font-mono text-xs text-green-400 whitespace-pre-wrap leading-relaxed">
                {`> INITIALIZING AEGIS LIFE OS...
> LOADING AI WORKFORCE...
> ESTABLISHING SECURE CONNECTIONS...
> BEHAVIORAL ANALYSIS: READY
> PROACTIVE INTELLIGENCE: ONLINE
> DIGITAL MATE: ACTIVATED`}
              </div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6 font-mono">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  JOIN THE AI EVOLUTION
                </span>
              </h2>
              
              <p className="text-xl mb-8 text-slate-300">
                Be among the first to experience true AI-powered personal computing
              </p>
              
              <form onSubmit={handleBetaSignup} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="neural.link@digital.mate"
                    className="flex-1 px-6 py-4 rounded-lg bg-slate-900/50 border border-cyan-500/30 text-white placeholder-slate-400 font-mono focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="ai-button bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-8 py-4 rounded-lg font-mono font-semibold transition-all disabled:opacity-50 border border-cyan-400/50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="ai-loading"></div>
                        PROCESSING...
                      </div>
                    ) : (
                      'INITIALIZE'
                    )}
                  </button>
                </div>
              </form>
              
              <div className="text-sm text-slate-500 mt-4 font-mono">
                🛡️ QUANTUM-ENCRYPTED • ZERO-KNOWLEDGE ARCHITECTURE • AI-VERIFIED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;