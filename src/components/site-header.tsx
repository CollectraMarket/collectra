import Link from "next/link";
import { getMessages } from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: string }) {
  const t = getMessages(locale);
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/25 backdrop-blur-xl">
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 font-black">D</div>
          <div>
            <p className="text-sm font-semibold tracking-[0.16em]">DIECAST</p>
            <p className="text-xs text-white/50">collector platform demo</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink href={`/${locale}`}>{t.home}</NavLink>
          <NavLink href={`/${locale}/browse`}>{t.browse}</NavLink>
          <NavLink href={`/${locale}/search`}>{t.search}</NavLink>
          <NavLink href={`/${locale}/listings/create/1`}>{t.sell}</NavLink>
          <NavLink href={`/${locale}/admin`}>{t.admin}</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/en" className="badge-chip">EN</Link>
          <Link href="/sr" className="badge-chip">SR</Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="rounded-xl px-3 py-2 text-sm font-medium text-white/72 transition hover:bg-white/8 hover:text-white">{children}</Link>;
}
