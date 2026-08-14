import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageComposer } from '../components/chat/MessageComposer';
import { ConversationInfoDrawer } from '../components/chat/ConversationInfoDrawer';
import { NewChatModal } from '../components/modals/NewChatModal';
import { NewGroupModal } from '../components/modals/NewGroupModal';
import { SupabaseConfigModal } from '../components/modals/SupabaseConfigModal';
import { ImageViewer } from '../components/chat/ImageViewer';

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activeConversation,
    activeConversationId,
    messages,
    isLoadingMessages,
    fetchConversations,
    subscribeToRealtime,
    openNewChatModal,
  } = useChatStore();

  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (activeConversationId) {
      setMobileView('chat');
      const unsubscribe = subscribeToRealtime(activeConversationId);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      setMobileView('sidebar');
    }
  }, [activeConversationId]);

  return (
    <div className="flex h-screen w-screen bg-[#0B0B0B] text-white overflow-hidden">
      {/* Left Sidebar */}
      <div
        className={`w-full md:w-[380px] lg:w-[420px] shrink-0 h-full ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        } flex-col border-r border-[#262626]`}
      >
        <ChatSidebar
          onOpenProfile={() => navigate('/profile')}
          onOpenSettings={() => navigate('/settings')}
        />
      </div>

      {/* Main Chat Panel */}
      <div
        className={`flex-1 h-full flex flex-col bg-[#0E0E0E] ${
          mobileView === 'sidebar' ? 'hidden md:flex' : 'flex'
        } relative min-w-0`}
      >
        {activeConversation ? (
          <>
            <ChatHeader onBackMobile={() => setMobileView('sidebar')} />

            {isLoadingMessages ? (
              <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm bg-[#0E0E0E]">
                <div className="animate-spin w-6 h-6 border-2 border-[#FF7A00] border-t-transparent rounded-full mr-3" />
                <span>Loading messages...</span>
              </div>
            ) : (
              <MessageList
                messages={messages}
                isGroup={activeConversation.type === 'group'}
              />
            )}

            <MessageComposer />
            <ConversationInfoDrawer />
          </>
        ) : (
          /* Empty Active Chat Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0E0E0E] text-neutral-500">
            <div className="w-20 h-20 bg-[#151515] rounded-3xl flex items-center justify-center mb-4 text-[#FF7A00] border border-[#262626] shadow-xl">
              <MessageSquarePlus className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-xl text-white mb-1">Select a conversation</h3>
            <p className="text-sm text-neutral-400 max-w-sm">
              Choose a contact from the sidebar or click the Orange + button to start a new chat.
            </p>
            <button
              onClick={() => openNewChatModal(true)}
              className="mt-6 px-6 py-3 bg-[#FF7A00] hover:bg-[#e66e00] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#FF7A00]/20 transition-all hover:scale-105"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* Global Modals & Lightboxes */}
      <NewChatModal />
      <NewGroupModal />
      <SupabaseConfigModal />
      <ImageViewer />
    </div>
  );
};
