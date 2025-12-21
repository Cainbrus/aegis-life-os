// =============================================
// AEGIS SMART PROTECTION SERVICE
// Handles idle detection, auto-cleanup, 
// intruder camera capture, and protection summaries
// =============================================

import { playNotification, playLock, playSosActivate } from './SoundService';

class SmartProtectionService {
  constructor() {
    this.idleTimeout = null;
    this.idleDelay = 30000; // 30 seconds for demo (would be longer in production)
    this.isIdle = false;
    this.lastActivity = Date.now();
    this.protectionLog = [];
    this.onIdleCallback = null;
    this.onActiveCallback = null;
    this.onProtectionComplete = null;
    this.isMonitoring = false;
    this.intruderPhotos = [];
    this.cleanupItems = [];
  }

  // Start monitoring for idle state
  startIdleMonitoring(options = {}) {
    if (this.isMonitoring) return;
    
    this.idleDelay = options.idleDelay || 30000;
    this.onIdleCallback = options.onIdle;
    this.onActiveCallback = options.onActive;
    this.onProtectionComplete = options.onProtectionComplete;
    this.isMonitoring = true;

    // Listen for user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'touchmove'];
    
    this.activityHandler = () => {
      this.lastActivity = Date.now();
      
      if (this.isIdle) {
        this.isIdle = false;
        if (this.onActiveCallback) {
          this.onActiveCallback();
        }
      }
      
      this.resetIdleTimer();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, this.activityHandler, { passive: true });
    });

    // Also monitor visibility changes (phone screen off)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    this.resetIdleTimer();
    console.log('🛡️ Aegis Smart Protection: Idle monitoring started');
  }

  // Stop monitoring
  stopIdleMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'touchmove'];
    activityEvents.forEach(event => {
      document.removeEventListener(event, this.activityHandler);
    });

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    console.log('🛡️ Aegis Smart Protection: Idle monitoring stopped');
  }

  // Reset the idle timer
  resetIdleTimer() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      this.triggerIdleProtection();
    }, this.idleDelay);
  }

  // Handle visibility changes (screen on/off)
  handleVisibilityChange() {
    if (document.hidden) {
      // Screen turned off - trigger protection immediately
      console.log('🛡️ Screen hidden - triggering protection');
      this.triggerIdleProtection();
    } else {
      // Screen turned on - could be intruder
      console.log('🛡️ Screen visible - monitoring for intruder');
      this.lastActivity = Date.now();
    }
  }

  // Trigger idle protection sequence
  async triggerIdleProtection() {
    if (this.isIdle) return;
    
    this.isIdle = true;
    playLock();
    
    console.log('🛡️ Aegis: Phone idle - activating protection');

    // Simulate cleanup actions
    const cleanupActions = await this.performAutoCleanup();
    
    if (this.onIdleCallback) {
      this.onIdleCallback(cleanupActions);
    }
  }

  // Perform automatic cleanup
  async performAutoCleanup() {
    const actions = [];
    const timestamp = new Date().toLocaleTimeString();

    // Simulated cleanup items (in real app, would actually clear these)
    const potentialCleanup = [
      { type: 'browser_history', description: 'Cleared recent browser history', count: 12, icon: '🌐' },
      { type: 'downloads', description: 'Moved 3 downloads to secure vault', count: 3, icon: '📥' },
      { type: 'clipboard', description: 'Cleared clipboard contents', count: 1, icon: '📋' },
      { type: 'recent_apps', description: 'Cleared recent apps list', count: 5, icon: '📱' },
      { type: 'notifications', description: 'Secured sensitive notifications', count: 2, icon: '🔔' },
    ];

    // Randomly select 2-4 cleanup actions for demo variety
    const numActions = Math.floor(Math.random() * 3) + 2;
    const shuffled = potentialCleanup.sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < numActions; i++) {
      const action = { ...shuffled[i], timestamp };
      actions.push(action);
      this.cleanupItems.push(action);
    }

    this.protectionLog.push({
      timestamp,
      type: 'auto_cleanup',
      actions
    });

    console.log('🛡️ Aegis: Auto-cleanup complete', actions);
    return actions;
  }

  // Capture intruder photo using device camera
  async captureIntruderPhoto() {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('Camera not available');
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } // Front camera
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();

      // Wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      // Get image data
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const photoRecord = {
        id: `intruder_${Date.now()}`,
        timestamp: new Date().toISOString(),
        image: imageData,
        location: await this.getLocation()
      };

      this.intruderPhotos.push(photoRecord);
      this.protectionLog.push({
        timestamp: new Date().toLocaleTimeString(),
        type: 'intruder_photo',
        photoId: photoRecord.id
      });

      playSosActivate();
      console.log('🛡️ Aegis: Intruder photo captured');
      
      return photoRecord;
    } catch (error) {
      console.log('Could not capture intruder photo:', error.message);
      
      // Create a placeholder record for demo
      const placeholderRecord = {
        id: `intruder_${Date.now()}`,
        timestamp: new Date().toISOString(),
        image: null,
        placeholder: true,
        message: 'Intruder detected - camera blocked'
      };
      
      this.intruderPhotos.push(placeholderRecord);
      return placeholderRecord;
    }
  }

  // Get current location
  async getLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 0, lng: 0, error: 'Geolocation not available' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        () => {
          resolve({ lat: 0, lng: 0, error: 'Location permission denied' });
        },
        { timeout: 5000 }
      );
    });
  }

  // Get protection summary for owner
  getProtectionSummary() {
    const recentActions = this.protectionLog.slice(-10);
    const totalCleanups = this.cleanupItems.length;
    const intruderAttempts = this.intruderPhotos.length;

    return {
      recentActions,
      totalCleanups,
      intruderAttempts,
      intruderPhotos: this.intruderPhotos,
      cleanupItems: this.cleanupItems,
      lastProtectionTime: this.protectionLog.length > 0 
        ? this.protectionLog[this.protectionLog.length - 1].timestamp 
        : null,
      status: 'protected'
    };
  }

  // Clear protection log (after owner reviews)
  clearProtectionLog() {
    this.protectionLog = [];
    this.cleanupItems = [];
    this.intruderPhotos = [];
  }

  // Set idle delay (in milliseconds)
  setIdleDelay(delay) {
    this.idleDelay = delay;
    if (this.isMonitoring) {
      this.resetIdleTimer();
    }
  }
}

// Create singleton instance
const smartProtection = new SmartProtectionService();

export default smartProtection;
export { SmartProtectionService };
