import React from 'react';
import { ArrowLeft, Search, Info, Phone, Video } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { Avatar } from '../common/Avatar';

interface ChatHeaderProps {
  onBackMobile?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onBackMobile }) => {
  const { activeConversation, openInfoDrawer, typingUsers } = useChatStore();

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const title = isGroup
    ? activeConversation.name || 'Group Chat'
    : activeConversation.other_user?.full_name || 'User';
  const avatarUrl = isGroup ? activeConversation.avatar_url : activeConversation.other_user?.avatar_url;
  const isOnline = !isGroup ? activeConversation.other_user?.is_online : undefined;

  // Typing indicator text
  const currentTypingInConv = typingUsers.filter((t) => t.conversation_id === activeConversation.id);
  const typingText =
    currentTypingInConv.length > 0
      ? currentTypingInConv.length === 1
        ? `${currentTypingInConv[0].user?.full_name || 'Someone'} is typing...`
        : `${currentTypingInConv.map((t) => t.user?.full_name).join(', ')} are typing...`
      : null;

  const getSubStatus = () => {
    if (typingText) return <span className="text-[#FF7A00] animate-pulse font-medium">{typingText}</span>;
    if (isGroup) {
      const memberCount = activeConversation.members?.length || 2;
      return <span>{memberCount} members</span>;
    }
    if (isOnline) {
      return (
        <span className="text-green-500 flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
          online
        </span>
      );
    }
    if (activeConversation.other_user?.last_seen) {
      const date = new Date(activeConversation.other_user.last_seen);
      return <span>Last seen {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
    }
    return <span>offline</span>;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 h-[72px] bg-[#0B0B0B] border-b border-[#262626] text-white z-10 shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        {onBackMobile && (
          <button
            onClick={onBackMobile}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#1A1A1A] md:hidden transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div
          className="flex items-center gap-4 cursor-pointer min-w-0"
          onClick={() => openInfoDrawer(true)}
        >
          <Avatar src={avatarUrl} name={title} isOnline={isOnline} size="md" />
          <div className="min-w-0">
            <h2 className="font-bold text-lg truncate leading-tight text-white">{title}</h2>
            <p className="text-xs text-gray-400 truncate mt-0.5">{getSubStatus()}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 text-gray-400 shrink-0">
        <button
          title="Voice Call (Demo)"
          className="p-2 rounded-xl hover:text-white hover:bg-[#1A1A1A] transition-colors hidden sm:block"
        >
          <Phone className="w-5 h-5" />
        </button>

        <button
          title="Video Call (Demo)"
          className="p-2 rounded-xl hover:text-white hover:bg-[#1A1A1A] transition-colors hidden sm:block"
        >
          <Video className="w-5 h-5" />
        </button>

        <button
          title="Search in chat"
          className="p-2 rounded-xl hover:text-white hover:bg-[#1A1A1A] transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={() => openInfoDrawer(true)}
          title="Conversation Info"
          className="p-2 rounded-xl hover:text-white hover:bg-[#1A1A1A] transition-colors"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
