import { createBrowserClient } from "@supabase/ssr";
import { getRequiredSupabaseEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  const { url, publishableKey } = getRequiredSupabaseEnv();

  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}
