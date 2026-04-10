"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const locale = typeof params.locale === "string" ? params.locale : "en";
  const rawNext = searchParams.get("next");
  const nextPath = rawNext && rawNext.startsWith("/") ? rawNext : `/${locale}`;
  const incomingMessage = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(incomingMessage);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <main className="container-shell py-8 md:py-10">
      <div className="mx-auto max-w-xl panel">
        <p className="kicker">Account access</p>
        <h1 className="mt-2 text-3xl font-semibold">Login</h1>
        <p className="mt-2 text-white/60">
          Uloguj se da bi mogao da praviš listinge i pristupiš zaštićenim delovima platforme.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm text-white/70">Email</span>
            <input
              type="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-white/70">Password</span>
            <input
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 text-sm text-white/60">
          Nemaš nalog?{" "}
          <Link
            href={`/${locale}/register?next=${encodeURIComponent(nextPath)}`}
            className="text-white underline underline-offset-4"
          >
            Registruj se
          </Link>
        </div>
      </div>
    </main>
  );
}