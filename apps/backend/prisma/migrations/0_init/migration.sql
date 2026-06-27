-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'AGENCY_OWNER', 'AGENCY_STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('CIN', 'DRIVING_LICENSE', 'SELFIE', 'PROOF_OF_ADDRESS', 'PASSPORT');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE', 'PENDING_INSPECTION');

-- CreateEnum
CREATE TYPE "VehicleDocumentType" AS ENUM ('CARTE_GRISE', 'INSURANCE_CERT', 'VISITE_TECHNIQUE', 'GPS_CERTIFICATE', 'CUSTOMS_CLEARANCE');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('ESSENCE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GPL');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'AWAITING_PAYMENT', 'PAID', 'ACTIVE', 'COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_AGENCY', 'DISPUTED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CIB', 'EDAHABIA', 'CASH', 'BANK_TRANSFER', 'CHEQUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'RELEASED', 'REFUNDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('BOOKING_PAYMENT', 'SECURITY_DEPOSIT', 'DEPOSIT_REFUND', 'DAMAGE_CHARGE', 'LATE_FEE', 'PLATFORM_FEE');

-- CreateEnum
CREATE TYPE "InsuranceCoverageType" AS ENUM ('THIRD_PARTY_ONLY', 'COMPREHENSIVE', 'COMPREHENSIVE_PLUS');

-- CreateEnum
CREATE TYPE "DamageReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISPUTED', 'CLOSED_NO_CHARGE');

-- CreateEnum
CREATE TYPE "BlacklistReason" AS ENUM ('NON_RETURN', 'DOCUMENT_FRAUD', 'PAYMENT_DEFAULT', 'VEHICLE_DAMAGE', 'VIOLENT_BEHAVIOR', 'MULTIPLE_FRAUD_SIGNALS', 'INSURANCE_FRAUD');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('OIL_CHANGE', 'TYRE_REPLACEMENT', 'BRAKE_SERVICE', 'VISITE_TECHNIQUE_RENEWAL', 'ACCIDENT_REPAIR', 'GENERAL_SERVICE', 'GPS_DEVICE_REPLACEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('MANAGER', 'AGENT', 'ACCOUNTANT', 'DISPATCHER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'PUSH', 'EMAIL');

