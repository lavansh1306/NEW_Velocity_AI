-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  email text NOT NULL,
  name text NULL,
  role text NULL DEFAULT 'employee'::text,
  capacity_hours_per_week integer NULL DEFAULT 40,
  is_active boolean NULL DEFAULT true,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_organization_id_email_key UNIQUE (organization_id, email),
  CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT users_role_check CHECK (
    (
      role = ANY (
        ARRAY['admin'::text, 'manager'::text, 'employee'::text]
      )
    )
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users USING btree (organization_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_org_email ON public.users USING btree (organization_id, email);
