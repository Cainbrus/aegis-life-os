import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Shield, Brain, Clock, Camera, MapPin, Ghost, RefreshCw, ChevronRight, AlertTriangle, CheckCircle, RotateCcw, Smartphone } from 'lucide-react';
import telemetry from '../services/TelemetryService';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = ({ onNavigate, onTestDecoy, onResetSetup }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [statusRes, eventsRes, scoreRes] = await Promise.all([
        axios.get(`${API}/security/status`, { params: { device_id: telemetry.deviceId } }),
        axios.get(`${API}/security/events`, { params: { device_id: telemetry.deviceId, limit: 100 } }),
        telemetry.score(),
      ]);

      const events = eventsRes.data?.events || [];
      const intruderPhotos = events.filter(e => e.type === 'intruder_photo' || e.type === 'photo_captured').length;
      const gpsEvents = events.filter(e => e.type === 'location_update' || e.type === 'gps_tracking').length;
      const decoyActivations = events.filter(e => e.type === 'decoy_activated' || e.type === 'entered_decoy' || e.detail?.includes('Decoy')).length;
      const lastUnlock = events.find(e => e.type === 'access_verified' || e.type === 'unlocked');

      setStats({
        protectionActive: statusRes.data?.configured || false,
        learnedBehavior: Math.min(100, Math.round((scoreRes?.confidence || 0) * 100)),
        trustScore: scoreRes?.trust_score || 0,
        lastUnlock: lastUnlock ? new Date(lastUnlock.timestamp).toLocaleString() : 'Never',
        intruderPhotos,
        gpsEvents,
        decoyActivations,
        totalEvents: events.length,
      });
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setStats({
        protectionActive: true,
        learnedBehavior: 0,
        trustScore: 100,
        lastUnlock: 'Unknown',
        intruderPhotos: 0,
        gpsEvents: 0,
        decoyActivations: 0,
        totalEvents: 0,
      });
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1121] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1121] pb-28" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600/20 to-transparent px-5 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src={`${process.env.PUBLIC_URL}/brand/shield-emblem.png`} 
              alt="Digital Mate" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(37,99,235,0.5)]" 
            />
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm">Protection Overview</p>
            </div>
          </div>
          <button 
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
            data-testid="refresh-stats"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Protection Status Banner */}
        <div className={`rounded-2xl p-4 border ${stats.protectionActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center gap-3">
            {stats.protectionActive ? (
              <CheckCircle className="text-emerald-400" size={24} />
            ) : (
              <AlertTriangle className="text-red-400" size={24} />
            )}
            <div>
              <p className={`font-bold ${stats.protectionActive ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.protectionActive ? 'Protection Active' : 'Protection Inactive'}
              </p>
              <p className="text-slate-400 text-sm">
                {stats.protectionActive ? 'Your device is being monitored' : 'Complete setup to enable protection'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 -mt-2 space-y-3">
        {/* Learned Behavior */}
        <StatCard
          icon={Brain}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/20"
          title="Learned Behaviour"
          value={`${stats.learnedBehavior}%`}
          subtitle={stats.learnedBehavior < 50 ? 'Still learning your patterns' : 'Good recognition confidence'}
          onClick={() => onNavigate?.('owner')}
          testId="stat-learned-behavior"
        >
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.learnedBehavior}%` }}
            />
          </div>
        </StatCard>

        {/* Last Unlock */}
        <StatCard
          icon={Clock}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20"
          title="Last Unlock"
          value={stats.lastUnlock}
          subtitle="Most recent verified access"
          testId="stat-last-unlock"
        />

        {/* Intruder Photos */}
        <StatCard
          icon={Camera}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/20"
          title="Intruder Photos"
          value={stats.intruderPhotos}
          subtitle={stats.intruderPhotos > 0 ? 'Photos captured during intrusions' : 'No intrusion photos yet'}
          onClick={() => onNavigate?.('evidence')}
          testId="stat-intruder-photos"
          showArrow={stats.intruderPhotos > 0}
        />

        {/* GPS Events */}
        <StatCard
          icon={MapPin}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          title="GPS Events"
          value={stats.gpsEvents}
          subtitle={stats.gpsEvents > 0 ? 'Location tracking events logged' : 'No GPS events recorded'}
          onClick={() => onNavigate?.('recovery')}
          testId="stat-gps-events"
          showArrow={stats.gpsEvents > 0}
        />

        {/* Decoy Activations */}
        <StatCard
          icon={Ghost}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/20"
          title="Decoy Activations"
          value={stats.decoyActivations}
          subtitle={stats.decoyActivations > 0 ? 'Times fake phone was shown' : 'Decoy not triggered yet'}
          onClick={() => onNavigate?.('decoy')}
          testId="stat-decoy-activations"
          showArrow
        />

        {/* Trust Score */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Shield className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-white font-semibold">Current Trust Score</p>
                <p className="text-slate-400 text-sm">Real-time owner confidence</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${stats.trustScore >= 70 ? 'text-emerald-400' : stats.trustScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {stats.trustScore}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-6">
        <h3 className="text-slate-400 text-sm font-medium mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            label="View Evidence"
            icon={Camera}
            onClick={() => onNavigate?.('evidence')}
            testId="quick-evidence"
          />
          <QuickAction
            label="Edit Decoy"
            icon={Ghost}
            onClick={() => onNavigate?.('decoy')}
            testId="quick-decoy"
          />
          <QuickAction
            label="Recovery Center"
            icon={MapPin}
            onClick={() => onNavigate?.('recovery')}
            testId="quick-recovery"
          />
          <QuickAction
            label="Protection Status"
            icon={Shield}
            onClick={() => onNavigate?.('status')}
            testId="quick-status"
          />
        </div>
      </div>

      {/* Dev/Test Actions */}
      <div className="px-5 mt-6 pb-8">
        <h3 className="text-slate-400 text-sm font-medium mb-3">Testing</h3>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            label="Test Decoy"
            icon={Smartphone}
            onClick={onTestDecoy}
            testId="test-decoy-btn"
            variant="warning"
          />
          <QuickAction
            label="Reset Setup"
            icon={RotateCcw}
            onClick={onResetSetup}
            testId="reset-setup-btn"
            variant="danger"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, iconColor, iconBg, title, value, subtitle, onClick, testId, showArrow, children }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`w-full text-left rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 transition-colors ${onClick ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'}`}
    data-testid={testId}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={iconColor} size={20} />
        </div>
        <div>
          <p className="text-white font-semibold">{title}</p>
          <p className="text-slate-400 text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {showArrow && <ChevronRight className="text-slate-500" size={18} />}
      </div>
    </div>
    {children}
  </button>
);

const QuickAction = ({ label, icon: Icon, onClick, testId, variant }) => {
  const baseClass = "flex items-center gap-2 p-3 rounded-xl border transition-colors";
  const variantClass = variant === 'danger' 
    ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
    : variant === 'warning'
    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white";
  
  return (
    <button
      onClick={onClick}
      className={`${baseClass} ${variantClass}`}
      data-testid={testId}
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default AdminDashboard;
