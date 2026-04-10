import type { User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export type AppProfile = typeof profiles.$inferSelect;

export type CurrentUserResult = {
  user: User;
  profile: AppProfile | null;
} | null;

export async function getCurrentUser(): Promise<CurrentUserResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  return {
    user,
    profile: profile ?? null,
  };
}
