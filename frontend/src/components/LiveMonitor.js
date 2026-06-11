import React, { useEffect, useState } from 'react';
import { Radar, MapPin, UserCheck, Siren, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import telemetry from '../services/TelemetryService';

const LABELS = {
  typing_speed: 'Typing rhythm', typing_dwell: 'Key hold time', typing_flight: 'Key transition',
  typing_variance: 'Typing consistency', touch_duration: 'Touch duration', touch_pressure: 'Touch pressure',
  tap_interval: 'Tap cadence', swipe_velocity: 'Swipe speed', swipe_length: 'Swipe length',
  motion_avg: 'Device motion', hour_of_day: 'Time of day', day_of_week: 'Day pattern',
  location_habit: 'Location habit', app_usage: 'App usage',
};

const band = (t) => {
  if (t >= 80) return { label: 'Definitely owner', color: '#34d399', text: 'text-emerald-400' };
  if (t >= 55) return { label: 'Uncertain', color: '#fbbf24', text: 'text-amber-400' };
  if (t >= 30) return { label: 'Suspicious', color: '#fb923c', text: 'text-orange-400' };
  return { label: 'Likely thief', color: '#f87171', text: 'text-red-400' };
};

const LiveMonitor = () => {
  const [score, setScore] = useState(telemetry.lastScore);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      // Keep the live score fresh so the "why" breakdown reflects right now
      if (Date.now() - (telemetry.lastScoreAt || 0) > 9000) {
        await telemetry.score();
      }
      const st = await telemetry.status();
      if (!alive) return;
      setStatus(st);
      setScore(telemetry.lastScore);
    };
    tick();
    const i = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(i); };
  }, []);

  const learning = score?.status === 'learning' || (status && !status.trained);
  const trust = Math.round(((score?.trust_score ?? status?.trust_score) ?? 1) * 100);
  const b = band(trust);
  const level = score?.trap_level ?? status?.trap_level ?? 0;
  const loc = status?.last_location;
  const hasLoc = loc && typeof loc.lat === 'number' && typeof loc.lng === 'number';

  const sigs = score?.signals ? Object.entries(score.signals) : [];
  const matching = sigs.filter(([, v]) => v >= 0.6).sort((a, b2) => b2[1] - a[1]).slice(0, 3);
  const mismatching = sigs.filter(([, v]) => v < 0.6).sort((a, b2) => a[1] - b2[1]).slice(0, 3);

  const R = 78, C = 2 * Math.PI * R;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 p-6 mb-5" data-testid="live-monitor">
      <div className="flex items-center gap-2 mb-1">
        <Radar size={18} className="text-cyan-400" />
        <h2 className="text-white font-bold">Who's using my phone right now?</h2>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center my-3">
        <div className="relative inline-flex items-center justify-center">
          <svg width="184" height="184" className="-rotate-90">
            <circle cx="92" cy="92" r={R} stroke="#1e293b" strokeWidth="13" fill="none" />
            <circle cx="92" cy="92" r={R} strokeWidth="13" fill="none" strokeLinecap="round"
              stroke={learning ? '#64748b' : b.color}
              strokeDasharray={C} strokeDashoffset={C * (1 - trust / 100)}
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }} />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black text-white" data-testid="live-trust-value">{trust}%</span>
            <span className="text-xs text-slate-500">trust score</span>
          </div>
        </div>
        <p className={`mt-3 font-bold text-lg ${learning ? 'text-slate-400' : b.text}`} data-testid="live-trust-label">
          {learning ? 'Learning your behaviour…' : b.label}
        </p>
      </div>

      {/* Why the score is what it is */}
      {!learning && sigs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4" data-testid="live-why">
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
            <p className="text-emerald-400 text-xs font-semibold flex items-center gap-1 mb-1.5"><TrendingUp size={13} /> Matches you</p>
            {matching.length ? matching.map(([k]) => (
              <p key={k} className="text-slate-300 text-xs">{LABELS[k] || k}</p>
            )) : <p className="text-slate-500 text-xs">—</p>}
          </div>
          <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
            <p className="text-red-400 text-xs font-semibold flex items-center gap-1 mb-1.5"><TrendingDown size={13} /> Doesn't match</p>
            {mismatching.length ? mismatching.map(([k]) => (
              <p key={k} className="text-slate-300 text-xs">{LABELS[k] || k}</p>
            )) : <p className="text-slate-500 text-xs">Nothing — all signals match</p>}
          </div>
        </div>
      )}

      {/* Facts */}
      <div className="space-y-2">
        <Fact icon={UserCheck} label="Last recognised owner" value={status?.last_owner || '—'} testid="live-last-owner" />
        <Fact icon={MapPin} label="Current location"
          value={hasLoc ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : 'Not reported'}
          link={hasLoc ? `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=15/${loc.lat}/${loc.lng}` : null}
          testid="live-location" />
        <Fact icon={level >= 2 ? Siren : ShieldCheck}
          label="Trap mode"
          value={level >= 3 ? 'Level 3 — recovery active' : level === 2 ? 'Level 2 — collecting evidence' : level === 1 ? 'Level 1 — watching' : 'Inactive — protected'}
          danger={level >= 2} testid="live-trap" />
      </div>
    </div>
  );
};

const Fact = ({ icon: Icon, label, value, link, danger, testid }) => (
  <div className="flex items-center justify-between bg-slate-800/40 rounded-xl px-3 py-2.5" data-testid={testid}>
    <span className="text-slate-400 text-sm flex items-center gap-2"><Icon size={15} className={danger ? 'text-red-400' : 'text-slate-500'} /> {label}</span>
    {link ? (
      <a href={link} target="_blank" rel="noreferrer" className="text-cyan-400 text-sm font-medium">{value}</a>
    ) : (
      <span className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{value}</span>
    )}
  </div>
);

export default LiveMonitor;
