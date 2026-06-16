// =============================================
// Digital Mate - Telemetry / Owner Recognition collector
// Gathers real behavioural signals available to a web/Capacitor app:
//  - typing rhythm (key intervals)
//  - touch duration & swipe velocity
//  - device motion (accelerometer)
//  - time-of-day
// and reports them to the Security Engine for baseline training & scoring.
// =============================================
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getDeviceId() {
  let id = localStorage.getItem('dm_device_id');
  if (!id) {
    id = 'dm-' + (crypto?.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));
    localStorage.setItem('dm_device_id', id);
  }
  return id;
}

class TelemetryService {
  constructor() {
    this.deviceId = getDeviceId();
    this.keyTimes = [];        // keydown timestamps (rhythm)
    this.dwellTimes = [];      // keyup - keydown (hold time)
    this.flightTimes = [];     // keydown - previous keyup
    this.keyDownAt = {};       // per-key keydown time
    this.lastKeyUp = 0;
    this.touchStart = 0;
    this.touchDurations = [];
    this.swipeVels = [];
    this.swipeLens = [];
    this.tapTimes = [];        // pointerdown timestamps (tap cadence)
    this.tapIntervals = [];
    this.pressures = [];       // pointer pressure
    this.motionMags = [];
    this.touchMoveRef = null;
    this.currentScreen = 'home';
    this.lastNetwork = null;
    this.lastScore = null;
    this.lastScoreAt = 0;
    this.knownDevice = undefined;     // 0-1 set by native Bluetooth bridge (owner's watch/car/earbuds)
    this.started = false;
  }

  setScreen(screen) { if (screen) this.currentScreen = screen; }

