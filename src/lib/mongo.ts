import { MongoClient, type Db } from "mongodb";

/**
 * MongoDB for identity (users, otp_challenges) and for rooms, bookings,
 * channels, blocked dates, and pricing. MySQL is not used.
 *
 * Sessions are not stored in Mongo. Guest and admin sessions are short-lived
 * JWTs in HttpOnly cookies (`guest_token`, `admin_token`). Logout clears the
 * cookie. A disabled account is rejected on the next authenticated request
 * once Mongo is reachable.
 *
 * If MONGODB_URI is empty, callers must return 503. This module never connects
 * at import time, so pages that do not touch auth still render.
 */

export class IdentityUnavailableError extends Error {
  constructor(message = "Identity store is not available") {
    super(message);
    this.name = "IdentityUnavailableError";
  }
}

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

function databaseName(uri: string): string {
  try {
    const pathname = new URL(uri).pathname.replace(/^\//, "");
    const name = pathname.split("/")[0]?.split("?")[0];
    return name || "panorama";
  } catch {
    return "panorama";
  }
}

export async function getMongoDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new IdentityUnavailableError();

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
    });
    globalForMongo.mongoClientPromise = client.connect().catch((error) => {
      globalForMongo.mongoClientPromise = undefined;
      throw error;
    });
  }

  try {
    const client = await globalForMongo.mongoClientPromise;
    return client.db(databaseName(uri));
  } catch (error) {
    globalForMongo.mongoClientPromise = undefined;
    if (error instanceof IdentityUnavailableError) throw error;
    throw new IdentityUnavailableError();
  }
}

export function isIdentityUnavailable(error: unknown): boolean {
  return error instanceof IdentityUnavailableError;
}
