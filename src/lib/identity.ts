import { createHash, randomInt, timingSafeEqual } from "crypto";
import { compare, hash } from "bcryptjs";
import { ObjectId, type Collection } from "mongodb";
import { getMongoDb, IdentityUnavailableError, isMongoConfigured } from "@/lib/mongo";
import { isEmailConfigured, sendAccountExistsNotice, sendGuestOtp } from "@/lib/email";

/**
 * Mongo collections:
 * - users: guests and admins (password hash, role, status, lockout)
 * - otp_challenges: hashed 6-digit codes, 10-minute expiry, single use
 *
 * There is no sessions collection. See src/lib/mongo.ts.
 */

const BCRYPT_COST = 12;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;

/** Cost-12 hash of a placeholder, so a missing account still pays for bcrypt. */
const DUMMY_PASSWORD_HASH =
  "$2b$12$cGiYred5.ntUrOthtw/jPu/1o2kU26uVqpoYvPR7ctJ3kTwlKv9Sy";

export type UserRole = "guest" | "admin";
export type UserStatus = "active" | "disabled";
export type OtpPurpose = "register" | "signin";

export type IdentityUser = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  failedLoginCount: number;
  lockedUntil: Date | null;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  backupCodes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type OtpChallenge = {
  _id: ObjectId;
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  usedAt: Date | null;
  createdAt: Date;
  pending?: {
    passwordHash: string;
    firstName: string;
    lastName: string;
  };
};

export class EmailDeliveryUnavailableError extends Error {
  constructor() {
    super("Email delivery is not configured");
    this.name = "EmailDeliveryUnavailableError";
  }
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function cleanPersonName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.replace(/[\u0000-\u001F]/g, "").trim();
  if (name.length < 2 || name.length > 80) return null;
  return name;
}

export function passwordAccepted(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 128;
}

function otpPepper(): string {
  return process.env.OTP_PEPPER?.trim() || process.env.JWT_SECRET || "";
}

export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(`${otpPepper()}:${code}`).digest("hex");
}

export function otpCodeMatches(code: string, codeHash: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const next = Buffer.from(hashOtpCode(code));
  const prev = Buffer.from(codeHash);
  return next.length === prev.length && timingSafeEqual(next, prev);
}

let indexesReady: Promise<void> | null = null;

async function users(): Promise<Collection<IdentityUser>> {
  await ensureIdentityIndexes();
  await ensureDevAdmin();
  const db = await getMongoDb();
  return db.collection<IdentityUser>("users");
}

async function challenges(): Promise<Collection<OtpChallenge>> {
  await ensureIdentityIndexes();
  const db = await getMongoDb();
  return db.collection<OtpChallenge>("otp_challenges");
}

export function ensureIdentityIndexes(): Promise<void> {
  if (!isMongoConfigured()) {
    return Promise.reject(new IdentityUnavailableError());
  }
  if (!indexesReady) {
    indexesReady = (async () => {
      const db = await getMongoDb();
      await db.collection("users").createIndex({ email: 1 }, { unique: true });
      await db.collection("otp_challenges").createIndex(
        { email: 1, purpose: 1, createdAt: -1 },
      );
      await db.collection("otp_challenges").createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 },
      );
    })().catch((error) => {
      indexesReady = null;
      throw error;
    });
  }
  return indexesReady;
}

export async function findUserByEmail(email: string): Promise<IdentityUser | null> {
  const col = await users();
  return col.findOne({ email });
}

export async function findUserById(id: string): Promise<IdentityUser | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await users();
  return col.findOne({ _id: new ObjectId(id) });
}

let adminSeedChecked = false;

/**
 * One-time admin seed. Runs only when ADMIN_EMAIL and ADMIN_PASSWORD are set
 * and the users collection has no admin. The password is hashed with bcrypt
 * cost 12 and is never written to logs.
 */
