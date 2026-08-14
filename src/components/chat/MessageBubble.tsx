import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  MoreHorizontal,
  Reply,
  Edit2,
  Trash2,
  Copy,
  Download,
  FileText,
  Smile,
} from 'lucide-react';
import { Message } from '../../types/chat';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { ReactionPicker } from './ReactionPicker';

interface MessageBubbleProps {
  message: Message;
  isGroup: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isGroup }) => {
  const { user } = useAuthStore();
  const {
    messages,
    setReplyingToMessage,
    setEditingMessage,
    deleteMessage,
    toggleReaction,
    openImageViewer,
  } = useChatStore();

  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const isMe = message.sender_id === user?.id;
  const isDeleted = !!message.deleted_at;

  // System Message
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 bg-neutral-800/80 text-neutral-400 text-xs rounded-full border border-neutral-700/50 shadow-sm text-center">
          {message.content}
        </span>
      </div>
    );
  }

  // Find replied-to message preview if applicable
  const replyMessage = message.reply_to_message_id
    ? messages.find((m) => m.id === message.reply_to_message_id)
    : null;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowActions(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`group relative flex flex-col my-1.5 ${
        isMe ? 'items-end' : 'items-start'
      }`}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      {/* Group Sender Name */}
      {!isMe && isGroup && message.sender && (
        <span className="text-[11px] font-semibold text-orange-400 ml-3 mb-0.5">
          {message.sender.full_name}
        </span>
      )}

      <div className="relative flex items-center max-w-[85%] sm:max-w-[70%]">
        {/* Action Button Trigger for Sent / Received */}
        <div
          className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mx-1 shrink-0 ${
            isMe ? 'order-first' : 'order-last'
          }`}
        >
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
            title="React"
          >
            <Smile className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
            title="Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Reaction Picker Popover */}
        {showReactionPicker && (
          <div
            className={`absolute z-30 -top-12 ${
              isMe ? 'right-0' : 'left-0'
            }`}
          >
            <ReactionPicker
              onSelectReaction={(emoji) => toggleReaction(message.id, emoji)}
              onClose={() => setShowReactionPicker(false)}
            />
          </div>
        )}

        {/* Options Menu Popover */}
        {showActions && (
          <div
            className={`absolute z-30 top-full mt-1 w-36 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1 text-xs text-neutral-200 ${
              isMe ? 'right-0' : 'left-0'
            }`}
          >
            <button
              onClick={() => {
                setReplyingToMessage(message);
                setShowActions(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center gap-2"
            >
              <Reply className="w-3.5 h-3.5 text-orange-400" />
              Reply
            </button>

            <button
              onClick={handleCopy}
              className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center gap-2"
            >
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
              Copy Text
            </button>

            {isMe && !isDeleted && message.message_type === 'text' && (
              <button
                onClick={() => {
                  setEditingMessage(message);
                  setShowActions(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                Edit
              </button>
            )}

            {isMe && !isDeleted && (
              <button
                onClick={() => {
                  deleteMessage(message.id);
                  setShowActions(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-rose-400 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        )}

        {/* Main Message Container */}
        <div
          className={`relative p-4 rounded-2xl shadow-xl text-[15px] leading-relaxed ${
            isMe
              ? 'bg-[#FF7A00] text-black font-medium rounded-tr-none'
              : 'bg-[#222222] text-gray-200 rounded-tl-none border border-[#2A2A2A]'
          }`}
        >
          {/* Reply Context Header */}
          {replyMessage && (
            <div
              className={`mb-2 p-2 rounded-xl text-xs border-l-4 ${
                isMe
                  ? 'bg-black/10 border-black text-black/80'
                  : 'bg-[#1A1A1A] border-[#FF7A00] text-gray-300'
              }`}
            >
              <p className={`font-bold truncate ${isMe ? 'text-black' : 'text-[#FF7A00]'}`}>
                {replyMessage.sender?.full_name || 'Original Message'}
              </p>
              <p className="truncate opacity-80 mt-0.5">{replyMessage.content}</p>
            </div>
          )}

          {/* Deleted Message State */}
          {isDeleted ? (
            <p className="italic opacity-60 text-xs">This message was deleted</p>
          ) : (
            <>
              {/* Image Attachment */}
              {message.message_type === 'image' && message.attachment_url && (
                <div className="mb-2 overflow-hidden rounded-xl cursor-pointer">
                  <img
                    src={message.attachment_url}
                    alt="Attachment"
                    onClick={() => openImageViewer(message.attachment_url || null)}
                    className="max-h-60 w-full object-cover rounded-xl hover:scale-102 transition-transform"
                  />
                </div>
              )}

              {/* Document File Attachment */}
              {message.message_type === 'file' && message.attachment_url && (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={message.attachment_name}
                  className={`flex items-center gap-3 p-2.5 mb-2 rounded-xl border transition-colors ${
                    isMe
                      ? 'bg-black/10 border-black/20 text-black hover:bg-black/20'
                      : 'bg-[#1A1A1A] border-[#333333] text-gray-200 hover:bg-[#262626]'
                  }`}
                >
                  <FileText className={`w-7 h-7 shrink-0 ${isMe ? 'text-black' : 'text-[#FF7A00]'}`} />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-xs truncate">{message.attachment_name || 'Document'}</p>
                    <p className="text-[10px] opacity-70">{formatFileSize(message.attachment_size)}</p>
                  </div>
                  <Download className="w-4 h-4 shrink-0 opacity-80" />
                </a>
              )}

              {/* Text Content */}
              {message.content && (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              )}
            </>
          )}

          {/* Timestamp, Edit badge & Read Status */}
          <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] opacity-75 float-right ml-3 uppercase font-medium">
            {message.is_edited && <span>(edited)</span>}
            <span className={isMe ? 'text-black/70' : 'text-gray-500'}>
              {formatTime(message.created_at)}
            </span>
            {isMe && (
              <span className="shrink-0 text-black">
                {message.is_read ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reactions Bar */}
      {message.reactions && message.reactions.length > 0 && (
        <div
          className={`flex flex-wrap gap-1 mt-1 ${
            isMe ? 'mr-1 justify-end' : 'ml-1 justify-start'
          }`}
        >
          {Object.entries(
            message.reactions.reduce((acc, r) => {
              acc[r.reaction] = (acc[r.reaction] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([emoji, count]) => {
            const numCount = Number(count);
            return (
              <button
                key={emoji}
                onClick={() => toggleReaction(message.id, emoji)}
                className="px-2 py-0.5 bg-neutral-800 border border-neutral-700/60 rounded-full text-xs flex items-center gap-1 text-neutral-200 hover:bg-neutral-750 transition-colors shadow-sm"
              >
                <span>{emoji}</span>
                {numCount > 1 && <span className="text-[10px] font-bold">{numCount}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
