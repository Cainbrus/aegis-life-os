import React, { useEffect, useState, useCallback } from 'react';
import { Fingerprint, ShieldCheck, Loader } from 'lucide-react';
import telemetry from '../services/TelemetryService';

// Stealth owner recognition. No score, no buttons, no graphs — it learns silently in the
// background. Shows only "Learning" or "Trained". Once trained, the dashboard hides this entirely.
const OwnerRecognition = () => {
  const [status, setStatus] = useState(null);

  const refresh = useCallback(async () => {
    setStatus(await telemetry.status());
  }, []);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 6000);
    return () => clearInterval(i);
  }, [refresh]);

  const trained = status?.trained;

  return (
    <div className="p-5 space-y-6" data-testid="owner-recognition-screen">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Fingerprint className="text-cyan-400" size={26} /> Owner Recognition
        </h2>
        <p className="text-slate-400 text-sm mt-1">Digital Mate quietly learns how you use your phone.</p>
      </div>

      <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-8 text-center" data-testid="recognition-status">
        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${trained ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
          {trained ? <ShieldCheck className="text-emerald-400" size={32} /> : <Loader className="text-amber-400 animate-spin" size={30} />}
        </div>
        <p className={`text-xl font-bold ${trained ? 'text-emerald-400' : 'text-amber-400'}`} data-testid="recognition-state">
          {trained ? 'Trained' : 'Learning'}
        </p>
        <p className="text-slate-400 text-sm mt-2">
          {trained
            ? 'Protection is active. You can forget Digital Mate is here.'
            : 'Just use your phone normally — no setup needed.'}
        </p>
      </div>

      <div className="rounded-2xl bg-slate-800/40 border border-slate-700/60 p-5">
        <p className="text-slate-300 text-sm mb-2 font-medium">Learning quietly in the background</p>
        <ul className="text-slate-500 text-sm space-y-1.5">
          <li>· Typing rhythm</li>
          <li>· Swipe &amp; touch patterns</li>
          <li>· Device movement</li>
          <li>· Unlock &amp; usage habits</li>
        </ul>
      </div>
    </div>
  );
};

export default OwnerRecognition;
