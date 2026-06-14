import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Compass, Lock, Unlock, MapPin, Crosshair, Trash2, ShieldAlert, X } from 'lucide-react';
import telemetry from '../services/TelemetryService';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RecoveryCenter = () => {
  const [loc, setLoc] = useState(null);
  const [state, setState] = useState({});
  const [busy, setBusy] = useState(false);
  const [wipeStep, setWipeStep] = useState(0); // 0 closed, 1 code, 2 confirm
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [code, setCode] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([
        telemetry.status(),
        axios.get(`${API}/security/recovery/location?device_id=${telemetry.deviceId}`),
      ]);
      setState(s || {});
      setLoc(l.data.last_location || null);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const locate = async () => {
    setBusy(true);
    const r = await telemetry.reportLocation();
    if (r) { toast.success('Location updated'); setLoc(r.location); }
    else toast.error('Location permission denied');
    setBusy(false);
    refresh();
  };

  const lock = async () => {
    setBusy(true);
    await axios.post(`${API}/security/recovery/lock`, { device_id: telemetry.deviceId });
    toast.warning('Device locked & Lost Mode enabled');
    setBusy(false); refresh();
  };

  const unlock = async () => {
    setBusy(true);
    try {
      await axios.post(`${API}/security/recovery/unlock`, { device_id: telemetry.deviceId, owner_code: code });
      toast.success('Device unlocked');
      setUnlockOpen(false); setCode('');
    } catch (e) { toast.error('Wrong owner code'); }
    setBusy(false); refresh();
  };

  const wipe = async () => {
    setBusy(true);
    try {
      await axios.post(`${API}/security/recovery/wipe`, { device_id: telemetry.deviceId, owner_code: code, confirm: true });
      toast.success('Remote wipe completed');
      setWipeStep(0); setCode('');
    } catch (e) {
      toast.error(e?.response?.status === 403 ? 'Wrong owner code' : 'Wipe failed');
    }
    setBusy(false); refresh();
  };

  const mapSrc = loc
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - 0.01}%2C${loc.lat - 0.01}%2C${loc.lng + 0.01}%2C${loc.lat + 0.01}&layer=mapnik&marker=${loc.lat}%2C${loc.lng}`
    : null;

  return (
    <div className="p-5 pb-28 space-y-5" data-testid="recovery-center-screen">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Compass className="text-cyan-400" size={26} /> Device Recovery
        </h2>
        <p className="text-slate-400 text-sm mt-1">Find, lock or wipe your phone if it's lost or stolen.</p>
      </div>

      {/* status banner */}
      <div className={`rounded-xl border p-3 text-sm flex items-center gap-2 ${state.lost_mode ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'}`}>
        {state.lost_mode ? <Lock size={16} /> : <Unlock size={16} />}
        {state.lost_mode ? 'Lost Mode active — tracking & evidence on' : 'Device is in normal mode'}
      </div>

      {/* Map */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 overflow-hidden" data-testid="recovery-map">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-white font-medium flex items-center gap-2"><MapPin size={16} className="text-cyan-400" /> Last known location</span>
          <button onClick={locate} disabled={busy} data-testid="locate-btn" className="text-cyan-400 text-sm flex items-center gap-1 hover:text-cyan-300">
            <Crosshair size={15} /> Locate
          </button>
        </div>
        {mapSrc ? (
          <iframe title="device-location" src={mapSrc} className="w-full h-52 border-0" />
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-500 text-sm">Tap "Locate" to report this device's position</div>
        )}
        {loc && <p className="px-4 py-2 text-slate-400 text-xs">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</p>}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        {state.lost_mode ? (
          <button onClick={() => setUnlockOpen(true)} data-testid="mark-recovered-btn"
            className="py-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-semibold flex flex-col items-center gap-1.5 hover:bg-emerald-500/25 transition-colors">
            <Unlock size={22} /> Mark recovered
          </button>
        ) : (
          <button onClick={lock} disabled={busy} data-testid="mark-lost-btn"
            className="py-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 font-semibold flex flex-col items-center gap-1.5 hover:bg-amber-500/25 transition-colors">
            <Lock size={22} /> Mark phone lost
          </button>
        )}
        <button onClick={() => setWipeStep(1)} data-testid="remote-wipe-btn"
          className="py-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 font-semibold flex flex-col items-center gap-1.5 hover:bg-red-500/25 transition-colors">
          <Trash2 size={22} /> Remote Wipe
        </button>
      </div>

      {/* Unlock modal */}
      {unlockOpen && (
        <Modal onClose={() => setUnlockOpen(false)} title="Recovery code" testid="unlock-modal">
          <p className="text-slate-400 text-sm mb-3">Enter your Recovery code to unlock.</p>
          <CodeInput value={code} onChange={setCode} testid="unlock-code-input" />
          <button onClick={unlock} disabled={busy || code.length < 4} data-testid="unlock-confirm-btn"
            className="w-full mt-4 py-3 rounded-xl bg-emerald-500 text-slate-900 font-bold disabled:opacity-50">Unlock device</button>
        </Modal>
      )}

      {/* Wipe flow (safe, 2-step) */}
      {wipeStep > 0 && (
        <Modal onClose={() => { setWipeStep(0); setCode(''); }} title="Remote wipe" testid="wipe-modal">
          {wipeStep === 1 && (
            <>
              <div className="flex items-center gap-2 text-red-400 mb-3"><ShieldAlert size={18} /> <span className="font-semibold">This erases your vault</span></div>
              <p className="text-slate-400 text-sm mb-3">Enter your Emergency Wipe code to continue.</p>
              <CodeInput value={code} onChange={setCode} testid="wipe-code-input" />
              <button onClick={() => setWipeStep(2)} disabled={code.length < 4} data-testid="wipe-next-btn"
                className="w-full mt-4 py-3 rounded-xl bg-slate-700 text-white font-semibold disabled:opacity-50">Continue</button>
            </>
          )}
          {wipeStep === 2 && (
            <>
              <div className="flex items-center gap-2 text-red-400 mb-3"><ShieldAlert size={18} /> <span className="font-semibold">Final confirmation</span></div>
              <p className="text-slate-300 text-sm mb-4">This permanently wipes all vault files on this device. This cannot be undone.</p>
              <button onClick={wipe} disabled={busy} data-testid="wipe-confirm-btn"
                className="w-full py-3 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50">Yes, wipe my device now</button>
              <button onClick={() => { setWipeStep(0); setCode(''); }} className="w-full mt-2 py-2 text-slate-400 text-sm">Cancel</button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ title, children, onClose, testid }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4" data-testid={testid}>
    <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
      </div>
      {children}
    </div>
  </div>
);

const CodeInput = ({ value, onChange, testid }) => (
  <input type="password" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)}
    placeholder="Owner code" data-testid={testid}
    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white tracking-widest text-center focus:border-cyan-500 outline-none" />
);

export default RecoveryCenter;
