import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, Crown, Baby, MapPin, Siren, ShieldCheck, RefreshCw, Copy, LogOut, UserPlus, ShieldQuestion } from 'lucide-react';
import telemetry from '../services/TelemetryService';

// Cross-device Family tracking. Parents see every member's last location (on one map) + alerts.
// Kids see no one — they're only protected themselves. Members link via a 6-char family code.
const FamilyTracking = () => {
  const [status, setStatus] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const s = await telemetry.familyStatus();
    setStatus(s);
    if (s?.in_family) {
      const m = await telemetry.familyMembers();
      setMembers(m.members || []);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, [load]);

  if (loading && !status) return <div className="p-5 text-slate-500" data-testid="family-screen">Loading family…</div>;

  return (
    <div className="p-5 pb-28 space-y-5" data-testid="family-screen">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="text-violet-400" size={26} /> Family</h2>
        <p className="text-slate-400 text-sm mt-1">Keep family phones protected and locatable.</p>
      </div>

      {!status?.in_family && <JoinOrCreate onDone={load} />}

      {status?.in_family && status.role === 'parent' && (
        <ParentView code={status.family_code} members={members} onRefresh={load} loading={loading} onDone={load} />
      )}

      {status?.in_family && (status.role === 'teen' || status.role === 'child') && (
        <SiblingView role={status.role} members={members} onDone={load} />
      )}
    </div>
  );
};

// Teens see siblings + sibling locations; children see siblings only (no locations); neither sees parents.
const SiblingView = ({ role, members, onDone }) => {
  const located = members.filter((m) => m.last_location && typeof m.last_location.lat === 'number');
  return (
    <div className="space-y-4" data-testid="family-sibling-view">
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-slate-300 text-sm">
        You are protected. {role === 'teen' ? 'You can see your siblings.' : 'You can see your siblings.'} Parents are private.
      </div>
      {role === 'teen' && located.length > 0 && <FamilyMap members={located} />}
      <div className="space-y-2" data-testid="family-members">
        {members.length === 0 && <p className="text-slate-500 text-sm">No siblings in your family yet.</p>}
        {members.map((m, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 flex items-center gap-3" data-testid="family-member">
            <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center">
              {m.member_role === 'teen' ? <Users size={18} className="text-cyan-400" /> : <Baby size={18} className="text-cyan-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">{m.name}{m.is_me ? ' (you)' : ''}</p>
              <p className="text-slate-500 text-xs capitalize">{m.member_role}</p>
            </div>
            {role === 'teen' && m.last_location && (
              <a href={`https://www.openstreetmap.org/?mlat=${m.last_location.lat}&mlon=${m.last_location.lng}#map=15/${m.last_location.lat}/${m.last_location.lng}`}
                target="_blank" rel="noreferrer" className="text-cyan-400"><MapPin size={18} /></a>
            )}
          </div>
        ))}
      </div>
      <LeaveBtn onDone={onDone} />
    </div>
  );
};

const JoinOrCreate = ({ onDone }) => {
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('child');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return toast.error('Enter your name');
    setBusy(true);
    try { const r = await telemetry.familyCreate(name.trim()); toast.success(`Family created — code ${r.family_code}`); onDone(); }
    catch (e) { toast.error('Could not create family'); }
    setBusy(false);
  };
  const join = async () => {
    if (!name.trim() || code.trim().length < 4) return toast.error('Enter your name and the family code');
    setBusy(true);
    try { await telemetry.familyJoin({ name: name.trim(), member_role: role, family_code: code.trim().toUpperCase() }); toast.success('Joined family'); onDone(); }
    catch (e) { toast.error(e?.response?.status === 404 ? 'Invalid family code' : 'Could not join'); }
    setBusy(false);
  };

  if (!mode) return (
    <div className="space-y-3">
      <button onClick={() => setMode('create')} data-testid="family-create-btn"
        className="w-full bg-violet-600 text-white rounded-2xl p-4 font-bold flex items-center justify-center gap-2 hover:opacity-90"><Crown size={20} /> Create a family (parent)</button>
      <button onClick={() => setMode('join')} data-testid="family-join-btn"
        className="w-full bg-slate-800 border border-slate-700 text-cyan-400 rounded-2xl p-4 font-semibold flex items-center justify-center gap-2 hover:bg-slate-700/60"><UserPlus size={20} /> Join with a family code</button>
    </div>
  );

  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 space-y-3" data-testid="family-form">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" data-testid="family-name"
        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white outline-none focus:border-violet-500" />
      {mode === 'join' && (
        <>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Family code (6 chars)" data-testid="family-code-input"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white tracking-widest uppercase outline-none focus:border-violet-500" />
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setRole('parent')} data-testid="family-role-parent" className={`py-3 rounded-xl border flex flex-col items-center gap-1 ${role === 'parent' ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-slate-700 text-slate-300'}`}><Crown size={16} /><span className="text-[11px]">Parent</span></button>
            <button onClick={() => setRole('teen')} data-testid="family-role-teen" className={`py-3 rounded-xl border flex flex-col items-center gap-1 ${role === 'teen' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-700 text-slate-300'}`}><Users size={16} /><span className="text-[11px]">Teen</span></button>
            <button onClick={() => setRole('child')} data-testid="family-role-child" className={`py-3 rounded-xl border flex flex-col items-center gap-1 ${role === 'child' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-700 text-slate-300'}`}><Baby size={16} /><span className="text-[11px]">Child</span></button>
          </div>
        </>
      )}
      <button onClick={mode === 'create' ? create : join} disabled={busy} data-testid="family-submit"
        className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold disabled:opacity-50">{busy ? 'Please wait…' : (mode === 'create' ? 'Create family' : 'Join family')}</button>
      <button onClick={() => setMode(null)} className="w-full py-2 text-slate-400 text-sm">Back</button>
    </div>
  );
};

