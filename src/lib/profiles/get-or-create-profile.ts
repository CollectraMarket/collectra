import type { User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { getAdminEmails } from "@/lib/env";

type AppProfile = typeof profiles.$inferSelect;

function cleanUsername(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);

  return normalized || "collector";
}

function makeDisplayName(user: User) {
  const metadata = user.user_metadata ?? {};
  const candidate =
    metadata.display_name ||
    metadata.full_name ||
    metadata.name ||
    metadata.username ||
    user.email?.split("@")[0] ||
    "Collector";

  return String(candidate).slice(0, 120);
}

function resolveRoleForUser(user: User): "user" | "admin" {
  const email = user.email?.trim().toLowerCase();
  if (!email) return "user";

  return getAdminEmails().has(email) ? "admin" : "user";
}

async function makeUniqueUsername(base: string, userId: string) {
  let attempt = 0;

  while (attempt < 50) {
    const suffix = attempt === 0 ? "" : String(attempt + 1);
    const maxBaseLength = 40 - suffix.length;
    const candidate = `${base.slice(0, maxBaseLength)}${suffix}`;

    const [existing] = await db
      .select({
        id: profiles.id,
        userId: profiles.userId,
      })
      .from(profiles)
      .where(eq(profiles.username, candidate))
      .limit(1);

    if (!existing || existing.userId === userId) {
      return candidate;
    }

    attempt += 1;
  }

  return `${base.slice(0, 30)}${userId.replace(/-/g, "").slice(0, 8)}`;
}

export async function getOrCreateProfileForUser(user: User): Promise<AppProfile> {
  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  if (existingProfile) {
    return existingProfile;
  }

  const emailBase = user.email?.split("@")[0] ?? "collector";
  const metadataBase =
    user.user_metadata?.username ||
    user.user_metadata?.user_name ||
    user.user_metadata?.nickname ||
    emailBase;

  const usernameBase = cleanUsername(String(metadataBase));
  const username = await makeUniqueUsername(usernameBase, user.id);
  const displayName = makeDisplayName(user);
  const role = resolveRoleForUser(user);

  const [insertedProfile] = await db
    .insert(profiles)
    .values({
      userId: user.id,
      username,
      displayName,
      role,
      status: "active",
      preferredCurrency: "EUR",
      preferredLanguage: "en",
      isIdentityVerified: false,
      ratingAvg: "0",
      ratingCount: 0,
      completedSalesCount: 0,
      activeListingsCount: 0,
      completionRate: "0",
    })
    .returning();

  return insertedProfile;
}
