import { randomBytes } from "crypto";
import type { Collection, Filter } from "mongodb";
import { LISTING_ROOMS } from "@/lib/listing";
import { getMongoDb, IdentityUnavailableError, isMongoConfigured } from "@/lib/mongo";
import { parseIntArray, parseStringArray } from "@/lib/json-array";

/**
 * Inventory, bookings, channels, and pricing.
 * Collections: rooms, bookings, blocked_dates, pricing_rules, channels,
 * external_bookings, contact_submissions.
 * Guests and admins stay in `users` / `otp_challenges` (see identity.ts).
 *
 * When MONGODB_URI is empty, public room reads use LISTING_ROOMS in memory.
 * Writes that need a database throw StoreUnavailableError.
 */

const UNIT_COUNTS: Record<string, number> = {
  "deluxe-double": 2,
  "luxury-studio-land-view": 2,
  "seafront-luxury-studio": 2,
  "superior-double-sea-view": 2,
  "double-room-balcony": 1,
};

export class StoreUnavailableError extends Error {
  constructor(message = "Database is not available") {
    super(message);
    this.name = "StoreUnavailableError";
  }
}

export function isStoreUnavailable(error: unknown): boolean {
  return error instanceof StoreUnavailableError || error instanceof IdentityUnavailableError;
}

export type RoomImage = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type RoomRecord = {
  id: string;
  slug: string;
  nameEn: string;
  nameEl: string;
  nameDe: string;
  descEn: string;
  descEl: string;
  descDe: string;
  capacity: number;
  bedType: string;
  sizeSqm: number;
  basePrice: number;
  totalUnits: number;
  amenities: string[];
  tourUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  images: RoomImage[];
  createdAt: Date;
  updatedAt: Date;
};

export type PricingRuleRecord = {
  id: string;
  roomId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  pricePerNight: number;
  daysOfWeek: number[];
  createdAt: Date;
  updatedAt: Date;
  room?: { nameEn: string; slug: string };
};

export type BlockedDateRecord = {
  id: string;
  roomId: string;
  date: Date;
  reason: string | null;
};

export type BookingStatus = "CONFIRMED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED";

export type BookingRecord = {
  id: string;
  referenceNumber: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestCountry: string | null;
  specialRequests: string | null;
  gdprConsent: boolean;
  gdprConsentAt: Date | null;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  paymentNotes: string | null;
  stripeSessionId: string | null;
  stripePaymentId: string | null;
  btcpayInvoiceId: string | null;
  locale: string;
  guestId: string | null;
  createdAt: Date;
  updatedAt: Date;
  room?: RoomRecord;
};

export type ChannelRecord = {
  id: string;
  name: string;
  platform: string;
  icalImportUrl: string | null;
  roomId: string;
  color: string;
  isActive: boolean;
  lastSyncAt: Date | null;
  lastSyncStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
  room?: { nameEn: string; slug: string };
  _count?: { externalBookings: number };
};

export type ExternalBookingRecord = {
  id: string;
  channelId: string;
  roomId: string;
  uid: string;
  summary: string | null;
  checkIn: Date;
  checkOut: Date;
  createdAt: Date;
  updatedAt: Date;
  room?: { id: string; nameEn: string };
  channel?: { color: string; platform: string; name?: string };
};

type RoomDoc = Omit<RoomRecord, "id"> & { _id: string };
type PricingDoc = Omit<PricingRuleRecord, "id" | "room"> & { _id: string };
type BlockedDoc = Omit<BlockedDateRecord, "id"> & { _id: string };
type BookingDoc = Omit<BookingRecord, "id" | "room"> & { _id: string };
type ChannelDoc = Omit<ChannelRecord, "id" | "room" | "_count"> & { _id: string };
type ExternalDoc = Omit<ExternalBookingRecord, "id" | "room" | "channel"> & { _id: string };

const EPOCH = new Date("2020-01-01T00:00:00.000Z");

function newId(): string {
  return randomBytes(12).toString("hex");
}

