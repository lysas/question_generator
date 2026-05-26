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
 
  // Sign‑up + auto‑login with display name metadata
  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: name,
          display_name: name,
          full_name: name
        }
      }
    });
    if (error) throw error;
    return data.user;
  },
 
  // Email / password login
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  // Google OAuth login
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },

  // Resolve email address from name/username using backend database query
  resolveEmailFromName: async (name) => {
    if (!name) return "";
    if (name.includes("@")) return name; // Already an email
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const url = `${baseUrl}/api/auth/resolve-email?name=${encodeURIComponent(name.trim())}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "User name not found.");
    }
    const data = await res.json();
    return data.email;
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