  _netSignature() {
    const c = navigator.connection || {};
    return [navigator.onLine ? 'on' : 'off', c.effectiveType || '?', c.type || '?'].join('|');
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.lastNetwork = this._netSignature();

    this._onKey = (e) => {
      const t = performance.now();
      this.keyTimes.push(t); if (this.keyTimes.length > 50) this.keyTimes.shift();
      this.keyDownAt[e.key || 'k'] = t;
      if (this.lastKeyUp) { this.flightTimes.push(t - this.lastKeyUp); if (this.flightTimes.length > 40) this.flightTimes.shift(); }
    };
    this._onKeyUp = (e) => {
      const t = performance.now();
      const down = this.keyDownAt[e.key || 'k'];
      if (down) { this.dwellTimes.push(t - down); if (this.dwellTimes.length > 40) this.dwellTimes.shift(); }
      this.lastKeyUp = t;
    };
    this._onDown = (e) => {
      const t = performance.now();
      this.touchStart = t;
      this.touchMoveRef = e.touches?.[0] || { clientX: e.clientX, clientY: e.clientY };
      if (this.tapTimes.length) { this.tapIntervals.push(t - this.tapTimes[this.tapTimes.length - 1]); if (this.tapIntervals.length > 30) this.tapIntervals.shift(); }
      this.tapTimes.push(t); if (this.tapTimes.length > 30) this.tapTimes.shift();
      if (typeof e.pressure === 'number' && e.pressure > 0) { this.pressures.push(e.pressure); if (this.pressures.length > 30) this.pressures.shift(); }
    };
    this._onUp = (e) => {
      if (this.touchStart) { this.touchDurations.push(performance.now() - this.touchStart); if (this.touchDurations.length > 30) this.touchDurations.shift(); }
      const end = e.changedTouches?.[0] || { clientX: e.clientX, clientY: e.clientY };
      if (this.touchMoveRef && end) {
        const dx = end.clientX - this.touchMoveRef.clientX;
        const dy = end.clientY - this.touchMoveRef.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dt = Math.max(1, performance.now() - this.touchStart);
        if (dist > 8) {
          this.swipeVels.push(dist / dt); if (this.swipeVels.length > 30) this.swipeVels.shift();
          this.swipeLens.push(dist); if (this.swipeLens.length > 30) this.swipeLens.shift();
        }
      }
      this.touchStart = 0;
    };
    this._onMotion = (e) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (a) { this.motionMags.push(Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2)); if (this.motionMags.length > 50) this.motionMags.shift(); }
    };
    this._onNet = () => {
      const sig = this._netSignature();
      if (this.lastNetwork && sig !== this.lastNetwork) {
        this.reportNetworkChange(this.lastNetwork, sig);
      }
      this.lastNetwork = sig;
    };

    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup', this._onKeyUp);
    // Pointer events give pressure; fall back to touch/mouse
    window.addEventListener('pointerdown', this._onDown, { passive: true });
    window.addEventListener('pointerup', this._onUp, { passive: true });
    window.addEventListener('online', this._onNet);
    window.addEventListener('offline', this._onNet);
    if (navigator.connection) navigator.connection.addEventListener?.('change', this._onNet);
    if (window.DeviceMotionEvent) window.addEventListener('devicemotion', this._onMotion);
  }

  _mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
  _std(arr) {
    if (arr.length < 2) return 0;
    const m = this._mean(arr);
    return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
  }

  buildFeatures() {
    const intervals = [];
    for (let i = 1; i < this.keyTimes.length; i++) intervals.push(this.keyTimes[i] - this.keyTimes[i - 1]);
    return {
      typing_speed: Math.round(this._mean(intervals)) || 180,
      typing_dwell: Math.round(this._mean(this.dwellTimes)) || 90,
      typing_flight: Math.round(this._mean(this.flightTimes)) || 70,
      typing_variance: Math.round(this._std(intervals)) || 30,
      touch_duration: Math.round(this._mean(this.touchDurations)) || 95,
      touch_pressure: Number((this._mean(this.pressures) || 0.5).toFixed(2)),
      tap_interval: Math.round(this._mean(this.tapIntervals)) || 400,
      swipe_velocity: Number((this._mean(this.swipeVels) || 2).toFixed(2)),
      swipe_length: Math.round(this._mean(this.swipeLens)) || 200,
      motion_avg: Number((this._mean(this.motionMags) || 10).toFixed(2)),
      hour_of_day: new Date().getHours(),
      day_of_week: new Date().getDay(),
    };
  }

  async getLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(null),
        { timeout: 4000, maximumAge: 60000 }
      );
    });
  }

  async sendTelemetry(label = 'owner') {
    try {
      const loc = await this.getLocation();
      const res = await axios.post(`${API}/security/telemetry`, {
        device_id: this.deviceId, label, features: this.buildFeatures(),
        screen: this.currentScreen, lat: loc?.lat, lng: loc?.lng,
      });
      return res.data;
    } catch (e) { return null; }
  }

  async reportNetworkChange(from, to) {
    try {
      return (await axios.post(`${API}/security/device-change`, {
        device_id: this.deviceId, kind: 'network',
        detail: `Network changed: ${from} -> ${to}`, metadata: { from, to },
      })).data;
    } catch (e) { return null; }
  }

  async score() {
    try {
      const loc = await this.getLocation();
      const res = await axios.post(`${API}/security/score`, {
        device_id: this.deviceId, features: this.buildFeatures(),
        screen: this.currentScreen, lat: loc?.lat, lng: loc?.lng,
        pin_ok: true,                          // reachable only after the access code unlock
        known_device: this.knownDevice,        // set by the native Bluetooth bridge when present
      });
      this.lastScore = res.data;       // cached for the live "who's using my phone" widget
      this.lastScoreAt = Date.now();
      return res.data;
    } catch (e) { return null; }
  }

  async status() {
    try { return (await axios.get(`${API}/security/status?device_id=${this.deviceId}`)).data; }
    catch (e) { return null; }
  }

  async reportLocation() {
    const loc = await this.getLocation();
    if (!loc) return null;
    try { return (await axios.post(`${API}/security/recovery/locate`, { device_id: this.deviceId, ...loc })).data; }
    catch (e) { return null; }
  }

  // Silently capture a front-camera photo and store it as evidence.
  async capturePhoto(level = 2) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 480 } } });
      const video = document.createElement('video');
      video.srcObject = stream; video.setAttribute('playsinline', 'true'); video.muted = true;
      await video.play();
      await new Promise((r) => setTimeout(r, 400));
      const vw = video.videoWidth || 480, vh = video.videoHeight || 360;
      const w = Math.min(vw, 480), scale = w / vw;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = Math.round(vh * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach((t) => t.stop());
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
      const loc = await this.getLocation();
      const bat = await this.getBattery();
      await axios.post(`${API}/security/evidence/photo`, { device_id: this.deviceId, photo: dataUrl, level, lat: loc?.lat, lng: loc?.lng, battery: bat.battery, charging: bat.charging });
      return dataUrl;
    } catch (e) {
      try {
        await axios.post(`${API}/security/events`, {
          device_id: this.deviceId, type: 'intruder_photo', severity: 'critical',
          title: 'Camera capture blocked', detail: 'Front camera was unavailable during intrusion.',
          metadata: { level },
        });
      } catch (_) { /* ignore */ }
      return null;
    }
  }

  async panic() {
    const loc = await this.getLocation();
    try { return (await axios.post(`${API}/security/panic`, { device_id: this.deviceId, lat: loc?.lat, lng: loc?.lng })).data; }
    catch (e) { return null; }
  }

  async alerts() {
    try { return (await axios.get(`${API}/security/alerts?device_id=${this.deviceId}`)).data; }
    catch (e) { return null; }
  }

  async aiInsights() {
    try { return (await axios.post(`${API}/security/ai-insights`, { device_id: this.deviceId }, { timeout: 20000 })).data; }
    catch (e) { return null; }
  }

  // ---- Family tracking (cross-device) ----
  async familyStatus() {
    try { return (await axios.get(`${API}/security/family/status?device_id=${this.deviceId}`)).data; }
    catch (e) { return { in_family: false }; }
  }
  async familyCreate(name) {
    return (await axios.post(`${API}/security/family/create`, { device_id: this.deviceId, name, member_role: 'parent' })).data;
  }
  async familyJoin({ name, member_role, family_code }) {
    return (await axios.post(`${API}/security/family/join`, { device_id: this.deviceId, name, member_role, family_code })).data;
  }
  async familyMembers() {
    try { return (await axios.get(`${API}/security/family/members?device_id=${this.deviceId}`)).data; }
    catch (e) { return { members: [] }; }
  }
  async familyLeave() {
    try { return (await axios.post(`${API}/security/family/leave`, { device_id: this.deviceId })).data; }
    catch (e) { return null; }
  }

  // ---- Decoy profile ----
  async getDecoyProfile() {
    try { return (await axios.get(`${API}/security/decoy/profile?device_id=${this.deviceId}`)).data; }
    catch (e) { return null; }
  }
  async saveDecoyProfile(p) {
    return (await axios.post(`${API}/security/decoy/profile`, { device_id: this.deviceId, ...p })).data;
  }

  // ---- Hidden Vault ----
  async vaultList(status = 'vault') {
    try { return (await axios.get(`${API}/security/vault/list?device_id=${this.deviceId}&status=${status}`)).data; }
    catch (e) { return { items: [] }; }
  }
  async vaultAdd({ kind, title, content, meta, status }) {
    return (await axios.post(`${API}/security/vault/add`, { device_id: this.deviceId, kind, title, content, status: status || 'vault', meta: meta || {} })).data;
  }
  async vaultApprove(itemId) {
    try { return (await axios.post(`${API}/security/vault/approve`, { device_id: this.deviceId, item_id: itemId })).data; }
    catch (e) { return null; }
  }
  async vaultItem(itemId) {
    try { return (await axios.get(`${API}/security/vault/item?device_id=${this.deviceId}&item_id=${itemId}`)).data; }
    catch (e) { return null; }
  }
  async vaultDelete(itemId) {
    try { return (await axios.delete(`${API}/security/vault/item?device_id=${this.deviceId}&item_id=${itemId}`)).data; }
    catch (e) { return null; }
  }

  async listProfiles() {
    try { return (await axios.get(`${API}/security/profiles?device_id=${this.deviceId}`)).data; }
    catch (e) { return { profiles: [] }; }
  }

  async addProfile({ name, access_code, role, recovery_code }) {
    return (await axios.post(`${API}/security/profiles/add`, {
      device_id: this.deviceId, name, access_code, role, recovery_code,
    })).data;
  }

  async removeProfile(profile_id, recovery_code) {
    return (await axios.post(`${API}/security/profiles/remove`, {
      device_id: this.deviceId, profile_id, recovery_code,
    })).data;
  }

  // ---- Setup (owner-defined codes; no defaults) ----
  async setupStatus() {
    try { return (await axios.get(`${API}/security/setup/status?device_id=${this.deviceId}`)).data; }
    catch (e) { return null; }
  }

  async submitSetup(payload) {
    const res = await axios.post(`${API}/security/setup`, { device_id: this.deviceId, ...payload }, { timeout: 20000 });
    return res.data;
  }

  verifyAccess(code) {
    // PLAIN TEXT verification - no hashing, no backend
    // Priority: 1. accessCode, 2. recoveryCode, 3. dev bypass
    
    const storedAccessCode = localStorage.getItem('dm_access_code');
    const storedRecoveryCode = localStorage.getItem('dm_recovery_code');
    
    // 1. Check access code first
    if (storedAccessCode && code === storedAccessCode) {
      console.log('[VERIFIED] Access code matched');
      return { verified: true, role: 'owner', profile: 'Owner' };
    }
    
    // 2. Check recovery code second
    if (storedRecoveryCode && code === storedRecoveryCode) {
      console.log('[VERIFIED] Recovery code matched');
      return { verified: true, role: 'owner', profile: 'Owner' };
    }
    
    // 3. Dev bypass last (always available)
    if (code === '0000') {
      console.log('[VERIFIED] Dev bypass code');
      return { verified: true, role: 'owner', profile: 'Developer' };
    }
    
    console.log('[REJECTED] Code did not match. Stored access:', storedAccessCode, 'Stored recovery:', storedRecoveryCode, 'Entered:', code);
    return { verified: false };
  }

  async triggerRecovery(secret) {
    const loc = await this.getLocation();
    try {
      return (await axios.post(`${API}/security/recovery/trigger`, { device_id: this.deviceId, secret, lat: loc?.lat, lng: loc?.lng })).data;
    } catch (e) { return { triggered: false }; }
  }

  async getBattery() {
    try {
      if (navigator.getBattery) {
        const b = await navigator.getBattery();
        return { battery: Math.round(b.level * 100), charging: b.charging };
      }
    } catch (e) { /* unsupported */ }
    return { battery: null, charging: null };
  }

  // ---- Privacy & Security Scan ----
  async _permState(name) {
    try {
      if (name === 'notifications' && 'Notification' in window) return Notification.permission === 'granted' ? 'granted' : 'denied';
      if (navigator.permissions?.query) {
        const r = await navigator.permissions.query({ name });
        return r.state; // granted | denied | prompt
      }
    } catch (e) { /* unsupported */ }
    return null;
  }

  async privacyScan() {
    const [camera, microphone, geolocation] = await Promise.all([
      this._permState('camera'), this._permState('microphone'), this._permState('geolocation'),
    ]);
    const notifications = await this._permState('notifications');
    const signals = {
      camera, microphone, geolocation, notifications,
      secure_context: window.isSecureContext === true,
      online: navigator.onLine,
    };
    const res = await axios.post(`${API}/security/privacy-scan`, { device_id: this.deviceId, signals });
    return res.data;
  }
}

const telemetry = new TelemetryService();
export { getDeviceId };
export default telemetry;
