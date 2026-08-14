import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { chatService } from '../../services/chatService';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { Profile } from '../../types/chat';

export const NewChatModal: React.FC = () => {
  const { isNewChatModalOpen, openNewChatModal, selectConversation, fetchConversations } =
    useChatStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !user) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const profiles = await chatService.searchProfiles(query, user.id);
      setResults(profiles);
    } catch (err) {
      console.error('Error searching profiles:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartConversation = async (targetUser: Profile) => {
    if (!user) return;

    try {
      const conv = await chatService.createOrGetDirectConversation(user.id, targetUser);
      await fetchConversations();
      await selectConversation(conv.id);
      openNewChatModal(false);
      setSearchQuery('');
      setResults([]);
    } catch (err) {
      console.error('Error starting conversation:', err);
    }
  };

  return (
    <Modal
      isOpen={isNewChatModalOpen}
      onClose={() => openNewChatModal(false)}
      title="Start New Conversation"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search user by full name or username..."
            autoFocus
            className="w-full pl-9 pr-4 py-2.5 bg-[#1A1A1A] text-sm text-white placeholder-neutral-500 rounded-xl border border-transparent focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] outline-none transition-colors"
          />
        </div>

        {/* Results List */}
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1 no-scrollbar">
          {isSearching ? (
            <p className="text-xs text-neutral-400 text-center py-6 animate-pulse">Searching users...</p>
          ) : results.length > 0 ? (
            results.map((profile) => (
              <div
                key={profile.id}
                onClick={() => handleStartConversation(profile)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#222222] cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={profile.avatar_url}
                    name={profile.full_name}
                    isOnline={profile.is_online}
                    size="md"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{profile.full_name}</h4>
                    <p className="text-xs text-[#FF7A00] font-medium">@{profile.username}</p>
                  </div>
                </div>

                <button className="p-2 rounded-xl bg-[#FF7A00]/10 text-[#FF7A00] group-hover:bg-[#FF7A00] group-hover:text-black transition-all">
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : searchQuery ? (
            <p className="text-xs text-neutral-500 text-center py-6">No users found matching "{searchQuery}"</p>
          ) : (
            <div className="text-center py-6 text-neutral-500">
              <p className="text-xs">Type a username like <span className="text-[#FF7A00] font-bold">aman_v</span> or <span className="text-[#FF7A00] font-bold">sarah_m</span> to search</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
