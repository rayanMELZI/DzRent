-- Sprint 3 deliverable — multi-tenant Row-Level Security.
-- Application sets: SELECT set_config('app.current_agency_id', $1, true) per request.
ALTER TABLE vehicles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_staff      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contracts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY agency_vehicles_isolation ON vehicles
  USING (agency_id = current_setting('app.current_agency_id', true)::uuid);

CREATE ROLE dzrent_agency_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dzrent_agency_role;
CREATE ROLE dzrent_admin_role BYPASSRLS;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dzrent_admin_role;
