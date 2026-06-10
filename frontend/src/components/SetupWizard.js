import React, { useState } from 'react';
import { toast } from 'sonner';
import { Shield, KeyRound, Phone, Lock, Plus, X, Check } from 'lucide-react';
import telemetry from '../services/TelemetryService';

// First-run setup. The owner defines their OWN codes — no defaults exist anywhere.
const SetupWizard = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [recovery, setRecovery] = useState('');
  const [recovery2, setRecovery2] = useState('');
  const [vault, setVault] = useState('');
  const [vault2, setVault2] = useState('');
  const [numbers, setNumbers] = useState(['']);
  const [busy, setBusy] = useState(false);

  const setNum = (i, v) => setNumbers((n) => n.map((x, idx) => (idx === i ? v : x)));
  const addNum = () => setNumbers((n) => [...n, '']);
  const rmNum = (i) => setNumbers((n) => n.filter((_, idx) => idx !== i));

  const next = () => {
    if (step === 0) {
      if (recovery.length < 4) return toast.error('Recovery code must be at least 4 characters');
      if (recovery !== recovery2) return toast.error('Recovery codes do not match');
    }
    if (step === 1) {
      if (!/^\d{4,}$/.test(vault)) return toast.error('Vault code must be at least 4 digits');
      if (vault !== vault2) return toast.error('Vault codes do not match');
    }
    setStep((s) => s + 1);
  };

  const finish = async () => {
    const trusted = numbers.map((n) => n.trim()).filter(Boolean);
    if (!trusted.length) return toast.error('Add at least one trusted number');
    setBusy(true);
    try {
      await telemetry.submitSetup({ recovery_code: recovery, vault_code: vault, trusted_numbers: trusted });
      toast.success('Setup complete — your codes are saved securely');
      onDone?.();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Setup failed');
    }
    setBusy(false);
  };

  const STEPS = ['Recovery code', 'Vault code', 'Trusted contacts'];

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

      {/* progress */}
      <div className="flex gap-2 my-5">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-cyan-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      {step === 0 && (
        <Card icon={KeyRound} title="Recovery code" subtitle="Authorizes unlock, wipe and emergency actions. Choose something only you know.">
          <Field label="Recovery code" value={recovery} onChange={setRecovery} type="password" testid="setup-recovery" placeholder="At least 4 characters" />
          <Field label="Confirm code" value={recovery2} onChange={setRecovery2} type="password" testid="setup-recovery2" placeholder="Re-enter" />
          <Primary onClick={next} testid="setup-next-0">Continue</Primary>
        </Card>
      )}

      {step === 1 && (
        <Card icon={Lock} title="Secret vault code" subtitle="Dial this number in the Phone app to open your Invisible Vault.">
          <Field label="Vault code (digits)" value={vault} onChange={setVault} type="password" inputMode="numeric" testid="setup-vault" placeholder="e.g. 4 or more digits" />
          <Field label="Confirm vault code" value={vault2} onChange={setVault2} type="password" inputMode="numeric" testid="setup-vault2" placeholder="Re-enter" />
          <Primary onClick={next} testid="setup-next-1">Continue</Primary>
        </Card>
      )}

      {step === 2 && (
        <Card icon={Phone} title="Trusted contacts" subtitle="Numbers we can alert if your phone is lost or stolen.">
          <div className="space-y-2">
            {numbers.map((n, i) => (
              <div key={i} className="flex gap-2">
                <input value={n} onChange={(e) => setNum(i, e.target.value)} placeholder="+1 555 123 4567"
                  data-testid={`setup-number-${i}`}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 outline-none" />
                {numbers.length > 1 && (
                  <button onClick={() => rmNum(i)} className="px-3 text-slate-400 hover:text-red-400"><X size={18} /></button>
                )}
              </div>
            ))}
            <button onClick={addNum} data-testid="setup-add-number" className="text-cyan-400 text-sm flex items-center gap-1 hover:text-cyan-300">
              <Plus size={15} /> Add another number
            </button>
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

const Field = ({ label, value, onChange, type = 'text', inputMode, placeholder, testid }) => (
  <div className="mb-3">
    <label className="text-slate-400 text-xs mb-1 block">{label}</label>
    <input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} data-testid={testid}
      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:border-cyan-500 outline-none" />
  </div>
);

const Primary = ({ onClick, children, testid }) => (
  <button onClick={onClick} data-testid={testid} className="w-full mt-2 py-3 rounded-xl bg-cyan-500 text-slate-900 font-bold">{children}</button>
);

export default SetupWizard;
