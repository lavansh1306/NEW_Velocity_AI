-- Create an Upsert handler to avoid RLS 500 error recursion crashes during creation
CREATE OR REPLACE FUNCTION public.upsert_team_member(
  p_organization_id uuid,
  p_team_id uuid,
  p_email text,
  p_name text,
  p_role text DEFAULT 'member'
)
RETURNS uuid -- Returns the team_member_id
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS internally
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_team_member_id uuid;
BEGIN
  -- 1. Check if user already exists
  SELECT id INTO v_user_id FROM users 
  WHERE organization_id = p_organization_id AND email = p_email;

  -- 2. If exists, Soft-Revive
  IF v_user_id IS NOT NULL THEN
    UPDATE users 
    SET is_active = true, 
        name = COALESCE(p_name, name) 
    WHERE id = v_user_id;
  ELSE
    -- Insert new user
    INSERT INTO users (organization_id, email, name, role, capacity_hours_per_week, is_active)
    VALUES (p_organization_id, p_email, p_name, 'employee', 40, true)
    RETURNING id INTO v_user_id;
  END IF;

  -- 3. Check for existing team_members entry
  SELECT id INTO v_team_member_id FROM team_members 
  WHERE team_id = p_team_id AND user_id = v_user_id;

  -- 4. Sync team_members status
  IF v_team_member_id IS NOT NULL THEN
    UPDATE team_members 
    SET status = 'active', 
        display_name = COALESCE(p_name, display_name) 
    WHERE id = v_team_member_id;
  ELSE
    INSERT INTO team_members (team_id, user_id, role, email, display_name, status)
    VALUES (p_team_id, v_user_id, p_role, p_email, p_name, 'active')
    RETURNING id INTO v_team_member_id;
  END IF;

  RETURN v_team_member_id;
END;
$$;
