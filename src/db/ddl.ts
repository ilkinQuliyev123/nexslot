// Mirrors schema.ts; executed once when the embedded Postgres (PGlite) starts.
export const ddl = `
CREATE TABLE organizations (
  id serial PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE, tagline text NOT NULL DEFAULT '',
  timezone text NOT NULL, currency text NOT NULL DEFAULT 'USD', logo_url text, plan_tier text NOT NULL DEFAULT 'pro'
);
CREATE TABLE users (
  id serial PRIMARY KEY, org_id integer NOT NULL REFERENCES organizations(id), email text NOT NULL, full_name text NOT NULL,
  role text NOT NULL, avatar_url text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (org_id, email)
);
CREATE TABLE services (
  id serial PRIMARY KEY, org_id integer NOT NULL REFERENCES organizations(id), title text NOT NULL, description text NOT NULL DEFAULT '',
  duration_min integer NOT NULL, price_cents integer NOT NULL, is_active integer NOT NULL DEFAULT 1
);
CREATE TABLE availability (
  id serial PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id), day_of_week integer NOT NULL, start_time text NOT NULL,
  end_time text NOT NULL, buffer_min integer NOT NULL DEFAULT 0, break_start text, break_end text
);
CREATE TABLE bookings (
  id serial PRIMARY KEY, org_id integer NOT NULL REFERENCES organizations(id), service_id integer NOT NULL REFERENCES services(id),
  staff_id integer NOT NULL REFERENCES users(id), client_name text NOT NULL, client_email text NOT NULL,
  start_at timestamptz NOT NULL, end_at timestamptz NOT NULL, status text NOT NULL, price_cents integer NOT NULL,
  stripe_session_id text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bookings_org_start ON bookings (org_id, start_at);
CREATE TABLE holds (
  id text PRIMARY KEY, org_id integer NOT NULL REFERENCES organizations(id), service_id integer NOT NULL REFERENCES services(id),
  staff_id integer NOT NULL REFERENCES users(id), start_at timestamptz NOT NULL, end_at timestamptz NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE client_notes (
  id serial PRIMARY KEY, org_id integer NOT NULL REFERENCES organizations(id), client_email text NOT NULL, note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
`
