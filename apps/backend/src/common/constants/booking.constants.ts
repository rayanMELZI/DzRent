import { BookingStatus } from '@prisma/client';
/** Statuses that block a vehicle's calendar (overlap checks in search + booking creation). */
export const BLOCKING_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.APPROVED, BookingStatus.AWAITING_PAYMENT, BookingStatus.PAID, BookingStatus.ACTIVE,
];
