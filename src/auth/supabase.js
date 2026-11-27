import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

let supabaseClient;

// Keep the client lazy: a persisted Developer Mode must not initialize a Supabase
// session, read its browser storage, or make Auth requests just to open the preview.
export function getSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Keep CampusTwin's browser session separate from other apps using this Supabase project.
        storageKey: 'campustwin-auth-token',
      },
    });
  }
  return supabaseClient;
}

export function getAuthRedirectUrl() {
  return new URL(import.meta.env.BASE_URL || '/', window.location.origin).toString();
}
