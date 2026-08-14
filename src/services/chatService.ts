import { INITIAL_MOCK_CONVERSATIONS, INITIAL_MOCK_MESSAGES, INITIAL_MOCK_PROFILES } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Conversation, Message, MessageReaction, Profile } from '../types/chat';

class ChatService {
  private getLocalConversations(): Conversation[] {
    const data = localStorage.getItem('chatflow_conversations');
    if (!data) {
      localStorage.setItem('chatflow_conversations', JSON.stringify(INITIAL_MOCK_CONVERSATIONS));
      return INITIAL_MOCK_CONVERSATIONS;
    }
    return JSON.parse(data);
  }

  private setLocalConversations(convs: Conversation[]) {
    localStorage.setItem('chatflow_conversations', JSON.stringify(convs));
  }

  private getLocalMessages(): Record<string, Message[]> {
    const data = localStorage.getItem('chatflow_messages');
    if (!data) {
      localStorage.setItem('chatflow_messages', JSON.stringify(INITIAL_MOCK_MESSAGES));
      return INITIAL_MOCK_MESSAGES;
    }
    return JSON.parse(data);
  }

  private setLocalMessages(msgs: Record<string, Message[]>) {
    localStorage.setItem('chatflow_messages', JSON.stringify(msgs));
  }

  // --- CONVERSATIONS ---
  async getConversations(userId: string): Promise<Conversation[]> {
    if (!isSupabaseConfigured()) {
      return this.getLocalConversations();
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_members!inner(*, profile:profiles(*)),
          messages(
            id, content, message_type, created_at, sender_id, attachment_url,
            sender:profiles(*)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Map Supabase response to client models
      return (data || []).map((c: any) => {
        const myMember = c.conversation_members.find((m: any) => m.user_id === userId);
        const otherMember = c.conversation_members.find((m: any) => m.user_id !== userId);
        const sortedMsgs = (c.messages || []).sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
          id: c.id,
          type: c.type,
          name: c.name,
          avatar_url: c.avatar_url,
          description: c.description,
          created_by: c.created_by,
          created_at: c.created_at,
          updated_at: c.updated_at,
          other_user: otherMember?.profile,
          last_message: sortedMsgs[0] || undefined,
          unread_count: 0,
          is_pinned: myMember?.is_pinned || false,
          is_archived: myMember?.is_archived || false,
          is_muted: myMember?.is_muted || false,
          members: c.conversation_members,
        };
      });
    } catch (err) {
      console.warn('Falling back to local conversations on query error:', err);
      return this.getLocalConversations();
    }
  }

  async searchProfiles(query: string, currentUserId: string): Promise<Profile[]> {
    if (!query.trim()) return [];

    if (!isSupabaseConfigured()) {
      return INITIAL_MOCK_PROFILES.filter(
        (p) =>
          p.id !== currentUserId &&
          (p.full_name.toLowerCase().includes(query.toLowerCase()) ||
            p.username.toLowerCase().includes(query.toLowerCase()))
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return (data || []) as Profile[];
  }

  async createOrGetDirectConversation(currentUserId: string, targetUser: Profile): Promise<Conversation> {
    if (!isSupabaseConfigured()) {
      const convs = this.getLocalConversations();
      let existing = convs.find((c) => c.type === 'direct' && c.other_user?.id === targetUser.id);

      if (existing) return existing;

      const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        type: 'direct',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        other_user: targetUser,
        unread_count: 0,
        is_pinned: false,
        is_archived: false,
        is_muted: false,
      };

      const updatedConvs = [newConv, ...convs];
      this.setLocalConversations(updatedConvs);
      return newConv;
    }

    // Call atomic Supabase stored function
    const { data: convId, error } = await supabase.rpc('create_direct_conversation', {
      target_user_id: targetUser.id,
    });

    if (error) throw error;

    const convs = await this.getConversations(currentUserId);
    return convs.find((c) => c.id === convId) || {
      id: convId,
      type: 'direct',
      other_user: targetUser,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async createGroupConversation(
    currentUserId: string,
    name: string,
    memberUserIds: string[],
    description?: string,
    avatarUrl?: string
  ): Promise<Conversation> {
    if (!isSupabaseConfigured()) {
      const convs = this.getLocalConversations();
      const groupMembers: Profile[] = INITIAL_MOCK_PROFILES.filter((p) => memberUserIds.includes(p.id));

      const newGroup: Conversation = {
        id: `conv_grp_${Date.now()}`,
        type: 'group',
        name,
        description,
        avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        created_by: currentUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_count: 0,
        is_pinned: false,
        is_archived: false,
        is_muted: false,
        members: [currentUserId, ...memberUserIds].map((uid) => ({
          id: `cm_${uid}_${Date.now()}`,
          conversation_id: `conv_grp_${Date.now()}`,
          user_id: uid,
          role: uid === currentUserId ? 'owner' : 'member',
          joined_at: new Date().toISOString(),
          last_read_at: new Date().toISOString(),
          is_muted: false,
          is_archived: false,
          profile: INITIAL_MOCK_PROFILES.find((p) => p.id === uid),
        })),
      };

      const updatedConvs = [newGroup, ...convs];
      this.setLocalConversations(updatedConvs);
      return newGroup;
    }

    // Insert conversation row
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({
        type: 'group',
        name,
        description,
        avatar_url: avatarUrl,
        created_by: currentUserId,
      })
      .select()
      .single();

    if (convErr) throw convErr;

    // Add members
    const membersToInsert = [
      { conversation_id: conv.id, user_id: currentUserId, role: 'owner' },
      ...memberUserIds.map((uid) => ({
        conversation_id: conv.id,
        user_id: uid,
        role: 'member',
      })),
    ];

    const { error: memErr } = await supabase.from('conversation_members').insert(membersToInsert);
    if (memErr) throw memErr;

    return conv as Conversation;
  }

  // --- MESSAGES ---
  async getMessages(conversationId: string): Promise<Message[]> {
    if (!isSupabaseConfigured()) {
      const allMsgs = this.getLocalMessages();
      return allMsgs[conversationId] || [];
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*),
        reactions:message_reactions(*, profile:profiles(*))
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as Message[];
  }

  async sendMessage(
    conversationId: string,
    sender: Profile,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'audio' = 'text',
    attachmentUrl?: string,
    attachmentName?: string,
    attachmentSize?: number,
    replyToMessageId?: string
  ): Promise<Message> {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversation_id: conversationId,
      sender_id: sender.id,
      content,
      message_type: messageType,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      attachment_size: attachmentSize,
      reply_to_message_id: replyToMessageId,
      is_edited: false,
      created_at: new Date().toISOString(),
      sender,
      reactions: [],
    };

    if (!isSupabaseConfigured()) {
      const allMsgs = this.getLocalMessages();
      const convMsgs = allMsgs[conversationId] || [];
      const updatedMsgs = [...convMsgs, newMessage];
      allMsgs[conversationId] = updatedMsgs;
      this.setLocalMessages(allMsgs);

      // Update last message in conversation list
      const convs = this.getLocalConversations();
      const updatedConvs = convs.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            last_message: newMessage,
            updated_at: newMessage.created_at,
          };
        }
        return c;
      });
      this.setLocalConversations(updatedConvs);

