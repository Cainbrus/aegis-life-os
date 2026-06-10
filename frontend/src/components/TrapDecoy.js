import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cloud, Calculator, Clock, Camera, Music, Settings, StickyNote } from 'lucide-react';
import telemetry from '../services/TelemetryService';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Decoy "safe" environment shown to an unrecognized user.
// Looks like an ordinary phone but contains no sensitive data.
// Every interaction is silently recorded as evidence.
const FAKE_APPS = [
  { name: 'Weather', icon: Cloud, color: 'from-sky-500 to-blue-500' },
  { name: 'Calculator', icon: Calculator, color: 'from-slate-500 to-slate-600' },
  { name: 'Clock', icon: Clock, color: 'from-indigo-500 to-purple-500' },
  { name: 'Camera', icon: Camera, color: 'from-pink-500 to-rose-500' },
  { name: 'Music', icon: Music, color: 'from-emerald-500 to-teal-500' },
  { name: 'Notes', icon: StickyNote, color: 'from-amber-500 to-orange-500' },
  { name: 'Photos', icon: Camera, color: 'from-fuchsia-500 to-pink-500' },
  { name: 'Settings', icon: Settings, color: 'from-slate-600 to-slate-700' },
];

const TrapDecoy = ({ onOwnerExit }) => {
  const [tapCount, setTapCount] = useState(0);
  const [opened, setOpened] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    // record that trap environment is being viewed
    log('viewed_home', 'decoy');
    return () => clearInterval(t);
  }, []);

  const log = (action, target = '', detail = '') => {
    axios.post(`${API}/security/trap/log-action`, {
      device_id: telemetry.deviceId, action, target, detail,
    }).catch(() => {});
  };

  const openApp = (name) => {
    log('opened_app', name);
    setOpened(name);
    setTimeout(() => setOpened(null), 1400);
  };

  // Secret owner escape: tap the clock 5 times quickly.
  const handleSecretTap = () => {
    const n = tapCount + 1;
    setTapCount(n);
    if (n >= 5) { setTapCount(0); onOwnerExit?.(); }
    setTimeout(() => setTapCount(0), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 p-6 flex flex-col" data-testid="trap-decoy-screen">
      <div className="text-center pt-8 select-none" onClick={handleSecretTap}>
        <p className="text-6xl font-thin text-white" data-testid="decoy-clock">
          {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </p>
        <p className="text-slate-300 mt-1">{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mt-16">
        {FAKE_APPS.map((app) => {
          const Icon = app.icon;
          return (
            <button key={app.name} onClick={() => openApp(app.name)} data-testid={`decoy-app-${app.name.toLowerCase()}`}
              className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center shadow-lg`}>
                <Icon size={26} className="text-white" />
              </div>
              <span className="text-white text-xs">{app.name}</span>
            </button>
          );
        })}
      </div>

      {opened && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center" data-testid="decoy-app-open">
          <div className="text-center">
            <p className="text-slate-300 text-lg">Opening {opened}…</p>
            <p className="text-slate-600 text-sm mt-2">No data available</p>
          </div>
        </div>
      )}

      <div className="mt-auto text-center pb-4">
        <p className="text-slate-700 text-xs">●●●●</p>
      </div>
    </div>
  );
};

export default TrapDecoy;
