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
      
      // Save codes to localStorage for offline verification
      localStorage.setItem('dm_access_hash', btoa(access));
      localStorage.setItem('dm_recovery_hash', btoa(recovery));
      localStorage.setItem('dm_cover_app', cover);
      localStorage.setItem('dm_configured', 'true');
      
      setDone(true);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Setup failed');
    }
    setBusy(false);
  };

  const TOTAL = 4;

  if (done) return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1121] via-[#0d1526] to-[#0B1121] p-6 flex flex-col items-center justify-center text-center" data-testid="setup-complete">
      <img src={`${process.env.PUBLIC_URL}/brand/shield-emblem.png`} alt="Digital Mate" className="w-28 h-28 object-contain mb-4 drop-shadow-[0_0_30px_rgba(37,99,235,0.5)]" />
      <h1 className="text-2xl font-black text-white">You are protected</h1>
      <p className="text-emerald-400 font-semibold mt-1">Digital Mate is now active in the background.</p>
      <p className="text-slate-400 text-sm mt-3 max-w-xs">Return to your phone and use it normally. Digital Mate will quietly learn your behaviour and protect you.</p>
      
      <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 max-w-xs">
        <p className="text-blue-400 font-semibold text-sm mb-2">To access Digital Mate:</p>
        <p className="text-slate-300 text-sm">Open the <span className="text-white font-bold">{cover}</span> app and enter your access code.</p>
      </div>
      
      <p className="text-blue-400/80 text-xs mt-4 tracking-wide">Your Digital Bodyguard. Your Trusted Mate.</p>
      
      <div className="mt-7 space-y-3 w-full max-w-xs">
        <button onClick={() => onDone?.('dashboard')} data-testid="setup-open-dashboard"
          className="w-full px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.35)]">Open Dashboard</button>
        <button onClick={() => {
          // Signal to minimize/close the app - in a real native app this would call App.minimizeApp()
          onDone?.('close');
          window.close(); // Attempt to close (works in some contexts)
        }} data-testid="setup-close-btn"
          className="w-full px-8 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold">Return to Phone</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1121] via-[#0d1526] to-[#0B1121] p-6 flex flex-col" data-testid="setup-wizard">
      <div className="flex items-center gap-3 pt-4 mb-2">
        <img src={`${process.env.PUBLIC_URL}/brand/shield-emblem.png`} alt="Digital Mate" className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(37,99,235,0.5)]" />
        <div>
          <h1 className="text-xl font-black text-white">Set up Digital Mate</h1>
          <p className="text-slate-400 text-sm">Your Digital Bodyguard. Your Trusted Mate.</p>
        </div>
      </div>
      <div className="flex gap-1.5 my-5">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      {step === 0 && (
        <Card icon={Shield} title="Choose your cover" subtitle="Digital Mate hides as an everyday app. Open it with your access code.">
          <Field label="Your name" value={name} onChange={setName} testid="setup-name" placeholder="e.g. Sam" />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {COVERS.map((c) => { const I = c.icon; const sel = cover === c.id; return (
              <button key={c.id} onClick={() => setCover(c.id)} data-testid={`cover-${c.id}`}
                className={`py-4 rounded-xl border flex flex-col items-center gap-2 ${sel ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 bg-slate-800/50 text-slate-300'}`}>
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
            className="w-full mt-5 py-3 rounded-xl bg-blue-500 text-slate-900 font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Check size={18} /> {busy ? 'Saving…' : 'Done'}
          </button>
          <p className="text-slate-500 text-xs text-center mt-2">You can grant permissions later from Protection Status.</p>
        </Card>
      )}
    </div>
  );
};

const PermRow = ({ icon: Icon, label, on, onGrant, testid }) => (
  <div className="flex items-center gap-3 bg-[#0e1626] border border-slate-700 rounded-xl p-3 mb-2">
    <Icon size={20} className={on ? 'text-emerald-400' : 'text-slate-400'} />
    <span className="flex-1 text-white text-sm">{label}</span>
    {on ? <span className="text-emerald-400 text-sm flex items-center gap-1"><Check size={15} /> Granted</span>
      : <button onClick={onGrant} data-testid={testid} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">Grant</button>}
  </div>
);

const Card = ({ icon: Icon, title, subtitle, children }) => (
  <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
    <div className="flex items-center gap-2 mb-1"><Icon className="text-blue-400" size={20} /><h2 className="text-white font-bold text-lg">{title}</h2></div>
    <p className="text-slate-400 text-sm mb-4">{subtitle}</p>
    {children}
  </div>
);
const Field = ({ label, value, onChange, type = 'text', testid, placeholder }) => (
  <div className="mb-3">
    <label className="text-slate-400 text-xs mb-1 block">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid={testid}
      className="w-full px-4 py-3 rounded-xl bg-[#0e1626] border border-slate-600 text-white focus:border-blue-500 outline-none" />
  </div>
);
const Primary = ({ onClick, children, testid }) => (
  <button onClick={onClick} data-testid={testid} className="w-full mt-2 py-3 rounded-xl bg-blue-500 text-slate-900 font-bold">{children}</button>
);

export default SetupWizard;