      return newMessage;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: sender.id,
        content,
        message_type: messageType,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_size: attachmentSize,
        reply_to_message_id: replyToMessageId,
      })
      .select(`*, sender:profiles(*)`)
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data as Message;
  }

  async editMessage(messageId: string, conversationId: string, newContent: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const allMsgs = this.getLocalMessages();
      const msgs = allMsgs[conversationId] || [];
      const updated = msgs.map((m) =>
        m.id === messageId
          ? { ...m, content: newContent, is_edited: true, edited_at: new Date().toISOString() }
          : m
      );
      allMsgs[conversationId] = updated;
      this.setLocalMessages(allMsgs);
      return;
    }

    const { error } = await supabase
      .from('messages')
      .update({
        content: newContent,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw error;
  }

  async deleteMessage(messageId: string, conversationId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const allMsgs = this.getLocalMessages();
      const msgs = allMsgs[conversationId] || [];
      const updated = msgs.map((m) =>
        m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m
      );
      allMsgs[conversationId] = updated;
      this.setLocalMessages(allMsgs);
      return;
    }

    const { error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  }

  async toggleReaction(
    messageId: string,
    conversationId: string,
    user: Profile,
    reaction: string
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      const allMsgs = this.getLocalMessages();
      const msgs = allMsgs[conversationId] || [];
      const updated = msgs.map((m) => {
        if (m.id === messageId) {
          const rxList = m.reactions || [];
          const existingIdx = rxList.findIndex((r) => r.user_id === user.id && r.reaction === reaction);

          let newRxList: MessageReaction[];
          if (existingIdx >= 0) {
            newRxList = rxList.filter((_, i) => i !== existingIdx);
          } else {
            newRxList = [
              ...rxList,
              {
                id: `rx_${Date.now()}`,
                message_id: messageId,
                user_id: user.id,
                reaction,
                created_at: new Date().toISOString(),
                profile: user,
              },
            ];
          }
          return { ...m, reactions: newRxList };
        }
        return m;
      });
      allMsgs[conversationId] = updated;
      this.setLocalMessages(allMsgs);
      return;
    }

    // Check if reaction exists in Supabase
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('reaction', reaction)
      .maybeSingle();

    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: user.id,
        reaction,
      });
    }
  }

  async togglePinConversation(conversationId: string, currentIsPinned: boolean): Promise<void> {
    if (!isSupabaseConfigured()) {
      const convs = this.getLocalConversations();
      this.setLocalConversations(
        convs.map((c) => (c.id === conversationId ? { ...c, is_pinned: !currentIsPinned } : c))
      );
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from('conversation_members')
      .update({ is_pinned: !currentIsPinned })
      .eq('conversation_id', conversationId)
      .eq('user_id', session.user.id);
  }

  async toggleArchiveConversation(conversationId: string, currentIsArchived: boolean): Promise<void> {
    if (!isSupabaseConfigured()) {
      const convs = this.getLocalConversations();
      this.setLocalConversations(
        convs.map((c) => (c.id === conversationId ? { ...c, is_archived: !currentIsArchived } : c))
      );
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from('conversation_members')
      .update({ is_archived: !currentIsArchived })
      .eq('conversation_id', conversationId)
      .eq('user_id', session.user.id);
  }

  async toggleMuteConversation(conversationId: string, currentIsMuted: boolean): Promise<void> {
    if (!isSupabaseConfigured()) {
      const convs = this.getLocalConversations();
      this.setLocalConversations(
        convs.map((c) => (c.id === conversationId ? { ...c, is_muted: !currentIsMuted } : c))
      );
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from('conversation_members')
      .update({ is_muted: !currentIsMuted })
      .eq('conversation_id', conversationId)
      .eq('user_id', session.user.id);
  }
}

export const chatService = new ChatService();