const ParentView = ({ code, members, onRefresh, loading, onDone }) => {
  const located = members.filter((m) => m.last_location && typeof m.last_location.lat === 'number');
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4 flex items-center justify-between" data-testid="family-code-card">
        <div>
          <p className="text-slate-400 text-xs">Family code (share with members)</p>
          <p className="text-white text-2xl font-black tracking-widest" data-testid="family-code">{code}</p>
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(code); toast.success('Code copied'); }} className="text-cyan-400 p-2"><Copy size={20} /></button>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">{members.length} member{members.length !== 1 ? 's' : ''}</h3>
        <button onClick={onRefresh} disabled={loading} className="text-violet-400 p-1" data-testid="family-refresh"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {located.length > 0 ? <FamilyMap members={located} /> : (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6 text-center text-slate-400 text-sm">No member locations yet. They will appear once members open the app with location enabled.</div>
      )}

      <div className="space-y-2" data-testid="family-members">
        {members.map((m, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 flex items-center gap-3" data-testid="family-member">
            <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center">
              {m.member_role === 'parent' ? <Crown size={18} className="text-amber-400" /> : <Baby size={18} className="text-cyan-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">{m.name}{m.is_me ? ' (you)' : ''}</p>
              <p className="text-slate-500 text-xs flex items-center gap-1">
                {m.lost_mode ? <span className="text-red-400 flex items-center gap-1"><Siren size={11} /> Lost mode</span>
                  : m.trap_level >= 2 ? <span className="text-amber-400 flex items-center gap-1"><ShieldQuestion size={11} /> Unusual activity</span>
                  : <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={11} /> Protected</span>}
                {m.alerts_unread > 0 && <span className="text-red-400">· {m.alerts_unread} alert{m.alerts_unread > 1 ? 's' : ''}</span>}
              </p>
            </div>
            {m.last_location && (
              <a href={`https://www.openstreetmap.org/?mlat=${m.last_location.lat}&mlon=${m.last_location.lng}#map=15/${m.last_location.lat}/${m.last_location.lng}`}
                target="_blank" rel="noreferrer" className="text-cyan-400"><MapPin size={18} /></a>
            )}
          </div>
        ))}
      </div>
      <LeaveBtn onDone={onDone} />
    </div>
  );
};

// Imperative Leaflet map with a pin per located member, auto-fit to bounds.
const FamilyMap = ({ members }) => {
  const ref = useRef(null);
  const mapRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(ref.current, { attributionControl: false, zoomControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current);
    }
    const map = mapRef.current;
    map.eachLayer((l) => { if (l instanceof L.Marker) map.removeLayer(l); });
    const pts = members.map((m) => [m.last_location.lat, m.last_location.lng]);
    members.forEach((m) => {
      L.marker([m.last_location.lat, m.last_location.lng]).addTo(map).bindPopup(m.name);
    });
    if (pts.length === 1) map.setView(pts[0], 14);
    else map.fitBounds(pts, { padding: [30, 30] });
    setTimeout(() => map.invalidateSize(), 200);
  }, [members]);
  return <div ref={ref} className="w-full h-56 rounded-2xl overflow-hidden border border-slate-700" data-testid="family-map" />;
};

const LeaveBtn = ({ onDone }) => (
  <button onClick={async () => { await telemetry.familyLeave(); toast.success('Left family'); onDone(); }} data-testid="family-leave"
    className="w-full mt-2 py-2.5 rounded-xl text-slate-400 text-sm flex items-center justify-center gap-2 hover:text-red-400"><LogOut size={15} /> Leave family</button>
);

export default FamilyTracking;
