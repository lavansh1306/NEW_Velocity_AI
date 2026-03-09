-- Create organization_members table for multi-tenant org membership
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'employee'::text,
  email text,
  display_name text,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT organization_members_pkey PRIMARY KEY (id),
  CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT organization_members_org_user_key UNIQUE (organization_id, user_id),
  CONSTRAINT organization_members_role_check CHECK (
    (role = ANY (ARRAY['owner'::text, 'manager'::text, 'employee'::text]))
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
