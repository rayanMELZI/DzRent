/**
 * DzRent – DEV demo seed (Phase A dashboard wiring)
 *
 * Creates a verified agency, its owner (phone-OTP loginable), a small fleet,
 * demo clients with contrasting trust profiles (clean / risky / blacklisted /
 * veteran) and bookings in every queue state, so the agency dashboard renders
 * live records end to end.
 *
 * Run AFTER the base seed (wilayas/categories/config):
 *   pnpm --filter @dzrent/backend db:seed        # base lookups
 *   pnpm --filter @dzrent/backend db:seed:dev    # this script
 *
 * Idempotent: keyed on unique fields (phone, slug, plate, bookingRef) — safe
 * to re-run. Dates are relative to "now" so the queue always looks alive.
 *
 * Login: +213661000001 → the OTP is printed by the backend console (dev SMS).
 */

import 'dotenv/config'; // standalone ts-node script — load .env like the Prisma CLI does

import {
  BookingStatus,
  BlacklistReason,
  FuelType,
  InsuranceCoverageType,
  KycDocumentType,
  KycStatus,
  NotificationChannel,
  Prisma,
  PrismaClient,
  TransmissionType,
  UserRole,
  UserStatus,
  VehicleDocumentType,
  VehicleStatus,
} from '@prisma/client';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

const OWNER_PHONE = '+213661000001';
const AGENCY_SLUG = 'sahara-auto-location';

const now = () => new Date();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const daysAhead = (d: number) => new Date(Date.now() + d * 86_400_000);

// ── helpers ───────────────────────────────────────────────────────────────────

async function upsertUser(u: {
  phone: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  locale?: string;
  riskScore?: number;
  riskFlags?: string[];
  createdAt?: Date;
}) {
  const data = {
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role ?? UserRole.CLIENT,
    status: UserStatus.ACTIVE,
    locale: u.locale ?? 'fr',
    riskScore: u.riskScore ?? 0,
    riskFlags: (u.riskFlags ?? []) as Prisma.InputJsonValue,
  };
  return prisma.user.upsert({
    where: { phone: u.phone },
    // Never clobber names on re-run — the user may have edited their profile.
    update: { role: data.role, status: data.status, riskScore: data.riskScore, riskFlags: data.riskFlags },
    create: { phone: u.phone, ...data, ...(u.createdAt && { createdAt: u.createdAt }) },
  });
}

/** Latest-version KYC doc per (user, type) — created once, then left alone. */
async function ensureKycDoc(userId: string, documentType: KycDocumentType, status: KycStatus) {
  const existing = await prisma.kycDocument.findFirst({ where: { userId, documentType } });
  if (existing) return existing;
  return prisma.kycDocument.create({
    data: {
      userId,
      documentType,
      status,
      version: 1,
      fileKey: `seed/kyc/${userId}/${documentType.toLowerCase()}.jpg`,
      fileMimeType: 'image/jpeg',
      fileSizeBytes: 204_800,
      fileHash: `seed-${documentType.toLowerCase()}-${userId.slice(0, 8)}`,
      ...(status !== KycStatus.PENDING_REVIEW && { reviewedAt: daysAgo(3) }),
      ...(status === KycStatus.REJECTED && { rejectionReason: 'Document illisible / non conforme.' }),
    },
  });
}

