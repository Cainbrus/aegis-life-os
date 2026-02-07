import React, { useState } from 'react';
import AegisLogo, { AegisLogoCompact } from './AegisLogo';

const DigitalMateWebsite = ({ onLaunchApp }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 3000);
  };

  // Navigation
  const NavLink = ({ page, children }) => (
    <button
      onClick={() => { setCurrentPage(page); setMobileMenuOpen(false); }}
      className={`px-4 py-2 font-semibold transition-all ${
        currentPage === page 
          ? 'text-cyan-400 border-b-2 border-cyan-400' 
          : 'text-slate-300 hover:text-cyan-400'
      }`}
    >
      {children}
    </button>
  );

  // Header Component
  const Header = () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => setCurrentPage('home')} className="flex items-center space-x-2">
            <AegisLogoCompact size={40} />
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              DIGITAL MATE
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink page="home">Home</NavLink>
            <NavLink page="features">Features</NavLink>
            <NavLink page="pricing">Pricing</NavLink>
            <NavLink page="investors">Investors</NavLink>
            <NavLink page="about">About</NavLink>
            <NavLink page="contact">Contact</NavLink>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button
              onClick={onLaunchApp}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-bold text-white hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20"
            >
              Launch App
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-cyan-500/20">
            <div className="flex flex-col space-y-2">
              <NavLink page="home">Home</NavLink>
              <NavLink page="features">Features</NavLink>
              <NavLink page="pricing">Pricing</NavLink>
              <NavLink page="investors">Investors</NavLink>
              <NavLink page="about">About</NavLink>
              <NavLink page="contact">Contact</NavLink>
              <button
                onClick={onLaunchApp}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-bold text-white"
              >
                Launch App
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );

  // Footer Component
  const Footer = () => (
    <footer className="bg-slate-900 border-t border-cyan-500/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <AegisLogoCompact size={30} />
              <span className="text-lg font-bold text-white">Digital Mate</span>
            </div>
            <p className="text-slate-400 text-sm">
              Your phone's bodyguard. Proactive protection for your digital life.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><button onClick={() => setCurrentPage('features')} className="hover:text-cyan-400">Features</button></li>
              <li><button onClick={() => setCurrentPage('pricing')} className="hover:text-cyan-400">Pricing</button></li>
              <li><button onClick={onLaunchApp} className="hover:text-cyan-400">Demo</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><button onClick={() => setCurrentPage('about')} className="hover:text-cyan-400">About Us</button></li>
              <li><button onClick={() => setCurrentPage('contact')} className="hover:text-cyan-400">Contact</button></li>
              <li><button onClick={() => setCurrentPage('investors')} className="hover:text-cyan-400">Investors</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><button onClick={() => setCurrentPage('privacy')} className="hover:text-cyan-400">Privacy Policy</button></li>
              <li><button onClick={() => setCurrentPage('terms')} className="hover:text-cyan-400">Terms of Service</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
          © 2025 Digital Mate. All rights reserved. | AEGIS™ is patent pending.
        </div>
      </div>
    </footer>
  );

  // HOME PAGE
  const HomePage = () => (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzA2YjZkNCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-60"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-20">
          <div className="flex justify-center mb-8">
            <AegisLogo size={200} showText={true} />
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
              YOUR PHONE'S
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              BODYGUARD
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-4 max-w-2xl mx-auto">
            We don't just lock attackers out. We let them IN — to <span className="text-cyan-400 font-bold">fake data</span> — while capturing their photo and location.
          </p>
          
          <p className="text-cyan-400 font-bold mb-8">
            Proactive protection. Not reactive.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-lg text-white hover:opacity-90 transition-all shadow-lg shadow-cyan-500/30"
            >
              Try the Demo →
            </button>
            <button
              onClick={() => setCurrentPage('features')}
              className="px-8 py-4 border-2 border-cyan-500/50 rounded-xl font-bold text-lg text-cyan-400 hover:bg-cyan-500/10 transition-all"
            >
              See Features
            </button>
          </div>

          {/* Trust Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-full border border-cyan-500/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-slate-400 text-sm">Patent Pending Technology</span>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4 text-white">
            The <span className="text-cyan-400">Trap Mode</span> Difference
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Every other security app locks intruders out. We let them in — to fake data.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-red-500/20">
              <div className="text-red-400 text-xl font-bold mb-4">❌ Everyone Else</div>
              <ul className="space-y-3 text-slate-400">
                <li>• Locks attacker out</li>
                <li>• Alert AFTER breach</li>
                <li>• No evidence gathered</li>
                <li>• Damage already done</li>
                <li>• No duress protection</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-cyan-500/30">
              <div className="text-cyan-400 text-xl font-bold mb-4">✓ AEGIS</div>
              <ul className="space-y-3 text-slate-300">
                <li>• <span className="text-cyan-400">Lets them in to FAKE data</span></li>
                <li>• <span className="text-cyan-400">Captures their photo</span></li>
                <li>• <span className="text-cyan-400">Logs their location</span></li>
                <li>• <span className="text-cyan-400">Records their actions</span></li>
                <li>• <span className="text-cyan-400">Duress pattern for forced unlock</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12 text-white">
            Three Patterns. Three Outcomes.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-2xl p-8 border border-green-500/30 text-center">
              <div className="text-5xl mb-4">🔓</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Owner Pattern</h3>
              <p className="text-slate-400">Full access to all your real data. Everything normal.</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-8 border border-yellow-500/30 text-center">
              <div className="text-5xl mb-4">🆘</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Duress Pattern</h3>
              <p className="text-slate-400">Shows fake data. Silently alerts your emergency contacts.</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-8 border border-red-500/30 text-center">
              <div className="text-5xl mb-4">🎭</div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Wrong Pattern</h3>
              <p className="text-slate-400">Trap Mode activates. Photo captured. Fake data shown.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyan-900/50 to-purple-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4 text-white">
            Ready to protect yourself?
          </h2>
          <p className="text-slate-300 mb-8">
            Try the full demo. See Trap Mode in action.
          </p>
          <button
            onClick={onLaunchApp}
            className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-xl text-white hover:opacity-90 transition-all shadow-lg"
          >
            Launch Demo →
          </button>
        </div>
      </section>
    </div>
  );

  // FEATURES PAGE
  const FeaturesPage = () => (
    <div className="pt-20">
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-black text-center mb-4 text-white">
            All <span className="text-cyan-400">Features</span>
          </h1>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Everything you need to protect your digital life.
          </p>

          {/* Security Features */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-cyan-400 mb-8 flex items-center">
              <span className="text-3xl mr-3">🛡️</span> Security
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Trap Mode', desc: 'Let intruders into fake data while gathering evidence', icon: '🎭' },
                { title: 'Intruder Photos', desc: 'Silently capture photos of anyone trying to access your phone', icon: '📸' },
                { title: 'Duress Pattern', desc: 'Special pattern shows fake data when forced to unlock', icon: '🆘' },
                { title: 'Remote Wipe', desc: 'Nuke your phone data from anywhere', icon: '💣' },
                { title: 'Calculator Vault', desc: 'Hidden storage behind a normal calculator', icon: '🔢' },
                { title: 'Evidence Log', desc: 'Complete audit trail for police reports', icon: '📋' },
              ].map((feature, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-all">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Features */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-red-400 mb-8 flex items-center">
              <span className="text-3xl mr-3">🚨</span> Emergency
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Crash Detection', desc: 'Detects car accidents and alerts your contacts', icon: '🚗' },
                { title: 'Fall Detection', desc: 'Alerts contacts if you fall (great for elderly)', icon: '🤕' },
                { title: 'Shake SOS', desc: 'Shake your phone 5 times for silent emergency alert', icon: '📳' },
                { title: 'Duress Phrase', desc: 'Say a secret phrase to trigger silent alert', icon: '🗣️' },
                { title: 'Auto-Call 000', desc: 'Automatically call emergency services', icon: '📞' },
                { title: 'Emergency Contacts', desc: 'Priority-ordered contacts called in sequence', icon: '👥' },
              ].map((feature, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-red-500/50 transition-all">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Family Features */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-purple-400 mb-8 flex items-center">
              <span className="text-3xl mr-3">👨‍👩‍👧</span> Family Safety
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Family Tracker', desc: 'See where everyone is in real-time', icon: '📍' },
                { title: 'Geofencing', desc: 'Alerts when family arrives/leaves locations', icon: '🏠' },
                { title: 'Family SOS', desc: 'Panic button alerts entire family instantly', icon: '🚨' },
                { title: 'Check-Ins', desc: 'Send "Are you OK?" requests', icon: '✅' },
              ].map((feature, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Features */}
          <div>
            <h2 className="text-2xl font-bold text-green-400 mb-8 flex items-center">
              <span className="text-3xl mr-3">🤖</span> AI Protection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Spam Blocking', desc: 'AI catches spam texts and calls', icon: '🚫' },
                { title: 'Phishing Detection', desc: 'Spots scam emails and links', icon: '🎣' },
                { title: 'Fraud Alerts', desc: 'Flags suspicious transactions', icon: '💳' },
                { title: 'Smart Assistant', desc: 'Chat with Aegis for help and advice', icon: '💬' },
              ].map((feature, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-green-500/50 transition-all">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Subscription checkout handler
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const handleSubscribe = async (packageId) => {
    setIsProcessing(true);
    setCheckoutError(null);
    
    try {
      const API = process.env.REACT_APP_BACKEND_URL || '';
      const originUrl = window.location.origin;
      
      const response = await fetch(`${API}/api/subscriptions/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: packageId,
          origin_url: originUrl
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError('Unable to process. Please try again.');
      setIsProcessing(false);
    }
  };

  // PRICING PAGE
  const PricingPage = () => (
    <div className="pt-20">
      <section className="py-20 bg-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-black text-center mb-4 text-white">
            Simple <span className="text-cyan-400">Pricing</span>
          </h1>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Premium protection at a fair price. Cancel anytime.
          </p>

          {checkoutError && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-center">
              {checkoutError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-2">BASIC</div>
              <div className="text-4xl font-black text-white mb-4">$4.99<span className="text-lg text-slate-500">/mo</span></div>
              <p className="text-slate-400 mb-6">Essential protection for everyday use</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Pattern lock protection',
                  'Invisible Vault',
                  'Intruder photo capture',
                  'GPS tracking',
                  'Remote lock',
                  '3 Emergency contacts',
                  'Basic activity log',
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <span className="text-green-400 mr-2">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleSubscribe('basic_monthly')}
                disabled={isProcessing}
                className="w-full py-3 border border-cyan-500 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Subscribe to Basic'}
              </button>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-b from-cyan-900/50 to-slate-800/50 rounded-2xl p-8 border-2 border-cyan-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 rounded-full text-sm font-bold text-white">
                BEST VALUE
              </div>
              <div className="text-cyan-400 font-semibold mb-2">PRO</div>
              <div className="text-4xl font-black text-white mb-4">$9.99<span className="text-lg text-slate-500">/mo</span></div>
              <p className="text-slate-400 mb-6">Complete protection suite</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Basic',
                  'TRAP MODE™',
                  'Duress pattern',
                  'Behavioral Guard™',
                  'Remote wipe',
                  'Unlimited contacts',
                  'Full AI features',
                  'Priority support',
                  'Family location sharing',
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <span className="text-cyan-400 mr-2">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleSubscribe('pro_monthly')}
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Subscribe to Pro'}
              </button>
            </div>
          </div>

          {/* Enterprise */}
          <div className="mt-12 max-w-3xl mx-auto bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
            <div className="text-slate-400 font-semibold mb-2">ENTERPRISE</div>
            <div className="text-3xl font-black text-white mb-4">Custom Pricing</div>
            <p className="text-slate-400 mb-6">For businesses protecting employee devices</p>
            <button 
              onClick={() => setCurrentPage('contact')}
              className="px-8 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-all"
            >
              Contact Sales
            </button>
          </div>

          {/* Money Back Guarantee */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              🔒 Secure payment via Stripe • Cancel anytime • 30-day money back guarantee
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  // ABOUT PAGE
  const AboutPage = () => (
    <div className="pt-20">
      <section className="py-20 bg-slate-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-black text-center mb-4 text-white">
            About <span className="text-cyan-400">Digital Mate</span>
          </h1>
          <p className="text-slate-400 text-center mb-16">
            Building the future of personal security
          </p>

          {/* Story */}
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
            <p className="text-slate-300 mb-4">
              Your phone is your entire life now. Your bank, your conversations, your photos, your health records. 
              And what's protecting it? A password that can be stolen, or biometrics that can be forced.
            </p>
            <p className="text-slate-300 mb-4">
              We asked a simple question: <span className="text-cyan-400 font-bold">"What happens when someone FORCES you to unlock your phone?"</span>
            </p>
            <p className="text-slate-300">
              That's why we built AEGIS. Not just another security app that locks people out — but one that lets them 
              into <span className="text-cyan-400">fake data</span> while gathering evidence against them. Proactive protection, not reactive.
            </p>
          </div>

          {/* Team */}
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-cyan-500/30 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">The Team</h2>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-4xl font-black text-white">
                CB
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyan-400">Cain Brunjes</h3>
                <p className="text-slate-400 mb-3">Founder & CEO</p>
                <p className="text-slate-300">
                  Building AEGIS because it needs to exist. Focused on creating technology that actually 
                  protects people instead of just pretending to.
                </p>
                <p className="text-slate-400 mt-4">📞 0457374662</p>
              </div>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-2xl p-8 border border-cyan-500/20 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-xl text-slate-300">
              "We're not building an app. We're building the <span className="text-cyan-400">future of personal security</span>."
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  // CONTACT PAGE
  // INVESTOR INQUIRY TYPES for auto-reply
  const investorInquiryTypes = [
    { id: 'pitch_deck', label: 'Pitch Deck & Overview', icon: '📊' },
    { id: 'financials', label: 'Financial Projections', icon: '💰' },
    { id: 'demo', label: 'Product Demo', icon: '🎬' },
    { id: 'team_meeting', label: 'Meet the Founder', icon: '👤' },
    { id: 'due_diligence', label: 'Due Diligence Materials', icon: '📋' },
    { id: 'term_sheet', label: 'Investment Terms', icon: '📝' },
  ];

  const [investorForm, setInvestorForm] = useState({
    name: '',
    email: '',
    firm: '',
    inquiryType: '',
    message: ''
  });
  const [investorSubmitted, setInvestorSubmitted] = useState(false);
  const [autoReplyContent, setAutoReplyContent] = useState(null);

  // Auto-reply content based on inquiry type
  const getAutoReply = (inquiryType) => {
    const replies = {
      pitch_deck: {
        subject: 'Digital Mate - Pitch Deck & Investment Overview',
        content: `Thank you for your interest in Digital Mate!

Attached you'll find our comprehensive investor package including:
• Executive Summary
• Product Overview & Demo Access
• Market Analysis
• Business Model & Revenue Projections
• 5-Year Financial Forecast
• Team & Roadmap

KEY HIGHLIGHTS:
📱 $150B mobile security market by 2030
🎭 Proprietary Trap Mode™ technology (patent pending)
📈 Clear path to $135M ARR by Year 5
💰 Seeking $500K seed at $3M cap

NEXT STEPS:
1. Review the attached materials
2. Try our live demo: [Demo Link]
3. Schedule a call with Cain: calendly.com/digitalmate

Looking forward to discussing how Digital Mate will revolutionize personal security.

Best regards,
Cain Brunjes
Founder & CEO, Digital Mate
📞 0457374662`
      },
      financials: {
        subject: 'Digital Mate - Financial Model & Projections',
        content: `Thank you for requesting our financial information!

FINANCIAL HIGHLIGHTS:

Year 1: $300K ARR | 100K users
Year 2: $2.4M ARR | 500K users  
Year 3: $12M ARR | 2M users
Year 5: $135M ARR | 15M users

UNIT ECONOMICS:
• LTV:CAC Ratio: 16-22x
• Gross Margin: 85%
• Blended CAC: $6
• Pro LTV: $99.80
• Family LTV: $329.67

USE OF FUNDS ($500K):
• 40% Product Development
• 24% Marketing & UA
• 20% Team Expansion
• 16% Operations & Legal

Full financial model and assumptions attached.

Schedule a deep-dive call: calendly.com/digitalmate

Best regards,
Cain Brunjes`
      },
      demo: {
        subject: 'Digital Mate - Live Demo Access',
        content: `Excited to show you Digital Mate in action!

🎬 LIVE DEMO ACCESS:
[Demo Link - Try it now!]

DEMO HIGHLIGHTS TO TRY:
1. Trap Mode™ - Enter wrong pattern 3x to see decoy activation
2. Dial-to-Unlock Vault - Open Phone, dial 8675309, press Call
3. Intruder Photo Capture - See evidence collection in real-time
4. Behavioral Guard - Watch how we detect suspicious behavior

PATTERNS TO TEST:
• Owner: 1-5-9-8-7 (full access)
• Duress: 2-5-8 (fake data + silent alert)
• Wrong: Any other (triggers Trap Mode)

VAULT CODE: 8675309 (dial on phone app)

Want a guided walkthrough? Let's schedule a call!
calendly.com/digitalmate

Best regards,
Cain Brunjes`
      },
      team_meeting: {
        subject: 'Digital Mate - Meeting with Cain Brunjes',
        content: `Thank you for wanting to connect!

I'd love to share the Digital Mate vision with you personally.

ABOUT ME:
I created Digital Mate because I was frustrated that our smartphones - devices that know everything about us - have such basic security. I believe everyone deserves a phone that actively protects them, not just locks out intruders, but outsmarts them.

AVAILABLE FOR:
• 30-min intro call
• 1-hour deep dive
• In-person meeting (Australia-based, happy to video call globally)

SCHEDULE DIRECTLY:
calendly.com/digitalmate

Or call me: 0457374662
Best times: 9am-6pm AEST, weekdays

Looking forward to meeting you!

Best regards,
Cain Brunjes
Founder & CEO, Digital Mate`
      },
      due_diligence: {
        subject: 'Digital Mate - Due Diligence Package',
        content: `Thank you for your serious interest in Digital Mate!

DUE DILIGENCE MATERIALS:

📊 COMPANY DOCUMENTS:
• Certificate of Incorporation
• Cap Table
• Articles of Association
• IP Assignment Agreements

💼 BUSINESS DOCUMENTS:
• Detailed Business Plan
• Market Research & Analysis
• Competitive Landscape
• Customer Testimonials & Feedback

💰 FINANCIAL DOCUMENTS:
• Historical Financials
• 5-Year Projections (3 scenarios)
• Unit Economics Deep Dive
• Use of Funds Breakdown

🔧 TECHNICAL DOCUMENTS:
• Architecture Overview
• Security Audit (pending)
• Patent Applications
• Technology Roadmap

📋 LEGAL:
• Privacy Policy
• Terms of Service
• Regulatory Compliance Plan

All materials will be shared via secure data room upon signing NDA.

Ready to proceed? Let's schedule a call.
calendly.com/digitalmate

Best regards,
Cain Brunjes`
      },
      term_sheet: {
        subject: 'Digital Mate - Investment Terms',
        content: `Thank you for your interest in investing!

CURRENT ROUND: Seed
RAISING: $500,000 AUD
INSTRUMENT: SAFE or Convertible Note

TERMS:
• Valuation Cap: $3,000,000 AUD
• Discount: 20%
• Pro-rata Rights: Yes
• Information Rights: Quarterly updates

EXPECTED MILESTONES (18 months):
• Launch on Android & iOS
• 500,000+ users
• $2M+ ARR run rate
• Series A ready

INVESTOR BENEFITS:
• Early entry at attractive valuation
• Board observer seat (for $100K+)
• Direct founder access
• Strategic input opportunity

MINIMUM INVESTMENT: $25,000

Ready to discuss terms? Let's schedule a call to go through the details.
calendly.com/digitalmate

Best regards,
Cain Brunjes
Founder & CEO, Digital Mate
📞 0457374662`
      }
    };
    return replies[inquiryType] || replies.pitch_deck;
  };

  const handleInvestorSubmit = (e) => {
    e.preventDefault();
    const reply = getAutoReply(investorForm.inquiryType);
    setAutoReplyContent(reply);
    setInvestorSubmitted(true);
    // In production, this would send email via backend
  };

  // INVESTORS PAGE
  const InvestorsPage = () => (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 text-sm font-medium">Now Raising - Seed Round</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">Invest in the Future of</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Personal Security</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-3xl mx-auto mb-8">
            Digital Mate is revolutionizing smartphone security with proprietary technology that doesn't just lock intruders out - it lets them into fake data while gathering evidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setInvestorForm({...investorForm, inquiryType: 'pitch_deck'});
                document.getElementById('investor-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-lg text-white hover:opacity-90 transition-all shadow-lg"
            >
              Get Pitch Deck →
            </button>
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 border-2 border-cyan-500/50 rounded-xl font-bold text-lg text-cyan-400 hover:bg-cyan-500/10 transition-all"
            >
              Try Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '$150B', label: 'Market by 2030', icon: '📈' },
              { value: '$500K', label: 'Raising', icon: '💰' },
              { value: '$3M', label: 'Valuation Cap', icon: '🎯' },
              { value: '50-100x', label: 'Target Return', icon: '🚀' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-6 text-center border border-slate-700">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Invest */}
      <section className="py-16 bg-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-white text-center mb-12">Why Invest in Digital Mate?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎭',
                title: 'Proprietary Technology',
                desc: 'Patent-pending Trap Mode™ and Behavioral Guard™ create an unbreachable moat. No competitor has anything like it.'
              },
              {
                icon: '📱',
                title: 'Massive Market',
                desc: '6.8 billion smartphone users. $150B security market. 60% have had their phone snooped. Everyone needs this.'
              },
              {
                icon: '📊',
                title: 'Strong Unit Economics',
                desc: 'LTV:CAC ratio of 16-22x. 85% gross margins. Clear path to $135M ARR by Year 5.'
              },
              {
                icon: '🛡️',
                title: 'First Mover Advantage',
                desc: 'No one else is doing deception-based security. By the time competitors catch up, we\'ll own the market.'
              },
              {
                icon: '🎯',
                title: 'Clear Exit Path',
                desc: 'Multiple acquisition targets: Apple, Google, Samsung, Norton, McAfee. $500M-$1B exit potential.'
              },
              {
                icon: '👨‍💼',
                title: 'Passionate Founder',
                desc: 'Cain built this because he needed it. That authenticity drives product decisions and user trust.'
              },
            ].map((item, i) => (
              <div key={i} className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Projections */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-white text-center mb-12">Financial Projections</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-4 px-4 text-slate-400 font-medium">Metric</th>
                  <th className="py-4 px-4 text-slate-400 font-medium">Year 1</th>
                  <th className="py-4 px-4 text-slate-400 font-medium">Year 2</th>
                  <th className="py-4 px-4 text-slate-400 font-medium">Year 3</th>
                  <th className="py-4 px-4 text-slate-400 font-medium">Year 5</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: 'Users', y1: '100K', y2: '500K', y3: '2M', y5: '15M' },
                  { metric: 'Revenue', y1: '$300K', y2: '$2.4M', y3: '$12M', y5: '$135M' },
                  { metric: 'Gross Margin', y1: '80%', y2: '82%', y3: '85%', y5: '85%' },
                  { metric: 'Net Margin', y1: '33%', y2: '38%', y3: '50%', y5: '56%' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td className="py-4 px-4 text-white font-semibold">{row.metric}</td>
                    <td className="py-4 px-4 text-slate-300">{row.y1}</td>
                    <td className="py-4 px-4 text-slate-300">{row.y2}</td>
                    <td className="py-4 px-4 text-cyan-400 font-semibold">{row.y3}</td>
                    <td className="py-4 px-4 text-green-400 font-bold">{row.y5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Investor Request Form */}
      <section id="investor-form" className="py-16 bg-slate-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-white text-center mb-4">Request Information</h2>
          <p className="text-slate-400 text-center mb-8">Select what you'd like to receive and we'll send it immediately.</p>
          
          {investorSubmitted && autoReplyContent ? (
            <div className="bg-slate-900 rounded-2xl p-8 border border-cyan-500/30">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-white">Information Sent!</h3>
                <p className="text-slate-400 mt-2">Check your email for: {autoReplyContent.subject}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 mt-6">
                <h4 className="text-cyan-400 font-bold mb-3">Preview:</h4>
                <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans">{autoReplyContent.content}</pre>
              </div>
              <button 
                onClick={() => { setInvestorSubmitted(false); setAutoReplyContent(null); }}
                className="mt-6 w-full py-3 bg-slate-700 rounded-xl text-white font-semibold hover:bg-slate-600 transition-all"
              >
                Request More Information
              </button>
            </div>
          ) : (
            <form onSubmit={handleInvestorSubmit} className="space-y-6">
              {/* Inquiry Type Selection */}
              <div>
                <label className="block text-slate-400 text-sm mb-3">What would you like to receive?</label>
                <div className="grid grid-cols-2 gap-3">
                  {investorInquiryTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setInvestorForm({...investorForm, inquiryType: type.id})}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        investorForm.inquiryType === type.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <div className={`text-sm font-medium mt-2 ${
                        investorForm.inquiryType === type.id ? 'text-cyan-400' : 'text-slate-300'
                      }`}>
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Your Name *</label>
                  <input
                    type="text"
                    value={investorForm.name}
                    onChange={(e) => setInvestorForm({...investorForm, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Email *</label>
                  <input
                    type="email"
                    value={investorForm.email}
                    onChange={(e) => setInvestorForm({...investorForm, email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="john@vc.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Firm / Company</label>
                <input
                  type="text"
                  value={investorForm.firm}
                  onChange={(e) => setInvestorForm({...investorForm, firm: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="Sequoia Capital"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Additional Questions</label>
                <textarea
                  value={investorForm.message}
                  onChange={(e) => setInvestorForm({...investorForm, message: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none h-24 resize-none"
                  placeholder="Any specific questions or areas of interest?"
                />
              </div>

              <button
                type="submit"
                disabled={!investorForm.inquiryType || !investorForm.name || !investorForm.email}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Me the Information →
              </button>

              <p className="text-center text-slate-500 text-sm">
                Response time: Immediate auto-reply + personal follow-up within 24 hours
              </p>
            </form>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-cyan-900/50 to-purple-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Ready to Protect Billions?</h2>
          <p className="text-slate-300 mb-8">Join us in building the future of personal digital security.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.open('tel:0457374662')}
              className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all"
            >
              📞 Call Now: 0457374662
            </button>
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 border-2 border-white/50 rounded-xl font-bold text-white hover:bg-white/10 transition-all"
            >
              Try the Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  const ContactPage = () => (
    <div className="pt-20">
      <section className="py-20 bg-slate-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-black text-center mb-4 text-white">
            Get in <span className="text-cyan-400">Touch</span>
          </h1>
          <p className="text-slate-400 text-center mb-16">
            Questions? Partnerships? Investment? Let's talk.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Contact Info</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">👤</div>
                  <div>
                    <div className="text-white font-semibold">Cain Brunjes</div>
                    <div className="text-slate-400">Founder & CEO</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">📞</div>
                  <div>
                    <div className="text-white font-semibold">0457374662</div>
                    <div className="text-slate-400">Phone</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">📍</div>
                  <div>
                    <div className="text-white font-semibold">Australia</div>
                    <div className="text-slate-400">Location</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentPage('investors')}
                className="mt-12 w-full p-6 bg-gradient-to-r from-cyan-900/40 to-purple-900/40 rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all text-left"
              >
                <h3 className="text-lg font-bold text-cyan-400 mb-2">🚀 For Investors</h3>
                <p className="text-slate-300 text-sm">
                  Interested in our seed round? Get instant access to pitch deck, financials, and schedule a demo.
                </p>
                <span className="text-cyan-400 text-sm font-semibold mt-2 inline-block">View Investor Page →</span>
              </button>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Send a Message</h2>
              {formSubmitted ? (
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-8 text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <div className="text-green-400 font-bold text-xl">Message Sent!</div>
                  <p className="text-slate-400 mt-2">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Name</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Message</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none h-32 resize-none"
                      placeholder="What's on your mind?"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-bold hover:opacity-90 transition-all"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // PRIVACY POLICY PAGE
  const PrivacyPolicyPage = () => (
    <div className="pt-20">
      <section className="py-20 bg-slate-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-black text-center mb-4 text-white">
            Privacy <span className="text-cyan-400">Policy</span>
          </h1>
          <p className="text-slate-400 text-center mb-12">
            Last updated: December 2025
          </p>

          <div className="space-y-8 text-slate-300">
            {/* Introduction */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                Digital Mate ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile security application.
              </p>
            </div>

            {/* Data Collection */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-cyan-400 font-semibold mb-2">Security Data (Stored Locally)</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Intruder photos captured during unauthorized access attempts</li>
                    <li>Location data when Trap Mode is activated</li>
                    <li>Activity logs of unauthorized access attempts</li>
                    <li>Pattern lock and security configurations</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-cyan-400 font-semibold mb-2">Account Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Email address (for subscription management)</li>
                    <li>Payment information (processed securely via Stripe)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Data */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>To provide security features (Trap Mode, Intruder Detection, Invisible Vault)</li>
                <li>To generate evidence for potential police reports</li>
                <li>To process subscription payments</li>
                <li>To send emergency alerts to your designated contacts</li>
                <li>To improve our security algorithms</li>
              </ul>
            </div>

            {/* Data Storage */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">4. Data Storage & Security</h2>
              <p className="mb-4">
                <span className="text-green-400 font-semibold">Your security data stays on YOUR device.</span> We do not upload your intruder photos, location data, or activity logs to external servers unless you explicitly choose to share them.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>All sensitive data is encrypted using AES-256 encryption</li>
                <li>The Invisible Vault uses additional encryption layers</li>
                <li>Payment processing is handled by Stripe (PCI-DSS compliant)</li>
              </ul>
            </div>

            {/* Third Party */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">5. Third-Party Services</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><span className="text-white font-semibold">Stripe:</span> Payment processing</li>
                <li><span className="text-white font-semibold">Google Play Services:</span> App distribution and updates</li>
              </ul>
              <p className="mt-4 text-sm">
                We do not sell your personal information to third parties.
              </p>
            </div>

            {/* User Rights */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">6. Your Rights</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal data stored by Digital Mate</li>
                <li>Delete your account and all associated data</li>
                <li>Export your security evidence</li>
                <li>Opt-out of non-essential data collection</li>
                <li>Request information about data processing</li>
              </ul>
            </div>

            {/* Children */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">7. Children's Privacy</h2>
              <p>
                Digital Mate is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-2xl p-6 border border-cyan-500/30">
              <h2 className="text-xl font-bold text-white mb-4">8. Contact Us</h2>
              <p className="mb-4">
                If you have questions about this Privacy Policy or our data practices:
              </p>
              <div className="space-y-2">
                <p><span className="text-cyan-400">Email:</span> privacy@digitalmate.app</p>
                <p><span className="text-cyan-400">Phone:</span> 0457374662</p>
                <p><span className="text-cyan-400">Location:</span> Australia</p>
              </div>
            </div>

            {/* Changes */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // TERMS OF SERVICE PAGE
  const TermsPage = () => (
    <div className="pt-20">
      <section className="py-20 bg-slate-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-black text-center mb-4 text-white">
            Terms of <span className="text-cyan-400">Service</span>
          </h1>
          <p className="text-slate-400 text-center mb-12">
            Last updated: December 2025
          </p>

          <div className="space-y-8 text-slate-300">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By downloading, installing, or using Digital Mate, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the application.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">2. Service Description</h2>
              <p>
                Digital Mate is a mobile security application that provides features including but not limited to: pattern lock protection, Trap Mode™, Invisible Vault, intruder detection, and emergency alerts.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">3. Subscription & Billing</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Subscriptions are billed monthly</li>
                <li>Basic: $4.99/month | Pro: $9.99/month</li>
                <li>Cancel anytime through your app store account</li>
                <li>Refunds subject to app store policies</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">4. Acceptable Use</h2>
              <p className="mb-4">You agree NOT to use Digital Mate to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Infringe on others' privacy rights illegally</li>
                <li>Stalk, harass, or harm others</li>
                <li>Conduct unauthorized surveillance</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">5. Limitation of Liability</h2>
              <p>
                Digital Mate is provided "as is" without warranties. We are not liable for any damages arising from your use of the application. Security features are designed to deter and document, not guarantee prevention of all unauthorized access.
              </p>
            </div>

            <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-2xl p-6 border border-cyan-500/30">
              <h2 className="text-xl font-bold text-white mb-4">6. Contact</h2>
              <p>For questions about these Terms: <span className="text-cyan-400">legal@digitalmate.app</span></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Render current page
  const renderPage = () => {
    switch(currentPage) {
      case 'features': return <FeaturesPage />;
      case 'pricing': return <PricingPage />;
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage />;
      case 'investors': return <InvestorsPage />;
      case 'privacy': return <PrivacyPolicyPage />;
      case 'terms': return <TermsPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      {renderPage()}
      <Footer />
    </div>
  );
};

export default DigitalMateWebsite;
