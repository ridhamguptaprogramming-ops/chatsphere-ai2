import React, { useState } from 'react';
import { Pin, VolumeX, Archive, MoreVertical, Image as ImageIcon, FileText } from 'lucide-react';
import { Conversation } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { useChatStore } from '../../stores/chatStore';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const { togglePinConversation, toggleArchiveConversation, toggleMuteConversation } = useChatStore();

  const isGroup = conversation.type === 'group';
  const name = isGroup
    ? conversation.name || 'Unnamed Group'
    : conversation.other_user?.full_name || 'Unknown User';
  const avatarUrl = isGroup ? conversation.avatar_url : conversation.other_user?.avatar_url;
  const isOnline = !isGroup ? conversation.other_user?.is_online : undefined;

  const lastMsg = conversation.last_message;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderLastMessagePreview = () => {
    if (!lastMsg) return <span className="italic text-neutral-500">No messages yet</span>;

    if (lastMsg.deleted_at) {
      return <span className="italic text-neutral-500 text-xs">This message was deleted</span>;
    }

    if (lastMsg.message_type === 'image') {
      return (
        <span className="flex items-center gap-1 text-neutral-400">
          <ImageIcon className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span>Photo</span>
        </span>
      );
    }

    if (lastMsg.message_type === 'file') {
      return (
        <span className="flex items-center gap-1 text-neutral-400">
          <FileText className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span>{lastMsg.attachment_name || 'Document'}</span>
        </span>
      );
    }

    return <span className="truncate">{lastMsg.content}</span>;
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-colors ${
        isActive
          ? 'bg-[#151515] border-l-4 border-[#FF7A00] text-white'
          : 'text-neutral-300 hover:bg-[#111111]'
      }`}
    >
      <Avatar src={avatarUrl} name={name} isOnline={isOnline} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="text-sm font-semibold text-white truncate pr-2">{name}</h4>
          <span className="text-[10px] text-gray-500 uppercase font-medium shrink-0">
            {formatTime(lastMsg?.created_at || conversation.updated_at)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-400">
          <div className="truncate pr-2 text-gray-400">{renderLastMessagePreview()}</div>

          <div className="flex items-center gap-1.5 shrink-0">
            {conversation.is_muted && <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
            {conversation.is_pinned && <Pin className="w-3.5 h-3.5 text-[#FF7A00] fill-[#FF7A00]/20" />}

            {conversation.unread_count && conversation.unread_count > 0 ? (
              <span className="w-5 h-5 bg-[#FF7A00] text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {conversation.unread_count}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Hover menu button */}
      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-[#222222]"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-7 z-20 w-36 bg-[#1A1A1A] border border-[#262626] rounded-xl shadow-2xl py-1 text-xs"
          >
            <button
              onClick={() => {
                togglePinConversation(conversation.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#222222] text-neutral-200 flex items-center gap-2"
            >
              <Pin className="w-3.5 h-3.5 text-[#FF7A00]" />
              {conversation.is_pinned ? 'Unpin Chat' : 'Pin Chat'}
            </button>
            <button
              onClick={() => {
                toggleMuteConversation(conversation.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#222222] text-neutral-200 flex items-center gap-2"
            >
              <VolumeX className="w-3.5 h-3.5" />
              {conversation.is_muted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={() => {
                toggleArchiveConversation(conversation.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#222222] text-neutral-200 flex items-center gap-2"
            >
              <Archive className="w-3.5 h-3.5" />
              {conversation.is_archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
