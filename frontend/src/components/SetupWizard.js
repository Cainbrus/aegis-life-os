import React, { useState } from 'react';
import { toast } from 'sonner';
import { Shield, KeyRound, LifeBuoy, Trash2, Phone, Calculator, Clock, StickyNote, Plus, X, Check, MessageSquareLock } from 'lucide-react';
import telemetry from '../services/TelemetryService';

// First-run setup. The owner defines THEIR OWN codes — no defaults exist anywhere.
// Three separate codes: Access (open app), Recovery (lost-phone mode), Wipe (last resort).
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
  const [wipe, setWipe] = useState(''); const [wipe2, setWipe2] = useState('');
  const [phrase, setPhrase] = useState('');
  const [pattern, setPattern] = useState('');
  const [email, setEmail] = useState('');
  const [email2, setEmail2] = useState('');
  const [numbers, setNumbers] = useState(['']);
  const [backup, setBackup] = useState('');
  const [busy, setBusy] = useState(false);

  const setNum = (i, v) => setNumbers((n) => n.map((x, idx) => (idx === i ? v : x)));

  const next = () => {
    if (step === 1) {
      if (access.length < 4) return toast.error('Access code must be at least 4 characters');
      if (access !== access2) return toast.error('Access codes do not match');
    }
    if (step === 2) {
      if (recovery.length < 4) return toast.error('Recovery code must be at least 4 characters');
      if (recovery !== recovery2) return toast.error('Recovery codes do not match');
      if (recovery === access) return toast.error('Recovery code must differ from Access code');
    }
    if (step === 3) {
      if (wipe.length < 4) return toast.error('Wipe code must be at least 4 characters');
      if (wipe !== wipe2) return toast.error('Wipe codes do not match');
      if (wipe === access || wipe === recovery) return toast.error('Wipe code must be unique');
    }
    if (step === 4 && phrase.trim().length < 4) return toast.error('Recovery phrase must be at least 4 characters');
    setStep((s) => s + 1);
  };

  const finish = async () => {
    const trusted = numbers.map((n) => n.trim()).filter(Boolean);
    if (!trusted.length) return toast.error('Add at least one trusted number');
    setBusy(true);
    try {
      await telemetry.submitSetup({
        owner_name: name || 'Owner', cover_app: cover,
        access_code: access, recovery_code: recovery, wipe_code: wipe,
        recovery_phrase: phrase.trim(), panic_pattern: pattern.trim(),
        recovery_email: email.trim(), trusted_numbers: trusted,
        backup_email: email2.trim(),
        backup_numbers: backup.trim() ? [backup.trim()] : [],
      });
      toast.success('Setup complete — your codes are saved securely');
      onDone?.();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Setup failed');
    }
    setBusy(false);
  };

  const TOTAL = 6;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 flex flex-col" data-testid="setup-wizard">
      <div className="flex items-center gap-3 pt-4 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Shield className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Set up Digital Mate</h1>
          <p className="text-slate-400 text-sm">You create your own codes — nobody else knows them.</p>
        </div>
      </div>

      <div className="flex gap-1.5 my-5">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-cyan-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      {step === 0 && (
        <Card icon={Shield} title="Choose your cover" subtitle="Digital Mate hides as an everyday app. Open it with your Access code.">
          <Field label="Your name (for this profile)" value={name} onChange={setName} testid="setup-name" placeholder="e.g. Sam" />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {COVERS.map((c) => {
              const I = c.icon; const sel = cover === c.id;
              return (
                <button key={c.id} onClick={() => setCover(c.id)} data-testid={`cover-${c.id}`}
                  className={`py-4 rounded-xl border flex flex-col items-center gap-2 ${sel ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-700 bg-slate-800/50 text-slate-300'}`}>
                  <I size={24} /> <span className="text-xs">{c.name}</span>
                </button>
              );
            })}
          </div>
          <Primary onClick={() => setStep(1)} testid="setup-next-0">Continue</Primary>
        </Card>
      )}

      {step === 1 && (
        <Card icon={KeyRound} title="Access code" subtitle="Opens the Digital Mate dashboard from the cover app.">
          <Field label="Access code" value={access} onChange={setAccess} type="password" testid="setup-access" placeholder="At least 4 characters" />
          <Field label="Confirm" value={access2} onChange={setAccess2} type="password" testid="setup-access2" placeholder="Re-enter" />
          <Primary onClick={next} testid="setup-next-1">Continue</Primary>
        </Card>
      )}

      {step === 2 && (
        <Card icon={LifeBuoy} title="Recovery code" subtitle="Starts Lost-Phone / Recovery mode (GPS tracking + evidence).">
          <Field label="Recovery code" value={recovery} onChange={setRecovery} type="password" testid="setup-recovery" placeholder="Different from Access code" />
          <Field label="Confirm" value={recovery2} onChange={setRecovery2} type="password" testid="setup-recovery2" placeholder="Re-enter" />
          <Primary onClick={next} testid="setup-next-2">Continue</Primary>
        </Card>
      )}

      {step === 3 && (
        <Card icon={Trash2} title="Emergency wipe code" subtitle="High-security, last-resort wipe only. Keep it secret and unique.">
          <Field label="Wipe code" value={wipe} onChange={setWipe} type="password" testid="setup-wipe" placeholder="Unique high-security code" />
          <Field label="Confirm" value={wipe2} onChange={setWipe2} type="password" testid="setup-wipe2" placeholder="Re-enter" />
          <Primary onClick={next} testid="setup-next-3">Continue</Primary>
        </Card>
      )}

      {step === 4 && (
        <Card icon={MessageSquareLock} title="Secret triggers" subtitle="Quiet ways to start recovery if your phone is taken.">
          <Field label="Recovery phrase" value={phrase} onChange={setPhrase} testid="setup-phrase" placeholder="e.g. find my phone now" />
          <Field label="Panic pattern (optional)" value={pattern} onChange={setPattern} testid="setup-pattern" placeholder="e.g. 1-3-7-9" />
          <Field label="Recovery email (optional)" value={email} onChange={setEmail} type="email" testid="setup-email" placeholder="alerts@you.com" />
          <Field label="Backup email (optional)" value={email2} onChange={setEmail2} type="email" testid="setup-backup-email" placeholder="backup@you.com" />
          <Primary onClick={next} testid="setup-next-4">Continue</Primary>
        </Card>
      )}

      {step === 5 && (
        <Card icon={Phone} title="Trusted contacts" subtitle="Numbers we can alert if your phone is lost or stolen.">
          <div className="space-y-2">
            {numbers.map((n, i) => (
              <div key={i} className="flex gap-2">
                <input value={n} onChange={(e) => setNum(i, e.target.value)} placeholder="+1 555 123 4567"
                  data-testid={`setup-number-${i}`}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 outline-none" />
                {numbers.length > 1 && (
                  <button onClick={() => setNumbers((x) => x.filter((_, idx) => idx !== i))} className="px-3 text-slate-400 hover:text-red-400"><X size={18} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setNumbers((n) => [...n, ''])} data-testid="setup-add-number" className="text-cyan-400 text-sm flex items-center gap-1 hover:text-cyan-300">
              <Plus size={15} /> Add another number
            </button>
          </div>
          <div className="mt-4">
            <label className="text-slate-400 text-xs mb-1 block">Backup number (optional)</label>
            <input value={backup} onChange={(e) => setBackup(e.target.value)} placeholder="+1 555 999 8888"
              data-testid="setup-backup-number"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 outline-none" />
            <p className="text-slate-500 text-xs mt-1">A trusted/backup number calling you 3× in 5 min auto-starts recovery (native phase).</p>
          </div>
          <button onClick={finish} disabled={busy} data-testid="setup-finish"
            className="w-full mt-5 py-3 rounded-xl bg-cyan-500 text-slate-900 font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Check size={18} /> {busy ? 'Saving…' : 'Finish setup'}
          </button>
        </Card>
      )}
    </div>
  );
};

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
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} data-testid={testid}
      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 outline-none" />
  </div>
);

const Primary = ({ onClick, children, testid }) => (
  <button onClick={onClick} data-testid={testid} className="w-full mt-2 py-3 rounded-xl bg-cyan-500 text-slate-900 font-bold">{children}</button>
);

export default SetupWizard;
