import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const providerError = params.get('error_description') || params.get('error');
      if (providerError) {
        setErrorMessage(providerError);
        return;
      }

      const code = params.get('code');
      if (!code) {
        setErrorMessage('The sign-in response did not contain an authorization code.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setErrorMessage(error.message);
        return;
      }

      await initializeAuth();
      if (useAuthStore.getState().user) navigate('/chat', { replace: true });
      else setErrorMessage('Sign-in succeeded, but your ChatFlow profile could not be loaded. Run the latest migration and try again.');
    };
    void completeSignIn();
  }, [initializeAuth, navigate]);

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white grid place-items-center p-6">
      <section className="w-full max-w-md rounded-3xl border border-[#262626] bg-[#151515] p-8 text-center shadow-2xl">
        {errorMessage ? <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-400" /> : <LoaderCircle className="mx-auto mb-4 h-10 w-10 animate-spin text-[#FF7A00]" />}
        <h1 className="text-xl font-bold">{errorMessage ? 'Google sign-in could not finish' : 'Signing you in…'}</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">{errorMessage || 'Securing your session and loading your profile.'}</p>
        {errorMessage && <button onClick={() => navigate('/login', { replace: true })} className="mt-6 rounded-xl bg-[#FF7A00] px-5 py-3 text-sm font-bold text-black">Back to login</button>}
      </section>
    </main>
  );
}
