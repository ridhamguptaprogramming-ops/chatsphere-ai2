-- Security and realtime hardening for ChatFlow.
-- Apply after 00001_initial_schema.sql.

CREATE TABLE IF NOT EXISTS public.typing_indicators (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_typing BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation
    ON public.typing_indicators (conversation_id, updated_at DESC);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view typing state" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can create their own typing state" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can update their own typing state" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can remove their own typing state" ON public.typing_indicators;
CREATE POLICY "Members can view typing state"
    ON public.typing_indicators FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = typing_indicators.conversation_id
          AND cm.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own typing state"
    ON public.typing_indicators FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = typing_indicators.conversation_id
          AND cm.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own typing state"
    ON public.typing_indicators FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own typing state"
    ON public.typing_indicators FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Do not let a browser client add arbitrary people to a conversation.
DROP POLICY IF EXISTS "Users can insert members or be added to conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can join only as themselves" ON public.conversation_members;
CREATE POLICY "Users can join only as themselves"
    ON public.conversation_members FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Preserve author and conversation identity when a message is edited.
DROP POLICY IF EXISTS "Users can update (edit/soft delete) their own messages" ON public.messages;
DROP POLICY IF EXISTS "Authors and group admins can update messages" ON public.messages;
CREATE POLICY "Authors and group admins can update messages"
    ON public.messages FOR UPDATE TO authenticated
    USING (
        sender_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = messages.conversation_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('owner', 'admin')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = messages.conversation_id
              AND cm.user_id = auth.uid()
        )
    );

-- Group creation is atomic so member insertion remains protected by RLS.
CREATE OR REPLACE FUNCTION public.create_group_conversation(
    group_name TEXT,
    member_ids UUID[],
    group_description TEXT DEFAULT NULL,
    group_avatar_url TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    new_conversation_id UUID;
    current_user_id UUID := auth.uid();
    target_id UUID;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF NULLIF(BTRIM(group_name), '') IS NULL THEN
        RAISE EXCEPTION 'A group name is required';
    END IF;

    INSERT INTO public.conversations (type, name, description, avatar_url, created_by)
    VALUES ('group', BTRIM(group_name), group_description, group_avatar_url, current_user_id)
    RETURNING id INTO new_conversation_id;

    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES (new_conversation_id, current_user_id, 'owner');

    FOREACH target_id IN ARRAY COALESCE(member_ids, ARRAY[]::UUID[]) LOOP
        IF target_id <> current_user_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = target_id) THEN
            INSERT INTO public.conversation_members (conversation_id, user_id, role)
            VALUES (new_conversation_id, target_id, 'member')
            ON CONFLICT (conversation_id, user_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN new_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_group_conversation(TEXT, UUID[], TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_group_conversation(TEXT, UUID[], TEXT, TEXT) TO authenticated;

-- Storage writes must be scoped to a folder named after the authenticated user.
DROP POLICY IF EXISTS "Auth Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Chat Media" ON storage.objects;
DROP POLICY IF EXISTS "Users upload avatars to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users upload chat media to their own folder" ON storage.objects;
CREATE POLICY "Users upload avatars to their own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users upload chat media to their own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('chat-media', 'documents') AND (storage.foldername(name))[1] = auth.uid()::text);
