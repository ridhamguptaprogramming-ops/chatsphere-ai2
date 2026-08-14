import React, { useState } from 'react';
import { Database, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useChatStore } from '../../stores/chatStore';
import { useToastStore } from '../../stores/toastStore';

export const SupabaseConfigModal: React.FC = () => {
  const { isSupabaseConfigModalOpen, openSupabaseConfigModal } = useChatStore();
  const { addToast } = useToastStore();
  const [copied, setCopied] = useState(false);

  const isConfigured = isSupabaseConfigured();

  const handleCopyEnvGuide = () => {
    const text = `# Add these to your .env.local file:
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast({
      type: 'success',
      title: 'Copied to clipboard',
      message: 'Environment template copied.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isSupabaseConfigModalOpen}
      onClose={() => openSupabaseConfigModal(false)}
      title="Supabase Database Configuration"
      maxWidth="lg"
    >
      <div className="space-y-5 text-sm">
        {/* Connection Status Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 ${
            isConfigured
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}
        >
          <Database className="w-6 h-6 shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white">
              {isConfigured ? 'Supabase Connected' : 'Running in Interactive Preview Mode'}
            </h4>
            <p className="text-xs opacity-80 mt-0.5">
              {isConfigured
                ? 'Your app is directly connected to your remote Supabase PostgreSQL database & Auth.'
                : 'All features (sending messages, media uploads, group chats, reactions, theme settings) work seamlessly in memory / local storage.'}
            </p>
          </div>
        </div>

        {/* Quick Steps Guide */}
        <div className="space-y-3 bg-[#1A1A1A] p-4 rounded-2xl border border-[#262626]">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF7A00]" />
            <span>Connecting your real Supabase Project</span>
          </h4>

          <ol className="list-decimal list-inside space-y-2 text-xs text-neutral-300">
            <li>
              Create a free project at{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF7A00] underline inline-flex items-center gap-0.5"
              >
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Run the SQL migration script included in <code className="bg-[#111111] px-1.5 py-0.5 rounded text-[#FF7A00]">supabase/migrations/00001_initial_schema.sql</code> inside Supabase SQL Editor.</li>
            <li>Enable Google OAuth in Supabase Authentication &gt; Providers.</li>
            <li>Copy your Project URL and Anon API key into your <code className="bg-[#111111] px-1.5 py-0.5 rounded text-[#FF7A00]">.env.local</code> variables.</li>
          </ol>
        </div>

        {/* Copy Env Guide Button */}
        <div className="flex justify-between items-center pt-2 border-t border-[#262626]">
          <span className="text-xs text-neutral-400">SQL Migration ready in workspace</span>
          <button
            onClick={handleCopyEnvGuide}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222222] text-white text-xs font-semibold rounded-xl flex items-center gap-2 border border-[#262626] transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Env Template'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
