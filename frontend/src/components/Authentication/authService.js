import { supabase } from '../../supabaseClient';

export const authService = {
  // Returns the current logged‑in user (or null)
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Suppress noisy AuthSessionMissingError when no session exists
      if (error.name !== 'AuthSessionMissingError' && !error.message?.includes('Auth session missing')) {
        console.error('Supabase getUser error:', error);
      }
      return null;
    }
    return data.user;
  },

  // Sign‑up + auto‑login (for dev you can log in after sign‑up if needed)
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
  },

  // Email / password login
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  // Log out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Retrieve JWT token for protected backend calls
  getToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
};
