import { create } from 'zustand';
import { CURRENT_MOCK_USER } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Profile, UserSettings } from '../types/chat';

interface AuthStore {
  user: Profile | null;
  settings: UserSettings | null;
  isLoading: boolean;
  isDemoMode: boolean;
  setUser: (user: Profile | null) => void;
  setSettings: (settings: UserSettings | null) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  initializeAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInDemoUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  user_id: '',
  theme: 'dark',
  notifications_enabled: true,
  read_receipts_enabled: true,
  last_seen_visibility: 'everyone',
  profile_visibility: 'everyone',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  isDemoMode: !isSupabaseConfigured(),

  setUser: (user) => set({ user }),
  setSettings: (settings) => set({ settings }),

  initializeAuth: async () => {
    set({ isLoading: true });

    if (!isSupabaseConfigured()) {
      // Demo/Mock fallback
      const savedUser = localStorage.getItem('chatflow_demo_user');
      const savedSettings = localStorage.getItem('chatflow_settings');

      const user = savedUser ? JSON.parse(savedUser) : CURRENT_MOCK_USER;
      const settings = savedSettings ? JSON.parse(savedSettings) : { ...DEFAULT_SETTINGS, user_id: user.id };

      set({
        user,
        settings,
        isDemoMode: true,
        isLoading: false,
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch real Supabase profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          set({
            user: profile as Profile,
            settings: userSettings ? (userSettings as UserSettings) : { ...DEFAULT_SETTINGS, user_id: session.user.id },
            isDemoMode: false,
            isLoading: false,
          });
          return;
        }
      }

      set({ user: null, isDemoMode: false, isLoading: false });
    } catch (err) {
      console.error('Error initializing auth:', err);
      set({ user: null, isDemoMode: false, isLoading: false });
    }

    // Subscribe to auth state changes
    if (isSupabaseConfigured()) {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            set({ user: profile as Profile });
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null });
        }
      });
    }
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured()) {
      await get().signInDemoUser();
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/chat`,
      },
    });

    if (error) {
      throw error;
    }
  },

  signInDemoUser: async () => {
    const user = CURRENT_MOCK_USER;
    const settings = { ...DEFAULT_SETTINGS, user_id: user.id };

    localStorage.setItem('chatflow_demo_user', JSON.stringify(user));
    localStorage.setItem('chatflow_settings', JSON.stringify(settings));

    set({ user, settings, isDemoMode: true });
  },

  signOut: async () => {
    if (!get().isDemoMode && isSupabaseConfigured()) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('chatflow_demo_user');
    }
    set({ user: null });
  },

  updateProfile: async (updates) => {
    const { user, isDemoMode } = get();
    if (!user) return;

    const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };

    if (isDemoMode) {
      localStorage.setItem('chatflow_demo_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
    set({ user: updatedUser });
  },

  updateSettings: async (updates) => {
    const { user, settings, isDemoMode } = get();
    if (!user || !settings) return;

    const updatedSettings = { ...settings, ...updates, updated_at: new Date().toISOString() };

    if (isDemoMode) {
      localStorage.setItem('chatflow_settings', JSON.stringify(updatedSettings));
      set({ settings: updatedSettings });
      return;
    }

    const { error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id);

    if (error) throw error;
    set({ settings: updatedSettings });
  },
}));