function catalogRooms(): RoomRecord[] {
  return LISTING_ROOMS.map((room, index) => ({
    id: room.slug,
    slug: room.slug,
    nameEn: room.nameEn,
    nameEl: room.nameEl,
    nameDe: room.nameDe,
    descEn: room.descEn,
    descEl: room.descEl,
    descDe: room.descDe,
    capacity: room.capacity,
    bedType: room.bedType,
    sizeSqm: room.sizeSqm,
    basePrice: room.basePrice,
    totalUnits: UNIT_COUNTS[room.slug] ?? 1,
    amenities: [...room.amenities],
    tourUrl: null,
    sortOrder: index + 1,
    isActive: true,
    images: [
      {
        id: `${room.slug}-image`,
        url: room.image,
        alt: room.nameEn,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    createdAt: EPOCH,
    updatedAt: EPOCH,
  }));
}

function presentRoom(doc: RoomDoc): RoomRecord {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id,
    basePrice: Number(rest.basePrice),
    totalUnits: Number(rest.totalUnits ?? 1),
    amenities: parseStringArray(rest.amenities),
    images: [...(rest.images || [])].sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    }),
  };
}

function presentBooking(doc: BookingDoc, room?: RoomRecord): BookingRecord {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id,
    totalPrice: Number(rest.totalPrice),
    checkIn: new Date(rest.checkIn),
    checkOut: new Date(rest.checkOut),
    createdAt: new Date(rest.createdAt),
    updatedAt: new Date(rest.updatedAt),
    gdprConsentAt: rest.gdprConsentAt ? new Date(rest.gdprConsentAt) : null,
    ...(room ? { room } : {}),
  };
}

let storeReady: Promise<void> | null = null;

async function ensureStore(): Promise<void> {
  if (!isMongoConfigured()) throw new StoreUnavailableError();
  if (!storeReady) {
    storeReady = (async () => {
      const db = await getMongoDb();
      await db.collection("rooms").createIndex({ slug: 1 }, { unique: true });
      await db.collection("bookings").createIndex({ referenceNumber: 1 }, { unique: true });
      await db.collection("bookings").createIndex(
        { stripeSessionId: 1 },
        { unique: true, sparse: true },
      );
      await db.collection("bookings").createIndex(
        { btcpayInvoiceId: 1 },
        { unique: true, sparse: true },
      );
      await db.collection("bookings").createIndex({ guestId: 1 });
      await db.collection("bookings").createIndex({ roomId: 1, checkIn: 1, checkOut: 1 });
      await db.collection("blocked_dates").createIndex({ roomId: 1, date: 1 }, { unique: true });
      await db.collection("pricing_rules").createIndex({ roomId: 1, startDate: 1, endDate: 1 });
      await db.collection("channels").createIndex({ roomId: 1 });
      await db.collection("external_bookings").createIndex(
        { channelId: 1, uid: 1 },
        { unique: true },
      );
      await db.collection("external_bookings").createIndex({ roomId: 1, checkIn: 1, checkOut: 1 });
      const rooms = db.collection<RoomDoc>("rooms");
      if ((await rooms.countDocuments()) === 0) {
        const now = new Date();
        try {
          await rooms.insertMany(
            catalogRooms().map((room) => {
              const { id, ...rest } = room;
              return { _id: id, ...rest, createdAt: now, updatedAt: now };
            }),
            { ordered: false },
          );
        } catch (error) {
          const code = (error as { code?: number }).code;
          if (code !== 11000) throw error;
        }
      }
    })().catch((error) => {
      storeReady = null;
      throw error;
    });
  }
  await storeReady;
}

async function collection<T extends { _id: string }>(name: string): Promise<Collection<T>> {
  await ensureStore();
  const db = await getMongoDb();
  return db.collection<T>(name);
}

function missingRoom(roomId: string): RoomRecord {
  return {
    id: roomId,
    slug: roomId,
    nameEn: "Room",
    nameEl: "Room",
    nameDe: "Room",
    descEn: "",
    descEl: "",
    descDe: "",
    capacity: 2,
    bedType: "",
    sizeSqm: 20,
    basePrice: 0,
    totalUnits: 1,
    amenities: [],
    tourUrl: null,
    sortOrder: 0,
    isActive: false,
    images: [],
    createdAt: EPOCH,
    updatedAt: EPOCH,
  };
}

