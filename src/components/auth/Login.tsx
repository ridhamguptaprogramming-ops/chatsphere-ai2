import React, { useState } from 'react';
import { MessageSquare, ShieldCheck, Zap, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';

export const Login: React.FC = () => {
  const { signInWithGoogle, signInDemoUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      addToast({
        type: 'error',
        title: 'Authentication Error',
        message: err.message || 'Could not initiate Google sign in.',
      });
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoggingIn(true);
    await signInDemoUser();
    addToast({
      type: 'success',
      title: 'Welcome to ChatFlow Demo',
      message: 'Logged in as Ridham Gupta.',
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col justify-between p-6 relative overflow-hidden select-none">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF7A00]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Brand */}
      <div className="flex items-center gap-3 z-10 max-w-6xl mx-auto w-full pt-4">
        <div className="w-10 h-10 rounded-2xl bg-[#FF7A00] flex items-center justify-center shadow-lg shadow-[#FF7A00]/20 text-black font-bold">
          <MessageSquare className="w-6 h-6 fill-black text-black" />
        </div>
        <span className="font-bold text-xl tracking-tight text-white">
          Chat<span className="text-[#FF7A00]">Flow</span>
        </span>
      </div>

      {/* Center Hero Box */}
      <div className="max-w-md w-full mx-auto my-auto z-10 py-12 text-center">
        <div className="mb-6 inline-flex p-4 rounded-3xl bg-[#151515] border border-[#262626] shadow-2xl text-[#FF7A00]">
          <MessageSquare className="w-12 h-12" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Connect. Chat. Share.
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-8">
          Simple, fast and secure messaging for everyone. Real-time conversations, media sharing, and group chats.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-98 disabled:opacity-50"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={handleDemoLogin}
            disabled={isLoggingIn}
            className="w-full py-3.5 px-4 bg-[#FF7A00] hover:bg-[#e66e00] text-black font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF7A00]/20 active:scale-98"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>Launch Instant Demo</span>
          </button>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 mt-10 pt-6 border-t border-[#262626] text-xs text-neutral-400">
          <div className="flex flex-col items-center gap-1">
            <Lock className="w-4 h-4 text-[#FF7A00]" />
            <span>End-to-End Auth</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap className="w-4 h-4 text-[#FF7A00]" />
            <span>Realtime Sync</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#FF7A00]" />
            <span>PostgreSQL RLS</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-neutral-500 z-10 pb-2">
        ChatFlow &copy; {new Date().getFullYear()} &bull; Built with React, Supabase & Tailwind CSS
      </div>
    </div>
  );
};
