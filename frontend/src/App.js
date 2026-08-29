import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { Shield, Compass, FileClock, Bot, X, LayoutDashboard } from 'lucide-react';

import SecurityDashboard from './components/SecurityDashboard';
import AdminDashboard from './components/AdminDashboard';
import OwnerRecognition from './components/OwnerRecognition';
import EvidenceCenter from './components/EvidenceCenter';
import RecoveryCenter from './components/RecoveryCenter';
import PrivacyScan from './components/PrivacyScan';
import SetupWizard from './components/SetupWizard';
import CoverScreen from './components/CoverScreen';
import AISecurityAdvisor from './components/AISecurityAdvisor';
import FamilyManager from './components/FamilyManager';
import FamilyTracking from './components/FamilyTracking';
import DecoyMode from './components/DecoyMode';
import DecoyProfileEditor from './components/DecoyProfileEditor';
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
  { id: 'admin', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'home', label: 'Home', icon: Shield },
  { id: 'recovery', label: 'Recovery', icon: Compass },
  { id: 'evidence', label: 'Evidence', icon: FileClock },
  { id: 'mate', label: 'Mate', icon: Bot },
];

function App() {
  // 'website' (public landing) or 'app' (security app)
  const [screen, setScreen] = useState('website');
  const [tab, setTab] = useState('admin');
  const [showSettings, setShowSettings] = useState(false);
  const [configured, setConfigured] = useState(null); // null=checking, true, false
  const [coverApp, setCoverApp] = useState('calculator');
  const [unlocked, setUnlocked] = useState(false);     // dashboard opens only after Access code
  const [role, setRole] = useState('owner');           // role of the profile that unlocked
  const [trapLevel, setTrapLevel] = useState(0);       // live trap level from owner-recognition
  const [decoySuppressed, setDecoySuppressed] = useState(false); // owner proved themselves this session
  const [decoyExit, setDecoyExit] = useState(false);
  const [exitCode, setExitCode] = useState('');
  const [forceDecoy, setForceDecoy] = useState(false);  // too many wrong codes -> decoy
  const failCountRef = useRef(0);

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
  // Check localStorage first (works offline on Android), then try backend.
  useEffect(() => {
    if (screen !== 'app') return undefined;
    
    // Check localStorage first (reliable on Android)
    const localConfigured = localStorage.getItem('dm_configured') === 'true';
    const localCover = localStorage.getItem('dm_cover_app');
    
    if (localConfigured) {
      setConfigured(true);
      if (localCover) setCoverApp(localCover);
      return;
    }
    
    // Try backend as fallback
    let cancelled = false;
    telemetry.setupStatus().then((s) => {
      if (cancelled) return;
      if (s && s.configured) {
        setConfigured(true);
        if (s.cover_app) setCoverApp(s.cover_app);
      } else {
        setConfigured(false);
      }
    }).catch(() => {
      if (!cancelled) setConfigured(false);
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
        telemetry.setupStatus().then((st) => {
          nativeConfigure({
            backendUrl: process.env.REACT_APP_BACKEND_URL,
            deviceId: telemetry.deviceId,
            trustedNumbers: (st?.trusted_numbers || []).concat(st?.backup_numbers || []).join(','),
            callCount: 3, callWindowSec: 300,
          });
        });
        nativeBondedDevices().then((devs) => { telemetry.knownDevice = devs && devs.length ? 1 : 0; });
      }
      return 'unlocked';
    }
    
    // Wrong code: after too many failed attempts, silently drop into the Decoy phone.
    failCountRef.current += 1;
    if (failCountRef.current >= 5) {
      failCountRef.current = 0;
      setForceDecoy(true);
      axios.post(`${API}/security/events`, {
        device_id: telemetry.deviceId, type: 'access_attempt', severity: 'critical',
        title: 'Repeated wrong access codes', detail: '5+ failed access attempts on the cover. Decoy shown.',
      }).catch(() => {});
    }
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
    return <div className="min-h-screen bg-[#0B1121] flex items-center justify-center text-slate-500" data-testid="app-loading">Loading…</div>;
  }
  if (configured === false) {
    return (
      <>
        <Toaster position="top-center" theme="dark" />
        <SetupWizard onDone={(action) => { 
          setConfigured(true); 
          if (action === 'dashboard') {
            setUnlocked(true);
            setTab('admin');
          } else {
            // User chose to return to phone - show cover on next open
            setUnlocked(false); 
          }
        }} />
      </>
    );
  }

  // --- Decoy / Fake Phone: ONLY show when forceDecoy is explicitly true (wrong codes entered) ---
  // Never show decoy automatically based on trapLevel - only on explicit wrong code trigger
  const resetSetup = () => {
    telemetry.setSessionToken(null);
    localStorage.removeItem('dm_access_enc');
    localStorage.removeItem('dm_recovery_enc');
    localStorage.removeItem('dm_access_code');
    localStorage.removeItem('dm_recovery_code');
    localStorage.removeItem('dm_access_hash');
    localStorage.removeItem('dm_recovery_hash');
    localStorage.removeItem('dm_cover_app');
    localStorage.removeItem('dm_configured');
    localStorage.removeItem('dm_device_id');
    window.location.reload();
  };
  
  // Owner exit from decoy - no verification, just open dashboard
  const handleDecoyOwnerExit = () => {
    setUnlocked(true);
    setRole('owner');
    setForceDecoy(false);
    setDecoySuppressed(true);
    setTab('admin');
    toast.success('Welcome back');
  };

  // Test decoy button handler (for Admin Dashboard)
  const handleTestDecoy = () => {
    setForceDecoy(true);
    setDecoySuppressed(false);
  };
  
  // DECOY: Only show if forceDecoy is explicitly set (from wrong codes or test button)
  if (forceDecoy && !decoySuppressed) {
    return (
      <>
        <Toaster position="top-center" theme="dark" />
        <DecoyMode onOwnerExit={handleDecoyOwnerExit} />
        {/* Reset Setup floating button */}
        <button 
          onClick={resetSetup}
          className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium"
          data-testid="decoy-reset-setup"
        >
          Reset Setup
        </button>
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

  // --- Main security app ---
  return (
    <div className="min-h-screen bg-[#0B1121]" data-testid="app-root">
      <Toaster position="top-center" theme="dark" />

      {tab === 'admin' && (
        <AdminDashboard 
          onNavigate={go}
          onTestDecoy={handleTestDecoy}
          onResetSetup={resetSetup}
        />
      )}
      {tab === 'home' && (
        <SecurityDashboard
          role={role}
          onNavigate={go}
          onOpenSettings={() => setShowSettings(true)}
          onPanic={handlePanic}
          onLock={() => { setUnlocked(false); setRole('owner'); setTab('admin'); telemetry.setSessionToken(null); }}
          onSecretDemo={() => toast.info('Developer mode is disabled in this build')}
        />
      )}
      {tab === 'owner' && <ScreenWrap onBack={() => go('admin')}><OwnerRecognition /></ScreenWrap>}
      {tab === 'privacy' && <ScreenWrap onBack={() => go('admin')}><PrivacyScan /></ScreenWrap>}
      {tab === 'status' && <ScreenWrap onBack={() => go('admin')}><SecurityChecklist onNavigate={go} /></ScreenWrap>}
      {tab === 'vault' && <ScreenWrap onBack={() => go('admin')}><VaultScreen /></ScreenWrap>}
      {tab === 'decoy' && <ScreenWrap onBack={() => go('admin')}><DecoyProfileEditor /></ScreenWrap>}
      {tab === 'family' && <ScreenWrap onBack={() => go('admin')}><FamilyTracking /></ScreenWrap>}
      {tab === 'profiles' && <ScreenWrap onBack={() => go('admin')}><FamilyManager /></ScreenWrap>}
      {tab === 'recovery' && <RecoveryCenter />}
      {tab === 'evidence' && <EvidenceCenter />}
      {tab === 'mate' && (
        <div className="min-h-screen" data-testid="mate-screen">
          <AISecurityAdvisor />
        </div>
      )}

      {/* Bottom nav — limited/guest profiles only see Dashboard + Mate */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex justify-around py-2 z-[10000]" data-testid="bottom-nav">
        {NAV.filter((n) => (role === 'owner' || role === 'trusted') || ['admin', 'mate'].includes(n.id)).map((n) => {
          const Icon = n.icon;
          const active = tab === n.id || (['owner', 'privacy', 'family', 'status', 'vault', 'profiles', 'decoy'].includes(tab) && n.id === 'admin');
          return (
            <button key={n.id} onClick={() => go(n.id)} data-testid={`nav-${n.id}`}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${active ? 'text-blue-400' : 'text-slate-500'}`}>
              <Icon size={22} />
              <span className="text-[10px] font-medium">{n.label}</span>
            </button>
          );
        })}
      </nav>

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} onWebsite={() => setScreen('website')} onProfiles={() => { setShowSettings(false); go('profiles'); }} onFamily={() => { setShowSettings(false); go('family'); }} />
      )}
    </div>
  );
}

const ScreenWrap = ({ children, onBack }) => (
  <div className="min-h-screen bg-[#0B1121] pb-28 overflow-y-auto">
    <button onClick={onBack} className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white p-2" data-testid="screen-back-btn"><X size={22} /></button>
    {children}
  </div>
);

const SettingsPanel = ({ onClose, onWebsite, onProfiles, onFamily, onResetSetup }) => {
  const [resetting, setResetting] = useState(false);
  const [adminActive, setAdminActive] = useState(false);
  useEffect(() => { if (isNative()) nativeIsAdminActive().then(setAdminActive); }, []);
  const reset = async () => {
    setResetting(true);
    await axios.post(`${API}/security/baseline/reset`, { device_id: telemetry.deviceId });
    toast.success('Owner recognition reset — re-learning your behaviour');
    setResetting(false);
  };
  const resetSetup = () => {
    if (window.confirm('This will clear all codes and settings. You will need to set up Digital Mate again. Continue?')) {
      localStorage.removeItem('dm_access_enc');
      localStorage.removeItem('dm_recovery_enc');
      localStorage.removeItem('dm_access_code');
      localStorage.removeItem('dm_recovery_code');
      localStorage.removeItem('dm_access_hash');
      localStorage.removeItem('dm_recovery_hash');
      localStorage.removeItem('dm_cover_app');
      localStorage.removeItem('dm_configured');
      localStorage.removeItem('dm_device_id');
      toast.success('Setup cleared — reloading...');
      setTimeout(() => window.location.reload(), 1000);
    }
  };
  const enableProtection = async () => {
    await nativeRequestAdmin();
    toast.info('Grant Device Admin to enable remote lock & wipe');
    setTimeout(() => nativeIsAdminActive().then(setAdminActive), 1500);
  };
  return (
    <div className="fixed inset-0 z-50 bg-[#0B1121] p-5 overflow-y-auto" data-testid="settings-panel">
      <div className="flex items-center justify-between mb-6 pt-2">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-2" data-testid="settings-close"><X size={24} /></button>
      </div>
      <div className="space-y-3">
        <Row label="Device ID" value={telemetry.deviceId.slice(0, 16) + '…'} />
        <Row label="Owner recovery code" value="•••••" />
        {isNative() && (
          <button onClick={enableProtection} data-testid="enable-protection-btn"
            className={`w-full text-left border rounded-xl p-4 font-medium transition-colors ${adminActive ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/60 border-slate-700 text-blue-400 hover:bg-slate-800'}`}>
            {adminActive ? 'Device protection enabled ✓' : 'Enable device protection (remote lock/wipe)'}
          </button>
        )}
        <button onClick={reset} disabled={resetting} data-testid="reset-baseline-btn"
          className="w-full text-left bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-amber-400 font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
          {resetting ? 'Resetting…' : 'Reset owner recognition'}
        </button>
        <button onClick={onProfiles} data-testid="open-profiles-btn"
          className="w-full text-left bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-blue-400 font-medium hover:bg-slate-800 transition-colors">
          Who can unlock this phone (access profiles)
        </button>
        <button onClick={onFamily} data-testid="open-family-btn"
          className="w-full text-left bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-violet-400 font-medium hover:bg-slate-800 transition-colors">
          Family tracking &amp; sharing
        </button>
        <button onClick={onWebsite} data-testid="open-website-btn"
          className="w-full text-left bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-blue-400 font-medium hover:bg-slate-800 transition-colors">
          View website &amp; plans
        </button>
        <button onClick={resetSetup} data-testid="reset-setup-btn"
          className="w-full text-left bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 font-medium hover:bg-red-500/20 transition-colors">
          Reset Setup
        </button>
      </div>
      <p className="text-slate-600 text-xs text-center mt-8">Digital Mate · Security &amp; recovery</p>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex justify-between">
    <span className="text-slate-300">{label}</span>
    <span className="text-slate-500 font-mono text-sm">{value}</span>
  </div>
);

export default App;