export async function listRooms(options?: { activeOnly?: boolean }): Promise<RoomRecord[]> {
  const activeOnly = options?.activeOnly !== false;
  if (!isMongoConfigured()) {
    const rooms = catalogRooms();
    return activeOnly ? rooms.filter((room) => room.isActive) : rooms;
  }
  try {
    const col = await collection<RoomDoc>("rooms");
    const filter: Filter<RoomDoc> = activeOnly ? { isActive: true } : {};
    const docs = await col.find(filter).sort({ sortOrder: 1 }).toArray();
    return docs.map(presentRoom);
  } catch (error) {
    if (isStoreUnavailable(error)) return activeOnly ? catalogRooms() : catalogRooms();
    throw error;
  }
}

export async function findRoom(idOrSlug: string): Promise<RoomRecord | null> {
  if (!idOrSlug) return null;
  if (!isMongoConfigured()) {
    return catalogRooms().find((room) => room.id === idOrSlug || room.slug === idOrSlug) ?? null;
  }
  try {
    const col = await collection<RoomDoc>("rooms");
    const doc = await col.findOne({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] });
    return doc ? presentRoom(doc) : null;
  } catch (error) {
    if (!isStoreUnavailable(error)) throw error;
    return catalogRooms().find((room) => room.id === idOrSlug || room.slug === idOrSlug) ?? null;
  }
}

export async function nextRoomSortOrder(): Promise<number> {
  const col = await collection<RoomDoc>("rooms");
  const last = await col.find().sort({ sortOrder: -1 }).limit(1).toArray();
  return (last[0]?.sortOrder || 0) + 1;
}

export async function createRoom(input: {
  slug: string;
  nameEn: string;
  nameEl: string;
  nameDe: string;
  descEn: string;
  descEl: string;
  descDe: string;
  capacity: number;
  bedType: string;
  sizeSqm: number;
  basePrice: number;
  totalUnits: number;
  amenities: unknown;
  tourUrl: string | null;
  sortOrder: number;
  images: { url: string; alt?: string; isPrimary?: boolean }[];
}): Promise<RoomRecord> {
  const col = await collection<RoomDoc>("rooms");
  const now = new Date();
  const id = newId();
  const doc: RoomDoc = {
    _id: id,
    slug: input.slug,
    nameEn: input.nameEn,
    nameEl: input.nameEl,
    nameDe: input.nameDe,
    descEn: input.descEn,
    descEl: input.descEl,
    descDe: input.descDe,
    capacity: Number(input.capacity),
    bedType: input.bedType,
    sizeSqm: Number(input.sizeSqm) || 0,
    basePrice: Number(input.basePrice),
    totalUnits: Number(input.totalUnits) || 1,
    amenities: parseStringArray(input.amenities),
    tourUrl: input.tourUrl,
    sortOrder: input.sortOrder,
    isActive: true,
    images: input.images.map((image, index) => ({
      id: newId(),
      url: image.url,
      alt: image.alt || input.nameEn,
      isPrimary: image.isPrimary || index === 0,
      sortOrder: index,
    })),
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);
  return presentRoom(doc);
}

export async function updateRoom(
  id: string,
  patch: Record<string, unknown>,
  images?: { url: string; alt?: string; isPrimary?: boolean }[],
): Promise<RoomRecord | null> {
  const col = await collection<RoomDoc>("rooms");
  const data: Record<string, unknown> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "amenities") data.amenities = parseStringArray(value);
    else if (key === "basePrice" || key === "capacity" || key === "sizeSqm" || key === "totalUnits" || key === "sortOrder") {
      data[key] = Number(value);
    } else data[key] = value;
  }
  if (images) {
    const current = await col.findOne({ _id: id });
    data.images = images.map((image, index) => ({
      id: newId(),
      url: image.url,
      alt: image.alt || current?.nameEn || "",
      isPrimary: image.isPrimary || index === 0,
      sortOrder: index,
    }));
  }
  const updated = await col.findOneAndUpdate({ _id: id }, { $set: data }, { returnDocument: "after" });
  return updated ? presentRoom(updated) : null;
}

export async function countBookingsForRoom(roomId: string): Promise<number> {
  if (!isMongoConfigured()) return 0;
  const col = await collection<BookingDoc>("bookings");
  return col.countDocuments({ roomId });
}

export async function deactivateRoom(id: string): Promise<void> {
  const col = await collection<RoomDoc>("rooms");
  await col.updateOne({ _id: id }, { $set: { isActive: false, updatedAt: new Date() } });
}

