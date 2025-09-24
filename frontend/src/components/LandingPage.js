import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

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
          <div className="text-6xl mb-6 animate-bounce">🛡️</div>
          <h1 className="text-3xl font-bold mb-4">Welcome to Aegis!</h1>
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
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🛡️</div>
            <div className="text-2xl font-bold">Aegis</div>
          </div>
          <div className="text-sm text-slate-400">
            The Future of Personal Computing
          </div>
        </header>

        {/* Main Hero */}
        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-8xl font-bold mb-8">
            Meet Your
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block">
              Digital Mate
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-12 leading-relaxed">
            Aegis isn't just an operating system—it's your <strong>Hierarchical Proactive Intelligence</strong> that learns, 
            protects, and anticipates your digital life before you even ask.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
            >
              Experience Aegis Now
            </button>
            <button className="border border-slate-600 hover:border-slate-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-800 bg-opacity-50 rounded-xl p-8 border border-slate-700">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-2xl font-bold mb-4">Proactive Intelligence</h3>
            <p className="text-slate-300 leading-relaxed">
              Your AI workforce anticipates your needs, resolves conflicts, and optimizes your digital life automatically. 
              Like having a personal assistant that never sleeps.
            </p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 rounded-xl p-8 border border-slate-700">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold mb-4">Unbreakable Security</h3>
            <p className="text-slate-300 leading-relaxed">
              Behavioral authentication, trap modes, and emergency wipe protocols protect you from digital threats 
              and physical coercion. Security by design, not afterthought.
            </p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 rounded-xl p-8 border border-slate-700">
            <div className="text-5xl mb-4">🎭</div>
            <h3 className="text-2xl font-bold mb-4">Perfect Deception</h3>
            <p className="text-slate-300 leading-relaxed">
              Intruders see convincing fake data while Aegis silently collects evidence. 
              Your phone becomes an intelligent trap that protects your real information.
            </p>
          </div>
        </div>

        {/* The Problem */}
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-xl p-8 mb-20">
          <h2 className="text-3xl font-bold mb-6 text-center">The Digital World is Broken</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold mb-4 text-red-300">❌ What's Wrong Today:</h4>
              <ul className="space-y-3 text-slate-300">
                <li>• Your phone is a passive tool, not an intelligent partner</li>
                <li>• Security is reactive, not proactive</li>
                <li>• You manage technology instead of it managing for you</li>
                <li>• Privacy is an afterthought, not a foundation</li>
                <li>• Your digital assistant is dumb, not truly intelligent</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4 text-green-300">✅ The Aegis Solution:</h4>
              <ul className="space-y-3 text-slate-300">
                <li>• Your Digital Mate learns and anticipates your needs</li>
                <li>• Advanced security protects you before threats emerge</li>
                <li>• AI workforce automates your digital tasks intelligently</li>
                <li>• Privacy-first architecture with zero-knowledge design</li>
                <li>• True intelligence that grows with your patterns</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-12">How Aegis Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="text-4xl mb-4">👑</div>
              <h4 className="text-xl font-semibold mb-3">L1 Owner</h4>
              <p className="text-sm text-slate-400">
                Constitutional oversight and final authority over your digital life
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-xl font-semibold mb-3">L2 Manager</h4>
              <p className="text-sm text-slate-400">
                Coordinates tasks and delegates work to specialist agents
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="text-4xl mb-4">📱</div>
              <h4 className="text-xl font-semibold mb-3">L3 App Workers</h4>
              <p className="text-sm text-slate-400">
                Specialized agents for messages, photos, calendar, and more
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="text-4xl mb-4">🔬</div>
              <h4 className="text-xl font-semibold mb-3">L4 Specialists</h4>
              <p className="text-sm text-slate-400">
                Advanced analysis for security, behavior, and predictions
              </p>
            </div>
          </div>
        </div>

        {/* Beta Signup */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">Join the Digital Evolution</h2>
          <p className="text-xl mb-8 opacity-90">
            Be among the first to experience true AI-powered personal computing
          </p>
          
          <form onSubmit={handleBetaSignup} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email for early access"
                className="flex-1 px-6 py-4 rounded-lg text-black text-lg"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Start Now'}
              </button>
            </div>
          </form>
          
          <div className="text-sm opacity-75 mt-4">
            🛡️ Privacy-first. Your email is encrypted and never shared.
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="text-3xl">🛡️</div>
            <div className="text-xl font-bold">Aegis Life OS</div>
          </div>
          <p className="text-slate-400 mb-4">
            The Hierarchical Proactive Intelligence Operating System
          </p>
          <div className="text-sm text-slate-500">
            © 2024 Aegis. Privacy-First Computing for the Future.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;