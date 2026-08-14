import React from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Shield,
  LogOut,
  Database,
  User,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { useToastStore } from '../../stores/toastStore';

interface SettingsViewProps {
  onBack: () => void;
  onOpenProfile: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onOpenProfile }) => {
  const { settings, updateSettings, signOut } = useAuthStore();
  const { openSupabaseConfigModal } = useChatStore();
  const { addToast } = useToastStore();

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    await updateSettings({ theme });
    addToast({ type: 'info', title: 'Theme Updated', message: `Theme set to ${theme}` });
  };

  const handleToggleNotifications = async () => {
    if (!settings) return;
    const updated = !settings.notifications_enabled;
    await updateSettings({ notifications_enabled: updated });
    addToast({
      type: 'info',
      title: 'Notifications',
      message: updated ? 'Notifications enabled' : 'Notifications muted',
    });
  };

  const handleToggleReadReceipts = async () => {
    if (!settings) return;
    const updated = !settings.read_receipts_enabled;
    await updateSettings({ read_receipts_enabled: updated });
    addToast({
      type: 'info',
      title: 'Read Receipts',
      message: updated ? 'Read receipts active' : 'Read receipts hidden',
    });
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
        <h2 className="font-bold text-base text-white">Settings</h2>
      </div>

      <div className="p-6 max-w-lg mx-auto w-full space-y-6">
        {/* Account Quick Card */}
        <div
          onClick={onOpenProfile}
          className="flex items-center justify-between p-4 bg-[#151515] rounded-2xl border border-[#262626] hover:border-[#FF7A00]/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FF7A00]/10 text-[#FF7A00]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Account & Profile</h4>
              <p className="text-xs text-neutral-400">Edit name, username, avatar and bio</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-neutral-400 rotate-180" />
        </div>

        {/* Appearance Settings */}
        <div className="bg-[#151515] rounded-2xl border border-[#262626] p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Appearance
          </h4>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'system', label: 'System', icon: Moon },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id as any)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  settings?.theme === t.id
                    ? 'bg-[#FF7A00] border-[#FF7A00] text-black shadow-md shadow-[#FF7A00]/20'
                    : 'bg-[#1A1A1A] border-transparent text-neutral-300 hover:bg-[#222222]'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy & Notifications */}
        <div className="bg-[#151515] rounded-2xl border border-[#262626] divide-y divide-[#262626] text-xs">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#FF7A00]" />
              <div>
                <p className="font-semibold text-white">Notifications</p>
                <p className="text-[11px] text-neutral-400">Show desktop alerts & sound</p>
              </div>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings?.notifications_enabled ? 'bg-[#FF7A00]' : 'bg-[#262626]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings?.notifications_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#FF7A00]" />
              <div>
                <p className="font-semibold text-white">Read Receipts</p>
                <p className="text-[11px] text-neutral-400">Send checkmarks when messages are seen</p>
              </div>
            </div>
            <button
              onClick={handleToggleReadReceipts}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings?.read_receipts_enabled ? 'bg-[#FF7A00]' : 'bg-[#262626]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings?.read_receipts_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Supabase Integration Button */}
        <div
          onClick={() => openSupabaseConfigModal(true)}
          className="flex items-center justify-between p-4 bg-[#151515] rounded-2xl border border-[#262626] hover:border-[#FF7A00]/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="font-semibold text-sm text-white">Supabase Setup</h4>
              <p className="text-xs text-neutral-400">View migration script & credentials</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-neutral-400 rotate-180" />
        </div>

        {/* Sign Out Button */}
        <button
          onClick={signOut}
          className="w-full py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors mt-6"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