export async function deleteRoom(id: string): Promise<void> {
  const col = await collection<RoomDoc>("rooms");
  await col.deleteOne({ _id: id });
}

export type BookingQuery = {
  id?: string;
  guestId?: string;
  roomId?: string;
  status?: string;
  referenceNumber?: string;
  stripeSessionId?: string;
  btcpayInvoiceId?: string;
  paymentStatus?: string;
  paymentStatusNot?: string;
  createdFrom?: Date;
  createdTo?: Date;
  checkInFrom?: Date;
  checkInTo?: Date;
  checkOutFrom?: Date;
  checkOutTo?: Date;
  overlapsStart?: Date;
  overlapsEnd?: Date;
  checkInLte?: Date;
  checkOutGt?: Date;
};

function bookingFilter(query: BookingQuery): Filter<BookingDoc> {
  const filter: Filter<BookingDoc> = {};
  if (query.id) filter._id = query.id;
  if (query.guestId) filter.guestId = query.guestId;
  if (query.roomId) filter.roomId = query.roomId;
  if (query.status) filter.status = query.status as BookingStatus;
  if (query.referenceNumber) filter.referenceNumber = query.referenceNumber;
  if (query.stripeSessionId) filter.stripeSessionId = query.stripeSessionId;
  if (query.btcpayInvoiceId) filter.btcpayInvoiceId = query.btcpayInvoiceId;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus as PaymentStatus;
  else if (query.paymentStatusNot) filter.paymentStatus = { $ne: query.paymentStatusNot as PaymentStatus };
  if (query.createdFrom || query.createdTo) {
    filter.createdAt = {};
    if (query.createdFrom) filter.createdAt.$gte = query.createdFrom;
    if (query.createdTo) filter.createdAt.$lte = query.createdTo;
  }
  if (query.checkInFrom || query.checkInTo || query.checkInLte) {
    filter.checkIn = {};
    if (query.checkInFrom) filter.checkIn.$gte = query.checkInFrom;
    if (query.checkInTo) filter.checkIn.$lte = query.checkInTo;
    if (query.checkInLte) filter.checkIn.$lte = query.checkInLte;
  }
  if (query.checkOutFrom || query.checkOutTo || query.checkOutGt) {
    filter.checkOut = {};
    if (query.checkOutFrom) filter.checkOut.$gte = query.checkOutFrom;
    if (query.checkOutTo) filter.checkOut.$lte = query.checkOutTo;
    if (query.checkOutGt) filter.checkOut.$gt = query.checkOutGt;
  }
  if (query.overlapsStart && query.overlapsEnd) {
    filter.checkIn = { ...(filter.checkIn || {}), $lt: query.overlapsEnd };
    filter.checkOut = { ...(filter.checkOut || {}), $gt: query.overlapsStart };
  }
  return filter;
}

async function roomsById(ids: string[]): Promise<Map<string, RoomRecord>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, RoomRecord>();
  if (unique.length === 0) return map;
  if (!isMongoConfigured()) {
    for (const room of catalogRooms()) {
      if (unique.includes(room.id) || unique.includes(room.slug)) map.set(room.id, room);
    }
    return map;
  }
  const col = await collection<RoomDoc>("rooms");
  const docs = await col.find({ _id: { $in: unique } }).toArray();
  for (const doc of docs) {
    const room = presentRoom(doc);
    map.set(room.id, room);
  }
  return map;
}

export async function listBookings(
  query: BookingQuery,
  options?: { includeRoom?: boolean; skip?: number; take?: number; sort?: "createdAt" | "checkIn" },
): Promise<BookingRecord[]> {
  if (!isMongoConfigured()) return [];
  const col = await collection<BookingDoc>("bookings");
  const sortField = options?.sort === "checkIn" ? "checkIn" : "createdAt";
  let cursor = col.find(bookingFilter(query)).sort({ [sortField]: -1 });
  if (options?.skip) cursor = cursor.skip(options.skip);
  if (options?.take) cursor = cursor.limit(options.take);
  const docs = await cursor.toArray();
  const rooms = options?.includeRoom ? await roomsById(docs.map((doc) => doc.roomId)) : new Map();
  return docs.map((doc) =>
    presentBooking(doc, options?.includeRoom ? rooms.get(doc.roomId) || missingRoom(doc.roomId) : undefined),
  );
}

