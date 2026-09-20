'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AdminUser {
  email: string;
  role: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message || 'Invalid credentials');
    }
    return data;
  };

  const logout = async (redirectTo: string = '/admin/login') => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut network errors
    }
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase.auth'))) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // Ignore storage exceptions
      }
    }
    // Force a hard redirect to clear all state and prevent back-button bypass
    window.location.replace(redirectTo);
  };

  const adminUser: AdminUser | null = user
    ? {
        email: user.email ?? '',
        role: 'admin',
        name:
          (user.user_metadata?.name as string) ||
          (user.email?.split('@')[0] ?? 'Admin'),
      }
    : null;

  return {
    token: session?.access_token ?? null,
    user: adminUser,
    session,
    isAuthenticated: !!session && !!user,
    loading,
    login,
    logout,
  };
}
