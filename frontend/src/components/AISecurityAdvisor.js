import React, { useState, useEffect, useCallback } from 'react';
import { Bot, RefreshCw, ShieldCheck, AlertTriangle, ShieldAlert, Info, Sparkles } from 'lucide-react';
import telemetry from '../services/TelemetryService';

// AI Security Advisor — NOT a chat clone. Turns the device's real security signals
// (recognition status, suspicious activity, battery, privacy) into prioritized insights.
const SEV = {
  critical: { color: 'text-red-400', ring: 'border-red-500/40 bg-red-500/5', Icon: ShieldAlert },
  warning: { color: 'text-amber-400', ring: 'border-amber-500/40 bg-amber-500/5', Icon: AlertTriangle },
  info: { color: 'text-emerald-400', ring: 'border-emerald-500/30 bg-emerald-500/5', Icon: ShieldCheck },
};

const AISecurityAdvisor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    setLoading(true);
    const r = await telemetry.aiInsights();
    setData(r);
    setLoading(false);
  }, []);

  useEffect(() => { run(); }, [run]);

  return (
    <div className="min-h-screen bg-[#0B1121] p-5 pb-24" data-testid="ai-advisor-screen">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bot className="text-indigo-400" size={26} /> AI Security Advisor
        </h2>
        <button onClick={run} disabled={loading} data-testid="advisor-refresh" className="text-indigo-400 p-2 disabled:opacity-50">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <p className="text-slate-400 text-sm mb-5 flex items-center gap-1">
        <Sparkles size={13} className="text-indigo-400" /> Insights from your phone's real security signals.
      </p>

      {loading ? (
        <p className="text-slate-500 text-sm">Analysing your device…</p>
      ) : !data || !data.insights?.length ? (
        <p className="text-slate-500 text-sm">No insights available yet.</p>
      ) : (
        <div className="space-y-3" data-testid="advisor-insights">
          {data.insights.map((ins, i) => {
            const s = SEV[ins.severity] || SEV.info; const I = s.Icon;
            return (
              <div key={i} className={`rounded-2xl border p-4 ${s.ring}`} data-testid="advisor-insight">
                <div className="flex items-start gap-3">
                  <I size={20} className={`${s.color} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{ins.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{ins.detail}</p>
                    {ins.action && (
                      <p className="text-slate-300 text-sm mt-2 flex items-start gap-1.5">
                        <Info size={13} className="text-blue-400 mt-0.5 shrink-0" /> {ins.action}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data?.source === 'rules' && (
        <p className="text-slate-600 text-xs text-center mt-6">AI advisor offline — showing rule-based insights.</p>
      )}
    </div>
  );
};

export default AISecurityAdvisor;