export async function countBookings(query: BookingQuery = {}): Promise<number> {
  if (!isMongoConfigured()) return 0;
  const col = await collection<BookingDoc>("bookings");
  return col.countDocuments(bookingFilter(query));
}

export async function sumBookingTotals(query: BookingQuery): Promise<number> {
  if (!isMongoConfigured()) return 0;
  const col = await collection<BookingDoc>("bookings");
  const rows = await col
    .aggregate<{ total: number }>([
      { $match: bookingFilter(query) },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ])
    .toArray();
  return Number(rows[0]?.total || 0);
}

export async function findBooking(query: BookingQuery, includeRoom = false): Promise<BookingRecord | null> {
  const [booking] = await listBookings(query, { includeRoom, take: 1, sort: "createdAt" });
  return booking ?? null;
}

export async function countOverlappingBookings(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
): Promise<number> {
  return countBookings({
    roomId,
    status: "CONFIRMED",
    overlapsStart: checkIn,
    overlapsEnd: checkOut,
  });
}

export async function countBlockedDates(roomId: string, checkIn: Date, checkOut: Date): Promise<number> {
  if (!isMongoConfigured()) return 0;
  const col = await collection<BlockedDoc>("blocked_dates");
  return col.countDocuments({
    roomId,
    date: { $gte: checkIn, $lt: checkOut },
  });
}

export async function listBlockedDates(from: Date, to: Date): Promise<BlockedDateRecord[]> {
  if (!isMongoConfigured()) return [];
  const col = await collection<BlockedDoc>("blocked_dates");
  const docs = await col.find({ date: { $gte: from, $lte: to } }).toArray();
  return docs.map((doc) => ({
    id: doc._id,
    roomId: doc.roomId,
    date: new Date(doc.date),
    reason: doc.reason ?? null,
  }));
}

export async function listPricingRulesForStay(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
): Promise<PricingRuleRecord[]> {
  if (!isMongoConfigured()) return [];
  const col = await collection<PricingDoc>("pricing_rules");
  const docs = await col
    .find({ roomId, startDate: { $lte: checkOut }, endDate: { $gte: checkIn } })
    .toArray();
  return docs.map((doc) => ({
    id: doc._id,
    roomId: doc.roomId,
    name: doc.name,
    startDate: new Date(doc.startDate),
    endDate: new Date(doc.endDate),
    pricePerNight: Number(doc.pricePerNight),
    daysOfWeek: parseIntArray(doc.daysOfWeek),
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  }));
}

export async function listPricingRules(roomId?: string | null): Promise<PricingRuleRecord[]> {
  if (!isMongoConfigured()) return [];
  const col = await collection<PricingDoc>("pricing_rules");
  const docs = await col
    .find(roomId ? { roomId } : {})
    .sort({ startDate: 1 })
    .toArray();
  const rooms = await roomsById(docs.map((doc) => doc.roomId));
  return docs.map((doc) => {
    const room = rooms.get(doc.roomId);
    return {
      id: doc._id,
      roomId: doc.roomId,
      name: doc.name,
      startDate: new Date(doc.startDate),
      endDate: new Date(doc.endDate),
      pricePerNight: Number(doc.pricePerNight),
      daysOfWeek: parseIntArray(doc.daysOfWeek),
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      room: room ? { nameEn: room.nameEn, slug: room.slug } : undefined,
    };
  });
}

export async function createPricingRule(input: {
  name: string;
  roomId: string;
  startDate: Date;
  endDate: Date;
  pricePerNight: number;
  daysOfWeek: unknown;
}): Promise<PricingRuleRecord> {
  const col = await collection<PricingDoc>("pricing_rules");
  const now = new Date();
  const doc: PricingDoc = {
    _id: newId(),
    name: input.name,
    roomId: input.roomId,
    startDate: input.startDate,
    endDate: input.endDate,
    pricePerNight: Number(input.pricePerNight),
    daysOfWeek: parseIntArray(input.daysOfWeek),
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);
  const room = await findRoom(input.roomId);
  return {
    id: doc._id,
    roomId: doc.roomId,
    name: doc.name,
    startDate: doc.startDate,
    endDate: doc.endDate,
    pricePerNight: doc.pricePerNight,
    daysOfWeek: doc.daysOfWeek,
    createdAt: now,
    updatedAt: now,
    room: room ? { nameEn: room.nameEn, slug: room.slug } : undefined,
  };
}

