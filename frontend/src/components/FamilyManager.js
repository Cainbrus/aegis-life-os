import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Users, Crown, ShieldCheck, UserCog, UserMinus, Plus, X } from 'lucide-react';
import telemetry from '../services/TelemetryService';

const ROLES = [
  { id: 'trusted', name: 'Trusted adult', icon: ShieldCheck, desc: 'Full access (e.g. partner)' },
  { id: 'limited', name: 'Limited', icon: UserCog, desc: 'Basic access (e.g. kids)' },
  { id: 'guest', name: 'Guest', icon: Users, desc: 'Minimal access' },
];
const ROLE_META = {
  owner: { label: 'Owner', color: 'text-amber-400', Icon: Crown },
  trusted: { label: 'Trusted adult', color: 'text-emerald-400', Icon: ShieldCheck },
  limited: { label: 'Limited', color: 'text-cyan-400', Icon: UserCog },
  guest: { label: 'Guest', color: 'text-slate-400', Icon: Users },
};

const FamilyManager = () => {
  const [profiles, setProfiles] = useState([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('trusted');
  const [recovery, setRecovery] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await telemetry.listProfiles();
    setProfiles(r.profiles || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (name.length < 1 || code.length < 4) return toast.error('Enter a name and a 4+ char access code');
    if (recovery.length < 4) return toast.error('Enter your Recovery code to authorise');
    setBusy(true);
    try {
      const r = await telemetry.addProfile({ name, access_code: code, role, recovery_code: recovery });
      setProfiles(r.profiles || []);
      toast.success(`${name} added as ${role}`);
      setAdding(false); setName(''); setCode(''); setRecovery(''); setRole('trusted');
    } catch (e) { toast.error(e?.response?.status === 403 ? 'Wrong Recovery code' : 'Could not add'); }
    setBusy(false);
  };

  const remove = async (p) => {
    const rc = window.prompt(`Enter your Recovery code to remove ${p.name}`);
    if (!rc) return;
    try {
      const r = await telemetry.removeProfile(p.id, rc);
      setProfiles(r.profiles || []);
      toast.success(`${p.name} removed`);
    } catch (e) { toast.error(e?.response?.data?.detail || 'Could not remove'); }
  };

  return (
    <div className="p-5 space-y-5" data-testid="family-screen">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="text-cyan-400" size={26} /> Trusted Family
        </h2>
        <p className="text-slate-400 text-sm mt-1">People Digital Mate should recognise — each with their own access level.</p>
      </div>

      <div className="space-y-2" data-testid="family-list">
        {profiles.map((p) => {
          const m = ROLE_META[p.role] || ROLE_META.trusted; const I = m.Icon;
          return (
            <div key={p.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-3.5" data-testid="family-member">
              <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center"><I size={20} className={m.color} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{p.name}</p>
                <p className={`text-xs ${m.color}`}>{m.label}</p>
              </div>
              {p.role !== 'owner' && (
                <button onClick={() => remove(p)} data-testid="family-remove" className="text-slate-500 hover:text-red-400 p-2"><UserMinus size={18} /></button>
              )}
            </div>
          );
        })}
      </div>

      {!adding ? (
        <button onClick={() => setAdding(true)} data-testid="family-add-btn"
          className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 font-medium flex items-center justify-center gap-2 hover:bg-slate-700/60">
          <Plus size={18} /> Add family member
        </button>
      ) : (
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4 space-y-3" data-testid="family-add-form">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">New member</h3>
            <button onClick={() => setAdding(false)} className="text-slate-400"><X size={18} /></button>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" data-testid="family-name"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white outline-none focus:border-cyan-500" />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Their access code (4+)" type="password" data-testid="family-code"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white outline-none focus:border-cyan-500" />
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const I = r.icon; const sel = role === r.id;
              return (
                <button key={r.id} onClick={() => setRole(r.id)} data-testid={`family-role-${r.id}`}
                  className={`py-3 rounded-xl border flex flex-col items-center gap-1 ${sel ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                  <I size={18} /><span className="text-[11px]">{r.name}</span>
                </button>
              );
            })}
          </div>
          <input value={recovery} onChange={(e) => setRecovery(e.target.value)} placeholder="Your Recovery code (to authorise)" type="password" data-testid="family-recovery"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white outline-none focus:border-cyan-500" />
          <button onClick={add} disabled={busy} data-testid="family-save" className="w-full py-3 rounded-xl bg-cyan-500 text-slate-900 font-bold disabled:opacity-50">
            {busy ? 'Adding…' : 'Add member'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FamilyManager;
