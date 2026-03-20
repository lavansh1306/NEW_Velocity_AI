-- Update RPC to allow same-organization soft deletes regardless of rigid role checks
CREATE OR REPLACE FUNCTION public.soft_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS internally
SET search_path = public
AS $$
DECLARE
    caller_role text;
    caller_org uuid;
    target_org uuid;
BEGIN
    -- 1. Get calling user context
    SELECT role, organization_id INTO caller_role, caller_org 
    FROM users WHERE id = auth.uid();
    
    -- 2. Check if Caller EXISTS
    IF caller_org IS NULL THEN
        RAISE EXCEPTION 'Access denied: Caller not found or belongs to no organization';
    END IF;

    -- 3. Get target organization
    SELECT organization_id INTO target_org 
    FROM users WHERE id = target_user_id;

    -- 4. Verify same organization
    IF target_org IS NULL OR target_org != caller_org THEN
        RAISE EXCEPTION 'Access denied: Target user does not belong to your organization';
    END IF;

    -- 5. Perform the update
    UPDATE users 
    SET is_active = false 
    WHERE id = target_user_id;

END;
$$;
