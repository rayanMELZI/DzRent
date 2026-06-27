-- Adds a computed PostGIS geography column to gps_tracking_logs.
-- Run AFTER `prisma migrate deploy`, BEFORE seeding. Re-apply if the table is recreated.
ALTER TABLE gps_tracking_logs
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326)
  GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)
  ) STORED;
CREATE INDEX IF NOT EXISTS idx_gps_tracking_logs_location ON gps_tracking_logs USING GIST (location);
