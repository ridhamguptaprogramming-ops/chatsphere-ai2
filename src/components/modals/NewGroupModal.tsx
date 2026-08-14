import React, { useState, useEffect } from 'react';
import { Users, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { INITIAL_MOCK_PROFILES } from '../../data/mockData';
import { chatService } from '../../services/chatService';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { useToastStore } from '../../stores/toastStore';
import { Profile } from '../../types/chat';

export const NewGroupModal: React.FC = () => {
  const { isNewGroupModalOpen, openNewGroupModal, selectConversation, fetchConversations } =
    useChatStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setAvailableUsers(INITIAL_MOCK_PROFILES.filter((p) => p.id !== user.id));
    }
  }, [user]);

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      addToast({ type: 'error', title: 'Group name required', message: 'Please enter a group name.' });
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    try {
      const conv = await chatService.createGroupConversation(
        user.id,
        groupName.trim(),
        selectedUserIds,
        groupDescription.trim()
      );

      addToast({ type: 'success', title: 'Group Created', message: `${groupName} group created successfully!` });
      await fetchConversations();
      await selectConversation(conv.id);

      // Reset
      openNewGroupModal(false);
      setStep(1);
      setSelectedUserIds([]);
      setGroupName('');
      setGroupDescription('');
    } catch (err) {
      console.error('Error creating group:', err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to create group.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isNewGroupModalOpen}
      onClose={() => openNewGroupModal(false)}
      title={step === 1 ? 'New Group: Select Members' : 'New Group: Details'}
    >
      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-xs text-neutral-400">
            Select participants to add to your new group:
          </p>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
            {availableUsers.map((profile) => {
              const isSelected = selectedUserIds.includes(profile.id);
              return (
                <div
                  key={profile.id}
                  onClick={() => toggleUserSelection(profile.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors border ${
                    isSelected
                      ? 'bg-[#FF7A00]/10 border-[#FF7A00]/50'
                      : 'bg-[#1A1A1A] border-transparent hover:bg-[#222222]'
                  }`}
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

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                      isSelected
                        ? 'bg-[#FF7A00] border-[#FF7A00] text-black font-bold'
                        : 'border-neutral-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
            <span className="text-xs text-neutral-400">
              {selectedUserIds.length} members selected
            </span>
            <button
              disabled={selectedUserIds.length === 0}
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-[#FF7A00] hover:bg-[#e66e00] disabled:opacity-40 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Design Team 🎨"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-[#1A1A1A] text-sm text-white placeholder-neutral-500 rounded-xl border border-transparent focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Group Description (Optional)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#1A1A1A] text-sm text-white placeholder-neutral-500 rounded-xl border border-transparent focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
            <button
              onClick={() => setStep(1)}
              className="px-3 py-2 text-neutral-400 hover:text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              disabled={!groupName.trim() || isSubmitting}
              onClick={handleCreateGroup}
              className="px-5 py-2 bg-[#FF7A00] hover:bg-[#e66e00] disabled:opacity-40 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-[#FF7A00]/20"
            >
              <Users className="w-4 h-4 text-black" />
              <span>{isSubmitting ? 'Creating...' : 'Create Group'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
