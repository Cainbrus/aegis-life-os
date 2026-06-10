import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { Shield, Compass, FileClock, Bot, X } from 'lucide-react';

import SecurityDashboard from './components/SecurityDashboard';
import OwnerRecognition from './components/OwnerRecognition';
import EvidenceCenter from './components/EvidenceCenter';
import RecoveryCenter from './components/RecoveryCenter';
import TrapDecoy from './components/TrapDecoy';
import AegisChat from './components/AegisChat';
import CalculatorVault from './components/CalculatorVault';
import PhoneDialer from './components/PhoneDialer';
import DigitalMateWebsite from './components/DigitalMateWebsite';
import { SubscriptionSuccess, SubscriptionCancel } from './components/SubscriptionPages';
import telemetry from './services/TelemetryService';
import './App.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const OWNER_CODE_HINT = '15987';

const NAV = [
  { id: 'home', label: 'Home', icon: Shield },
  { id: 'recovery', label: 'Recovery', icon: Compass },
  { id: 'evidence', label: 'Evidence', icon: FileClock },
  { id: 'mate', label: 'Mate', icon: Bot },
];

function App() {
  // 'website' (public landing) or 'app' (security app)
  const [screen, setScreen] = useState('website');
  const [tab, setTab] = useState('home');
  const [showDialer, setShowDialer] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [trapActive, setTrapActive] = useState(false);
  const [ownerVerify, setOwnerVerify] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Subscription redirect routing (Stripe)
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // Remove the static splash screen once React has mounted
  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('hidden');
      setTimeout(() => splash.remove(), 500);
    }
  }, []);

  // Start behavioural telemetry once inside the app
  useEffect(() => {
    if (screen !== 'app') return;
    telemetry.start();

    const learn = setInterval(() => { telemetry.sendTelemetry('owner'); }, 12000);
    const guard = setInterval(async () => {
      const r = await telemetry.score();
      if (r) setTrapActive(r.trap_active);
    }, 18000);
    // initial sample + score
    telemetry.sendTelemetry('owner');
    return () => { clearInterval(learn); clearInterval(guard); };
  }, [screen]);

  const exitTrap = async () => {
    if (verifyCode !== OWNER_CODE_HINT) { toast.error('Owner verification failed'); return; }
    try {
      await axios.post(`${API}/security/trap/deactivate`, { device_id: telemetry.deviceId, owner_code: verifyCode });
      setTrapActive(false); setOwnerVerify(false); setVerifyCode('');
      toast.success('Welcome back. Trap Mode cleared.');
    } catch (e) { toast.error('Could not deactivate'); }
  };

  // --- Stripe subscription pages ---
  if (path === '/subscription/success' || params.get('session_id')) {
    return <><Toaster position="top-center" theme="dark" /><SubscriptionSuccess onContinue={() => { window.history.pushState({}, '', '/'); setScreen('app'); }} /></>;
  }
  if (path === '/subscription/cancel') {
    return <><Toaster position="top-center" theme="dark" /><SubscriptionCancel onRetry={() => { window.history.pushState({}, '', '/'); setScreen('website'); }} onContinue={() => { window.history.pushState({}, '', '/'); setScreen('app'); }} /></>;
  }

  // --- Public website ---
  if (screen === 'website') {
    return (
      <>
        <Toaster position="top-center" theme="dark" />
        <DigitalMateWebsite onLaunchApp={() => setScreen('app')} />
      </>
    );
  }

  // --- Trap Mode decoy (full screen) ---
  if (trapActive) {
    return (
      <>
        <Toaster position="top-center" theme="dark" />
        <TrapDecoy onOwnerExit={() => setOwnerVerify(true)} />
        {ownerVerify && (
          <OwnerVerifyModal code={verifyCode} setCode={setVerifyCode} onConfirm={exitTrap} onClose={() => { setOwnerVerify(false); setVerifyCode(''); }} />
        )}
      </>
    );
  }

  // --- Vault flow ---
  if (showVault) {
    return <CalculatorVault onClose={() => setShowVault(false)} onVaultAccess={() => {}} />;
  }
  if (showDialer) {
    return <PhoneDialer onClose={() => setShowDialer(false)} onVaultUnlock={() => { setShowDialer(false); setShowVault(true); }} secretCode="8675309" />;
  }

  // --- Main security app ---
  return (
    <div className="min-h-screen bg-slate-950" data-testid="app-root">
      <Toaster position="top-center" theme="dark" />

      {tab === 'home' && (
        <SecurityDashboard
          onNavigate={setTab}
          onOpenVault={() => setShowDialer(true)}
          onOpenSettings={() => setShowSettings(true)}
          onSecretDemo={() => toast.info('Developer mode is disabled in this build')}
        />
      )}
      {tab === 'owner' && <ScreenWrap onBack={() => setTab('home')}><OwnerRecognition /></ScreenWrap>}
      {tab === 'recovery' && <RecoveryCenter />}
      {tab === 'evidence' && <EvidenceCenter />}
      {tab === 'mate' && (
        <div className="min-h-screen" data-testid="mate-screen">
          <AegisChat onClose={() => setTab('home')} userName="Owner" />
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex justify-around py-2 z-40" data-testid="bottom-nav">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id || (tab === 'owner' && n.id === 'home');
          return (
            <button key={n.id} onClick={() => setTab(n.id)} data-testid={`nav-${n.id}`}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${active ? 'text-cyan-400' : 'text-slate-500'}`}>
              <Icon size={22} />
              <span className="text-[10px] font-medium">{n.label}</span>
            </button>
          );
        })}
      </nav>

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} onWebsite={() => setScreen('website')} />
      )}
    </div>
  );
}

const ScreenWrap = ({ children, onBack }) => (
  <div className="min-h-screen bg-slate-950 pb-24">
    <button onClick={onBack} className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white p-2" data-testid="screen-back-btn"><X size={22} /></button>
    {children}
  </div>
);

const OwnerVerifyModal = ({ code, setCode, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" data-testid="owner-verify-modal">
    <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-5">
      <h3 className="text-white font-bold mb-1">Owner verification</h3>
      <p className="text-slate-400 text-sm mb-3">Enter your owner code to exit Trap Mode.</p>
      <input type="password" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)}
        placeholder="Owner code" data-testid="owner-verify-input"
        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-center tracking-widest focus:border-cyan-500 outline-none" />
      <button onClick={onConfirm} data-testid="owner-verify-confirm" className="w-full mt-4 py-3 rounded-xl bg-cyan-500 text-slate-900 font-bold">Verify &amp; exit</button>
      <button onClick={onClose} className="w-full mt-2 py-2 text-slate-400 text-sm">Cancel</button>
    </div>
  </div>
);

const SettingsPanel = ({ onClose, onWebsite }) => {
  const [resetting, setResetting] = useState(false);
  const reset = async () => {
    setResetting(true);
    await axios.post(`${API}/security/baseline/reset`, { device_id: telemetry.deviceId });
    toast.success('Owner recognition reset — re-learning your behaviour');
    setResetting(false);
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 p-5 overflow-y-auto" data-testid="settings-panel">
      <div className="flex items-center justify-between mb-6 pt-2">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-2" data-testid="settings-close"><X size={24} /></button>
      </div>
      <div className="space-y-3">
        <Row label="Device ID" value={telemetry.deviceId.slice(0, 16) + '…'} />
        <Row label="Owner recovery code" value="•••••" />
        <button onClick={reset} disabled={resetting} data-testid="reset-baseline-btn"
          className="w-full text-left bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-amber-400 font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
          {resetting ? 'Resetting…' : 'Reset owner recognition'}
        </button>
        <button onClick={onWebsite} data-testid="open-website-btn"
          className="w-full text-left bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-cyan-400 font-medium hover:bg-slate-800 transition-colors">
          View website &amp; plans
        </button>
      </div>
      <p className="text-slate-600 text-xs text-center mt-8">Digital Mate · Security &amp; recovery</p>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex justify-between">
    <span className="text-slate-300">{label}</span>
    <span className="text-slate-500 font-mono text-sm">{value}</span>
  </div>
);

export default App;
