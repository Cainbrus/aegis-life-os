import React, { useState } from 'react';
import { toast } from 'sonner';
import { Shield, KeyRound, LifeBuoy, Calculator, Clock, StickyNote, Check, MapPin, Camera, Bell } from 'lucide-react';
import telemetry from '../services/TelemetryService';

// Simple setup: Cover -> Access code -> Recovery code -> Permissions -> Done.
// Everything else (wipe code, trusted numbers, family, email) is optional and added later in Settings.
const COVERS = [
  { id: 'calculator', name: 'Calculator', icon: Calculator },
  { id: 'clock', name: 'Clock', icon: Clock },
  { id: 'notes', name: 'Notes', icon: StickyNote },
];

const SetupWizard = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [cover, setCover] = useState('calculator');
  const [access, setAccess] = useState(''); const [access2, setAccess2] = useState('');
  const [recovery, setRecovery] = useState(''); const [recovery2, setRecovery2] = useState('');
  const [perms, setPerms] = useState({ location: false, camera: false, notifications: false });
  const [contact, setContact] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const numericCover = cover === 'calculator' || cover === 'clock';

  const next = () => {
    if (step === 1) {
      if (access.length < 4) return toast.error('Access code must be at least 4 characters');
      if (numericCover && !/^\d+$/.test(access)) return toast.error(`For the ${cover} cover, use digits only`);
      if (access !== access2) return toast.error('Access codes do not match');
    }
    if (step === 2) {
      if (recovery.length < 4) return toast.error('Recovery code must be at least 4 characters');
      if (recovery !== recovery2) return toast.error('Recovery codes do not match');
      if (recovery === access) return toast.error('Recovery code must differ from Access code');
    }
    setStep((s) => s + 1);
  };

  const grant = async (key) => {
    try {
      if (key === 'location') await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 }));
      if (key === 'camera') { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach((t) => t.stop()); }
      if (key === 'notifications') { const p = await Notification.requestPermission(); if (p !== 'granted') throw new Error(); }
      setPerms((x) => ({ ...x, [key]: true }));
    } catch (e) { toast.error(`${key} permission denied`); }
  };

  const finish = async () => {
    setBusy(true);
    try {
      const c = contact.trim();
      const extra = c ? (c.includes('@') ? { recovery_email: c } : { trusted_numbers: [c] }) : {};
      await telemetry.submitSetup({ owner_name: name || 'Owner', cover_app: cover, access_code: access, recovery_code: recovery, ...extra });
      setDone(true);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Setup failed');
    }
    setBusy(false);
  };

  const TOTAL = 4;

  if (done) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 flex flex-col items-center justify-center text-center" data-testid="setup-complete">
      <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 flex items-center justify-center mb-5">
        <Shield className="text-emerald-400" size={40} />
      </div>
      <h1 className="text-2xl font-black text-white">You are protected</h1>
      <p className="text-emerald-400 font-semibold mt-1">Digital Mate is now protecting your phone.</p>
      <p className="text-slate-400 text-sm mt-3 max-w-xs">It quietly learns how you use your phone and steps in if someone else takes it. Enter your access code on the {cover} to open it.</p>
      <button onClick={() => onDone?.()} data-testid="setup-complete-btn"
        className="mt-8 px-8 py-3 rounded-xl bg-cyan-500 text-slate-900 font-bold">Open Digital Mate</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 flex flex-col" data-testid="setup-wizard">
      <div className="flex items-center gap-3 pt-4 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><Shield className="text-white" size={22} /></div>
        <div>
          <h1 className="text-xl font-black text-white">Set up Digital Mate</h1>
          <p className="text-slate-400 text-sm">Set it up once, then forget it's there.</p>
        </div>
      </div>
      <div className="flex gap-1.5 my-5">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-cyan-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      {step === 0 && (
        <Card icon={Shield} title="Choose your cover" subtitle="Digital Mate hides as an everyday app. Open it with your access code.">
          <Field label="Your name" value={name} onChange={setName} testid="setup-name" placeholder="e.g. Sam" />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {COVERS.map((c) => { const I = c.icon; const sel = cover === c.id; return (
              <button key={c.id} onClick={() => setCover(c.id)} data-testid={`cover-${c.id}`}
                className={`py-4 rounded-xl border flex flex-col items-center gap-2 ${sel ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-700 bg-slate-800/50 text-slate-300'}`}>
                <I size={24} /> <span className="text-xs">{c.name}</span>
              </button>
            ); })}
          </div>
          <Primary onClick={() => setStep(1)} testid="setup-next-0">Continue</Primary>
        </Card>
      )}

      {step === 1 && (
        <Card icon={KeyRound} title="Create your access code" subtitle={`You'll type this on the ${cover} to open Digital Mate.`}>
          <Field label="Access code" value={access} onChange={setAccess} type="password" testid="setup-access" placeholder={numericCover ? 'At least 4 digits' : 'At least 4 characters'} />
          <Field label="Confirm" value={access2} onChange={setAccess2} type="password" testid="setup-access2" placeholder="Re-enter" />
          <Primary onClick={next} testid="setup-next-1">Continue</Primary>
        </Card>
      )}

      {step === 2 && (
        <Card icon={LifeBuoy} title="Create your recovery code" subtitle="Used to recover or unlock if your phone is lost or stolen.">
          <Field label="Recovery code" value={recovery} onChange={setRecovery} type="password" testid="setup-recovery" placeholder="Different from your access code" />
          <Field label="Confirm" value={recovery2} onChange={setRecovery2} type="password" testid="setup-recovery2" placeholder="Re-enter" />
          <Primary onClick={next} testid="setup-next-2">Continue</Primary>
        </Card>
      )}

      {step === 3 && (
        <Card icon={Bell} title="Grant permissions" subtitle="Needed for recovery, evidence capture and alerts. You can change these later.">
          <PermRow icon={MapPin} label="Location" on={perms.location} onGrant={() => grant('location')} testid="perm-location" />
          <PermRow icon={Camera} label="Camera" on={perms.camera} onGrant={() => grant('camera')} testid="perm-camera" />
          <PermRow icon={Bell} label="Notifications" on={perms.notifications} onGrant={() => grant('notifications')} testid="perm-notifications" />
          <Field label="Recovery email or phone (recommended)" value={contact} onChange={setContact} testid="setup-contact" placeholder="you@email.com or +1 555…" />
          <button onClick={finish} disabled={busy} data-testid="setup-finish"
            className="w-full mt-5 py-3 rounded-xl bg-cyan-500 text-slate-900 font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Check size={18} /> {busy ? 'Saving…' : 'Done'}
          </button>
          <p className="text-slate-500 text-xs text-center mt-2">You can grant permissions later from Protection Status.</p>
        </Card>
      )}
    </div>
  );
};

