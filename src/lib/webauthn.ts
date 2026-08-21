// WebAuthn / Passkey / Biometric Authentication Helpers

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch (err) {
    console.warn('Error checking platform authenticator:', err);
  }
  return false;
}

// Convert ArrayBuffer to Base64URL
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convert Base64URL to Uint8Array
export function base64UrlToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface WebAuthnEnrollmentResult {
  credentialId: string;
  rawCredential: PublicKeyCredential;
}

export async function registerBiometricPasskey(
  userEmail: string,
  userId: string
): Promise<WebAuthnEnrollmentResult> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn biometrics is not supported in this browser.');
  }

  // Create random 32-byte challenge
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  // User ID as bytes
  const userIdBuffer = new TextEncoder().encode(userId);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Master Tracker App',
      id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
    },
    user: {
      id: userIdBuffer,
      name: userEmail,
      displayName: userEmail.split('@')[0] || 'User',
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Fingerprint/FaceID/Windows Hello
      userVerification: 'preferred',
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: 'none',
  };

  const credential = (await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  })) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Biometric enrollment cancelled or failed.');
  }

  const credentialId = bufferToBase64Url(credential.rawId);

  return {
    credentialId,
    rawCredential: credential,
  };
}

export async function verifyBiometricPasskey(credentialIdBase64?: string | null): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn biometrics is not supported in this browser.');
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const allowCredentials: PublicKeyCredentialDescriptor[] = [];
  if (credentialIdBase64) {
    try {
      const rawId = base64UrlToUint8Array(credentialIdBase64);
      allowCredentials.push({
        id: rawId.buffer as ArrayBuffer,
        type: 'public-key',
        transports: ['internal'],
      });
    } catch (e) {
      console.warn('Failed to parse credential id:', e);
    }
  }

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    timeout: 60000,
    userVerification: 'preferred',
    rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
    ...(allowCredentials.length > 0 ? { allowCredentials } : {}),
  };

  const assertion = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions,
  });

  return !!assertion;
}
