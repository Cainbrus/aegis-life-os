import React, { useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, AlertTriangle, ShieldAlert, ScanLine, Smartphone, ChevronDown, ExternalLink } from 'lucide-react';
import telemetry from '../services/TelemetryService';

const STATUS = {
  safe: { color: 'text-emerald-400', dot: 'bg-emerald-500', label: 'Safe', Icon: ShieldCheck },
  review: { color: 'text-amber-400', dot: 'bg-amber-500', label: 'Review Needed', Icon: AlertTriangle },
  high_risk: { color: 'text-red-400', dot: 'bg-red-500', label: 'High Risk', Icon: ShieldAlert },
  native_pending: { color: 'text-slate-400', dot: 'bg-slate-500', label: 'Needs native app', Icon: Smartphone },
};

const OVERALL = {
  safe: { color: 'from-emerald-950/60 to-emerald-900/30 border-emerald-500/40 text-emerald-400', text: 'No unusual security concerns detected.', Icon: ShieldCheck },
  review: { color: 'from-amber-950/60 to-amber-900/30 border-amber-500/40 text-amber-400', text: 'Some settings should be reviewed.', Icon: AlertTriangle },
  high_risk: { color: 'from-red-950/60 to-red-900/30 border-red-500/40 text-red-400', text: 'Potential security concerns need attention.', Icon: ShieldAlert },
};

const PrivacyScan = () => {
  const [report, setReport] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState(null);

  const run = async () => {
    setScanning(true);
    try {
      const r = await telemetry.privacyScan();
      setReport(r);
    } catch (e) { toast.error('Scan failed'); }
    setScanning(false);
  };

  const openSettings = (settings) => {
    if (!settings) return;
    // On the native Android app this deep-links to the relevant Settings page.
    try { window.location.href = `intent:#Intent;action=${settings};end`; }
    catch (e) { /* ignore */ }
    toast.info(`Open Android Settings: ${settings.split('.').pop()}`);
  };

  const grouped = report ? report.checks.reduce((acc, c) => {
    (acc[c.category] = acc[c.category] || []).push(c); return acc;
  }, {}) : {};

  return (
    <div className="p-5 pb-28 space-y-5" data-testid="privacy-scan-screen">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ScanLine className="text-blue-400" size={26} /> Privacy &amp; Security Scan
        </h2>
        <p className="text-slate-400 text-sm mt-1">See who and what can access your phone.</p>
      </div>

      {!report && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-8 text-center">
          <ScanLine className="mx-auto text-blue-400 mb-3" size={36} />
          <p className="text-white font-semibold">Run a privacy &amp; security scan</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">Checks permissions, network, SIM changes and device settings.</p>
          <button onClick={run} disabled={scanning} data-testid="run-scan-btn"
            className="px-6 py-3 rounded-xl bg-blue-500 text-slate-900 font-bold disabled:opacity-50">
            {scanning ? 'Scanning…' : 'Start scan'}
          </button>
        </div>
      )}

      {report && (
        <>
          {(() => { const o = OVERALL[report.overall]; const I = o.Icon; return (
            <div className={`rounded-2xl p-5 border bg-gradient-to-br ${o.color}`} data-testid="scan-overall">
              <div className="flex items-center gap-3">
                <I size={28} />
                <div>
                  <p className="font-bold text-lg">{STATUS[report.overall].label}</p>
                  <p className="text-slate-300 text-sm">{o.text}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4 text-xs">
                <span className="text-emerald-400">{report.counts.safe} safe</span>
                <span className="text-amber-400">{report.counts.review} review</span>
                <span className="text-red-400">{report.counts.high_risk} high risk</span>
                <span className="text-slate-400">{report.counts.native_pending} need native app</span>
              </div>
            </div>
          ); })()}

          <button onClick={run} disabled={scanning} data-testid="rescan-btn" className="text-blue-400 text-sm">{scanning ? 'Scanning…' : 'Re-scan'}</button>

          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-2">
              <h3 className="text-slate-400 text-xs uppercase tracking-wide mt-2">{cat}</h3>
              {items.map((c) => {
                const s = STATUS[c.status]; const SIcon = s.Icon;
                const isOpen = open === c.id;
                return (
                  <div key={c.id} className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden" data-testid={`scan-check-${c.id}`}>
                    <button onClick={() => setOpen(isOpen ? null : c.id)} className="w-full flex items-center gap-3 p-3.5 text-left">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.dot} shrink-0`} />
                      <span className="flex-1 text-white text-sm">{c.label}</span>
                      <span className={`text-xs ${s.color} flex items-center gap-1`}><SIcon size={13} /> {s.label}</span>
                      <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-0 text-sm space-y-2 border-t border-slate-700/60">
                        <Row label="Detected" value={c.detected} />
                        <Row label="Why it matters" value={c.risk} />
                        <Row label="Recommended" value={c.action} />
                        {c.settings && (
                          <button onClick={() => openSettings(c.settings)} data-testid={`open-settings-${c.id}`}
                            className="mt-1 text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300">
                            <ExternalLink size={14} /> Open Android settings
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <p className="text-slate-600 text-xs text-center pt-2">
            Items marked "Needs native app" require the upcoming native Android build to inspect other apps and system settings.
            Digital Mate never claims to detect lawful interception or government monitoring.
          </p>
        </>
      )}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="pt-2"><span className="text-slate-500 text-xs">{label}</span><p className="text-slate-300">{value}</p></div>
);

export default PrivacyScan;