const PermRow = ({ icon: Icon, label, on, onGrant, testid }) => (
  <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl p-3 mb-2">
    <Icon size={20} className={on ? 'text-emerald-400' : 'text-slate-400'} />
    <span className="flex-1 text-white text-sm">{label}</span>
    {on ? <span className="text-emerald-400 text-sm flex items-center gap-1"><Check size={15} /> Granted</span>
      : <button onClick={onGrant} data-testid={testid} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">Grant</button>}
  </div>
);

const Card = ({ icon: Icon, title, subtitle, children }) => (
  <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5">
    <div className="flex items-center gap-2 mb-1"><Icon className="text-cyan-400" size={20} /><h2 className="text-white font-bold text-lg">{title}</h2></div>
    <p className="text-slate-400 text-sm mb-4">{subtitle}</p>
    {children}
  </div>
);
const Field = ({ label, value, onChange, type = 'text', testid, placeholder }) => (
  <div className="mb-3">
    <label className="text-slate-400 text-xs mb-1 block">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid={testid}
      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 outline-none" />
  </div>
);
const Primary = ({ onClick, children, testid }) => (
  <button onClick={onClick} data-testid={testid} className="w-full mt-2 py-3 rounded-xl bg-cyan-500 text-slate-900 font-bold">{children}</button>
);

export default SetupWizard;
