import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getOrCreateProfileForUser } from "@/lib/profiles/get-or-create-profile";

function makeLoginRedirect(locale: string, nextPath?: string) {
  const safeNext = nextPath && nextPath.startsWith("/") ? nextPath : "";
  const query = safeNext ? `?next=${encodeURIComponent(safeNext)}` : "";
  return `/${locale}/login${query}`;
}

export async function requireUser(locale: string, nextPath?: string) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.user) {
    redirect(makeLoginRedirect(locale, nextPath));
  }

  const profile =
    currentUser.profile ?? (await getOrCreateProfileForUser(currentUser.user));

  if (profile.status !== "active") {
    redirect(`/${locale}/login?message=${encodeURIComponent("Account is not active.")}`);
  }

  return {
    user: currentUser.user,
    profile,
  };
}

export async function requireAdmin(locale: string, nextPath?: string) {
  const session = await requireUser(locale, nextPath);

  if (session.profile.role !== "admin") {
    redirect(`/${locale}`);
  }

  return session;
}

export async function getOptionalSession() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.user) {
    return null;
  }

  const profile =
    currentUser.profile ?? (await getOrCreateProfileForUser(currentUser.user));

  return {
    user: currentUser.user,
    profile,
  };
}