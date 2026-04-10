import Link from "next/link";
import { getMessages } from "@/lib/i18n";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getMessages(locale);

  return (
    <main className="container-shell py-8 md:py-12">
      <section className="panel-strong">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="kicker">Collector marketplace & reference database</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">{t.title}</h1>
            <p className="mt-5 max-w-3xl text-base text-white/70 md:text-lg">{t.desc}</p>

            <form action={`/${locale}/search`} className="mt-8 flex flex-col gap-3 md:flex-row">
              <input name="q" placeholder={t.placeholder} className="field" />
              <button className="btn-primary md:min-w-[170px]">{t.search}</button>
            </form>

            <div className="mt-4">
              <Link href={`/${locale}/browse`} className="btn-secondary">Browse models</Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="section-title">Why this platform works</p>
              <p className="mt-3 text-white/65">The catalog layer stays clean and standardized, while listings and auctions remain user-owned marketplace entries linked to an official model entity.</p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold">Active auctions</p>
                <p className="mt-2 text-sm text-white/55">Binding bids, anti-sniping logic and clear ending-soon state.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold">New listings</p>
                <p className="mt-2 text-sm text-white/55">Multiple collector listings linked to one clean model entity.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold">Popular manufacturers</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Mini GT","Norev","Solido","Spark","Kyosho"].map((item) => <span key={item} className="badge-chip">{item}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