-- CreateTable
CREATE TABLE "wilayas" (
    "id" INTEGER NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "nameFr" VARCHAR(100) NOT NULL,
    "regionCode" VARCHAR(20) NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wilayas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "locale" VARCHAR(5) NOT NULL DEFAULT 'fr',
    "avatarUrl" VARCHAR(500),
    "nationalIdNumber" VARCHAR(20),
    "otpHash" VARCHAR(255),
    "otpExpiresAt" TIMESTAMPTZ(0),
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMPTZ(0),
    "lastLoginIp" VARCHAR(45),
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskFlags" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,
    "deletedAt" TIMESTAMPTZ(0),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "wilayaId" INTEGER NOT NULL,
    "commune" VARCHAR(150) NOT NULL,
    "street" VARCHAR(255),
    "postalCode" VARCHAR(10),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "label" VARCHAR(50),

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "documentType" "KycDocumentType" NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "version" INTEGER NOT NULL DEFAULT 1,
    "fileKey" VARCHAR(500) NOT NULL,
    "fileMimeType" VARCHAR(100) NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "documentNumber" VARCHAR(100),
    "issuedAt" TIMESTAMPTZ(0),
    "expiresAt" TIMESTAMPTZ(0),
    "issuingWilaya" VARCHAR(100),
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMPTZ(0),
    "rejectionReason" TEXT,
    "reviewNotes" TEXT,
    "fileHash" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ownerId" UUID NOT NULL,
    "wilayaId" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "nameAr" VARCHAR(200),
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "logoUrl" VARCHAR(500),
    "registrationNo" VARCHAR(50),
    "taxId" VARCHAR(30),
    "artisanCardNo" VARCHAR(30),
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "address" VARCHAR(500) NOT NULL,
    "commune" VARCHAR(150) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMPTZ(0),
    "verifiedBy" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspensionReason" TEXT,
    "sharesBlacklist" BOOLEAN NOT NULL DEFAULT true,
    "acceptsBlacklist" BOOLEAN NOT NULL DEFAULT true,
    "commissionRatePct" DECIMAL(5,2),
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,
    "deletedAt" TIMESTAMPTZ(0),

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agencyId" UUID NOT NULL,
    "documentType" VARCHAR(100) NOT NULL,
    "fileKey" VARCHAR(500) NOT NULL,
    "fileMimeType" VARCHAR(100) NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMPTZ(0),
    "reviewedBy" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agency_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_staff" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "staffRole" "StaffRole" NOT NULL DEFAULT 'AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "hiredAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firedAt" TIMESTAMPTZ(0),
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "agency_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agencyId" UUID NOT NULL,
    "licensePlate" VARCHAR(20) NOT NULL,
    "chassisNumber" VARCHAR(50) NOT NULL,
    "make" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "color" VARCHAR(50) NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "transmission" "TransmissionType" NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 5,
    "doors" INTEGER NOT NULL DEFAULT 4,
    "trunkVolumeLiters" INTEGER,
    "currentMileageKm" INTEGER NOT NULL DEFAULT 0,
    "categoryId" UUID NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "gpsDeviceId" VARCHAR(100),
    "gpsImei" VARCHAR(20),
    "gpsLastPingAt" TIMESTAMPTZ(0),
    "dailyRateDA" DECIMAL(12,2),
    "weeklyRateDA" DECIMAL(12,2),
    "monthlyRateDA" DECIMAL(12,2),
    "depositAmountDA" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "availableFrom" TIMESTAMPTZ(0),
    "availableUntil" TIMESTAMPTZ(0),
    "features" TEXT[],
    "photos" TEXT[],
    "hasValidInsurance" BOOLEAN NOT NULL DEFAULT false,
    "hasValidVisite" BOOLEAN NOT NULL DEFAULT false,
    "hasGpsDevice" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,
    "deletedAt" TIMESTAMPTZ(0),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" VARCHAR(50) NOT NULL,
    "nameFr" VARCHAR(100) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "iconKey" VARCHAR(100),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vehicle_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vehicleId" UUID NOT NULL,
    "documentType" "VehicleDocumentType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fileKey" VARCHAR(500) NOT NULL,
    "fileMimeType" VARCHAR(100) NOT NULL,
    "documentNumber" VARCHAR(100),
    "issuedAt" TIMESTAMPTZ(0),
    "expiresAt" TIMESTAMPTZ(0),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMPTZ(0),
    "verifiedBy" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_maintenance" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vehicleId" UUID NOT NULL,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "mileageAtServiceKm" INTEGER NOT NULL,
    "performedAt" TIMESTAMPTZ(0) NOT NULL,
    "nextServiceAt" TIMESTAMPTZ(0),
    "nextServiceKm" INTEGER,
    "costDA" DECIMAL(12,2),
    "performedBy" VARCHAR(200),
    "notes" TEXT,
    "receiptKey" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "vehicle_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wilaya_pricing_rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agencyId" UUID NOT NULL,
    "wilayaId" INTEGER NOT NULL,
    "categorySlug" VARCHAR(50) NOT NULL,
    "dailyRateDA" DECIMAL(12,2) NOT NULL,
    "weeklyRateDA" DECIMAL(12,2) NOT NULL,
    "monthlyRateDA" DECIMAL(12,2) NOT NULL,
    "depositAmountDA" DECIMAL(12,2) NOT NULL,
    "taxRatePct" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "wilaya_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bookingRef" VARCHAR(20) NOT NULL,
    "clientId" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "requestedFrom" TIMESTAMPTZ(0) NOT NULL,
    "requestedUntil" TIMESTAMPTZ(0) NOT NULL,
    "confirmedFrom" TIMESTAMPTZ(0),
    "confirmedUntil" TIMESTAMPTZ(0),
    "actualPickupAt" TIMESTAMPTZ(0),
    "actualReturnAt" TIMESTAMPTZ(0),
    "pickupWilayaId" INTEGER,
    "pickupAddress" VARCHAR(500),
    "returnAddress" VARCHAR(500),
    "isOneWay" BOOLEAN NOT NULL DEFAULT false,
    "dailyRateDA" DECIMAL(12,2) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "subtotalDA" DECIMAL(12,2) NOT NULL,
    "discountDA" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmountDA" DECIMAL(12,2) NOT NULL,
    "insuranceAmountDA" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "depositAmountDA" DECIMAL(12,2) NOT NULL,
    "totalAmountDA" DECIMAL(12,2) NOT NULL,
    "includedKm" INTEGER,
    "extraKmRateDA" DECIMAL(10,2),
    "mileageAtPickupKm" INTEGER,
    "mileageAtReturnKm" INTEGER,
    "additionalDrivers" INTEGER NOT NULL DEFAULT 0,
    "hasChildSeat" BOOLEAN NOT NULL DEFAULT false,
    "hasGpsScreen" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "agencyNotes" TEXT,
    "cancelledAt" TIMESTAMPTZ(0),
    "cancelledBy" UUID,
    "cancellationReason" TEXT,
    "cancellationPolicySnapshot" JSONB,
    "kycVerifiedAt" TIMESTAMPTZ(0),
    "kycApprovedBy" UUID,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_contracts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bookingId" UUID NOT NULL,
    "contractRef" VARCHAR(30) NOT NULL,
    "wilayaId" INTEGER,
    "contractPdfKey" VARCHAR(500),
    "signedPdfKey" VARCHAR(500),
    "clientSignedAt" TIMESTAMPTZ(0),
    "clientSignatureHash" VARCHAR(255),
    "clientSignatureIp" VARCHAR(45),
    "agencySignedAt" TIMESTAMPTZ(0),
    "agencySignerUserId" UUID,
    "appliedClauses" JSONB NOT NULL DEFAULT '[]',
    "pickupConditionPhotos" TEXT[],
    "pickupConditionNotes" TEXT,
    "pickupFuelLevel" INTEGER,
    "returnConditionPhotos" TEXT[],
    "returnConditionNotes" TEXT,
    "returnFuelLevel" INTEGER,
    "lateReturnPenaltyDA" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lateReturnHours" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "rental_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bookingId" UUID NOT NULL,
    "paymentRef" VARCHAR(50) NOT NULL,
    "externalRef" VARCHAR(200),
    "paymentType" "PaymentType" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountDA" DECIMAL(12,2) NOT NULL,
    "feeDA" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmountDA" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'DZD',
    "gatewayResponse" JSONB,
    "authorizedAt" TIMESTAMPTZ(0),
    "capturedAt" TIMESTAMPTZ(0),
    "releasedAt" TIMESTAMPTZ(0),
    "refundedAt" TIMESTAMPTZ(0),
    "failedAt" TIMESTAMPTZ(0),
    "failureReason" TEXT,
    "receivedBy" UUID,
    "receivedAt" TIMESTAMPTZ(0),
    "reconciledAt" TIMESTAMPTZ(0),
    "reconciledBy" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoiceRef" VARCHAR(30) NOT NULL,
    "paymentId" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "subtotalDA" DECIMAL(12,2) NOT NULL,
    "taxAmountDA" DECIMAL(12,2) NOT NULL,
    "totalDA" DECIMAL(12,2) NOT NULL,
    "taxRatePct" DECIMAL(5,2) NOT NULL,
    "issuedAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfKey" VARCHAR(500),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_tracking_logs" (
    "id" BIGSERIAL NOT NULL,
    "vehicleId" UUID NOT NULL,
    "bookingId" UUID,
    "deviceId" VARCHAR(100) NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "altitudeM" DECIMAL(8,2),
    "speedKmh" DECIMAL(6,2),
    "headingDeg" INTEGER,
    "accuracyM" DECIMAL(8,2),
    "isIgnitionOn" BOOLEAN NOT NULL DEFAULT false,
    "isSpeeding" BOOLEAN NOT NULL DEFAULT false,
    "isGeofenceViolation" BOOLEAN NOT NULL DEFAULT false,
    "recordedAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_tracking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vehicleId" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "coverageType" "InsuranceCoverageType" NOT NULL,
    "providerName" VARCHAR(200) NOT NULL,
    "policyNumber" VARCHAR(100) NOT NULL,
    "coverageAmountDA" DECIMAL(15,2) NOT NULL,
    "premiumDA" DECIMAL(12,2) NOT NULL,
    "startDate" TIMESTAMPTZ(0) NOT NULL,
    "endDate" TIMESTAMPTZ(0) NOT NULL,
    "documentKey" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "damage_reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bookingId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "reportedBy" UUID NOT NULL,
    "insuranceId" UUID,
    "status" "DamageReportStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "photoKeys" TEXT[],
    "policeReportNo" VARCHAR(100),
    "policeReportKey" VARCHAR(500),
    "estimatedCostDA" DECIMAL(12,2),
    "finalCostDA" DECIMAL(12,2),
    "clientChargedDA" DECIMAL(12,2),
    "insuranceClaimDA" DECIMAL(12,2),
    "resolvedAt" TIMESTAMPTZ(0),
    "resolvedBy" UUID,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "damage_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklist_entries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "reportedById" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "reason" "BlacklistReason" NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceKeys" TEXT[],
    "bookingId" UUID,
    "isShared" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reviewedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "adminReviewedAt" TIMESTAMPTZ(0),
    "adminNotes" TEXT,
    "expiresAt" TIMESTAMPTZ(0),
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "blacklist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_signals" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "signalType" VARCHAR(100) NOT NULL,
    "severity" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMPTZ(0),
    "resolvedBy" UUID,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "clientId" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "vehicleId" UUID,
    "overallRating" INTEGER NOT NULL,
    "cleanlinessRating" INTEGER,
    "serviceRating" INTEGER,
    "valueRating" INTEGER,
    "comment" TEXT,
    "commentAr" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "moderatedAt" TIMESTAMPTZ(0),
    "moderatedBy" UUID,
    "agencyResponse" TEXT,
    "agencyResponseAt" TIMESTAMPTZ(0),
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "templateId" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMPTZ(0),
    "failureReason" TEXT,
    "externalRef" VARCHAR(200),
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_clauses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "clauseCode" VARCHAR(100) NOT NULL,
    "titleFr" VARCHAR(300) NOT NULL,
    "titleAr" VARCHAR(300) NOT NULL,
    "contentFr" TEXT NOT NULL,
    "contentAr" TEXT NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "applicableWilayaIds" INTEGER[],
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "legal_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_config" (
    "key" VARCHAR(200) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "wilayas_code_key" ON "wilayas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_nationalIdNumber_idx" ON "users"("nationalIdNumber");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_riskScore_idx" ON "users"("riskScore");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "user_addresses_userId_idx" ON "user_addresses"("userId");

-- CreateIndex
CREATE INDEX "kyc_documents_userId_documentType_status_idx" ON "kyc_documents"("userId", "documentType", "status");

-- CreateIndex
CREATE INDEX "kyc_documents_documentNumber_idx" ON "kyc_documents"("documentNumber");

-- CreateIndex
CREATE INDEX "kyc_documents_status_idx" ON "kyc_documents"("status");

-- CreateIndex
CREATE INDEX "kyc_documents_expiresAt_idx" ON "kyc_documents"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_slug_key" ON "agencies"("slug");

-- CreateIndex
CREATE INDEX "agencies_ownerId_idx" ON "agencies"("ownerId");

-- CreateIndex
CREATE INDEX "agencies_wilayaId_idx" ON "agencies"("wilayaId");

-- CreateIndex
CREATE INDEX "agencies_isVerified_isActive_idx" ON "agencies"("isVerified", "isActive");

-- CreateIndex
CREATE INDEX "agencies_slug_idx" ON "agencies"("slug");

-- CreateIndex
CREATE INDEX "agencies_deletedAt_idx" ON "agencies"("deletedAt");

-- CreateIndex
CREATE INDEX "agency_documents_agencyId_idx" ON "agency_documents"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "agency_staff_userId_key" ON "agency_staff"("userId");

-- CreateIndex
CREATE INDEX "agency_staff_agencyId_idx" ON "agency_staff"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_chassisNumber_key" ON "vehicles"("chassisNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_gpsDeviceId_key" ON "vehicles"("gpsDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_gpsImei_key" ON "vehicles"("gpsImei");

-- CreateIndex
CREATE INDEX "vehicles_agencyId_status_idx" ON "vehicles"("agencyId", "status");

-- CreateIndex
CREATE INDEX "vehicles_licensePlate_idx" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_gpsDeviceId_idx" ON "vehicles"("gpsDeviceId");

-- CreateIndex
CREATE INDEX "vehicles_categoryId_idx" ON "vehicles"("categoryId");

-- CreateIndex
CREATE INDEX "vehicles_status_deletedAt_idx" ON "vehicles"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "vehicles_agencyId_status_availableFrom_availableUntil_idx" ON "vehicles"("agencyId", "status", "availableFrom", "availableUntil");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_categories_slug_key" ON "vehicle_categories"("slug");

-- CreateIndex
CREATE INDEX "vehicle_documents_vehicleId_documentType_idx" ON "vehicle_documents"("vehicleId", "documentType");

-- CreateIndex
CREATE INDEX "vehicle_documents_expiresAt_idx" ON "vehicle_documents"("expiresAt");

-- CreateIndex
CREATE INDEX "vehicle_maintenance_vehicleId_performedAt_idx" ON "vehicle_maintenance"("vehicleId", "performedAt");

-- CreateIndex
CREATE INDEX "vehicle_maintenance_nextServiceAt_idx" ON "vehicle_maintenance"("nextServiceAt");

-- CreateIndex
CREATE INDEX "wilaya_pricing_rules_wilayaId_categorySlug_idx" ON "wilaya_pricing_rules"("wilayaId", "categorySlug");

-- CreateIndex
CREATE UNIQUE INDEX "wilaya_pricing_rules_agencyId_wilayaId_categorySlug_key" ON "wilaya_pricing_rules"("agencyId", "wilayaId", "categorySlug");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingRef_key" ON "bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "bookings_vehicleId_requestedFrom_requestedUntil_idx" ON "bookings"("vehicleId", "requestedFrom", "requestedUntil");

-- CreateIndex
CREATE INDEX "bookings_clientId_status_idx" ON "bookings"("clientId", "status");

-- CreateIndex
CREATE INDEX "bookings_agencyId_status_idx" ON "bookings"("agencyId", "status");

-- CreateIndex
CREATE INDEX "bookings_bookingRef_idx" ON "bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rental_contracts_bookingId_key" ON "rental_contracts"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "rental_contracts_contractRef_key" ON "rental_contracts"("contractRef");

-- CreateIndex
CREATE INDEX "rental_contracts_bookingId_idx" ON "rental_contracts"("bookingId");

-- CreateIndex
CREATE INDEX "rental_contracts_contractRef_idx" ON "rental_contracts"("contractRef");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentRef_key" ON "payments"("paymentRef");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_status_paymentType_idx" ON "payments"("status", "paymentType");

-- CreateIndex
CREATE INDEX "payments_externalRef_idx" ON "payments"("externalRef");

-- CreateIndex
CREATE INDEX "payments_paymentMethod_status_idx" ON "payments"("paymentMethod", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceRef_key" ON "invoices"("invoiceRef");

-- CreateIndex
CREATE INDEX "invoices_paymentId_idx" ON "invoices"("paymentId");

-- CreateIndex
CREATE INDEX "invoices_agencyId_issuedAt_idx" ON "invoices"("agencyId", "issuedAt");

-- CreateIndex
CREATE INDEX "gps_tracking_logs_vehicleId_recordedAt_idx" ON "gps_tracking_logs"("vehicleId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "gps_tracking_logs_bookingId_recordedAt_idx" ON "gps_tracking_logs"("bookingId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "gps_tracking_logs_isGeofenceViolation_recordedAt_idx" ON "gps_tracking_logs"("isGeofenceViolation", "recordedAt");

-- CreateIndex
CREATE INDEX "gps_tracking_logs_deviceId_recordedAt_idx" ON "gps_tracking_logs"("deviceId", "recordedAt");

-- CreateIndex
CREATE INDEX "insurance_policies_vehicleId_isActive_idx" ON "insurance_policies"("vehicleId", "isActive");

-- CreateIndex
CREATE INDEX "insurance_policies_endDate_idx" ON "insurance_policies"("endDate");

-- CreateIndex
CREATE INDEX "damage_reports_bookingId_idx" ON "damage_reports"("bookingId");

-- CreateIndex
CREATE INDEX "damage_reports_vehicleId_status_idx" ON "damage_reports"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "damage_reports_status_idx" ON "damage_reports"("status");

-- CreateIndex
CREATE INDEX "blacklist_entries_userId_isActive_idx" ON "blacklist_entries"("userId", "isActive");

-- CreateIndex
CREATE INDEX "blacklist_entries_agencyId_idx" ON "blacklist_entries"("agencyId");

-- CreateIndex
CREATE INDEX "blacklist_entries_isShared_isActive_idx" ON "blacklist_entries"("isShared", "isActive");

-- CreateIndex
CREATE INDEX "fraud_signals_userId_isResolved_idx" ON "fraud_signals"("userId", "isResolved");

-- CreateIndex
CREATE INDEX "fraud_signals_signalType_createdAt_idx" ON "fraud_signals"("signalType", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_agencyId_isApproved_idx" ON "reviews"("agencyId", "isApproved");

-- CreateIndex
CREATE INDEX "reviews_vehicleId_isApproved_idx" ON "reviews"("vehicleId", "isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_clientId_agencyId_vehicleId_key" ON "reviews"("clientId", "agencyId", "vehicleId");

-- CreateIndex
CREATE INDEX "notification_logs_userId_channel_idx" ON "notification_logs"("userId", "channel");

-- CreateIndex
CREATE INDEX "notification_logs_isDelivered_createdAt_idx" ON "notification_logs"("isDelivered", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "legal_clauses_clauseCode_key" ON "legal_clauses"("clauseCode");

-- CreateIndex
CREATE INDEX "legal_clauses_isActive_isMandatory_idx" ON "legal_clauses"("isActive", "isMandatory");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_wilayaId_fkey" FOREIGN KEY ("wilayaId") REFERENCES "wilayas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_wilayaId_fkey" FOREIGN KEY ("wilayaId") REFERENCES "wilayas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_documents" ADD CONSTRAINT "agency_documents_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_staff" ADD CONSTRAINT "agency_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_staff" ADD CONSTRAINT "agency_staff_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "vehicle_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenance" ADD CONSTRAINT "vehicle_maintenance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wilaya_pricing_rules" ADD CONSTRAINT "wilaya_pricing_rules_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wilaya_pricing_rules" ADD CONSTRAINT "wilaya_pricing_rules_wilayaId_fkey" FOREIGN KEY ("wilayaId") REFERENCES "wilayas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_wilayaId_fkey" FOREIGN KEY ("wilayaId") REFERENCES "wilayas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_tracking_logs" ADD CONSTRAINT "gps_tracking_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_reports" ADD CONSTRAINT "damage_reports_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_reports" ADD CONSTRAINT "damage_reports_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_reports" ADD CONSTRAINT "damage_reports_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "insurance_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist_entries" ADD CONSTRAINT "blacklist_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist_entries" ADD CONSTRAINT "blacklist_entries_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist_entries" ADD CONSTRAINT "blacklist_entries_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