export async function deletePricingRule(id: string): Promise<void> {
  const col = await collection<PricingDoc>("pricing_rules");
  await col.deleteOne({ _id: id });
}

export async function countOverlappingExternal(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
): Promise<number> {
  if (!isMongoConfigured()) return 0;
  const col = await collection<ExternalDoc>("external_bookings");
  return col.countDocuments({
    roomId,
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });
}

export async function listExternalBookings(query: {
  roomId?: string;
  channelId?: string;
  overlapsStart?: Date;
  overlapsEnd?: Date;
  checkInLte?: Date;
  checkOutGt?: Date;
  checkInFrom?: Date;
  checkInTo?: Date;
  checkOutFrom?: Date;
  checkOutTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  take?: number;
}): Promise<ExternalBookingRecord[]> {
  if (!isMongoConfigured()) return [];
  const col = await collection<ExternalDoc>("external_bookings");
  const filter: Record<string, unknown> = {};
  const checkIn: Record<string, Date> = {};
  const checkOut: Record<string, Date> = {};
  if (query.roomId) filter.roomId = query.roomId;
  if (query.channelId) filter.channelId = query.channelId;
  if (query.overlapsEnd) checkIn.$lt = query.overlapsEnd;
  if (query.overlapsStart) checkOut.$gt = query.overlapsStart;
  if (query.checkInLte) checkIn.$lte = query.checkInLte;
  if (query.checkInFrom) checkIn.$gte = query.checkInFrom;
  if (query.checkInTo) checkIn.$lte = query.checkInTo;
  if (query.checkOutGt) checkOut.$gt = query.checkOutGt;
  if (query.checkOutFrom) checkOut.$gte = query.checkOutFrom;
  if (query.checkOutTo) checkOut.$lte = query.checkOutTo;
  if (Object.keys(checkIn).length > 0) filter.checkIn = checkIn;
  if (Object.keys(checkOut).length > 0) filter.checkOut = checkOut;
  if (query.createdFrom || query.createdTo) {
    const createdAt: Record<string, Date> = {};
    if (query.createdFrom) createdAt.$gte = query.createdFrom;
    if (query.createdTo) createdAt.$lte = query.createdTo;
    filter.createdAt = createdAt;
  }
  let cursor = col.find(filter as Filter<ExternalDoc>).sort({ createdAt: -1 });
  if (query.take) cursor = cursor.limit(query.take);
  const docs = await cursor.toArray();
  const rooms = await roomsById(docs.map((doc) => doc.roomId));
  const channels = await channelsById(docs.map((doc) => doc.channelId));
  return docs.map((doc) => {
    const room = rooms.get(doc.roomId);
    const channel = channels.get(doc.channelId);
    return {
      id: doc._id,
      channelId: doc.channelId,
      roomId: doc.roomId,
      uid: doc.uid,
      summary: doc.summary ?? null,
      checkIn: new Date(doc.checkIn),
      checkOut: new Date(doc.checkOut),
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      room: { id: doc.roomId, nameEn: room?.nameEn || "Room" },
      channel: {
        color: channel?.color || "#6366f1",
        platform: channel?.platform || "OTHER",
        name: channel?.name,
      },
    };
  });
}

export async function countExternalBookings(query: {
  createdFrom?: Date;
  createdTo?: Date;
  checkInFrom?: Date;
  checkInTo?: Date;
  checkOutFrom?: Date;
  checkOutTo?: Date;
}): Promise<number> {
  if (!isMongoConfigured()) return 0;
  const rows = await listExternalBookings(query);
  return rows.length;
}

async function channelsById(ids: string[]): Promise<Map<string, ChannelRecord>> {
  const map = new Map<string, ChannelRecord>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!isMongoConfigured() || unique.length === 0) return map;
  const col = await collection<ChannelDoc>("channels");
  const docs = await col.find({ _id: { $in: unique } }).toArray();
  for (const doc of docs) map.set(doc._id, presentChannel(doc));
  return map;
}

