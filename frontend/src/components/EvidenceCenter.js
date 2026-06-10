import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { FileClock, MapPin, Camera, ShieldAlert, Lock, RotateCcw, Trash2 } from 'lucide-react';
import telemetry from '../services/TelemetryService';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICONS = {
  access_attempt: ShieldAlert,
  intruder_photo: Camera,
  location: MapPin,
  trap: ShieldAlert,
  recovery: Lock,
  device_change: RotateCcw,
};

const SEV_STYLES = {
  critical: 'border-red-500/40 bg-red-500/5',
  warning: 'border-amber-500/40 bg-amber-500/5',
  info: 'border-slate-600 bg-slate-800/40',
};

const EvidenceCenter = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/security/events?device_id=${telemetry.deviceId}`);
      setEvents(res.data.events || []);
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clearAll = async () => {
    await axios.delete(`${API}/security/events?device_id=${telemetry.deviceId}`);
    load();
  };

  const fmt = (iso) => {
    try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch { return iso; }
  };

  return (
    <div className="p-5 space-y-5" data-testid="evidence-center-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileClock className="text-cyan-400" size={26} /> Evidence Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">Every suspicious event, access attempt and location.</p>
        </div>
        {events.length > 0 && (
          <button onClick={clearAll} data-testid="clear-evidence-btn" className="text-slate-500 hover:text-red-400 transition-colors">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading timeline…</p>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-8 text-center" data-testid="evidence-empty">
          <ShieldAlert className="mx-auto text-emerald-400 mb-3" size={36} />
          <p className="text-white font-semibold">All clear</p>
          <p className="text-slate-400 text-sm mt-1">No suspicious activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="evidence-timeline">
          {events.map((e) => {
            const Icon = ICONS[e.type] || ShieldAlert;
            return (
              <div key={e.id} className={`rounded-xl border p-4 ${SEV_STYLES[e.severity] || SEV_STYLES.info}`} data-testid="evidence-item">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5"><Icon size={18} className={e.severity === 'critical' ? 'text-red-400' : e.severity === 'warning' ? 'text-amber-400' : 'text-slate-400'} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="text-white font-medium text-sm">{e.title}</p>
                      <span className="text-slate-500 text-xs whitespace-nowrap">{fmt(e.created_at)}</span>
                    </div>
                    {e.detail && <p className="text-slate-400 text-xs mt-1">{e.detail}</p>}
                    {e.lat != null && e.lng != null && (
                      <p className="text-cyan-400/80 text-xs mt-1 flex items-center gap-1">
                        <MapPin size={11} /> {e.lat.toFixed(4)}, {e.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvidenceCenter;
