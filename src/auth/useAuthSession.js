import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from './supabase.js';

const emptyState = {
  ready: true,
  session: null,
  user: null,
  passwordRecovery: false,
  error: '',
};

export function useAuthSession({ enabled = true } = {}) {
  const [state, setState] = useState(() => ({
    ...emptyState,
    ready: !enabled || !isSupabaseConfigured,
  }));

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) {
      setState((current) => ({
        ...current,
        ...emptyState,
      }));
      return undefined;
    }

    const client = getSupabaseClient();
    if (!client) return undefined;
    let isMounted = true;

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      setState((current) => ({
        ...current,
        ready: true,
        session,
        user: session?.user ?? null,
        passwordRecovery: event === 'PASSWORD_RECOVERY'
          ? true
          : event === 'SIGNED_OUT' ? false : current.passwordRecovery,
        error: '',
      }));
    });

    client.auth.getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        setState((current) => ({
          ...current,
          ready: true,
          session: data.session,
          user: data.session?.user ?? null,
          error: error?.message ?? '',
        }));
      })
      .catch((error) => {
        if (!isMounted) return;
        setState((current) => ({ ...current, ready: true, error: error.message || 'Could not restore your session.' }));
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [enabled]);

  const clearPasswordRecovery = useCallback(() => {
    setState((current) => ({ ...current, passwordRecovery: false }));
  }, []);

  return { ...state, clearPasswordRecovery };
}
