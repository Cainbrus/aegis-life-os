import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader, MapPin, UserCheck, Siren } from 'lucide-react';
import telemetry from '../services/TelemetryService';

// Stealth status — no score, no gauge, no signal graphs. Just a calm "Protected" / "Learning".
// The recognition engine runs silently in the background and drives Decoy/Trap automatically.
const LiveMonitor = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (Date.now() - (telemetry.lastScoreAt || 0) > 9000) await telemetry.score();
      const st = await telemetry.status();
      if (alive) setStatus(st);
    };
    tick();
    const i = setInterval(tick, 6000);
    return () => { alive = false; clearInterval(i); };
  }, []);

  const learning = status && !status.trained;
  const level = status?.trap_level ?? 0;
  const loc = status?.last_location;
  const hasLoc = loc && typeof loc.lat === 'number' && typeof loc.lng === 'number';
  const alert = level >= 2;

  const tone = alert ? 'red' : learning ? 'amber' : 'emerald';
  const T = {
    red: { ring: 'border-red-500/40 from-red-950/60 to-orange-950/40', text: 'text-red-400', Icon: Siren, label: 'Checking activity', sub: 'Unusual use detected — protecting your phone.' },
    amber: { ring: 'border-amber-500/30 from-amber-950/40 to-slate-900', text: 'text-amber-400', Icon: Loader, label: 'Learning', sub: 'Getting to know how you use your phone.' },
    emerald: { ring: 'border-emerald-500/30 from-emerald-950/50 to-cyan-950/40', text: 'text-emerald-400', Icon: ShieldCheck, label: 'Protected', sub: 'Watching quietly in the background.' },
  }[tone];
  const Icon = T.Icon;

  return (
    <div className={`rounded-3xl p-6 mb-5 border bg-gradient-to-br ${T.ring}`} data-testid="live-monitor">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${alert ? 'bg-red-500/20' : learning ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
          <Icon className={`${T.text} ${learning ? 'animate-spin' : ''}`} size={28} />
        </div>
        <div>
          <p className={`text-xl font-bold ${T.text}`} data-testid="live-status-label">{T.label}</p>
          <p className="text-slate-400 text-sm">{T.sub}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Fact icon={UserCheck} label="Recognised owner" value={status?.last_owner || '—'} testid="live-last-owner" />
        <Fact icon={MapPin} label="Location"
          value={hasLoc ? `${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}` : 'Not reported'}
          link={hasLoc ? `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=15/${loc.lat}/${loc.lng}` : null}
          testid="live-location" />
      </div>
    </div>
  );
};

const Fact = ({ icon: Icon, label, value, link, testid }) => (
  <div className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-2.5" data-testid={testid}>
    <span className="text-slate-400 text-sm flex items-center gap-2"><Icon size={15} className="text-slate-500" /> {label}</span>
    {link ? <a href={link} target="_blank" rel="noreferrer" className="text-cyan-400 text-sm font-medium">{value}</a>
      : <span className="text-white text-sm font-medium">{value}</span>}
  </div>
);

export default LiveMonitor;
