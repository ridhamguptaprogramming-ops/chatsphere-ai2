import React from 'react';
import { X, VolumeX, Pin, Archive, Users, Shield, Image as ImageIcon } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { Avatar } from '../common/Avatar';

export const ConversationInfoDrawer: React.FC = () => {
  const {
    activeConversation,
    isInfoDrawerOpen,
    openInfoDrawer,
    messages,
    toggleMuteConversation,
    togglePinConversation,
    toggleArchiveConversation,
  } = useChatStore();

  if (!isInfoDrawerOpen || !activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const name = isGroup
    ? activeConversation.name || 'Group Chat'
    : activeConversation.other_user?.full_name || 'User';
  const avatarUrl = isGroup ? activeConversation.avatar_url : activeConversation.other_user?.avatar_url;
  const isOnline = !isGroup ? activeConversation.other_user?.is_online : undefined;

  // Filter image attachments for shared media
  const sharedMedia = messages.filter((m) => m.message_type === 'image' && m.attachment_url);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 bg-[#0B0B0B] border-l border-[#262626] text-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#262626]">
        <h3 className="font-bold text-sm text-neutral-200">Contact Info</h3>
        <button
          onClick={() => openInfoDrawer(false)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1A1A1A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-4 bg-[#151515] rounded-2xl border border-[#262626]">
          <Avatar src={avatarUrl} name={name} isOnline={isOnline} size="xl" className="mb-3" />
          <h2 className="font-bold text-lg text-white leading-tight">{name}</h2>
          {!isGroup && activeConversation.other_user?.username && (
            <p className="text-xs text-[#FF7A00] font-medium mt-0.5">
              @{activeConversation.other_user.username}
            </p>
          )}

          {isGroup && activeConversation.description && (
            <p className="text-xs text-neutral-400 mt-2 px-2">{activeConversation.description}</p>
          )}

          {!isGroup && activeConversation.other_user?.bio && (
            <p className="text-xs text-neutral-300 mt-2 italic px-2">
              "{activeConversation.other_user.bio}"
            </p>
          )}
        </div>

        {/* Quick Settings Actions */}
        <div className="bg-[#151515] rounded-2xl border border-[#262626] divide-y divide-[#262626] text-xs">
          <button
            onClick={() => toggleMuteConversation(activeConversation.id)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-[#1A1A1A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <VolumeX className="w-4 h-4 text-[#FF7A00]" />
              <span>Mute Notifications</span>
            </div>
            <span className="text-neutral-400 font-medium">
              {activeConversation.is_muted ? 'Muted' : 'Off'}
            </span>
          </button>

          <button
            onClick={() => togglePinConversation(activeConversation.id)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-[#1A1A1A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Pin className="w-4 h-4 text-[#FF7A00]" />
              <span>Pin Conversation</span>
            </div>
            <span className="text-neutral-400 font-medium">
              {activeConversation.is_pinned ? 'Pinned' : 'Off'}
            </span>
          </button>

          <button
            onClick={() => toggleArchiveConversation(activeConversation.id)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-[#1A1A1A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Archive className="w-4 h-4 text-[#FF7A00]" />
              <span>Archive Chat</span>
            </div>
            <span className="text-neutral-400 font-medium">
              {activeConversation.is_archived ? 'Archived' : 'Active'}
            </span>
          </button>
        </div>

        {/* Group Members Section */}
        {isGroup && activeConversation.members && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Group Members ({activeConversation.members.length})</span>
              </h4>
            </div>

            <div className="bg-neutral-850 rounded-2xl border border-neutral-800 divide-y divide-neutral-800 overflow-hidden">
              {activeConversation.members.map((mem) => (
                <div key={mem.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={mem.profile?.avatar_url}
                      name={mem.profile?.full_name || 'User'}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {mem.profile?.full_name}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        @{mem.profile?.username}
                      </p>
                    </div>
                  </div>

                  {mem.role !== 'member' && (
                    <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>{mem.role.toUpperCase()}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Media Section */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 px-1 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Shared Media ({sharedMedia.length})</span>
          </h4>

          {sharedMedia.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {sharedMedia.map((m) => (
                <img
                  key={m.id}
                  src={m.attachment_url}
                  alt="Shared media"
                  className="w-full h-20 object-cover rounded-xl border border-neutral-800 hover:scale-105 transition-transform cursor-pointer"
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic p-3 bg-neutral-850 rounded-xl border border-neutral-800 text-center">
              No photos or media shared yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
