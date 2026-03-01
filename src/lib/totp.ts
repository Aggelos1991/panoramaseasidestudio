import * as OTPAuth from "otpauth";
import crypto from "crypto";

const ISSUER = "Panorama Seaside";

/**
 * Generate a new TOTP secret and return the secret + otpauth URI
 */
export function generateTOTPSecret(email: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret: secret.base32,
    uri: totp.toString(),
  };
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyTOTP(token: string, secret: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // Allow 1 period window (±30 seconds)
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

/**
 * Generate backup codes (10 codes, 8 chars each)
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code.toUpperCase())
    .digest("hex");
}

/**
 * Verify a backup code against stored hashes
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[],
): { valid: boolean; remainingCodes: string[] } {
  const hashed = hashBackupCode(code);
  const index = hashedCodes.indexOf(hashed);

  if (index === -1) {
    return { valid: false, remainingCodes: hashedCodes };
  }

  // Remove used code
  const remaining = [...hashedCodes];
  remaining.splice(index, 1);
  return { valid: true, remainingCodes: remaining };
}
