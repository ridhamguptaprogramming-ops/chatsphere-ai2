import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, Check, User, AtSign, MessageSquare, Info } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../common/Avatar';
import { storageService } from '../../services/storageService';
import { useToastStore } from '../../stores/toastStore';

interface ProfileViewProps {
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [statusText, setStatusText] = useState(user?.status_text || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await storageService.uploadFile(file, 'avatars');
      setAvatarUrl(result.url);
      addToast({ type: 'success', title: 'Avatar updated', message: 'Photo ready to save.' });
    } catch (err) {
      console.error('Avatar upload error:', err);
      addToast({ type: 'error', title: 'Upload failed', message: 'Could not upload avatar.' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      addToast({ type: 'error', title: 'Validation error', message: 'Name and username are required.' });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        status_text: statusText.trim(),
        avatar_url: avatarUrl,
      });

      addToast({ type: 'success', title: 'Profile Updated', message: 'Your changes have been saved.' });
      onBack();
    } catch (err) {
      console.error('Error updating profile:', err);
      addToast({ type: 'error', title: 'Error', message: 'Could not save profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B0B] text-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-[#0B0B0B] border-b border-[#262626] sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-base text-white">Edit Profile</h2>
      </div>

      <form onSubmit={handleSave} className="p-6 max-w-lg mx-auto w-full space-y-6">
        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar src={avatarUrl} name={fullName || 'User'} size="xl" />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-[#FF7A00] font-bold mt-2">Click to change avatar</p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1A1A1A] text-sm text-white placeholder-neutral-500 rounded-xl border border-transparent focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Username</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1A1A1A] text-sm text-white placeholder-neutral-500 rounded-xl border border-transparent focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Bio</span>
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a bit about yourself"
              className="w-full px-4 py-2.5 bg-[#1A1A1A] text-sm text-white placeholder-neutral-500 rounded-xl border border-transparent focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Status Text</span>
            </label>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="e.g. Available, At work, In a meeting"
              className="w-full px-4 py-2.5 bg-[#1A1A1A] text-sm text-white placeholder-neutral-500 rounded-xl border border-transparent focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 bg-[#FF7A00] hover:bg-[#e66e00] disabled:opacity-50 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF7A00]/25"
        >
          <Check className="w-4 h-4 text-black" />
          <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </form>
    </div>
  );
};
