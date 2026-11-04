/** Maps a fleet vehicle status onto the shared status vocabulary + i18n label. */
import type { StringKey } from '@dzrent/i18n';
import type { StatusToken } from '@dzrent/tokens';
import type { VehicleFleetStatus } from '@dzrent/types';

export const FLEET_STATUS: Record<VehicleFleetStatus, { labelKey: StringKey; badge: StatusToken }> =
  {
    available: { labelKey: 'fleet_st_available', badge: 'approved' },
    rented: { labelKey: 'fleet_st_rented', badge: 'pending' },
    maintenance: { labelKey: 'fleet_st_maint', badge: 'expiring' },
    out_of_service: { labelKey: 'fleet_st_oos', badge: 'refused' },
    inspection: { labelKey: 'fleet_st_inspect', badge: 'none' },
  };

export const FLEET_STATUS_ORDER: VehicleFleetStatus[] = [
  'available',
  'rented',
  'maintenance',
  'out_of_service',
  'inspection',
];
