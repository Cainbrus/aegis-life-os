import React, { useState, useEffect } from 'react';

// Stealth cover. Looks like an ordinary app. Entering the owner's Access code opens the
// dashboard; entering the Panic pattern / Recovery phrase silently triggers recovery.
// onSubmit(code) returns one of: 'unlocked' | 'recovery' | 'none' (handled by App).
const CoverScreen = ({ cover = 'calculator', onSubmit }) => {
  if (cover === 'clock') return <ClockCover onSubmit={onSubmit} />;
  if (cover === 'notes') return <NotesCover onSubmit={onSubmit} />;
  return <CalculatorCover onSubmit={onSubmit} />;
};

// ---------------- Calculator ----------------
const CalculatorCover = ({ onSubmit }) => {
  const [expr, setExpr] = useState('');
  const [display, setDisplay] = useState('0');

  const press = async (k) => {
    if (k === 'C') { setExpr(''); setDisplay('0'); return; }
    if (k === '=') {
      // Try the typed sequence as an access/recovery secret first.
      const res = await onSubmit(expr.replace(/[^0-9a-zA-Z]/g, ''));
      if (res === 'unlocked') return;
      // Otherwise behave like a normal calculator.
      try {
        // eslint-disable-next-line no-eval
        const val = String(eval(expr.replace(/[^0-9+\-*/.]/g, '')) ?? '');
        setDisplay(val || '0'); setExpr(val);
      } catch { setDisplay('Error'); setExpr(''); }
      return;
    }
    const ne = expr + k;
    setExpr(ne); setDisplay(ne);
  };

  const keys = ['C', '/', '*', '⌫', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'];
  return (
    <div className="min-h-screen bg-[#0e1626] flex flex-col justify-end p-4" data-testid="cover-calculator">
      <div className="text-right text-white text-5xl font-light px-4 py-10 break-all min-h-[120px]" data-testid="calc-display">{display}</div>
      <div className="grid grid-cols-4 gap-2">
        {keys.map((k) => (
          <button key={k} onClick={() => (k === '⌫' ? (setExpr((e) => e.slice(0, -1)), setDisplay((d) => d.slice(0, -1) || '0')) : press(k))}
            data-testid={`calc-key-${k === '=' ? 'equals' : k === '/' ? 'div' : k === '*' ? 'mul' : k}`}
            className={`h-16 rounded-2xl text-2xl font-medium ${k === '=' ? 'bg-orange-500 text-white' : ['/', '*', '-', '+', 'C', '⌫'].includes(k) ? 'bg-slate-700 text-orange-400' : 'bg-slate-800 text-white'} ${k === '0' ? 'col-span-2' : ''} active:opacity-70`}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
};

// ---------------- Shared numeric passcode pad ----------------
const Pad = ({ onSubmit, onClose }) => {
  const [v, setV] = useState('');
  const tap = async (d) => {
    if (d === 'ok') { const r = await onSubmit(v); if (r !== 'unlocked') setV(''); return; }
    if (d === 'del') return setV((s) => s.slice(0, -1));
    setV((s) => (s.length < 12 ? s + d : s));
  };
  return (
    <div className="fixed inset-0 z-50 bg-[#0B1121]/95 flex flex-col items-center justify-center p-6" data-testid="cover-pad">
      <input value={v} readOnly className="text-center text-white text-3xl tracking-widest mb-6 bg-transparent" placeholder="••••" />
      <div className="grid grid-cols-3 gap-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map((d) => (
          <button key={d} onClick={() => tap(d)} data-testid={`pad-${d}`}
            className="w-16 h-16 rounded-full bg-slate-800 text-white text-xl active:opacity-70">
            {d === 'del' ? '⌫' : d === 'ok' ? '→' : d}
          </button>
        ))}
      </div>
      <button onClick={onClose} className="mt-6 text-slate-600 text-xs">close</button>
    </div>
  );
};

// ---------------- Clock ----------------
const ClockCover = ({ onSubmit }) => {
  const [now, setNow] = useState(new Date());
  const [taps, setTaps] = useState(0);
  const [pad, setPad] = useState(false);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const tap = () => { const n = taps + 1; setTaps(n); if (n >= 3) { setPad(true); setTaps(0); } setTimeout(() => setTaps(0), 1500); };
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-[#0B1121] flex flex-col items-center justify-center" data-testid="cover-clock" onClick={tap}>
      <p className="text-white text-7xl font-thin tabular-nums">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
      <p className="text-slate-400 mt-2">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      {pad && <Pad onSubmit={onSubmit} onClose={() => setPad(false)} />}
    </div>
  );
};

// ---------------- Notes ----------------
const NotesCover = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const save = async () => { const r = await onSubmit(text.trim().replace(/\s+/g, '')); if (r !== 'unlocked') setText(''); };
  return (
    <div className="min-h-screen bg-[#0e1626] flex flex-col" data-testid="cover-notes">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h1 className="text-white text-xl font-semibold">Notes</h1>
        <button onClick={save} data-testid="notes-save" className="text-blue-400 font-medium">Done</button>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} autoFocus placeholder="Tap to add a note…"
        data-testid="notes-text"
        className="flex-1 bg-transparent text-white p-5 outline-none resize-none text-lg" />
    </div>
  );
};

export default CoverScreen;
