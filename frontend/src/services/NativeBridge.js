// Bridge to the DigitalMateNative Kotlin plugin. All calls no-op safely on web.
import { Capacitor, registerPlugin } from '@capacitor/core';

const Native = registerPlugin('DigitalMateNative');

export const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch (e) { return false; }
};

const safe = async (fn, fallback = null) => {
  if (!isNative()) return fallback;
  try { return await fn(); } catch (e) { return fallback; }
};

export const nativeConfigure = (opts) => safe(() => Native.configure(opts), { ok: false });
export const nativeIsAdminActive = () => safe(async () => (await Native.isAdminActive()).active, false);
export const nativeRequestAdmin = () => safe(() => Native.requestDeviceAdmin(), null);
export const nativeLock = () => safe(() => Native.lockNow(), null);
export const nativeWipe = () => safe(() => Native.wipeDevice(), null);
export const nativeBondedDevices = () => safe(async () => (await Native.getBondedDevices()).devices || [], []);
export const nativeStartRecovery = () => safe(() => Native.startRecoveryService(), null);
export const nativeStopRecovery = () => safe(() => Native.stopRecoveryService(), null);

export default Native;
