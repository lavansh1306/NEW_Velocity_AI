-- ─── project_plans: add auto-save tracking columns ────────────────────────────
ALTER TABLE project_plans
  ADD COLUMN IF NOT EXISTS last_edited_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS auto_saved      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS published       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at    TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS published_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- ─── plan_tasks: add ordering ─────────────────────────────────────────────────
ALTER TABLE plan_tasks
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- ─── index for quick draft lookups ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_project_plans_status_user
  ON project_plans(organization_id, created_by, status, last_edited_at DESC);

-- ─── RLS policies for project_plans (if not already set) ─────────────────────
-- Allow authenticated users to CRUD their own plans within their org
DO $$
BEGIN
  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_plans' AND policyname = 'project_plans_insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY project_plans_insert ON project_plans
        FOR INSERT TO authenticated
        WITH CHECK (organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        ));
    $p$;
  END IF;

  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_plans' AND policyname = 'project_plans_select'
  ) THEN
    EXECUTE $p$
      CREATE POLICY project_plans_select ON project_plans
        FOR SELECT TO authenticated
        USING (organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        ));
    $p$;
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_plans' AND policyname = 'project_plans_update'
  ) THEN
    EXECUTE $p$
      CREATE POLICY project_plans_update ON project_plans
        FOR UPDATE TO authenticated
        USING (created_by = auth.uid())
        WITH CHECK (created_by = auth.uid());
    $p$;
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_plans' AND policyname = 'project_plans_delete'
  ) THEN
    EXECUTE $p$
      CREATE POLICY project_plans_delete ON project_plans
        FOR DELETE TO authenticated
        USING (created_by = auth.uid());
    $p$;
  END IF;
END $$;

-- ─── RLS policies for plan_tasks ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'plan_tasks' AND policyname = 'plan_tasks_insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY plan_tasks_insert ON plan_tasks
        FOR INSERT TO authenticated
        WITH CHECK (plan_id IN (
          SELECT id FROM project_plans WHERE created_by = auth.uid()
        ));
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'plan_tasks' AND policyname = 'plan_tasks_select'
  ) THEN
    EXECUTE $p$
      CREATE POLICY plan_tasks_select ON plan_tasks
        FOR SELECT TO authenticated
        USING (plan_id IN (
          SELECT id FROM project_plans WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
          )
        ));
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'plan_tasks' AND policyname = 'plan_tasks_update'
  ) THEN
    EXECUTE $p$
      CREATE POLICY plan_tasks_update ON plan_tasks
        FOR UPDATE TO authenticated
        USING (plan_id IN (
          SELECT id FROM project_plans WHERE created_by = auth.uid()
        ));
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'plan_tasks' AND policyname = 'plan_tasks_delete'
  ) THEN
    EXECUTE $p$
      CREATE POLICY plan_tasks_delete ON plan_tasks
        FOR DELETE TO authenticated
        USING (plan_id IN (
          SELECT id FROM project_plans WHERE created_by = auth.uid()
        ));
    $p$;
  END IF;
END $$;

-- Enable RLS on the tables if not already enabled
ALTER TABLE project_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_tasks ENABLE ROW LEVEL SECURITY;
