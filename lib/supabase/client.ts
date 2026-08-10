import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let anonymousSignIn: Promise<string> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  browserClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return browserClient;
}

export async function ensureAnonymousPlannerUser(client: SupabaseClient) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user.id) return sessionData.session.user.id;

  if (!anonymousSignIn) {
    anonymousSignIn = client.auth.signInAnonymously().then(({ data, error }) => {
      if (error) throw error;
      if (!data.user) throw new Error("Supabase did not return an anonymous user.");
      return data.user.id;
    }).finally(() => {
      anonymousSignIn = null;
    });
  }

  return anonymousSignIn;
}