function presentChannel(doc: ChannelDoc, room?: RoomRecord, externalCount = 0): ChannelRecord {
  return {
    id: doc._id,
    name: doc.name,
    platform: doc.platform,
    icalImportUrl: doc.icalImportUrl ?? null,
    roomId: doc.roomId,
    color: doc.color || "#6366f1",
    isActive: doc.isActive !== false,
    lastSyncAt: doc.lastSyncAt ? new Date(doc.lastSyncAt) : null,
    lastSyncStatus: doc.lastSyncStatus ?? null,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
    room: room ? { nameEn: room.nameEn, slug: room.slug } : undefined,
    _count: { externalBookings: externalCount },
  };
}

export async function listChannels(query?: {
  id?: string;
  activeOnly?: boolean;
  requireIcal?: boolean;
}): Promise<ChannelRecord[]> {
  if (!isMongoConfigured()) return [];
  const col = await collection<ChannelDoc>("channels");
  const filter: Filter<ChannelDoc> = {};
  if (query?.id) filter._id = query.id;
  if (query?.activeOnly) filter.isActive = true;
  if (query?.requireIcal) filter.icalImportUrl = { $ne: null };
  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  const rooms = await roomsById(docs.map((doc) => doc.roomId));
  const external = await collection<ExternalDoc>("external_bookings");
  const counts = await external
    .aggregate<{ _id: string; count: number }>([
      { $match: { channelId: { $in: docs.map((doc) => doc._id) } } },
      { $group: { _id: "$channelId", count: { $sum: 1 } } },
    ])
    .toArray();
  const countMap = new Map(counts.map((row) => [row._id, row.count]));
  return docs.map((doc) => presentChannel(doc, rooms.get(doc.roomId), countMap.get(doc._id) || 0));
}

export async function createChannel(input: {
  name: string;
  platform: string;
  icalImportUrl: string | null;
  roomId: string;
  color: string;
}): Promise<ChannelRecord> {
  const col = await collection<ChannelDoc>("channels");
  const now = new Date();
  const doc: ChannelDoc = {
    _id: newId(),
    name: input.name,
    platform: input.platform,
    icalImportUrl: input.icalImportUrl,
    roomId: input.roomId,
    color: input.color || "#6366f1",
    isActive: true,
    lastSyncAt: null,
    lastSyncStatus: null,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);
  const room = await findRoom(input.roomId);
  return presentChannel(doc, room || undefined, 0);
}

export async function updateChannel(
  id: string,
  patch: Partial<Pick<ChannelDoc, "lastSyncAt" | "lastSyncStatus" | "isActive">>,
): Promise<void> {
  const col = await collection<ChannelDoc>("channels");
  await col.updateOne({ _id: id }, { $set: { ...patch, updatedAt: new Date() } });
}

export async function deleteChannel(id: string): Promise<void> {
  const col = await collection<ChannelDoc>("channels");
  const external = await collection<ExternalDoc>("external_bookings");
  await external.deleteMany({ channelId: id });
  await col.deleteOne({ _id: id });
}

export async function externalUids(channelId: string): Promise<string[]> {
  if (!isMongoConfigured()) return [];
  const col = await collection<ExternalDoc>("external_bookings");
  const docs = await col.find({ channelId }, { projection: { uid: 1 } }).toArray();
  return docs.map((doc) => doc.uid);
}

