import React, { useState } from 'react';
import axios from 'axios';
import AegisLogo, { AegisLogoCompact } from './AegisLogo';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// BOLD DRAMATIC IMAGES
const HERO_BG = "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1920&q=80"; // Cyberpunk neon
const AI_IMAGE = "https://images.unsplash.com/photo-1677442135136-760c813028c0?w=800&q=80"; // AI circuit brain
const CYBER_IMAGE = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80"; // Matrix code
const TECH_IMAGE = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80"; // Circuit board

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 via-black to-purple-900/30"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzA2YjZkNCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
        
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <AegisLogo size={180} />
          <h1 className="text-4xl font-black mb-4 mt-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            INITIALIZING...
          </h1>
          <p className="text-cyan-300 mb-6 text-lg">
            Your Digital Mate is coming online
          </p>
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <div className="text-sm text-cyan-400/70 font-mono">
            [SYSTEM BOOT SEQUENCE ACTIVE]
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* DRAMATIC BACKGROUND */}
      <div className="fixed inset-0">
        {/* Dark gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black"></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzA2YjZkNCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60"></div>
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Scan line effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-1 animate-scan"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-sm">
          <AegisLogoCompact size={50} />
          <div className="flex items-center space-x-4">
            <div className="text-sm text-cyan-400 font-mono animate-pulse">
              ● SYSTEM ONLINE
            </div>
            <div className="text-sm text-slate-500 font-mono">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12 max-w-7xl">
          {/* HERO SECTION - BOLD AND IN YOUR FACE */}
          <div className="text-center mb-16">
            {/* Main Logo - BIGGER */}
            <div className="flex justify-center mb-6">
              <AegisLogo size={280} showText={true} />
            </div>
            
            {/* BOLD HEADLINE */}
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-pulse">
                YOUR ULTIMATE
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                DIGITAL GUARDIAN
              </span>
            </h1>
            
            <div className="relative max-w-3xl mx-auto">
              <p className="text-xl md:text-2xl text-cyan-100 mb-4 leading-relaxed font-medium">
                <span className="text-cyan-400 font-mono font-bold">[SYSTEM INITIALIZED]</span>
              </p>
              <p className="text-lg text-slate-300 mb-8">
                Where cutting-edge AI meets unbreakable trust. Your Digital Mate learns, protects, and evolves with you.
              </p>
              
              {/* BOLD TAGLINE */}
              <div className="inline-block px-6 py-2 border-2 border-cyan-500/50 rounded-full bg-cyan-500/10 mb-8">
                <p className="text-cyan-400 font-bold tracking-wider">
                  "BETTER BE SAFE THAN SORRY"
                </p>
              </div>
            </div>

            {/* BIG BOLD CTA BUTTON */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={onGetStarted}
                className="group relative px-12 py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl font-black text-xl text-white transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)] border border-cyan-400/50"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span>⚡ INITIALIZE AEGIS</span>
                  <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
              </button>
            </div>
          </div>

          {/* DRAMATIC IMAGE SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* AI Brain Image */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] group">
              <img 
                src={AI_IMAGE} 
                alt="AI Neural Network" 
                className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">AI-POWERED BRAIN</h3>
                <p className="text-slate-300">Neural networks that think ahead</p>
              </div>
            </div>
            
            {/* Cyber Security Image */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)] group">
              <img 
                src={CYBER_IMAGE} 
                alt="Cyber Security Matrix" 
                className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-black text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">QUANTUM SECURITY</h3>
                <p className="text-slate-300">Impenetrable digital fortress</p>
              </div>
            </div>
          </div>

          {/* BOLD FEATURE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border-2 border-cyan-500/30 overflow-hidden group hover:border-cyan-400/60 transition-all hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="text-6xl mb-4 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">🧠</div>
                <h3 className="text-2xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">L1-L4 AI WORKFORCE</h3>
                <p className="text-slate-300 leading-relaxed">
                  Hierarchical agents working 24/7. <span className="text-cyan-400 font-bold">Owner</span> → <span className="text-blue-400 font-bold">Manager</span> → <span className="text-purple-400 font-bold">Workers</span>
                </p>
                <div className="mt-4 flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-2 shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
                  <span className="text-green-400 font-mono text-sm font-bold">NEURAL NETWORK ACTIVE</span>
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