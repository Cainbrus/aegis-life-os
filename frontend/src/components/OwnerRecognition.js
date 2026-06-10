import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Fingerprint, Activity, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import telemetry from '../services/TelemetryService';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SIGNAL_LABELS = {
  typing_speed: 'Typing rhythm',
  typing_variance: 'Typing consistency',
  touch_duration: 'Touch dynamics',
  swipe_velocity: 'Swipe motion',
  motion_avg: 'Device motion',
  hour_of_day: 'Usage time',
};

const OwnerRecognition = () => {
  const [status, setStatus] = useState(null);
  const [score, setScore] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const s = await telemetry.status();
    setStatus(s);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const trainSamples = async () => {
    setBusy(true);
    // Capture enough owner samples in one action to build the baseline.
    for (let i = 0; i < 8; i++) {
      await telemetry.sendTelemetry('owner');
      await new Promise((r) => setTimeout(r, 150));
    }
    await refresh();
    setBusy(false);
  };

  const runScore = async () => {
    setBusy(true);
    const r = await telemetry.score();
    setScore(r);
    await refresh();
    setBusy(false);
  };

  const trained = status?.trained;
  const needed = status?.samples_needed ?? 8;
  const progress = Math.min(100, Math.round(((8 - needed) / 8) * 100));
  const trust = score ? Math.round(score.trust_score * 100) : Math.round((status?.trust_score ?? 1) * 100);

  return (
    <div className="p-5 space-y-6" data-testid="owner-recognition-screen">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Fingerprint className="text-cyan-400" size={26} /> Owner Recognition
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Learns how you hold, type and move — not just your PIN.
        </p>
      </div>

      {/* Trust gauge */}
      <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-6 text-center" data-testid="trust-gauge">
        <div className="relative inline-flex items-center justify-center">
          <svg width="160" height="160" className="-rotate-90">
            <circle cx="80" cy="80" r="68" stroke="#1e293b" strokeWidth="12" fill="none" />
            <circle cx="80" cy="80" r="68" strokeWidth="12" fill="none" strokeLinecap="round"
              stroke={trust >= 60 ? '#22d3ee' : '#f87171'}
              strokeDasharray={2 * Math.PI * 68}
              strokeDashoffset={2 * Math.PI * 68 * (1 - trust / 100)}
              style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }} />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black text-white" data-testid="trust-score-value">{trust}%</span>
            <span className="text-xs text-slate-400">trust score</span>
          </div>
        </div>
        <p className={`mt-3 font-semibold flex items-center justify-center gap-2 ${trust >= 60 ? 'text-cyan-400' : 'text-red-400'}`}>
          {trust >= 60 ? <><ShieldCheck size={18} /> Recognized as owner</> : <><AlertTriangle size={18} /> Unrecognized user</>}
        </p>
      </div>

      {/* Training state */}
      <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold flex items-center gap-2"><Activity size={18} className="text-emerald-400" /> Behavioural model</span>
          <span className={`text-xs px-2 py-1 rounded-full ${trained ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {trained ? 'Trained' : 'Learning'}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-700" style={{ width: `${trained ? 100 : progress}%` }} />
        </div>
        <p className="text-slate-400 text-xs mt-2">
          {trained ? `Model trained on ${status?.sample_count} samples.` : `${needed} more samples needed to build your baseline.`}
        </p>
        <div className="flex gap-3 mt-4">
          <button onClick={trainSamples} disabled={busy} data-testid="train-baseline-btn"
            className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium disabled:opacity-50 transition-colors">
            {busy ? 'Capturing…' : 'Capture my behaviour'}
          </button>
          <button onClick={runScore} disabled={busy} data-testid="run-score-btn"
            className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-sm font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            <RefreshCw size={15} /> Verify me now
          </button>
        </div>
      </div>

      {/* Live signals */}
      {score?.signals && (
        <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-5" data-testid="signal-breakdown">
          <h3 className="text-white font-semibold mb-3">Live signal match</h3>
          <div className="space-y-3">
            {Object.entries(score.signals).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{SIGNAL_LABELS[k] || k}</span>
                  <span className="text-slate-400">{Math.round(v * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full">
                  <div className={`h-full rounded-full ${v >= 0.6 ? 'bg-cyan-400' : 'bg-red-400'}`} style={{ width: `${Math.round(v * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerRecognition;
