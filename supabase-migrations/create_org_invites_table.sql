-- Create org_invites table for shareable organization invite codes
CREATE TABLE IF NOT EXISTS public.org_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'employee'::text,
  created_by uuid,
  max_uses integer,
  use_count integer DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active boolean DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT org_invites_pkey PRIMARY KEY (id),
  CONSTRAINT org_invites_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT org_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT org_invites_role_check CHECK (
    (role = ANY (ARRAY['owner'::text, 'manager'::text, 'employee'::text]))
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_org_invites_organization_id ON public.org_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_invite_code ON public.org_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_org_invites_is_active ON public.org_invites(is_active);
