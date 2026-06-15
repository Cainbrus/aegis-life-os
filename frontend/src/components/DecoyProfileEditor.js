import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Ghost, Wand2, Eye, Save, Plus, X } from 'lucide-react';
import telemetry from '../services/TelemetryService';
import DecoyMode from './DecoyMode';

// Owner-created Decoy Profile. Choose what the fake phone shows an intruder.
// SAFETY: only this owner-approved content appears in Decoy Mode — never vault/passwords/private data.
const GENERIC = {
  name: 'My decoy',
  contacts: ['Alex Carter', 'Mum', 'Jordan', 'Work', 'Sam Reed', 'Taylor'],
  messages: [
    { from: 'Mum', text: 'Dinner Sunday? x', time: '9:41' },
    { from: 'Jordan', text: 'haha yeah', time: '8:12' },
    { from: 'Work', text: 'See you at 9', time: 'Yesterday' },
  ],
  notes: [
    { title: 'Shopping', body: 'milk, eggs, bread' },
    { title: 'Wifi', body: 'guest: welcome123' },
  ],
};

const DecoyProfileEditor = () => {
  const [p, setP] = useState(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    telemetry.getDecoyProfile().then((d) => {
      setP(d ? { name: d.name || 'My decoy', contacts: d.contacts || [], messages: d.messages || [], notes: d.notes || [] }
        : { ...GENERIC });
    });
  }, []);

  if (!p) return <div className="p-5 text-slate-500" data-testid="decoy-editor">Loading…</div>;

  const setContacts = (text) => setP({ ...p, contacts: text.split('\n').map((s) => s.trim()).filter(Boolean) });
  const setMsg = (i, k, v) => setP({ ...p, messages: p.messages.map((m, idx) => idx === i ? { ...m, [k]: v } : m) });
  const setNote = (i, k, v) => setP({ ...p, notes: p.notes.map((n, idx) => idx === i ? { ...n, [k]: v } : n) });

  const save = async () => {
    setBusy(true);
    try { await telemetry.saveDecoyProfile(p); toast.success('Decoy profile saved'); }
    catch (e) { toast.error('Could not save'); }
    setBusy(false);
  };

  if (preview) {
    return (
      <div className="fixed inset-0 z-50 bg-black" data-testid="decoy-preview">
        <DecoyMode profile={p} preview onOwnerExit={() => setPreview(false)} />
        <button onClick={() => setPreview(false)} data-testid="decoy-preview-close"
          className="fixed top-4 right-4 z-[60] bg-slate-900/90 text-white text-xs px-3 py-2 rounded-lg border border-slate-600">Exit preview</button>
      </div>
    );
  }

  return (
    <div className="p-5 pb-28 space-y-5" data-testid="decoy-editor">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Ghost className="text-purple-400" size={26} /> Decoy Profile</h2>
        <p className="text-slate-400 text-sm mt-1">What an intruder sees in the fake phone. Keep it harmless.</p>
      </div>

      <button onClick={() => setP({ ...GENERIC })} data-testid="decoy-quickfill"
        className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 font-medium flex items-center justify-center gap-2 hover:bg-slate-700/60">
        <Wand2 size={18} /> Quick fill (generic harmless content)
      </button>

      <Field label="Profile name" value={p.name} onChange={(v) => setP({ ...p, name: v })} testid="decoy-name" />

      <div>
        <label className="text-slate-400 text-xs mb-1 block">Fake contacts (one per line)</label>
        <textarea value={p.contacts.join('\n')} onChange={(e) => setContacts(e.target.value)} rows={5} data-testid="decoy-contacts"
          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white outline-none focus:border-purple-500" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between"><label className="text-slate-400 text-xs">Fake messages</label>
          <button onClick={() => setP({ ...p, messages: [...p.messages, { from: '', text: '', time: 'now' }] })} className="text-cyan-400 text-xs flex items-center gap-1"><Plus size={13} /> Add</button></div>
        {p.messages.map((m, i) => (
          <div key={i} className="flex gap-2" data-testid="decoy-msg-row">
            <input value={m.from} onChange={(e) => setMsg(i, 'from', e.target.value)} placeholder="From" className="w-24 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm outline-none" />
            <input value={m.text} onChange={(e) => setMsg(i, 'text', e.target.value)} placeholder="Message" className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm outline-none" />
            <button onClick={() => setP({ ...p, messages: p.messages.filter((_, idx) => idx !== i) })} className="text-slate-500"><X size={16} /></button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between"><label className="text-slate-400 text-xs">Fake notes</label>
          <button onClick={() => setP({ ...p, notes: [...p.notes, { title: '', body: '' }] })} className="text-cyan-400 text-xs flex items-center gap-1"><Plus size={13} /> Add</button></div>
        {p.notes.map((n, i) => (
          <div key={i} className="space-y-1" data-testid="decoy-note-row">
            <input value={n.title} onChange={(e) => setNote(i, 'title', e.target.value)} placeholder="Title" className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm outline-none" />
            <div className="flex gap-2">
              <input value={n.body} onChange={(e) => setNote(i, 'body', e.target.value)} placeholder="Body" className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm outline-none" />
              <button onClick={() => setP({ ...p, notes: p.notes.filter((_, idx) => idx !== i) })} className="text-slate-500"><X size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setPreview(true)} data-testid="decoy-preview-btn" className="py-3 rounded-xl bg-slate-700 text-white font-semibold flex items-center justify-center gap-2"><Eye size={18} /> Preview</button>
        <button onClick={save} disabled={busy} data-testid="decoy-save" className="py-3 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Save size={18} /> {busy ? 'Saving…' : 'Save'}</button>
      </div>
      <p className="text-slate-600 text-xs text-center">Your real photos, vault, passwords and messages are never shown here.</p>
    </div>
  );
};

const Field = ({ label, value, onChange, testid }) => (
  <div>
    <label className="text-slate-400 text-xs mb-1 block">{label}</label>
    <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid}
      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white outline-none focus:border-purple-500" />
  </div>
);

export default DecoyProfileEditor;
