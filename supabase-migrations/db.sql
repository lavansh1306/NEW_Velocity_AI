-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.email_intrests (
  id bigint NOT NULL,
  email text,
  source text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  CONSTRAINT email_intrests_pkey PRIMARY KEY (id)
);
CREATE TABLE public.employee_leave_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  leave_type_id uuid NOT NULL,
  year integer NOT NULL,
  total_allocated integer DEFAULT 0,
  used_days numeric DEFAULT 0,
  pending_days numeric DEFAULT 0,
  CONSTRAINT employee_leave_balances_pkey PRIMARY KEY (id),
  CONSTRAINT employee_leave_balances_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT employee_leave_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT employee_leave_balances_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id)
);
CREATE TABLE public.holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  date date NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT holidays_pkey PRIMARY KEY (id),
  CONSTRAINT holidays_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.jira_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  cloud_id text NOT NULL,
  site_url text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT jira_connections_pkey PRIMARY KEY (id),
  CONSTRAINT jira_connections_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.jira_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  jira_project_id uuid,
  issue_key text NOT NULL,
  summary text,
  description text,
  status text,
  priority text,
  assignee_email text,
  reporter_email text,
  original_estimate_seconds integer DEFAULT 0,
  time_spent_seconds integer DEFAULT 0,
  remaining_estimate_seconds integer DEFAULT 0,
  story_points numeric,
  due_date date,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT jira_issues_pkey PRIMARY KEY (id),
  CONSTRAINT jira_issues_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT jira_issues_jira_project_id_fkey FOREIGN KEY (jira_project_id) REFERENCES public.jira_projects(id)
);
CREATE TABLE public.jira_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  cloud_id text NOT NULL,
  project_key text NOT NULL,
  name text,
  description text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT jira_projects_pkey PRIMARY KEY (id),
  CONSTRAINT jira_projects_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.leave_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  leave_type_id uuid,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  reason text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT leave_requests_pkey PRIMARY KEY (id),
  CONSTRAINT leave_requests_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT leave_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id)
);
CREATE TABLE public.leave_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  annual_quota integer DEFAULT 20,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT leave_types_pkey PRIMARY KEY (id),
  CONSTRAINT leave_types_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  subscription_tier text DEFAULT 'free'::text CHECK (subscription_tier = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text])),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'deleted'::text])),
  work_hours_per_week integer DEFAULT 40,
  work_days_per_week integer DEFAULT 5,
  week_starts_on text DEFAULT 'monday'::text,
  fiscal_year_start text DEFAULT 'january'::text,
  target_utilization integer DEFAULT 85,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.plan_task_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  match_percentage numeric,
  justification text,
  is_selected boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT plan_task_matches_pkey PRIMARY KEY (id),
  CONSTRAINT plan_task_matches_plan_task_id_fkey FOREIGN KEY (plan_task_id) REFERENCES public.plan_tasks(id),
  CONSTRAINT plan_task_matches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.plan_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  task_name text NOT NULL,
  description text,
  estimated_hours numeric,
  required_skills jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT plan_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT plan_tasks_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.project_plans(id)
);
CREATE TABLE public.project_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT project_plans_pkey PRIMARY KEY (id),
  CONSTRAINT project_plans_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT project_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  team_id uuid,
  name text NOT NULL,
  description text,
  source text DEFAULT 'internal'::text CHECK (source = ANY (ARRAY['internal'::text, 'jira'::text])),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text])),
  start_date date,
  end_date date,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT projects_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.task_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  allocated_hours_per_week numeric NOT NULL,
  start_date date,
  end_date date,
  is_confirmed boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT task_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT task_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  estimated_hours numeric,
  actual_hours numeric,
  start_date date,
  due_date date,
  status text DEFAULT 'not_started'::text CHECK (status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'blocked'::text, 'completed'::text])),
  created_at timestamp without time zone DEFAULT now(),
  jira_issue_id uuid,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT tasks_jira_issue_fkey FOREIGN KEY (jira_issue_id) REFERENCES public.jira_issues(id)
);
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid,
  email text,
  display_name text,
  role text DEFAULT 'member'::text CHECK (role IN ('lead', 'member', 'Engineer', 'Designer', 'Product Manager', 'Engineering Manager', 'QA Engineer', 'Data Scientist', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer')),
  status text DEFAULT 'active'::text CHECK (status IN ('active', 'pending', 'invited')),
  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.timesheets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  task_id uuid,
  project_id uuid,
  work_date date NOT NULL,
  hours_logged numeric NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT timesheets_pkey PRIMARY KEY (id),
  CONSTRAINT timesheets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT timesheets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT timesheets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT timesheets_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id)
);
CREATE TABLE public.user_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_name text NOT NULL,
  proficiency_level text CHECK (proficiency_level = ANY (ARRAY['beginner'::text, 'mid'::text, 'advanced'::text])),
  experience_years numeric,
  source text CHECK (source = ANY (ARRAY['manual'::text, 'llm_inferred'::text, 'project_derived'::text])),
  confidence_score numeric,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_skills_pkey PRIMARY KEY (id),
  CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  email text NOT NULL,
  name text,
  role text DEFAULT 'employee'::text CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text, 'employee'::text])),
  capacity_hours_per_week integer DEFAULT 40,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);