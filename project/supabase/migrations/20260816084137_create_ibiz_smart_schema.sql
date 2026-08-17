/*
# iBiz Smart 智企通 — Core schema

1. Overview
   Multi-user SaaS for Hong Kong business digital identity (CorpID) registration.
   Users sign in with email/password (Supabase Auth). Each user can belong to one or
   more organisations. Each organisation has a CorpID registration, documents, and
   team members. An activity log tracks recent actions for the dashboard.

2. New Tables
   - profiles              — extends auth.users with display name, phone, language
   - organisations         — a business entity (BR number, name, type)
   - organisation_members  — join table: user <-> organisation with role
   - registrations         — CorpID registration application (one per organisation)
   - documents             — uploaded files metadata for an organisation
   - activities            — recent activity log entries for the dashboard

3. Security
   - RLS enabled on every table.
   - Owner-scoped CRUD: users can only access rows in organisations they belong to.
   - profiles are self-service: a user reads/updates only their own profile.
   - organisation_members membership is checked via EXISTS subqueries for child tables.
   - All owner columns default to auth.uid() where the client inserts without a user_id.
*/

-- All tables created first (policies reference organisation_members)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text,
  name_zh text,
  br_number text,
  business_type text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organisation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, user_id)
);

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  reference_number text,
  id_type text,
  id_number text,
  role text,
  auth_declaration boolean NOT NULL DEFAULT false,
  terms_agreed boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text,
  storage_path text,
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  action text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- organisations policies
DROP POLICY IF EXISTS "select_orgs_as_member" ON organisations;
CREATE POLICY "select_orgs_as_member" ON organisations FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = organisations.id AND m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "insert_own_org" ON organisations;
CREATE POLICY "insert_own_org" ON organisations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_orgs_as_member" ON organisations;
CREATE POLICY "update_orgs_as_member" ON organisations FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = organisations.id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = organisations.id AND m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "delete_orgs_as_owner" ON organisations;
CREATE POLICY "delete_orgs_as_owner" ON organisations FOR DELETE
  TO authenticated USING (created_by = auth.uid());

-- organisation_members policies
DROP POLICY IF EXISTS "select_own_memberships" ON organisation_members;
CREATE POLICY "select_own_memberships" ON organisation_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organisation_members m2
      WHERE m2.organisation_id = organisation_members.organisation_id
        AND m2.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "insert_own_membership" ON organisation_members;
CREATE POLICY "insert_own_membership" ON organisation_members FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_membership" ON organisation_members;
CREATE POLICY "delete_own_membership" ON organisation_members FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- registrations policies
DROP POLICY IF EXISTS "select_own_registrations" ON registrations;
CREATE POLICY "select_own_registrations" ON registrations FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = registrations.organisation_id AND m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "insert_own_registrations" ON registrations;
CREATE POLICY "insert_own_registrations" ON registrations FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = registrations.organisation_id AND m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "update_own_registrations" ON registrations;
CREATE POLICY "update_own_registrations" ON registrations FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = registrations.organisation_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = registrations.organisation_id AND m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "delete_own_registrations" ON registrations;
CREATE POLICY "delete_own_registrations" ON registrations FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = registrations.organisation_id AND m.user_id = auth.uid()
  ));

-- documents policies
DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = documents.organisation_id AND m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = documents.organisation_id AND m.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organisation_members m
    WHERE m.organisation_id = documents.organisation_id AND m.user_id = auth.uid()
  ));

-- activities policies
DROP POLICY IF EXISTS "select_own_activities" ON activities;
CREATE POLICY "select_own_activities" ON activities FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_activities" ON activities;
CREATE POLICY "insert_own_activities" ON activities FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_activities" ON activities;
CREATE POLICY "delete_own_activities" ON activities FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organisation_members_org ON organisation_members(organisation_id);
CREATE INDEX IF NOT EXISTS idx_organisation_members_user ON organisation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_org ON registrations(organisation_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organisation_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);

-- updated_at trigger for registrations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registrations_updated_at ON registrations;
CREATE TRIGGER trg_registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
