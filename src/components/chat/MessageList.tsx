import React, { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { Message } from '../../types/chat';
import { useChatStore } from '../../stores/chatStore';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isGroup: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isGroup }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { typingUsers, activeConversationId } = useChatStore();

  const activeTyping = typingUsers.filter((t) => t.conversation_id === activeConversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTyping]);

  // Group messages by date string
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const isYesterday =
      date.getDate() === now.getDate() - 1 &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = formatDateHeader(msg.created_at);
    const existingGroup = groupedMessages.find((g) => g.date === dateKey);
    if (existingGroup) {
      existingGroup.msgs.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, msgs: [msg] });
    }
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#0E0E0E] no-scrollbar">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
          <div className="w-16 h-16 bg-[#151515] rounded-2xl flex items-center justify-center mb-3 text-[#FF7A00] border border-[#262626]">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h4 className="font-semibold text-neutral-300 text-sm">No messages yet</h4>
          <p className="text-xs text-neutral-500 mt-1">Send a message to start the conversation!</p>
        </div>
      ) : (
        groupedMessages.map((group) => (
          <div key={group.date} className="space-y-4">
            <div className="flex justify-center my-4">
              <span className="px-4 py-1.5 bg-[#1A1A1A] text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                {group.date}
              </span>
            </div>

            {group.msgs.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isGroup={isGroup} />
            ))}
          </div>
        ))
      )}

      {/* Typing Indicator Animated Dots */}
      {activeTyping.length > 0 && (
        <div className="flex items-center gap-2.5 my-2">
          <div className="flex gap-1.5 p-2 bg-[#1A1A1A] rounded-2xl">
            <span className="w-1.5 h-1.5 bg-[#FF7A00] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-[#FF7A00] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-[#FF7A00] rounded-full animate-bounce" />
          </div>
          <span className="text-xs italic text-gray-500 font-medium">
            {activeTyping.map((t) => t.user?.full_name).join(', ')} is typing...
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
