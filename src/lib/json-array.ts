/**
 * Utility for handling JSON-encoded arrays stored as Text in MySQL.
 * PostgreSQL supports native String[] / Int[] but MySQL does not,
 * so we store them as JSON text and parse at the application layer.
 */

/** Parse a JSON text column back to a string array. Returns [] on failure. */
export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Parse a JSON text column back to an int array. Returns [] on failure. */
export function parseIntArray(value: unknown): number[] {
  if (Array.isArray(value)) return value as number[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Stringify an array for storage in a JSON text column. */
export function toJsonArray(value: unknown[]): string {
  return JSON.stringify(value);
}
