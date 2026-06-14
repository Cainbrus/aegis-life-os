import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { Shield, Compass, FileClock, Bot, X } from 'lucide-react';

import SecurityDashboard from './components/SecurityDashboard';
import OwnerRecognition from './components/OwnerRecognition';
import EvidenceCenter from './components/EvidenceCenter';
import RecoveryCenter from './components/RecoveryCenter';
import PrivacyScan from './components/PrivacyScan';
import SetupWizard from './components/SetupWizard';
import CoverScreen from './components/CoverScreen';
import AISecurityAdvisor from './components/AISecurityAdvisor';
import FamilyManager from './components/FamilyManager';
import DecoyMode from './components/DecoyMode';
import SecurityChecklist from './components/SecurityChecklist';
import VaultScreen from './components/VaultScreen';
import DigitalMateWebsite from './components/DigitalMateWebsite';
import { SubscriptionSuccess, SubscriptionCancel } from './components/SubscriptionPages';
import telemetry from './services/TelemetryService';
import { requestNotificationPermission, sendAlert } from './services/PushNotificationService';
import { isNative, nativeConfigure, nativeBondedDevices, nativeLock, nativeStartRecovery, nativeIsAdminActive, nativeRequestAdmin } from './services/NativeBridge';
import './App.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
  const [showSettings, setShowSettings] = useState(false);
  const [configured, setConfigured] = useState(null); // null=checking, true, false
  const [coverApp, setCoverApp] = useState('calculator');
  const [unlocked, setUnlocked] = useState(false);     // dashboard opens only after Access code
  const [role, setRole] = useState('owner');           // role of the profile that unlocked
  const [trapLevel, setTrapLevel] = useState(0);       // live trap level from owner-recognition
  const [decoySuppressed, setDecoySuppressed] = useState(false); // owner proved themselves this session
  const [decoyExit, setDecoyExit] = useState(false);
  const [exitCode, setExitCode] = useState('');

  // Navigate + tell the recognition engine which screen is in use (app-usage habit)
  const go = (t) => { setTab(t); telemetry.setScreen(t); };

  // refs for silent trap escalation handling
  const capturedRef = useRef(false);
  const notifiedRef = useRef(false);
  const trackRef = useRef(null);

  const startTracking = () => {
    if (trackRef.current) return;
    telemetry.reportLocation();
    trackRef.current = setInterval(() => telemetry.reportLocation(), 120000); // every 2 min
  };
  const stopTracking = () => {
    if (trackRef.current) { clearInterval(trackRef.current); trackRef.current = null; }
  };

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

  // Check first-run setup status when entering the app (initial check only).
  // Use a cancel flag + functional update so a late/stale response can NEVER overwrite a
  // user-driven change (e.g. after the owner finishes setup -> configured must stay true).
  useEffect(() => {
    if (screen !== 'app') return undefined;
    let cancelled = false;
    telemetry.setupStatus().then((s) => {
      if (cancelled) return;
      setConfigured((prev) => (prev === null ? !!(s && s.configured) : prev));
      if (s && s.cover_app) setCoverApp(s.cover_app);
    });
    return () => { cancelled = true; };
  }, [screen]);

  // Start behavioural telemetry only once the dashboard is unlocked (real owner inside)
  useEffect(() => {
    if (screen !== 'app' || !unlocked) return;
    telemetry.start();
    requestNotificationPermission();

    const learn = setInterval(() => { telemetry.sendTelemetry('owner'); }, 12000);
    const guard = setInterval(async () => {
      const r = await telemetry.score();
      if (!r) return;
      const level = r.trap_level || 0;
      setTrapLevel(level);

      // SILENT escalation — the user sees no change; everything happens in the background.
      if (level >= 2 && !capturedRef.current) {
        capturedRef.current = true;
        telemetry.capturePhoto(level);
        startTracking();
      }
      if (level >= 3 && !notifiedRef.current) {
        notifiedRef.current = true;
        sendAlert('Possible theft detected. Recovery mode activated and device locked.', 'security');
      }
      if (level === 0) {
        capturedRef.current = false;
        notifiedRef.current = false;
        setDecoySuppressed(false);
        stopTracking();
      }
    }, 18000);

    telemetry.sendTelemetry('owner');
    telemetry.score().then((r) => { if (r) setTrapLevel(r.trap_level || 0); });  // immediate live score + trap level
    return () => { clearInterval(learn); clearInterval(guard); stopTracking(); };
  }, [screen, unlocked]);

  // Cover-screen submit: try Access code -> unlock; else try a secret recovery trigger (silent)
  const handleCoverSubmit = async (code) => {
    if (!code || code.length < 4) return 'none';
    const r = await telemetry.verifyAccess(code);
    if (r && r.verified) {
      setUnlocked(true); setRole(r.role || 'owner'); telemetry.setScreen('home');
      // Configure the native layer (background receivers/services) with the owner's settings
      if (isNative()) {
        const st = await telemetry.setupStatus();
        nativeConfigure({
          backendUrl: process.env.REACT_APP_BACKEND_URL,
          deviceId: telemetry.deviceId,
          trustedNumbers: (st?.trusted_numbers || []).concat(st?.backup_numbers || []).join(','),
          callCount: 3, callWindowSec: 300,
        });
        nativeBondedDevices().then((devs) => { telemetry.knownDevice = devs && devs.length ? 1 : 0; });
      }
      return 'unlocked';
    }
    const t = await telemetry.triggerRecovery(code);
    if (t && t.triggered) return 'recovery';  // silent — cover behaves normally
    return 'none';
  };

  const handlePanic = async () => {
    await telemetry.panic();
    telemetry.capturePhoto(3);
    startTracking();
    if (isNative()) { nativeLock(); nativeStartRecovery(); }  // real device lock + background tracking
    sendAlert('Lost Phone mode activated. Live tracking and remote lock are on.', 'emergency');
    go('recovery');
    toast.success('Panic activated — device locked & tracking started');
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

  // --- First-run setup gate (no default codes exist) ---
  if (configured === null) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500" data-testid="app-loading">Loading…</div>;
  }
  if (configured === false) {
    return (
      <>
        <Toaster position="top-center" theme="dark" />
        <SetupWizard onDone={() => { setConfigured(true); setUnlocked(false); }} />
      </>
    );
  }

  // --- Stealth cover (Calculator/Clock/Notes). Dashboard opens only with the Access code. ---
  if (!unlocked) {
    return (
      <>
        <Toaster position="top-center" theme="dark" />
        <CoverScreen cover={coverApp} onSubmit={handleCoverSubmit} />
      </>
    );
  }

  // --- Decoy / Fake Phone: unrecognised user (low trust) is silently shown a believable fake phone ---
  if (trapLevel >= 2 && !decoySuppressed) {
    return (
      <>
        <Toaster position="top-center" theme="dark" />
        <DecoyMode onOwnerExit={() => setDecoyExit(true)} />
        {decoyExit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" data-testid="decoy-exit-modal">
            <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-5">
              <h3 className="text-white font-bold mb-1">Owner verification</h3>
              <p className="text-slate-400 text-sm mb-3">Enter your access code to return to Digital Mate.</p>
              <input type="password" inputMode="numeric" value={exitCode} onChange={(e) => setExitCode(e.target.value)}
                placeholder="Access code" data-testid="decoy-exit-input"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-center tracking-widest focus:border-cyan-500 outline-none" />
              <button onClick={async () => {
                const r = await telemetry.verifyAccess(exitCode);
                if (r && r.verified) { setDecoySuppressed(true); setDecoyExit(false); setExitCode(''); toast.success('Welcome back'); }
                else toast.error('Incorrect code');
              }} data-testid="decoy-exit-confirm" className="w-full mt-4 py-3 rounded-xl bg-cyan-500 text-slate-900 font-bold">Unlock</button>
              <button onClick={() => { setDecoyExit(false); setExitCode(''); }} className="w-full mt-2 py-2 text-slate-400 text-sm">Cancel</button>
            </div>
          </div>
        )}
      </>
    );
  }

  // --- Main security app ---
  return (
    <div className="min-h-screen bg-slate-950" data-testid="app-root">
      <Toaster position="top-center" theme="dark" />

      {tab === 'home' && (
        <SecurityDashboard
          role={role}
          onNavigate={go}
          onOpenSettings={() => setShowSettings(true)}
          onPanic={handlePanic}
          onLock={() => { setUnlocked(false); setRole('owner'); setTab('home'); }}
          onSecretDemo={() => toast.info('Developer mode is disabled in this build')}
        />
      )}
      {tab === 'owner' && <ScreenWrap onBack={() => go('home')}><OwnerRecognition /></ScreenWrap>}
      {tab === 'privacy' && <ScreenWrap onBack={() => go('home')}><PrivacyScan /></ScreenWrap>}
      {tab === 'status' && <ScreenWrap onBack={() => go('home')}><SecurityChecklist /></ScreenWrap>}
      {tab === 'vault' && <ScreenWrap onBack={() => go('home')}><VaultScreen /></ScreenWrap>}
      {tab === 'family' && <ScreenWrap onBack={() => go('home')}><FamilyManager /></ScreenWrap>}
      {tab === 'recovery' && <RecoveryCenter />}
      {tab === 'evidence' && <EvidenceCenter />}
      {tab === 'mate' && (
        <div className="min-h-screen" data-testid="mate-screen">
          <AISecurityAdvisor />
        </div>
      )}

      {/* Bottom nav — limited/guest profiles only see Home + Mate */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex justify-around py-2 z-[10000]" data-testid="bottom-nav">
        {NAV.filter((n) => (role === 'owner' || role === 'trusted') || ['home', 'mate'].includes(n.id)).map((n) => {
          const Icon = n.icon;
          const active = tab === n.id || (['owner', 'privacy', 'family', 'status', 'vault'].includes(tab) && n.id === 'home');
          return (
            <button key={n.id} onClick={() => go(n.id)} data-testid={`nav-${n.id}`}
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
  <div className="min-h-screen bg-slate-950 pb-28 overflow-y-auto">
    <button onClick={onBack} className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white p-2" data-testid="screen-back-btn"><X size={22} /></button>
    {children}
  </div>
);

const SettingsPanel = ({ onClose, onWebsite }) => {
  const [resetting, setResetting] = useState(false);
  const [adminActive, setAdminActive] = useState(false);
  useEffect(() => { if (isNative()) nativeIsAdminActive().then(setAdminActive); }, []);
  const reset = async () => {
    setResetting(true);
    await axios.post(`${API}/security/baseline/reset`, { device_id: telemetry.deviceId });
    toast.success('Owner recognition reset — re-learning your behaviour');
    setResetting(false);
  };
  const enableProtection = async () => {
    await nativeRequestAdmin();
    toast.info('Grant Device Admin to enable remote lock & wipe');
    setTimeout(() => nativeIsAdminActive().then(setAdminActive), 1500);
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
        {isNative() && (
          <button onClick={enableProtection} data-testid="enable-protection-btn"
            className={`w-full text-left border rounded-xl p-4 font-medium transition-colors ${adminActive ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/60 border-slate-700 text-cyan-400 hover:bg-slate-800'}`}>
            {adminActive ? 'Device protection enabled ✓' : 'Enable device protection (remote lock/wipe)'}
          </button>
        )}
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
