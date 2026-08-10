import {
  ensureAnonymousPlannerUser,
  getSupabaseBrowserClient,
} from "../supabase/client.ts";

export async function plannerConnection() {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const userId = await ensureAnonymousPlannerUser(client);
  return { client, userId };
}
