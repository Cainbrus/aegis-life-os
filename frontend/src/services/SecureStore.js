// =============================================
// Digital Mate - SecureStore
// Encrypts sensitive codes at rest using the Web Crypto API (SubtleCrypto).
// - AES-GCM 256-bit encryption with a random IV per value
// - Key is derived via PBKDF2 from the device id + a static app salt
// This protects the access/recovery codes from being read directly out of
// localStorage. Verification decrypts then compares in plain text (no hashing),
// preserving the single-device comparison model.
// =============================================

const APP_SALT = 'digital-mate::v1::code-store';
const PBKDF2_ITERATIONS = 100000;

const enc = new TextEncoder();
const dec = new TextDecoder();

const hasCrypto = () =>
  typeof window !== 'undefined' &&
  window.crypto &&
  window.crypto.subtle &&
  typeof window.crypto.subtle.importKey === 'function';

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBuf(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(deviceId) {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(`${deviceId}::${APP_SALT}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(APP_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// Encrypt a plaintext code -> base64(iv(12) + ciphertext). Falls back to a
// reversible base64 encoding if SubtleCrypto is unavailable (old WebView).
export async function encryptValue(deviceId, plaintext) {
  if (!hasCrypto()) return `plain:${btoa(plaintext)}`;
  const key = await deriveKey(deviceId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const cipher = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return `enc:${bufToB64(combined.buffer)}`;
}

// Decrypt a stored value produced by encryptValue. Returns null on failure.
export async function decryptValue(deviceId, stored) {
  if (!stored) return null;
  if (stored.startsWith('plain:')) {
    try { return atob(stored.slice(6)); } catch { return null; }
  }
  if (!stored.startsWith('enc:') || !hasCrypto()) return null;
  try {
    const combined = b64ToBuf(stored.slice(4));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await deriveKey(deviceId);
    const plain = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data,
    );
    return dec.decode(plain);
  } catch {
    return null;
  }
}
