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
    this.keyTimes = [];
    this.touchStart = 0;
    this.touchDurations = [];
    this.swipeVels = [];
    this.motionMags = [];
    this.touchMoveRef = null;
    this.started = false;
  }

  start() {
    if (this.started) return;
    this.started = true;

    this._onKey = () => { this.keyTimes.push(performance.now()); if (this.keyTimes.length > 50) this.keyTimes.shift(); };
    this._onTouchStart = (e) => { this.touchStart = performance.now(); this.touchMoveRef = e.touches?.[0] || null; };
    this._onTouchEnd = (e) => {
      if (this.touchStart) {
        this.touchDurations.push(performance.now() - this.touchStart);
        if (this.touchDurations.length > 30) this.touchDurations.shift();
      }
      const end = e.changedTouches?.[0];
      if (this.touchMoveRef && end) {
        const dx = end.clientX - this.touchMoveRef.clientX;
        const dy = end.clientY - this.touchMoveRef.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dt = Math.max(1, performance.now() - this.touchStart);
        if (dist > 8) { this.swipeVels.push(dist / dt); if (this.swipeVels.length > 30) this.swipeVels.shift(); }
      }
      this.touchStart = 0;
    };
    this._onMotion = (e) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (a) {
        const m = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
        this.motionMags.push(m);
        if (this.motionMags.length > 50) this.motionMags.shift();
      }
    };

    window.addEventListener('keydown', this._onKey);
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchend', this._onTouchEnd, { passive: true });
    // mouse fallback for desktop testing
    window.addEventListener('mousedown', this._onTouchStart);
    window.addEventListener('mouseup', this._onTouchEnd);
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
      typing_variance: Math.round(this._std(intervals)) || 30,
      touch_duration: Math.round(this._mean(this.touchDurations)) || 95,
      swipe_velocity: Number(this._mean(this.swipeVels).toFixed(2)) || 2,
      motion_avg: Number(this._mean(this.motionMags).toFixed(2)) || 10,
      hour_of_day: new Date().getHours(),
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
      const res = await axios.post(`${API}/security/telemetry`, {
        device_id: this.deviceId, label, features: this.buildFeatures(),
      });
      return res.data;
    } catch (e) { return null; }
  }

  async score() {
    try {
      const loc = await this.getLocation();
      const res = await axios.post(`${API}/security/score`, {
        device_id: this.deviceId, features: this.buildFeatures(),
        lat: loc?.lat, lng: loc?.lng,
      });
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
      await axios.post(`${API}/security/evidence/photo`, { device_id: this.deviceId, photo: dataUrl, level, lat: loc?.lat, lng: loc?.lng });
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
}

const telemetry = new TelemetryService();
export { getDeviceId };
export default telemetry;
