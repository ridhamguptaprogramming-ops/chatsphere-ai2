-- Ensures OAuth users always have the application rows required after sign-in.
CREATE OR REPLACE FUNCTION public.ensure_current_profile()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
    auth_user auth.users%ROWTYPE;
    base_username TEXT;
    final_username TEXT;
BEGIN
    SELECT * INTO auth_user FROM auth.users WHERE id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    base_username := LOWER(REGEXP_REPLACE(COALESCE(SPLIT_PART(auth_user.email, '@', 1), 'user'), '[^a-z0-9_]', '_', 'g'));
    final_username := base_username || '_' || SUBSTRING(auth_user.id::text FROM 1 FOR 8);

    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
      auth_user.id,
      final_username,
      COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.raw_user_meta_data->>'name', base_username),
      COALESCE(auth_user.raw_user_meta_data->>'avatar_url', auth_user.raw_user_meta_data->>'picture', '')
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_settings (user_id) VALUES (auth_user.id) ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.user_presence (user_id, is_online, last_seen) VALUES (auth_user.id, true, NOW())
    ON CONFLICT (user_id) DO UPDATE SET is_online = true, last_seen = NOW(), updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_current_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_current_profile() TO authenticated;
