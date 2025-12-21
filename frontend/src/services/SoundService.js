// =============================================
// AEGIS SOUND & HAPTIC FEEDBACK SERVICE
// Provides audio feedback and haptic vibrations
// for a native phone-like experience
// =============================================

class AegisSoundService {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3;
    this.hapticEnabled = true;
  }

  // Initialize audio context (must be called after user interaction)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Generate a simple tone
  playTone(frequency, duration, type = 'sine', volume = this.volume) {
    if (!this.enabled) return;
    
    try {
      this.init();
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.log('Sound playback failed:', e);
    }
  }

  // Button click sound - short, subtle tap
  buttonClick() {
    this.playTone(800, 0.05, 'sine', 0.15);
    this.hapticTap();
  }

  // Success sound - positive chime
  success() {
    this.playTone(523, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.25), 200);
    this.hapticSuccess();
  }

  // Error sound - low buzz
  error() {
    this.playTone(200, 0.15, 'square', 0.2);
    setTimeout(() => this.playTone(180, 0.2, 'square', 0.15), 100);
    this.hapticError();
  }

  // Notification sound - attention-grabbing chime
  notification(type = 'info') {
    const sounds = {
      info: () => {
        this.playTone(880, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(1046, 0.15, 'sine', 0.25), 100);
      },
      security: () => {
        this.playTone(440, 0.1, 'square', 0.3);
        setTimeout(() => this.playTone(440, 0.1, 'square', 0.3), 150);
        setTimeout(() => this.playTone(880, 0.2, 'square', 0.35), 300);
        this.hapticWarning();
      },
      emergency: () => {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => this.playTone(880, 0.15, 'square', 0.4), i * 200);
          setTimeout(() => this.playTone(660, 0.15, 'square', 0.4), i * 200 + 100);
        }
        this.hapticEmergency();
      },
      calendar: () => {
        this.playTone(659, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.25), 150);
      },
      family: () => {
        this.playTone(523, 0.08, 'sine', 0.25);
        setTimeout(() => this.playTone(659, 0.08, 'sine', 0.25), 80);
        setTimeout(() => this.playTone(784, 0.12, 'sine', 0.3), 160);
      },
      finance: () => {
        this.playTone(392, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(523, 0.15, 'sine', 0.25), 100);
      },
      health: () => {
        this.playTone(440, 0.15, 'sine', 0.2);
        setTimeout(() => this.playTone(554, 0.15, 'sine', 0.2), 200);
      }
    };

    (sounds[type] || sounds.info)();
    this.hapticNotification();
  }

  // Message received sound
  messageReceived() {
    this.playTone(1200, 0.05, 'sine', 0.2);
    setTimeout(() => this.playTone(1400, 0.08, 'sine', 0.25), 60);
    this.hapticTap();
  }

  // Pattern dot touch
  patternDot() {
    this.playTone(600, 0.03, 'sine', 0.1);
    this.hapticLight();
  }

  // Unlock sound
  unlock() {
    this.playTone(523, 0.08, 'sine', 0.2);
    setTimeout(() => this.playTone(659, 0.08, 'sine', 0.2), 60);
    setTimeout(() => this.playTone(784, 0.1, 'sine', 0.25), 120);
    setTimeout(() => this.playTone(1046, 0.15, 'sine', 0.3), 180);
    this.hapticSuccess();
  }

  // Lock sound
  lock() {
    this.playTone(784, 0.08, 'sine', 0.2);
    setTimeout(() => this.playTone(523, 0.15, 'sine', 0.25), 100);
    this.hapticTap();
  }

  // App open whoosh
  appOpen() {
    // Quick ascending sweep
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.playTone(400 + (i * 100), 0.02, 'sine', 0.08), i * 15);
    }
    this.hapticLight();
  }

  // App close
  appClose() {
    // Quick descending sweep
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.playTone(800 - (i * 100), 0.02, 'sine', 0.08), i * 15);
    }
    this.hapticLight();
  }

  // Calculator key press
  calculatorKey() {
    this.playTone(1000 + Math.random() * 200, 0.03, 'sine', 0.1);
    this.hapticLight();
  }

  // Vault unlock (secret access)
  vaultUnlock() {
    const notes = [523, 587, 659, 784, 880, 1046];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.1, 'sine', 0.2), i * 80);
    });
    this.hapticSuccess();
  }

  // Emergency/SOS activation
  sosActivate() {
    this.notification('emergency');
  }

  // Wipe mode warning
  wipeWarning() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(440, 0.3, 'square', 0.4);
      }, i * 500);
    }
    this.hapticEmergency();
  }

  // Typing/keyboard sound
  keyPress() {
    this.playTone(800 + Math.random() * 400, 0.02, 'sine', 0.08);
    this.hapticLight();
  }

  // Swipe sound
  swipe() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playTone(300 + (i * 50), 0.02, 'sine', 0.05), i * 20);
    }
  }

  // ==========================================
  // HAPTIC FEEDBACK (Vibration API)
  // ==========================================

  hapticTap() {
    if (!this.hapticEnabled || !navigator.vibrate) return;
    navigator.vibrate(10);
  }

  hapticLight() {
    if (!this.hapticEnabled || !navigator.vibrate) return;
    navigator.vibrate(5);
  }

  hapticSuccess() {
    if (!this.hapticEnabled || !navigator.vibrate) return;
    navigator.vibrate([30, 50, 30]);
  }

  hapticError() {
    if (!this.hapticEnabled || !navigator.vibrate) return;
    navigator.vibrate([50, 30, 50, 30, 50]);
  }

  hapticWarning() {
    if (!this.hapticEnabled || !navigator.vibrate) return;
    navigator.vibrate([100, 50, 100]);
  }

  hapticNotification() {
    if (!this.hapticEnabled || !navigator.vibrate) return;
    navigator.vibrate([50, 30, 50]);
  }

  hapticEmergency() {
    if (!this.hapticEnabled || !navigator.vibrate) return;
    navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
  }

  // Toggle sound on/off
  toggle(enabled) {
    this.enabled = enabled;
  }

  // Toggle haptics on/off
  toggleHaptics(enabled) {
    this.hapticEnabled = enabled;
  }

  // Set volume (0-1)
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
}

// Create singleton instance
const aegisSound = new AegisSoundService();

// Export individual functions for easy use
export const playButtonClick = () => aegisSound.buttonClick();
export const playSuccess = () => aegisSound.success();
export const playError = () => aegisSound.error();
export const playNotification = (type) => aegisSound.notification(type);
export const playMessageReceived = () => aegisSound.messageReceived();
export const playPatternDot = () => aegisSound.patternDot();
export const playUnlock = () => aegisSound.unlock();
export const playLock = () => aegisSound.lock();
export const playAppOpen = () => aegisSound.appOpen();
export const playAppClose = () => aegisSound.appClose();
export const playCalculatorKey = () => aegisSound.calculatorKey();
export const playVaultUnlock = () => aegisSound.vaultUnlock();
export const playSosActivate = () => aegisSound.sosActivate();
export const playWipeWarning = () => aegisSound.wipeWarning();
export const playKeyPress = () => aegisSound.keyPress();
export const playSwipe = () => aegisSound.swipe();
export const toggleSound = (enabled) => aegisSound.toggle(enabled);
export const toggleHaptics = (enabled) => aegisSound.toggleHaptics(enabled);
export const setVolume = (vol) => aegisSound.setVolume(vol);
export const initSound = () => aegisSound.init();

export default aegisSound;
