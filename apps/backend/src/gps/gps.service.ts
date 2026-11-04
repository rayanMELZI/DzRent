import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { BookingStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ForbiddenException } from '@nestjs/common';
import { GpsPingDto } from './dto/gps.dto';

/** Haversine distance in km between two lat/lng points. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371,
    toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1),
    dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class GpsService {
  private readonly logger = new Logger(GpsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfig: PlatformConfigService,
    private readonly notifications: NotificationsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /** Ingests a batch of pings from trackers. Maps device→vehicle→active booking. */
  async ingest(pings: GpsPingDto[]) {
    const speedThreshold = await this.platformConfig.get<number>('gps_speed_threshold_kmh', 160);
    const geofenceRadius = await this.platformConfig.get<number>('gps_geofence_radius_km', 50);
    let stored = 0;

    for (const p of pings) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { gpsDeviceId: p.deviceId },
        select: {
          id: true,
          licensePlate: true,
          agency: { select: { wilaya: { select: { latitude: true, longitude: true } } } },
        },
      });
      if (!vehicle) {
        this.logger.warn(`Unknown GPS device ${p.deviceId}`);
        continue;
      }

      const activeBooking = await this.prisma.booking.findFirst({
        where: { vehicleId: vehicle.id, status: BookingStatus.ACTIVE },
        select: {
          id: true,
          bookingRef: true,
          pickupWilayaId: true,
          client: { select: { id: true, phone: true, locale: true } },
        },
      });

      const isSpeeding = (p.speedKmh ?? 0) > speedThreshold;
      const centroid = vehicle.agency.wilaya;
      const distKm = haversineKm(
        p.latitude,
        p.longitude,
        Number(centroid.latitude),
        Number(centroid.longitude),
      );
      const isGeofenceViolation = distKm > geofenceRadius;

      await this.prisma.gpsTrackingLog.create({
        data: {
          vehicleId: vehicle.id,
          bookingId: activeBooking?.id ?? null,
          deviceId: p.deviceId,
          latitude: p.latitude as never,
          longitude: p.longitude as never,
          speedKmh: (p.speedKmh ?? null) as never,
          headingDeg: p.headingDeg ?? null,
          isIgnitionOn: !!p.ignitionOn,
          isSpeeding,
          isGeofenceViolation,
          recordedAt: new Date(p.recordedAt),
        },
      });
      await this.prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { gpsLastPingAt: new Date(p.recordedAt) },
      });
      stored++;

      // Geofence alert (deduped 10 min per booking via Redis)
      if (isGeofenceViolation && activeBooking) {
        const key = `dzrent:geofence:${activeBooking.id}`;
        if (!(await this.redis.get(key))) {
          await this.redis.setex(key, 600, '1');
          await this.notifications.sendSms({
            userId: activeBooking.client.id,
            phone: activeBooking.client.phone,
            locale: activeBooking.client.locale as 'fr' | 'ar',
            templateId: 'GEOFENCE_ALERT',
            vars: {
              plate: vehicle.licensePlate,
              bookingRef: activeBooking.bookingRef,
              lat: p.latitude.toFixed(4),
              lng: p.longitude.toFixed(4),
            },
          });
          this.logger.warn(
            `GEOFENCE breach: ${vehicle.licensePlate} ${distKm.toFixed(1)}km from centroid (booking ${activeBooking.bookingRef})`,
          );
        }
      }
    }
    return { received: pings.length, stored };
  }

  /** Latest known position for a vehicle (agency-scoped). */
  async latest(vehicleId: string, caller: AuthenticatedUser) {
    await this.assertVehicleAccess(vehicleId, caller);
    const log = await this.prisma.gpsTrackingLog.findFirst({
      where: { vehicleId },
      orderBy: { recordedAt: 'desc' },
    });
    return log ?? { message: 'No GPS data yet.' };
  }

  /** History between two timestamps (agency-scoped). */
  async history(
    vehicleId: string,
    caller: AuthenticatedUser,
    from: string,
    to: string,
    limit = 500,
  ) {
    await this.assertVehicleAccess(vehicleId, caller);
    return this.prisma.gpsTrackingLog.findMany({
      where: { vehicleId, recordedAt: { gte: new Date(from), lte: new Date(to) } },
      orderBy: { recordedAt: 'desc' },
      take: Math.min(limit, 1000),
    });
  }

  private async assertVehicleAccess(vehicleId: string, caller: AuthenticatedUser) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { agencyId: true, agency: { select: { ownerId: true } } },
    });
    if (!v) throw new ForbiddenException('Vehicle not found.');
    const ok =
      caller.role === 'ADMIN' || v.agency.ownerId === caller.id || caller.agencyId === v.agencyId;
    if (!ok) throw new ForbiddenException('This vehicle belongs to another agency.');
  }
}
