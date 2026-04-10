const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  null;

const databaseUrl = process.env.DATABASE_URL?.trim() || null;
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || null;
const adminEmailsRaw = process.env.ADMIN_EMAILS?.trim() || "";

export function getSupabaseUrl() {
  return supabaseUrl;
}

export function getSupabasePublishableKey() {
  return supabasePublishableKey;
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getRequiredSupabaseEnv() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
  };
}

export function getRequiredDatabaseUrl() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }

  return databaseUrl;
}

export function getRequiredAppUrl() {
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is missing.");
  }

  return appUrl.replace(/\/$/, "");
}

export function getAdminEmails() {
  return new Set(
    adminEmailsRaw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}