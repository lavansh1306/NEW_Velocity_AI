create table public.tasks (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  name text not null,
  description text null,
  estimated_hours numeric null,
  actual_hours numeric null,
  start_date date null,
  due_date date null,
  status text null default 'not_started'::text,
  created_at timestamp without time zone null default now(),
  jira_issue_id uuid null,
  assignee_id uuid null,
  constraint tasks_pkey primary key (id),
  constraint tasks_assignee_id_fkey foreign KEY (assignee_id) references users (id) on delete set null,
  constraint tasks_jira_issue_fkey foreign KEY (jira_issue_id) references jira_issues (id) on delete set null,
  constraint tasks_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint tasks_status_check check (
    (
      status = any (
        array[
          'not_started'::text,
          'in_progress'::text,
          'blocked'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tasks_project_id on public.tasks using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_tasks_assignee_id on public.tasks using btree (assignee_id) TABLESPACE pg_default;