export async function ensureDevAdmin(): Promise<void> {
  if (adminSeedChecked || !isMongoConfigured()) return;
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !passwordAccepted(password)) {
    adminSeedChecked = true;
    return;
  }
  const db = await getMongoDb();
  const col = db.collection<IdentityUser>("users");
  const existing = await col.countDocuments({ role: "admin" });
  if (existing > 0) {
    adminSeedChecked = true;
    return;
  }
  const passwordHash = await hash(password, BCRYPT_COST);
  const now = new Date();
  try {
    await col.insertOne({
      _id: new ObjectId(),
      email,
      passwordHash,
      role: "admin",
      status: "active",
      firstName: "Admin",
      lastName: "",
      failedLoginCount: 0,
      lockedUntil: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    // A concurrent seed or an existing email owns the unique index.
  }
  adminSeedChecked = true;
}

export async function updateAdminById(
  id: string,
  patch: Partial<Pick<IdentityUser, "twoFactorEnabled" | "twoFactorSecret" | "backupCodes" | "passwordHash">>,
): Promise<IdentityUser | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await users();
  const updated = await col.findOneAndUpdate(
    { _id: new ObjectId(id), role: "admin" },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return updated;
}

function isLocked(user: IdentityUser): boolean {
  return Boolean(user.lockedUntil && user.lockedUntil > new Date());
}

async function recordFailedLogin(user: IdentityUser): Promise<void> {
  const failedLoginCount = (user.failedLoginCount || 0) + 1;
  const lockedUntil =
    failedLoginCount >= LOCK_AFTER ? new Date(Date.now() + LOCK_MS) : user.lockedUntil ?? null;
  const col = await users();
  await col.updateOne(
    { _id: user._id },
    { $set: { failedLoginCount, lockedUntil, updatedAt: new Date() } },
  );
}

async function clearFailedLogin(userId: ObjectId): Promise<void> {
  const col = await users();
  await col.updateOne(
    { _id: userId },
    { $set: { failedLoginCount: 0, lockedUntil: null, updatedAt: new Date() } },
  );
}

/**
 * OTP mail uses Resend when RESEND_API_KEY is set.
 * In development, with no provider, the code is logged and not returned.
 * In production, with no provider, this throws and the route responds 503.
 */
export function canDeliverOtp(): boolean {
  return isEmailConfigured() || process.env.NODE_ENV !== "production";
}

async function deliverCode(email: string, code: string): Promise<void> {
  if (isEmailConfigured()) {
    const sent = await sendGuestOtp(email, code);
    if (sent) return;
    if (process.env.NODE_ENV === "production") throw new EmailDeliveryUnavailableError();
  }
  if (process.env.NODE_ENV !== "production") {
    console.info(`[dev-otp] ${email} ${code}`);
    return;
  }
  throw new EmailDeliveryUnavailableError();
}

async function issueChallenge(input: {
  email: string;
  purpose: OtpPurpose;
  pending?: OtpChallenge["pending"];
}): Promise<void> {
  const code = generateOtpCode();
  const col = await challenges();
  await col.updateMany(
    { email: input.email, purpose: input.purpose, usedAt: null },
    { $set: { usedAt: new Date() } },
  );
  await col.insertOne({
    _id: new ObjectId(),
    email: input.email,
    purpose: input.purpose,
    codeHash: hashOtpCode(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    usedAt: null,
    createdAt: new Date(),
    ...(input.pending ? { pending: input.pending } : {}),
  });
  try {
    await deliverCode(input.email, code);
  } catch (error) {
    await col.updateOne(
      { email: input.email, purpose: input.purpose, usedAt: null },
      { $set: { usedAt: new Date() } },
    );
    throw error;
  }
}

export async function beginGuestRegister(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ otpRequired: true }> {
  if (!canDeliverOtp()) throw new EmailDeliveryUnavailableError();
  const passwordHash = await hash(input.password, BCRYPT_COST);
  const existing = await findUserByEmail(input.email);
  if (existing) {
    await sendAccountExistsNotice(input.email);
    return { otpRequired: true };
  }
  await issueChallenge({
    email: input.email,
    purpose: "register",
    pending: {
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });
  return { otpRequired: true };
}

export async function beginGuestSignIn(
  email: string,
  password: string,
): Promise<{ otpRequired: true } | { error: "invalid" }> {
  if (!canDeliverOtp()) throw new EmailDeliveryUnavailableError();
  const user = await findUserByEmail(email);
  const passwordOk = await compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
  const guest = user?.role === "guest" ? user : null;

  if (!guest || !passwordOk) {
    if (guest && guest.status === "active" && !isLocked(guest)) {
      await recordFailedLogin(guest);
    }
    return { error: "invalid" };
  }
  if (guest.status !== "active" || isLocked(guest)) {
    return { error: "invalid" };
  }

  await issueChallenge({ email, purpose: "signin" });
  return { otpRequired: true };
}

async function consumeChallenge(
  email: string,
  purpose: OtpPurpose,
  code: string,
): Promise<OtpChallenge | null> {
  const col = await challenges();
  const challenge = await col.findOne(
    { email, purpose, usedAt: null, expiresAt: { $gt: new Date() } },
    { sort: { createdAt: -1 } },
  );
  if (!challenge || challenge.attempts >= challenge.maxAttempts) return null;

  const reserved = await col.findOneAndUpdate(
    { _id: challenge._id, usedAt: null, attempts: { $lt: challenge.maxAttempts } },
    { $inc: { attempts: 1 } },
  );
  if (!reserved || !otpCodeMatches(code, reserved.codeHash)) return null;

  const consumed = await col.updateOne(
    { _id: challenge._id, usedAt: null },
    { $set: { usedAt: new Date() } },
  );
  if (consumed.modifiedCount !== 1) return null;
  return reserved;
}

export async function verifyGuestOtp(input: {
  email: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<IdentityUser | null> {
  const challenge = await consumeChallenge(input.email, input.purpose, input.code);
  if (!challenge) return null;

  if (input.purpose === "register") {
    if (!challenge.pending) return null;
    const col = await users();
    const now = new Date();
    try {
      await col.insertOne({
        _id: new ObjectId(),
        email: input.email,
        passwordHash: challenge.pending.passwordHash,
        role: "guest",
        status: "active",
        firstName: challenge.pending.firstName,
        lastName: challenge.pending.lastName,
        failedLoginCount: 0,
        lockedUntil: null,
        createdAt: now,
        updatedAt: now,
      });
    } catch {
      return null;
    }
  }

  const user = await findUserByEmail(input.email);
  if (!user || user.role !== "guest" || user.status !== "active" || isLocked(user)) {
    return null;
  }
  await clearFailedLogin(user._id);
  return { ...user, failedLoginCount: 0, lockedUntil: null };
}

export async function updateOwnProfile(
  email: string,
  input: {
    firstName?: string;
    lastName?: string;
    currentPassword?: string;
    newPassword?: string;
  },
): Promise<IdentityUser | "invalid" | "unauthorized"> {
  const user = await findUserByEmail(email);
  if (!user || user.role !== "guest" || user.status !== "active") return "unauthorized";

  const patch: Partial<IdentityUser> = { updatedAt: new Date() };
  if (input.firstName) patch.firstName = input.firstName;
  if (input.lastName) patch.lastName = input.lastName;

  if (input.newPassword) {
    if (!input.currentPassword) return "invalid";
    const matches = await compare(input.currentPassword, user.passwordHash);
    if (!matches) return "invalid";
    patch.passwordHash = await hash(input.newPassword, BCRYPT_COST);
  }

  const col = await users();
  await col.updateOne({ _id: user._id, role: "guest" }, { $set: patch });
  return { ...user, ...patch };
}

export async function verifyAdminPassword(
  email: string,
  password: string,
): Promise<
  | { ok: true; user: IdentityUser }
  | { ok: false; reason: "invalid" | "locked" | "absent" }
> {
  const user = await findUserByEmail(email);
  if (!user) return { ok: false, reason: "absent" };
  if (user.role !== "admin") return { ok: false, reason: "invalid" };
  if (user.status !== "active") return { ok: false, reason: "invalid" };
  if (isLocked(user)) return { ok: false, reason: "locked" };

  const passwordOk = await compare(password, user.passwordHash);
  if (!passwordOk) {
    await recordFailedLogin(user);
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, user };
}

export async function clearAdminFailures(userId: ObjectId): Promise<void> {
  await clearFailedLogin(userId);
}

export async function replaceAdminBackupCodes(email: string, backupCodes: string): Promise<void> {
  const col = await users();
  await col.updateOne(
    { email, role: "admin" },
    { $set: { backupCodes, updatedAt: new Date() } },
  );
}

export async function updateAdminPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<"ok" | "invalid" | "absent"> {
  const user = await findUserByEmail(email);
  if (!user || user.role !== "admin" || user.status !== "active") return "absent";
  const matches = await compare(currentPassword, user.passwordHash);
  if (!matches) return "invalid";
  const passwordHash = await hash(newPassword, BCRYPT_COST);
  const col = await users();
  await col.updateOne(
    { _id: user._id, role: "admin" },
    { $set: { passwordHash, updatedAt: new Date(), failedLoginCount: 0, lockedUntil: null } },
  );
  return "ok";
}