async function ensureFraudSignal(userId: string, signalType: string, severity: number, description: string) {
  const existing = await prisma.fraudSignal.findFirst({ where: { userId, signalType, isResolved: false } });
  if (existing) return existing;
  return prisma.fraudSignal.create({ data: { userId, signalType, severity, description } });
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 DEV seed — demo agency, fleet, clients, bookings\n');

  // Wilaya 16 (Alger) — normally from the base seed; upserted so this script stands alone.
  await prisma.wilaya.upsert({
    where: { id: 16 },
    update: {},
    create: { id: 16, code: '16', nameFr: 'Alger', nameAr: 'الجزائر', regionCode: 'NORD_CENTRE', latitude: 36.7538, longitude: 3.0588 },
  });

  // Categories used by the demo fleet.
  const CATEGORIES = [
    { slug: 'citadine', nameFr: 'Citadine', nameAr: 'حضرية', sortOrder: 1 },
    { slug: 'berline', nameFr: 'Berline', nameAr: 'صالون', sortOrder: 2 },
    { slug: 'suv', nameFr: 'SUV', nameAr: 'دفع رباعي', sortOrder: 3 },
    { slug: 'prestige', nameFr: 'Prestige', nameAr: 'فاخرة', sortOrder: 6 },
  ];
  const categories = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.vehicleCategory.upsert({ where: { slug: c.slug }, update: {}, create: c });
    categories.set(c.slug, row.id);
  }

  // ── Owner + verified agency ────────────────────────────────────────────────
  const owner = await upsertUser({
    phone: OWNER_PHONE,
    firstName: 'Sarah',
    lastName: 'Benaissa',
    role: UserRole.AGENCY_OWNER,
    createdAt: daysAgo(120),
  });
  const agency = await prisma.agency.upsert({
    where: { slug: AGENCY_SLUG },
    update: { isVerified: true },
    create: {
      ownerId: owner.id,
      wilayaId: 16,
      name: 'Sahara Auto Location',
      nameAr: 'الصحراء لكراء السيارات',
      slug: AGENCY_SLUG,
      phone: OWNER_PHONE,
      address: '12 Rue Didouche Mourad',
      commune: 'Hydra, Alger',
      registrationNo: '16/00-1234567B24',
      taxId: '099916123456789',
      isVerified: true,
      verifiedAt: daysAgo(90),
    },
  });

  // ── Fleet ──────────────────────────────────────────────────────────────────
  const FLEET = [
    { plate: '004120-16', make: 'Hyundai', model: 'Tucson', year: 2023, color: 'Gris', cat: 'suv', fuel: FuelType.DIESEL, trans: TransmissionType.AUTOMATIC, daily: 11_000, deposit: 60_000, km: 31_500 },
    { plate: '011880-16', make: 'Hyundai', model: 'Accent', year: 2022, color: 'Blanc', cat: 'berline', fuel: FuelType.ESSENCE, trans: TransmissionType.AUTOMATIC, daily: 6_500, deposit: 35_000, km: 48_200 },
    { plate: '020510-16', make: 'Volkswagen', model: 'Golf 8', year: 2022, color: 'Noir', cat: 'berline', fuel: FuelType.ESSENCE, trans: TransmissionType.AUTOMATIC, daily: 8_500, deposit: 50_000, km: 39_900 },
    { plate: '000760-16', make: 'Mercedes', model: 'Classe C', year: 2023, color: 'Argent', cat: 'prestige', fuel: FuelType.ESSENCE, trans: TransmissionType.AUTOMATIC, daily: 18_000, deposit: 90_000, km: 18_750 },
  ];
  // Insurance end / visite expiry per vehicle (drives real compliance alerts):
  // one urgent (9 days), one warning (18), the rest comfortable.
  const EXPIRIES = [
    { ins: 200, tech: 9 },
    { ins: 18, tech: 140 },
    { ins: 130, tech: 64 },
    { ins: 200, tech: 95 },
  ];
  const vehicles = new Map<string, string>();
  for (const [i, v] of FLEET.entries()) {
    const row = await prisma.vehicle.upsert({
      where: { licensePlate: v.plate },
      update: { status: VehicleStatus.AVAILABLE },
      create: {
        agencyId: agency.id,
        licensePlate: v.plate,
        chassisNumber: `VF1SEED00000000${i}A`,
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        fuelType: v.fuel,
        transmission: v.trans,
        categoryId: categories.get(v.cat)!,
        status: VehicleStatus.AVAILABLE,
        currentMileageKm: v.km,
        dailyRateDA: v.daily,
        depositAmountDA: v.deposit,
        gpsDeviceId: `GPS-SEED-${i + 1}`,
        gpsImei: `35915605939141${i}`,
        gpsLastPingAt: minutesAgo(2),
        hasValidInsurance: true,
        hasValidVisite: true,
        hasGpsDevice: true,
        features: ['AC', 'BLUETOOTH'],
      },
    });
    vehicles.set(v.model, row.id);

    // Real compliance records behind the flags: insurance policy + visite doc.
    const exp = EXPIRIES[i]!;
    const hasPolicy = await prisma.insurancePolicy.findFirst({ where: { vehicleId: row.id, isActive: true } });
    if (!hasPolicy) {
      await prisma.insurancePolicy.create({
        data: {
          vehicleId: row.id, agencyId: agency.id,
          coverageType: InsuranceCoverageType.COMPREHENSIVE,
          providerName: 'SAA', policyNumber: `SAA-2026-${1000 + i}`,
          coverageAmountDA: 2_000_000, premiumDA: 85_000,
          startDate: daysAgo(180), endDate: daysAhead(exp.ins),
        },
      });
    }
    const hasVisite = await prisma.vehicleDocument.findFirst({
      where: { vehicleId: row.id, documentType: VehicleDocumentType.VISITE_TECHNIQUE },
    });
    if (!hasVisite) {
      await prisma.vehicleDocument.create({
        data: {
          vehicleId: row.id, documentType: VehicleDocumentType.VISITE_TECHNIQUE, version: 1,
          fileKey: `seed/vehicles/${row.id}/visite.pdf`, fileMimeType: 'application/pdf',
          documentNumber: `VT-2026-${2000 + i}`, issuedAt: daysAgo(300), expiresAt: daysAhead(exp.tech),
          isVerified: true, verifiedAt: daysAgo(299),
        },
      });
    }
  }

  // ── Clients with contrasting trust profiles ────────────────────────────────
  // Yacine — clean regular: KYC complete, address proof still in review.
  const yacine = await upsertUser({ phone: '+213661000002', firstName: 'Yacine', lastName: 'Cherif', createdAt: daysAgo(70) });
  await ensureKycDoc(yacine.id, KycDocumentType.CIN, KycStatus.APPROVED);
  await ensureKycDoc(yacine.id, KycDocumentType.DRIVING_LICENSE, KycStatus.APPROVED);
  await ensureKycDoc(yacine.id, KycDocumentType.SELFIE, KycStatus.APPROVED);
  await ensureKycDoc(yacine.id, KycDocumentType.PROOF_OF_ADDRESS, KycStatus.PENDING_REVIEW);

  // Riad — brand-new account with a document mismatch flag (the ⚠ row).
  const riad = await upsertUser({
    phone: '+213661000003', firstName: 'Riad', lastName: 'Mansouri',
    riskScore: 32, riskFlags: ['DOCUMENT_MISMATCH'], createdAt: minutesAgo(90),
  });
  await ensureKycDoc(riad.id, KycDocumentType.CIN, KycStatus.APPROVED);
  await ensureKycDoc(riad.id, KycDocumentType.DRIVING_LICENSE, KycStatus.PENDING_REVIEW);
  await ensureKycDoc(riad.id, KycDocumentType.SELFIE, KycStatus.REJECTED);
  await ensureFraudSignal(riad.id, 'DOCUMENT_MISMATCH', 4, 'Selfie does not match the CIN portrait.');

  // Lina — veteran with full KYC and completed rentals behind her.
  const lina = await upsertUser({ phone: '+213661000004', firstName: 'Lina', lastName: 'Hadj', createdAt: daysAgo(160) });
  for (const t of [KycDocumentType.CIN, KycDocumentType.DRIVING_LICENSE, KycDocumentType.SELFIE, KycDocumentType.PROOF_OF_ADDRESS]) {
    await ensureKycDoc(lina.id, t, KycStatus.APPROVED);
  }

  // Karim — blacklisted after a prior incident (red trust check).
  const karim = await upsertUser({ phone: '+213661000005', firstName: 'Karim', lastName: 'Benali', createdAt: daysAgo(40) });
  await ensureKycDoc(karim.id, KycDocumentType.CIN, KycStatus.APPROVED);
  await ensureKycDoc(karim.id, KycDocumentType.DRIVING_LICENSE, KycStatus.APPROVED);
  await ensureKycDoc(karim.id, KycDocumentType.SELFIE, KycStatus.APPROVED);
  const hasEntry = await prisma.blacklistEntry.findFirst({ where: { userId: karim.id, agencyId: agency.id } });
  if (!hasEntry) {
    await prisma.blacklistEntry.create({
      data: {
        userId: karim.id,
        reportedById: owner.id,
        agencyId: agency.id,
        reason: BlacklistReason.NON_RETURN,
        description: 'Véhicule rendu avec 3 jours de retard sans réponse aux appels.',
        isShared: true,
      },
    });
  }

  // Second agency (federation demo): Atlas Cars also flagged Karim — the
  // blacklist page shows "2 agences", a much stronger signal than one report.
  const atlasOwner = await upsertUser({
    phone: '+213661000010', firstName: 'Mounir', lastName: 'Ait Ahmed',
    role: UserRole.AGENCY_OWNER, createdAt: daysAgo(200),
  });
  const atlas = await prisma.agency.upsert({
    where: { slug: 'atlas-cars' },
    update: { isVerified: true },
    create: {
      ownerId: atlasOwner.id, wilayaId: 16,
      name: 'Atlas Cars', nameAr: 'أطلس للسيارات', slug: 'atlas-cars',
      phone: '+213661000010', address: 'Cité 5 Juillet', commune: 'Bab Ezzouar, Alger',
      isVerified: true, verifiedAt: daysAgo(150),
    },
  });
  const hasAtlasEntry = await prisma.blacklistEntry.findFirst({ where: { userId: karim.id, agencyId: atlas.id } });
  if (!hasAtlasEntry) {
    await prisma.blacklistEntry.create({
      data: {
        userId: karim.id, reportedById: atlasOwner.id, agencyId: atlas.id,
        reason: BlacklistReason.PAYMENT_DEFAULT,
        description: 'Chèque de caution sans provision lors de la location de mai 2026.',
        isShared: true, createdAt: daysAgo(20),
      },
    });
  }

  // Notification-center demo entries for the owner.
  const hasNotifs = await prisma.notificationLog.findFirst({ where: { userId: owner.id } });
  if (!hasNotifs) {
    const NOTIFS = [
      { body: 'Nouvelle demande de réservation DZR-2026-90003 (Hyundai Accent, 011880-16).', minsAgo: 6 },
      { body: 'Nouvelle demande de réservation DZR-2026-90002 (Mercedes Classe C, 000760-16).', minsAgo: 72 },
      { body: 'Rappel conformité : la visite technique du Hyundai Tucson (004120-16) expire dans 9 jours.', minsAgo: 60 * 26 },
    ];
    for (const n of NOTIFS) {
      await prisma.notificationLog.create({
        data: {
          userId: owner.id, channel: NotificationChannel.SMS,
          templateId: 'BOOKING_CREATED_AGENCY_FR',
          payload: { body: n.body } as Prisma.InputJsonValue,
          isDelivered: true, deliveredAt: minutesAgo(n.minsAgo), createdAt: minutesAgo(n.minsAgo),
        },
      });
    }
  }

  // ── Bookings across the three queue views ──────────────────────────────────
  type BookingSeed = {
    ref: string; clientId: string; model: string; status: BookingStatus;
    fromInDays: number; days: number; daily: number; deposit: number;
    createdAt: Date; confirmed?: boolean; cancelled?: { reason: string };
    completed?: boolean;
  };
  const price = (daily: number, days: number) => {
    const subtotal = daily * days;
    const tax = Math.round(subtotal * 0.19);
    const insurance = 800 * days;
    return { subtotal, tax, insurance, total: subtotal + tax + insurance };
  };
  const BOOKINGS: BookingSeed[] = [
    { ref: 'DZR-2026-90001', clientId: yacine.id, model: 'Tucson', status: BookingStatus.PENDING, fromInDays: 3, days: 4, daily: 11_000, deposit: 60_000, createdAt: minutesAgo(22) },
    { ref: 'DZR-2026-90002', clientId: riad.id, model: 'Classe C', status: BookingStatus.PENDING, fromInDays: 2, days: 3, daily: 18_000, deposit: 90_000, createdAt: minutesAgo(70) },
    { ref: 'DZR-2026-90003', clientId: karim.id, model: 'Accent', status: BookingStatus.PENDING, fromInDays: 5, days: 2, daily: 6_500, deposit: 35_000, createdAt: minutesAgo(5) },
    { ref: 'DZR-2026-90004', clientId: lina.id, model: 'Golf 8', status: BookingStatus.APPROVED, fromInDays: 1, days: 3, daily: 8_500, deposit: 50_000, createdAt: daysAgo(1), confirmed: true },
    { ref: 'DZR-2026-90005', clientId: riad.id, model: 'Accent', status: BookingStatus.CANCELLED_AGENCY, fromInDays: 4, days: 2, daily: 6_500, deposit: 35_000, createdAt: daysAgo(2), cancelled: { reason: 'Documents KYC incomplets.' } },
    // Lina's history — drives her "rentals completed" trust count.
    { ref: 'DZR-2026-90101', clientId: lina.id, model: 'Golf 8', status: BookingStatus.COMPLETED, fromInDays: -30, days: 3, daily: 8_500, deposit: 50_000, createdAt: daysAgo(33), confirmed: true, completed: true },
    { ref: 'DZR-2026-90102', clientId: lina.id, model: 'Accent', status: BookingStatus.COMPLETED, fromInDays: -75, days: 5, daily: 6_500, deposit: 35_000, createdAt: daysAgo(80), confirmed: true, completed: true },
  ];

  for (const b of BOOKINGS) {
    const from = daysAhead(b.fromInDays);
    const until = daysAhead(b.fromInDays + b.days);
    const p = price(b.daily, b.days);
    const vehicleId = vehicles.get(b.model)!;
    const common = {
      clientId: b.clientId,
      agencyId: agency.id,
      vehicleId,
      status: b.status,
      requestedFrom: from,
      requestedUntil: until,
      ...(b.confirmed && { confirmedFrom: from, confirmedUntil: until }),
      ...(b.completed && { actualPickupAt: from, actualReturnAt: until }),
      ...(b.cancelled && { cancelledAt: daysAgo(1), cancelledBy: owner.id, cancellationReason: b.cancelled.reason }),
      dailyRateDA: b.daily,
      totalDays: b.days,
      subtotalDA: p.subtotal,
      taxAmountDA: p.tax,
      insuranceAmountDA: p.insurance,
      depositAmountDA: b.deposit,
      totalAmountDA: p.total,
      pickupWilayaId: 16,
    };
    await prisma.booking.upsert({
      where: { bookingRef: b.ref },
      update: { status: b.status },
      create: { bookingRef: b.ref, ...common, createdAt: b.createdAt },
    });
  }

  console.log('✅ Agency  :', agency.name, `(slug ${agency.slug})`);
  console.log('✅ Fleet   :', FLEET.length, 'vehicles');
  console.log('✅ Clients : Yacine (clean) · Riad (risk flag) · Lina (veteran) · Karim (blacklisted)');
  console.log('✅ Bookings: 3 pending · 1 approved · 1 refused · 2 completed');
  console.log(`\n🔑 Dashboard login: ${OWNER_PHONE} — the OTP prints in the backend console.\n`);
}

main()
  .catch((e) => {
    console.error('❌ Dev seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
