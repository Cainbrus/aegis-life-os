import React, { useEffect, useState, useCallback } from 'react';
import { Shield, Fingerprint, Compass, FileClock, Bot, Ghost, ChevronRight, Settings, Siren } from 'lucide-react';
import telemetry from '../services/TelemetryService';

const SecurityDashboard = ({ onNavigate, onOpenVault, onOpenSettings, onSecretDemo, onPanic }) => {
  const [status, setStatus] = useState(null);
  const [tap, setTap] = useState(0);

  const refresh = useCallback(async () => {
    const s = await telemetry.status();
    setStatus(s);
  }, []);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 8000);
    return () => clearInterval(i);
  }, [refresh]);

  const trapActive = status?.trap_active;
  const trust = Math.round((status?.trust_score ?? 1) * 100);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-5 pb-24" data-testid="security-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between pt-3 mb-6">
        <div>
          <h1 onClick={handleTitleTap} className="text-2xl font-black text-white select-none cursor-default tracking-tight">Digital Mate</h1>
          <p className="text-slate-500 text-sm">Security &amp; recovery</p>
        </div>
        <button onClick={onOpenSettings} data-testid="settings-btn" className="text-slate-400 hover:text-white p-2">
          <Settings size={22} />
        </button>
      </div>

      {/* Protection status hero */}
      <div className={`rounded-3xl p-6 mb-5 border ${trapActive ? 'bg-gradient-to-br from-red-950/60 to-orange-950/40 border-red-500/40' : 'bg-gradient-to-br from-emerald-950/50 to-cyan-950/40 border-emerald-500/30'}`} data-testid="protection-hero">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${trapActive ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
            {trapActive ? <Ghost className="text-red-400" size={24} /> : <Shield className="text-emerald-400" size={24} />}
          </div>
          <div>
            <p className={`font-bold text-lg ${trapActive ? 'text-red-400' : 'text-emerald-400'}`}>
              {trapActive ? 'Trap Mode Active' : 'Protected'}
            </p>
            <p className="text-slate-400 text-sm">
              {trapActive ? 'Decoy shown to unrecognized user' : trained ? 'Owner recognition online' : 'Learning your behaviour'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Trust" value={`${trust}%`} color={trust >= 60 ? 'text-cyan-400' : 'text-red-400'} testid="stat-trust" />
          <Stat label="Threats" value={status?.threats_blocked ?? 0} color="text-amber-400" testid="stat-threats" />
          <Stat label="Intruders" value={status?.intruders_detected ?? 0} color="text-red-400" testid="stat-intruders" />
        </div>
      </div>

      {/* Panic / Lost Phone */}
      <button onClick={() => setConfirmPanic(true)} data-testid="panic-btn"
        className={`w-full mb-5 rounded-2xl p-4 flex items-center justify-center gap-3 font-bold border transition-all ${lostMode ? 'bg-red-600/30 border-red-500/60 text-red-300' : 'bg-gradient-to-r from-red-600 to-rose-600 border-red-500/50 text-white hover:opacity-90'}`}>
        <Siren size={22} />
        {lostMode ? 'Lost Phone mode active — tracking' : 'Panic / Lost Phone'}
      </button>

      {/* Feature tiles */}
      <div className="space-y-3">
        <Tile icon={Fingerprint} title="Owner Recognition" subtitle={trained ? 'Model trained' : `${status?.samples_needed ?? 8} samples to go`} color="from-cyan-500 to-blue-500" onClick={() => onNavigate('owner')} testid="tile-owner" />
        <Tile icon={Ghost} title="Invisible Vault" subtitle="Dial your secret code to open" color="from-purple-500 to-fuchsia-500" onClick={onOpenVault} testid="tile-vault" />
        <Tile icon={Compass} title="Device Recovery" subtitle="Locate, lock or wipe" color="from-emerald-500 to-teal-500" onClick={() => onNavigate('recovery')} testid="tile-recovery" />
        <Tile icon={FileClock} title="Evidence Center" subtitle="Photos, locations &amp; events" color="from-amber-500 to-orange-500" onClick={() => onNavigate('evidence')} testid="tile-evidence" />
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

const Stat = ({ label, value, color, testid }) => (
  <div className="bg-black/30 rounded-xl p-3 text-center" data-testid={testid}>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
    <p className="text-slate-500 text-xs mt-0.5">{label}</p>
  </div>
);

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
