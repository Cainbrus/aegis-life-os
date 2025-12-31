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
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>Cain Brunjes</li>
              <li>0457374662</li>
              <li>Australia</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
          © 2024 Digital Mate. All rights reserved. | AEGIS™ is patent pending.
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

  // PRICING PAGE
  const PricingPage = () => (
    <div className="pt-20">
      <section className="py-20 bg-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-black text-center mb-4 text-white">
            Simple <span className="text-cyan-400">Pricing</span>
          </h1>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Premium features at a fair price. Cancel anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-slate-400 font-semibold mb-2">FREE</div>
              <div className="text-4xl font-black text-white mb-4">$0<span className="text-lg text-slate-500">/mo</span></div>
              <p className="text-slate-400 mb-6">Get started with basic protection</p>
              <ul className="space-y-3 mb-8">
                {['Basic pattern lock', 'Single emergency contact', 'GPS tracking', 'Remote lock'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <span className="text-green-400 mr-2">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-all">
                Get Started
              </button>
            </div>

            {/* Premium */}
            <div className="bg-gradient-to-b from-cyan-900/50 to-slate-800/50 rounded-2xl p-8 border-2 border-cyan-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 rounded-full text-sm font-bold text-white">
                MOST POPULAR
              </div>
              <div className="text-cyan-400 font-semibold mb-2">PREMIUM</div>
              <div className="text-4xl font-black text-white mb-4">$9.99<span className="text-lg text-slate-500">/mo</span></div>
              <p className="text-slate-400 mb-6">Full protection for individuals</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Free',
                  'TRAP MODE',
                  'Intruder photos',
                  'Duress pattern',
                  'Calculator vault',
                  'Unlimited contacts',
                  'All AI features',
                  'Remote wipe',
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <span className="text-cyan-400 mr-2">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onLaunchApp}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-bold hover:opacity-90 transition-all"
              >
                Start Free Trial
              </button>
            </div>

            {/* Family */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-purple-500/30">
              <div className="text-purple-400 font-semibold mb-2">FAMILY</div>
              <div className="text-4xl font-black text-white mb-4">$14.99<span className="text-lg text-slate-500">/mo</span></div>
              <p className="text-slate-400 mb-6">Protect the whole family</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Premium',
                  'Up to 6 family members',
                  'Family location sharing',
                  'Geofencing alerts',
                  'Family SOS',
                  'Check-in requests',
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <span className="text-purple-400 mr-2">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 border border-purple-500 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-all">
                Get Family Plan
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

              <div className="mt-12 p-6 bg-cyan-900/20 rounded-xl border border-cyan-500/30">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">For Investors</h3>
                <p className="text-slate-300 text-sm">
                  Interested in our seed round? We'd love to show you a demo of Trap Mode in action. 
                  Get in touch and let's talk.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Send a Message</h2>
              {formSubmitted ? (
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-8 text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <div className="text-green-400 font-bold text-xl">Message Sent!</div>
                  <p className="text-slate-400 mt-2">We'll get back to you soon.</p>
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

  // Render current page
  const renderPage = () => {
    switch(currentPage) {
      case 'features': return <FeaturesPage />;
      case 'pricing': return <PricingPage />;
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage />;
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
