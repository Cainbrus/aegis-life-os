import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Image, StickyNote, Phone, Camera, Settings, Cloud, Users } from 'lucide-react';
import telemetry from '../services/TelemetryService';

// Stealth Decoy / Fake Phone. Shown silently when an unrecognised user is detected.
// Looks like an ordinary phone with believable but FAKE data. The real owner's data stays hidden.
// Every interaction is logged as evidence; a front-camera photo + location are captured on entry.
// No warnings are ever shown to the intruder.

const FAKE_APPS = [
  { id: 'messages', name: 'Messages', icon: MessageSquare, color: 'from-green-500 to-emerald-600' },
  { id: 'photos', name: 'Photos', icon: Image, color: 'from-pink-500 to-rose-600' },
  { id: 'contacts', name: 'Contacts', icon: Users, color: 'from-blue-500 to-indigo-600' },
  { id: 'notes', name: 'Notes', icon: StickyNote, color: 'from-amber-400 to-yellow-500' },
  { id: 'phone', name: 'Phone', icon: Phone, color: 'from-emerald-500 to-green-600' },
  { id: 'camera', name: 'Camera', icon: Camera, color: 'from-slate-500 to-slate-700' },
  { id: 'weather', name: 'Weather', icon: Cloud, color: 'from-sky-400 to-blue-500' },
  { id: 'settings', name: 'Settings', icon: Settings, color: 'from-slate-600 to-slate-800' },
];

const FAKE_MESSAGES = [
  { from: 'Mum', text: 'Are you coming for dinner Sunday? x', time: '9:41' },
  { from: 'Jordan', text: 'haha yeah saw that 😂', time: '8:12' },
  { from: 'Delivery', text: 'Your parcel is out for delivery today', time: 'Yesterday' },
  { from: 'Sam', text: 'call me when you get a sec', time: 'Yesterday' },
  { from: 'Gym', text: 'Class booked for 6pm Tue', time: 'Mon' },
];
const FAKE_CONTACTS = ['Alex Carter', 'Mum', 'Jordan', 'Dr Patel', 'Sam Reed', 'Pizza Place', 'Work', 'Taylor'];
const FAKE_NOTES = [
  { t: 'Shopping', b: 'milk, eggs, bread, coffee' },
  { t: 'Wifi', b: 'guest network: welcome123' },
  { t: 'Ideas', b: 'weekend trip — book hotel' },
];

const DecoyMode = ({ onOwnerExit }) => {
  const [view, setView] = useState('home');
  const [time, setTime] = useState(new Date());
  const [secretTaps, setSecretTaps] = useState(0);
  const captured = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    // On entry: log + silently capture evidence (photo + location)
    log('entered_decoy', 'home');
    if (!captured.current) {
      captured.current = true;
      telemetry.capturePhoto(3);
      telemetry.reportLocation();
    }
    return () => clearInterval(t);
  }, []);

  const log = (action, target = '', detail = '') => {
    axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/security/trap/log-action`, {
      device_id: telemetry.deviceId, action, target, detail,
    }).catch(() => {});
  };

  const open = (id) => { log('opened_app', id); setView(id); };

  // Hidden owner exit: tap the status-bar time 5x quickly
  const tapTime = () => {
    const n = secretTaps + 1; setSecretTaps(n);
    if (n >= 5) { setSecretTaps(0); onOwnerExit?.(); }
    setTimeout(() => setSecretTaps(0), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-300 flex flex-col" data-testid="decoy-mode">
      {/* status bar */}
      <div className="flex justify-between items-center px-5 pt-3 pb-1 text-slate-800 text-xs font-medium">
        <span onClick={tapTime} className="select-none cursor-default" data-testid="decoy-statusbar-time">
          {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
        <span>5G  ▦  82%</span>
      </div>

      {view === 'home' && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mt-10 mb-12 select-none" onClick={tapTime}>
            <p className="text-6xl font-thin text-slate-800">{time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
            <p className="text-slate-600 mt-1">{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          {/* a fake notification */}
          <div className="mx-4 mb-6 bg-white/80 backdrop-blur rounded-2xl p-3 shadow-sm">
            <p className="text-xs text-slate-500">Messages · now</p>
            <p className="text-sm text-slate-800">Mum: Are you coming for dinner Sunday? x</p>
          </div>
          <div className="grid grid-cols-4 gap-5 px-6 mt-auto mb-10">
            {FAKE_APPS.map((a) => {
              const Icon = a.icon;
              return (
                <button key={a.id} onClick={() => open(a.id)} data-testid={`decoy-app-${a.id}`}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <span className="text-slate-700 text-[11px]">{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view !== 'home' && (
        <AppShell title={FAKE_APPS.find((a) => a.id === view)?.name} onBack={() => { log('closed_app', view); setView('home'); }}>
          {view === 'messages' && FAKE_MESSAGES.map((m, i) => (
            <Row key={i} title={m.from} sub={m.text} right={m.time} onClick={() => log('read_message', m.from)} />
          ))}
          {view === 'contacts' && FAKE_CONTACTS.map((c, i) => (
            <Row key={i} title={c} sub="mobile" onClick={() => log('viewed_contact', c)} />
          ))}
          {view === 'notes' && FAKE_NOTES.map((n, i) => (
            <Row key={i} title={n.t} sub={n.b} onClick={() => log('read_note', n.t)} />
          ))}
          {view === 'photos' && (
            <div className="grid grid-cols-3 gap-1 p-1">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} onClick={() => log('viewed_photo', `IMG_${1000 + i}`)}
                  className="aspect-square rounded" style={{ background: `hsl(${(i * 37) % 360} 45% 78%)` }} />
              ))}
            </div>
          )}
          {['phone', 'camera', 'weather', 'settings'].includes(view) && (
            <div className="p-10 text-center text-slate-500">
              <p className="text-sm">Nothing to show right now.</p>
            </div>
          )}
        </AppShell>
      )}
    </div>
  );
};

const AppShell = ({ title, onBack, children }) => (
  <div className="flex-1 bg-white flex flex-col" data-testid="decoy-app-open">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
      <button onClick={onBack} className="text-blue-500 text-sm">‹ Back</button>
      <h1 className="text-slate-900 font-semibold flex-1 text-center pr-10">{title}</h1>
    </div>
    <div className="flex-1 overflow-y-auto">{children}</div>
  </div>
);

const Row = ({ title, sub, right, onClick }) => (
  <button onClick={onClick} className="w-full text-left px-4 py-3 border-b border-slate-100 flex items-center gap-3 active:bg-slate-50">
    <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-slate-900 text-sm font-medium">{title}</p>
      <p className="text-slate-500 text-xs truncate">{sub}</p>
    </div>
    {right && <span className="text-slate-400 text-xs">{right}</span>}
  </button>
);

export default DecoyMode;
