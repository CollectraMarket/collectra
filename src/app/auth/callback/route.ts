import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfileForUser } from "@/lib/profiles/get-or-create-profile";
import { isSupportedLocale } from "@/lib/i18n";

function getSafeNext(nextParam: string | null) {
  if (!nextParam || !nextParam.startsWith("/")) {
    return "/en";
  }

  return nextParam;
}

function getLocaleFromPath(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return isSupportedLocale(firstSegment ?? "") ? firstSegment : "en";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const safeNext = getSafeNext(requestUrl.searchParams.get("next"));
  const locale = getLocaleFromPath(safeNext);

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/login?message=${encodeURIComponent("Missing auth code.")}`,
        requestUrl.origin
      )
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/login?message=${encodeURIComponent(error.message)}`,
        requestUrl.origin
      )
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await getOrCreateProfileForUser(user);
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}