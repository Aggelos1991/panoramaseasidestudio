-- ============================================================
-- Panorama Seaside Studios — Complete Database Schema
-- PostgreSQL (Neon) — GDPR Protected
-- ============================================================
-- Run this in the Neon SQL Editor to create all tables.
-- PII fields are encrypted at the application level (AES-256-GCM)
-- before being stored. Neon also encrypts data at rest.
-- ============================================================

-- Enable crypto extension (for gen_random_uuid fallback)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────

CREATE TYPE "BookingStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'UNPAID',
  'PAID',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
);

-- ─── Room Types ─────────────────────────────────────────────

CREATE TABLE "Room" (
  "id"          TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "nameEn"      TEXT NOT NULL,
  "nameEl"      TEXT NOT NULL,
  "nameDe"      TEXT NOT NULL,
  "descEn"      TEXT NOT NULL,
  "descEl"      TEXT NOT NULL,
  "descDe"      TEXT NOT NULL,
  "capacity"    INTEGER NOT NULL,
  "bedType"     TEXT NOT NULL,
  "sizeSqm"     INTEGER NOT NULL,
  "basePrice"   DECIMAL(10,2) NOT NULL,
  "totalUnits"  INTEGER NOT NULL DEFAULT 1,
  "amenities"   TEXT[],
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Room_slug_key" ON "Room"("slug");
CREATE INDEX "Room_slug_idx" ON "Room"("slug");
CREATE INDEX "Room_isActive_idx" ON "Room"("isActive");

-- ─── Room Images ────────────────────────────────────────────

CREATE TABLE "RoomImage" (
  "id"        TEXT NOT NULL,
  "roomId"    TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "alt"       TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RoomImage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RoomImage_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "RoomImage_roomId_idx" ON "RoomImage"("roomId");

-- ─── Pricing Rules ──────────────────────────────────────────

CREATE TABLE "PricingRule" (
  "id"            TEXT NOT NULL,
  "roomId"        TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "startDate"     DATE NOT NULL,
  "endDate"       DATE NOT NULL,
  "pricePerNight" DECIMAL(10,2) NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PricingRule_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PricingRule_roomId_startDate_endDate_idx"
  ON "PricingRule"("roomId", "startDate", "endDate");

-- ─── Blocked Dates ──────────────────────────────────────────

CREATE TABLE "BlockedDate" (
  "id"     TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "date"   DATE NOT NULL,
  "reason" TEXT,

  CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BlockedDate_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "BlockedDate_roomId_date_key" ON "BlockedDate"("roomId", "date");
CREATE INDEX "BlockedDate_roomId_date_idx" ON "BlockedDate"("roomId", "date");

-- ─── Bookings (PII fields encrypted at app level) ──────────

CREATE TABLE "Booking" (
  "id"              TEXT NOT NULL,
  "referenceNumber" TEXT NOT NULL,
  "roomId"          TEXT NOT NULL,
  "checkIn"         DATE NOT NULL,
  "checkOut"        DATE NOT NULL,
  "nights"          INTEGER NOT NULL,
  "guests"          INTEGER NOT NULL,
  "totalPrice"      DECIMAL(10,2) NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'EUR',
  "status"          "BookingStatus" NOT NULL DEFAULT 'PENDING',

  -- Guest PII (encrypted with AES-256-GCM at application level)
  "guestFirstName"  TEXT NOT NULL,  -- ENCRYPTED PII
  "guestLastName"   TEXT NOT NULL,  -- ENCRYPTED PII
  "guestEmail"      TEXT NOT NULL,  -- ENCRYPTED PII
  "guestPhone"      TEXT,           -- ENCRYPTED PII
  "guestCountry"    TEXT,           -- ENCRYPTED PII
  "specialRequests" TEXT,           -- ENCRYPTED PII

  -- GDPR consent tracking
  "gdprConsent"     BOOLEAN NOT NULL DEFAULT false,
  "gdprConsentAt"   TIMESTAMP(3),

  -- Payment tracking (manual / external)
  "paymentStatus"   "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "paymentMethod"   TEXT,
  "paymentNotes"    TEXT,

  -- Legacy Stripe fields
  "stripeSessionId" TEXT,
  "stripePaymentId" TEXT,

  "locale"    TEXT NOT NULL DEFAULT 'en',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Booking_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id")
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Booking_referenceNumber_key" ON "Booking"("referenceNumber");
CREATE UNIQUE INDEX "Booking_stripeSessionId_key" ON "Booking"("stripeSessionId");
CREATE INDEX "Booking_referenceNumber_idx" ON "Booking"("referenceNumber");
CREATE INDEX "Booking_roomId_checkIn_checkOut_idx" ON "Booking"("roomId", "checkIn", "checkOut");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_guestEmail_idx" ON "Booking"("guestEmail");

-- ─── Admin Users ────────────────────────────────────────────

CREATE TABLE "AdminUser" (
  "id"        TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "password"  TEXT NOT NULL,  -- bcrypt hashed
  "name"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- ─── Contact Submissions (PII encrypted at app level) ──────

CREATE TABLE "ContactSubmission" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,     -- ENCRYPTED PII
  "email"     TEXT NOT NULL,     -- ENCRYPTED PII
  "subject"   TEXT,
  "message"   TEXT NOT NULL,     -- ENCRYPTED PII
  "locale"    TEXT NOT NULL DEFAULT 'en',
  "isRead"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactSubmission_isRead_idx" ON "ContactSubmission"("isRead");

-- ─── GDPR Audit Log ────────────────────────────────────────

CREATE TABLE "GdprAuditLog" (
  "id"          TEXT NOT NULL,
  "action"      TEXT NOT NULL,  -- ACCESS, EXPORT, DELETE, ANONYMIZE, CONSENT_GIVEN, CONSENT_WITHDRAWN
  "entityType"  TEXT NOT NULL,  -- Booking, ContactSubmission
  "entityId"    TEXT NOT NULL,
  "details"     TEXT,
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "performedBy" TEXT,           -- admin email or 'system'
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GdprAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GdprAuditLog_entityType_entityId_idx" ON "GdprAuditLog"("entityType", "entityId");
CREATE INDEX "GdprAuditLog_action_idx" ON "GdprAuditLog"("action");
CREATE INDEX "GdprAuditLog_createdAt_idx" ON "GdprAuditLog"("createdAt");

-- ─── GDPR Deletion Requests ────────────────────────────────

CREATE TABLE "GdprDeletionRequest" (
  "id"            TEXT NOT NULL,
  "email"         TEXT NOT NULL,
  "requestedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"   TIMESTAMP(3),
  "status"        TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, COMPLETED, REJECTED
  "deletedData"   TEXT,  -- JSON summary of deleted data
  "processedBy"   TEXT,  -- admin email

  CONSTRAINT "GdprDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GdprDeletionRequest_email_idx" ON "GdprDeletionRequest"("email");
CREATE INDEX "GdprDeletionRequest_status_idx" ON "GdprDeletionRequest"("status");

-- ============================================================
-- Schema created successfully!
-- Next steps:
-- 1. Set DATABASE_URL in .env with your Neon connection string
-- 2. Run: npx prisma db push (to sync Prisma client)
-- 3. Run: npx prisma db seed (to seed rooms + admin user)
-- ============================================================
