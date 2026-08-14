import React from 'react';
import { MessageSquarePlus, Users, Search, Settings, Archive, Database } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Avatar } from '../common/Avatar';
import { ConversationItem } from './ConversationItem';

interface ChatSidebarProps {
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onOpenProfile,
  onOpenSettings,
}) => {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    selectConversation,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    openNewChatModal,
    openNewGroupModal,
    openSupabaseConfigModal,
    isLoadingConversations,
  } = useChatStore();

  const isConnectedToSupabase = isSupabaseConfigured();

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Tab filter
    if (activeTab === 'unread' && (!c.unread_count || c.unread_count === 0)) return false;
    if (activeTab === 'archived' && !c.is_archived) return false;
    if (activeTab !== 'archived' && c.is_archived) return false;
    if (activeTab === 'groups' && c.type !== 'group') return false;

    // Search query filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = c.type === 'group' ? c.name : c.other_user?.full_name;
    const username = c.other_user?.username;

    return (
      name?.toLowerCase().includes(query) ||
      username?.toLowerCase().includes(query) ||
      c.last_message?.content.toLowerCase().includes(query)
    );
  });

  // Sort pinned first, then by date
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;

    const timeA = new Date(a.last_message?.created_at || a.updated_at).getTime();
    const timeB = new Date(b.last_message?.created_at || b.updated_at).getTime();
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col h-full bg-[#0B0B0B] border-r border-[#262626] text-neutral-100">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onOpenProfile}>
          <Avatar
            src={user?.avatar_url}
            name={user?.full_name || 'User'}
            isOnline={user?.is_online}
            size="md"
          />
          <div>
            <h3 className="font-bold text-base text-white leading-tight tracking-tight">{user?.full_name}</h3>
            <p className="text-xs text-[#FF7A00] font-medium">@{user?.username || 'user'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Supabase Status Pill */}
          <button
            onClick={() => openSupabaseConfigModal(true)}
            title={isConnectedToSupabase ? 'Connected to Supabase' : 'Click to configure Supabase'}
            className={`p-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors ${
              isConnectedToSupabase
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">
              {isConnectedToSupabase ? 'Supabase' : 'DB Setup'}
            </span>
          </button>

          <button
            onClick={() => openNewGroupModal(true)}
            title="New Group"
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-[#1A1A1A] transition-colors"
          >
            <Users className="w-5 h-5" />
          </button>

          <button
            onClick={() => openNewChatModal(true)}
            title="New Chat"
            className="p-2 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-black font-bold shadow-lg shadow-[#FF7A00]/20 transition-all hover:scale-105"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-[#1A1A1A] transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full pl-9 pr-4 py-2 bg-[#1A1A1A] text-sm text-gray-200 placeholder-neutral-500 rounded-xl border border-transparent focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#262626] text-xs overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: 'Unread' },
          { id: 'groups', label: 'Groups' },
          { id: 'archived', label: 'Archived', icon: Archive },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#FF7A00] text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-[#151515]'
            }`}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 no-scrollbar">
        {isLoadingConversations ? (
          // Skeleton loaders
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 mx-2 rounded-xl animate-pulse">
              <div className="w-12 h-12 bg-[#1A1A1A] rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#1A1A1A] rounded w-1/2" />
                <div className="h-3 bg-[#151515] rounded w-3/4" />
              </div>
            </div>
          ))
        ) : sortedConversations.length > 0 ? (
          sortedConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversationId === conv.id}
              onClick={() => selectConversation(conv.id)}
            />
          ))
        ) : (
          <div className="p-8 text-center text-neutral-500">
            <MessageSquarePlus className="w-10 h-10 mx-auto mb-2 text-neutral-600 opacity-60" />
            <p className="text-sm font-medium text-neutral-400">No conversations found</p>
            <p className="text-xs text-neutral-500 mt-1">
              {searchQuery
                ? 'Try searching for something else'
                : 'Click the Orange + button above to start a chat'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
