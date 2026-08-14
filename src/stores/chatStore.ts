import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { chatService } from '../services/chatService';
import { Conversation, Message, Profile, TypingIndicator } from '../types/chat';
import { useAuthStore } from './authStore';

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: TypingIndicator[];
  searchQuery: string;
  activeTab: 'all' | 'unread' | 'archived' | 'groups';

  // Modals & Drawers
  isNewChatModalOpen: boolean;
  isNewGroupModalOpen: boolean;
  isSupabaseConfigModalOpen: boolean;
  isInfoDrawerOpen: boolean;
  activeImageViewerUrl: string | null;

  // Active message actions
  replyingToMessage: Message | null;
  editingMessage: Message | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: 'all' | 'unread' | 'archived' | 'groups') => void;
  openNewChatModal: (open: boolean) => void;
  openNewGroupModal: (open: boolean) => void;
  openSupabaseConfigModal: (open: boolean) => void;
  openInfoDrawer: (open: boolean) => void;
  openImageViewer: (url: string | null) => void;

  setReplyingToMessage: (msg: Message | null) => void;
  setEditingMessage: (msg: Message | null) => void;

  fetchConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (
    content: string,
    messageType?: 'text' | 'image' | 'file' | 'audio',
    attachmentUrl?: string,
    attachmentName?: string,
    attachmentSize?: number
  ) => Promise<void>;

  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, reaction: string) => Promise<void>;

  togglePinConversation: (conversationId: string) => Promise<void>;
  toggleArchiveConversation: (conversationId: string) => Promise<void>;
  toggleMuteConversation: (conversationId: string) => Promise<void>;

  sendTypingSignal: (isTyping: boolean) => void;
  subscribeToRealtime: (conversationId: string) => () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  activeConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  typingUsers: [],
  searchQuery: '',
  activeTab: 'all',

  isNewChatModalOpen: false,
  isNewGroupModalOpen: false,
  isSupabaseConfigModalOpen: false,
  isInfoDrawerOpen: false,
  activeImageViewerUrl: null,

  replyingToMessage: null,
  editingMessage: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  openNewChatModal: (open) => set({ isNewChatModalOpen: open }),
  openNewGroupModal: (open) => set({ isNewGroupModalOpen: open }),
  openSupabaseConfigModal: (open) => set({ isSupabaseConfigModalOpen: open }),
  openInfoDrawer: (open) => set({ isInfoDrawerOpen: open }),
  openImageViewer: (url) => set({ activeImageViewerUrl: url }),

  setReplyingToMessage: (msg) => set({ replyingToMessage: msg }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),

  fetchConversations: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isLoadingConversations: true });
    try {
      const convs = await chatService.getConversations(user.id);
      set({ conversations: convs, isLoadingConversations: false });

      // If active conversation exists, update its reference
      const activeId = get().activeConversationId;
      if (activeId) {
        const active = convs.find((c) => c.id === activeId) || null;
        set({ activeConversation: active });
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      set({ isLoadingConversations: false });
    }
  },

  selectConversation: async (conversationId: string) => {
    set({
      activeConversationId: conversationId,
      isLoadingMessages: true,
      replyingToMessage: null,
      editingMessage: null,
    });

    const convs = get().conversations;
    const active = convs.find((c) => c.id === conversationId) || null;
    set({ activeConversation: active });

    try {
      const msgs = await chatService.getMessages(conversationId);
      set({ messages: msgs, isLoadingMessages: false });

      // Clear unread count locally for active conversation
      set({
        conversations: convs.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
      });
    } catch (err) {
      console.error('Error loading messages:', err);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (content, messageType = 'text', attachmentUrl, attachmentName, attachmentSize) => {
    const { activeConversationId, replyingToMessage } = get();
    const user = useAuthStore.getState().user;
    if (!activeConversationId || !user) return;

    const replyId = replyingToMessage?.id;

    try {
      const newMsg = await chatService.sendMessage(
        activeConversationId,
        user,
        content,
        messageType,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        replyId
      );

      set((state) => ({
        messages: [...state.messages, newMsg],
        replyingToMessage: null,
      }));

      // Refresh conversation list to show latest message preview
      await get().fetchConversations();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  },

  editMessage: async (messageId, newContent) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    try {
      await chatService.editMessage(messageId, activeConversationId, newContent);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId
            ? { ...m, content: newContent, is_edited: true, edited_at: new Date().toISOString() }
            : m
        ),
        editingMessage: null,
      }));
    } catch (err) {
      console.error('Error editing message:', err);
    }
  },

  deleteMessage: async (messageId) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    try {
      await chatService.deleteMessage(messageId, activeConversationId);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m
        ),
      }));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  },

  toggleReaction: async (messageId, reaction) => {
    const { activeConversationId } = get();
    const user = useAuthStore.getState().user;
    if (!activeConversationId || !user) return;

    try {
      await chatService.toggleReaction(messageId, activeConversationId, user, reaction);
      const updatedMsgs = await chatService.getMessages(activeConversationId);
      set({ messages: updatedMsgs });
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  },

  togglePinConversation: async (conversationId) => {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    await chatService.togglePinConversation(conversationId, !!conv.is_pinned);
    await get().fetchConversations();
  },

  toggleArchiveConversation: async (conversationId) => {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    await chatService.toggleArchiveConversation(conversationId, !!conv.is_archived);
    await get().fetchConversations();
  },

  toggleMuteConversation: async (conversationId) => {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    await chatService.toggleMuteConversation(conversationId, !!conv.is_muted);
    await get().fetchConversations();
  },

  sendTypingSignal: (isTyping) => {
    const { activeConversationId } = get();
    const user = useAuthStore.getState().user;
    if (!activeConversationId || !user || !isSupabaseConfigured()) return;

    const channel = supabase.channel(`typing_${activeConversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { conversation_id: activeConversationId, user, is_typing: isTyping },
    });
  },

  subscribeToRealtime: (conversationId) => {
    if (!isSupabaseConfigured()) return () => {};

    const channel = supabase
      .channel(`chat_room_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Fetch complete sender object
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single();

          const fullMsg: Message = { ...newMsg, sender: sender || undefined, reactions: [] };

          set((state) => {
            if (state.messages.some((m) => m.id === fullMsg.id)) return state;
            return { messages: [...state.messages, fullMsg] };
          });

          get().fetchConversations();
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user, is_typing } = payload.payload;
        if (!user || user.id === useAuthStore.getState().user?.id) return;

        set((state) => {
          const filtered = state.typingUsers.filter((t) => t.user_id !== user.id);
          if (!is_typing) return { typingUsers: filtered };
          return {
            typingUsers: [
              ...filtered,
              {
                conversation_id: conversationId,
                user_id: user.id,
                is_typing: true,
                updated_at: new Date().toISOString(),
                user,
              },
            ],
          };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
