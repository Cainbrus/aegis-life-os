import React, { useEffect, useState, useCallback } from 'react';
import { Fingerprint, Compass, FileClock, Bot, Lock, ChevronRight, Settings, Siren, ScanLine, Users, ShieldCheck } from 'lucide-react';
import telemetry from '../services/TelemetryService';
import LiveMonitor from './LiveMonitor';

const SecurityDashboard = ({ role = 'owner', onNavigate, onOpenSettings, onSecretDemo, onPanic, onLock }) => {
  const [status, setStatus] = useState(null);
  const [tap, setTap] = useState(0);
  const canManage = role === 'owner' || role === 'trusted';

  const refresh = useCallback(async () => {
    const s = await telemetry.status();
    setStatus(s);
  }, []);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 8000);
    return () => clearInterval(i);
  }, [refresh]);

  const trained = status?.trained;
  const lostMode = status?.lost_mode;
  const [confirmPanic, setConfirmPanic] = useState(false);

  const doPanic = () => { setConfirmPanic(false); onPanic?.(); };

  const handleTitleTap = () => {
    const n = tap + 1; setTap(n);
    if (n >= 7) { setTap(0); onSecretDemo?.(); }
    setTimeout(() => setTap(0), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-5 pb-32" data-testid="security-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between pt-3 mb-6">
        <div>
          <h1 onClick={handleTitleTap} className="text-2xl font-black text-white select-none cursor-default tracking-tight">Digital Mate</h1>
          <p className="text-slate-500 text-sm">Security &amp; recovery</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onLock} data-testid="lock-btn" className="text-slate-400 hover:text-white p-2" title="Hide app">
            <Lock size={20} />
          </button>
          <button onClick={onOpenSettings} data-testid="settings-btn" className="text-slate-400 hover:text-white p-2">
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* Live "Who's using my phone right now?" — the centerpiece */}
      <LiveMonitor />

      {/* Panic / Lost Phone — only owner/trusted */}
      {canManage && (
        <button onClick={() => setConfirmPanic(true)} data-testid="panic-btn"
          className={`w-full mb-5 rounded-2xl p-4 flex items-center justify-center gap-3 font-bold border transition-all ${lostMode ? 'bg-red-600/30 border-red-500/60 text-red-300' : 'bg-gradient-to-r from-red-600 to-rose-600 border-red-500/50 text-white hover:opacity-90'}`}>
          <Siren size={22} />
          {lostMode ? 'Lost Phone mode active — tracking' : 'Panic / Lost Phone'}
        </button>
      )}

      {/* Feature tiles */}
      <div className="space-y-3">
        <Tile icon={Fingerprint} title="Owner Recognition" subtitle={trained ? 'Model trained' : `${status?.samples_needed ?? 8} samples to go`} color="from-cyan-500 to-blue-500" onClick={() => onNavigate('owner')} testid="tile-owner" />
        <Tile icon={ShieldCheck} title="Protection Status" subtitle="Permissions &amp; device protection" color="from-emerald-500 to-green-600" onClick={() => onNavigate('status')} testid="tile-status" />
        <Tile icon={Lock} title="Hidden Vault" subtitle="Hide photos, files, notes &amp; passwords" color="from-fuchsia-500 to-purple-600" onClick={() => onNavigate('vault')} testid="tile-vault" />
        {canManage && <Tile icon={Users} title="Trusted Family" subtitle="Manage who's recognised" color="from-violet-500 to-purple-500" onClick={() => onNavigate('family')} testid="tile-family" />}
        {canManage && <Tile icon={Compass} title="Device Recovery" subtitle="Locate, lock or wipe" color="from-emerald-500 to-teal-500" onClick={() => onNavigate('recovery')} testid="tile-recovery" />}
        {canManage && <Tile icon={ScanLine} title="Privacy &amp; Security Scan" subtitle="Check what can access your phone" color="from-sky-500 to-cyan-500" onClick={() => onNavigate('privacy')} testid="tile-privacy" />}
        {canManage && <Tile icon={FileClock} title="Evidence Center" subtitle="Photos, locations &amp; events" color="from-amber-500 to-orange-500" onClick={() => onNavigate('evidence')} testid="tile-evidence" />}
        <Tile icon={Bot} title="AI Digital Mate" subtitle="Your security assistant" color="from-indigo-500 to-violet-500" onClick={() => onNavigate('mate')} testid="tile-mate" />
      </div>

      {confirmPanic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" data-testid="panic-confirm-modal">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-red-500/40 p-5">
            <div className="flex items-center gap-2 text-red-400 mb-2"><Siren size={20} /><h3 className="font-bold text-white">Activate Lost Phone mode?</h3></div>
            <p className="text-slate-400 text-sm mb-4">This locks the device, starts live location tracking, captures a photo and alerts you.</p>
            <button onClick={doPanic} data-testid="panic-confirm-btn" className="w-full py-3 rounded-xl bg-red-500 text-white font-bold">Yes, activate now</button>
            <button onClick={() => setConfirmPanic(false)} className="w-full mt-2 py-2 text-slate-400 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Tile = ({ icon: Icon, title, subtitle, color, onClick, testid }) => (
  <button onClick={onClick} data-testid={testid}
    className="w-full bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80 hover:border-slate-600 transition-all flex items-center gap-4 group">
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="text-left flex-1 min-w-0">
      <p className="text-white font-semibold">{title}</p>
      <p className="text-slate-400 text-sm truncate">{subtitle}</p>
    </div>
    <ChevronRight className="text-slate-600 group-hover:text-slate-400 transition-colors" size={20} />
  </button>
);

export default SecurityDashboard;
