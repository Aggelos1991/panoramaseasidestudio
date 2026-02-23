import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT = "panorama-seaside-salt"; // static salt — key is already secret

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY environment variable is required for GDPR compliance");
  }
  return scryptSync(secret, SALT, 32);
}

/**
 * Encrypt a plaintext string. Returns base64-encoded string: iv:encrypted:tag
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`;
}

/**
 * Decrypt an encrypted string (iv:encrypted:tag format)
 * Returns plaintext. If decryption fails (wrong key, tampered), returns "[encrypted]".
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getKey();
    const [ivHex, encrypted, tagHex] = encryptedText.split(":");
    if (!ivHex || !encrypted || !tagHex) return encryptedText;

    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "[encrypted]";
  }
}

/**
 * Check if a string looks like it's already encrypted (iv:data:tag format)
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(":");
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
}

/**
 * Encrypt PII fields in an object. Only encrypts string values for specified keys.
 */
export function encryptPII<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[],
): T {
  const result = { ...data };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && value.length > 0 && !isEncrypted(value)) {
      (result[field] as unknown) = encrypt(value);
    }
  }
  return result;
}

/**
 * Decrypt PII fields in an object.
 */
export function decryptPII<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[],
): T {
  const result = { ...data };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && isEncrypted(value)) {
      (result[field] as unknown) = decrypt(value);
    }
  }
  return result;
}

// PII field definitions per entity
export const BOOKING_PII_FIELDS = [
  "guestFirstName",
  "guestLastName",
  "guestEmail",
  "guestPhone",
  "guestCountry",
  "specialRequests",
] as const;

export const CONTACT_PII_FIELDS = ["name", "email", "message"] as const;