export async function upsertExternalBooking(input: {
  channelId: string;
  roomId: string;
  uid: string;
  summary: string | null;
  checkIn: Date;
  checkOut: Date;
}): Promise<void> {
  const col = await collection<ExternalDoc>("external_bookings");
  const now = new Date();
  await col.updateOne(
    { channelId: input.channelId, uid: input.uid },
    {
      $set: {
        summary: input.summary,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        roomId: input.roomId,
        updatedAt: now,
      },
      $setOnInsert: {
        _id: newId(),
        channelId: input.channelId,
        uid: input.uid,
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

export async function deleteExternalByUids(channelId: string, uids: string[]): Promise<void> {
  if (uids.length === 0) return;
  const col = await collection<ExternalDoc>("external_bookings");
  await col.deleteMany({ channelId, uid: { $in: uids } });
}

export type NewBookingInput = {
  referenceNumber: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  totalPrice: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestCountry: string | null;
  specialRequests: string | null;
  locale: string;
  guestId?: string | null;
  paymentMethod: string | null;
  paymentNotes: string | null;
};

export async function referenceExists(referenceNumber: string): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  const col = await collection<BookingDoc>("bookings");
  const found = await col.findOne({ referenceNumber }, { projection: { _id: 1 } });
  return Boolean(found);
}

/**
 * Holds a room without a multi-document transaction so a standalone MongoDB works.
 * Re-checks capacity after insert and removes the row if the hold lost the race.
 */
export async function reserveBooking(input: NewBookingInput): Promise<BookingRecord> {
  if (!isMongoConfigured()) throw new StoreUnavailableError();
  const colRooms = await collection<RoomDoc>("rooms");
  const roomDoc = await colRooms.findOne({
    $or: [{ _id: input.roomId }, { slug: input.roomId }],
  });
  if (!roomDoc) throw new Error("Room not found");
  const room = presentRoom(roomDoc);
  if (input.guests > room.capacity) throw new Error("Each room allows at most 2 guests");

  const blocked = await countBlockedDates(room.id, input.checkIn, input.checkOut);
  if (blocked > 0) throw new Error("Some dates are blocked");

  const [booked, external] = await Promise.all([
    countOverlappingBookings(room.id, input.checkIn, input.checkOut),
    countOverlappingExternal(room.id, input.checkIn, input.checkOut),
  ]);
  if (booked + external >= room.totalUnits) throw new Error("Room no longer available");

  const now = new Date();
  const doc: BookingDoc = {
    _id: newId(),
    referenceNumber: input.referenceNumber,
    roomId: room.id,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights: input.nights,
    guests: input.guests,
    totalPrice: input.totalPrice,
    currency: "EUR",
    status: "CONFIRMED",
    guestFirstName: input.guestFirstName,
    guestLastName: input.guestLastName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    guestCountry: input.guestCountry,
    specialRequests: input.specialRequests,
    gdprConsent: true,
    gdprConsentAt: now,
    paymentStatus: "PENDING",
    paymentMethod: input.paymentMethod,
    paymentNotes: input.paymentNotes,
    stripeSessionId: null,
    stripePaymentId: null,
    btcpayInvoiceId: null,
    locale: input.locale,
    guestId: input.guestId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const bookings = await collection<BookingDoc>("bookings");
  await bookings.insertOne(doc);

  const [bookedAfter, externalAfter] = await Promise.all([
    countOverlappingBookings(room.id, input.checkIn, input.checkOut),
    countOverlappingExternal(room.id, input.checkIn, input.checkOut),
  ]);
  if (bookedAfter + externalAfter > room.totalUnits) {
    await bookings.deleteOne({ _id: doc._id });
    throw new Error("Room no longer available");
  }
  return presentBooking(doc, room);
}

export async function updateBooking(
  id: string,
  patch: Partial<Pick<
    BookingDoc,
    | "status"
    | "paymentStatus"
    | "paymentMethod"
    | "stripeSessionId"
    | "stripePaymentId"
    | "btcpayInvoiceId"
  >>,
): Promise<BookingRecord | null> {
  const col = await collection<BookingDoc>("bookings");
  const updated = await col.findOneAndUpdate(
    { _id: id },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!updated) return null;
  const room = await findRoom(updated.roomId);
  return presentBooking(updated, room || missingRoom(updated.roomId));
}

export async function updateBookings(
  query: BookingQuery,
  patch: Partial<Pick<BookingDoc, "status" | "paymentStatus" | "paymentMethod" | "stripePaymentId">>,
): Promise<number> {
  if (!isMongoConfigured()) return 0;
  const col = await collection<BookingDoc>("bookings");
  const result = await col.updateMany(bookingFilter(query), {
    $set: { ...patch, updatedAt: new Date() },
  });
  return result.modifiedCount;
}

export async function saveContactSubmission(input: {
  name: string;
  email: string;
  subject: string | null;
  message: string;
  locale: string;
}): Promise<void> {
  if (!isMongoConfigured()) throw new StoreUnavailableError();
  await ensureStore();
  const db = await getMongoDb();
  await db.collection<{
    _id: string;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    locale: string;
    isRead: boolean;
    createdAt: Date;
  }>("contact_submissions").insertOne({
    _id: newId(),
    ...input,
    isRead: false,
    createdAt: new Date(),
  });
}
