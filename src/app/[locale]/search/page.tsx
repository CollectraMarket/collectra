import Link from "next/link";
import { searchModels, type SearchScope } from "@/lib/search";

function getSafeScope(value?: string): SearchScope {
  return value === "listed" ? "listed" : "catalog";
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; scope?: string }>;
}) {
  const { locale } = await params;
  const { q = "", scope: rawScope } = await searchParams;
  const scope = getSafeScope(rawScope);

  const result = await searchModels(q, scope);

  return (
    <main className="container-shell py-8 md:py-10">
      <div className="mb-6">
        <p className="kicker">Search</p>
        <h1 className="mt-2 text-3xl font-semibold">Smart search</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          Pretraga je sada fokusirana na jače poklapanje ključnih pojmova, a ne samo na široko
          hvatanje sličnih modela.
        </p>
      </div>

      <form action={`/${locale}/search`} className="panel mb-6 grid gap-4">
        <div className="grid gap-3 md:grid-cols-[1fr_240px_160px]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Porsche Dakar, MINI GT Red Bull, BMW M3 1:18, Solido Delta HF..."
            className="field"
          />

          <select name="scope" defaultValue={scope} className="field">
            <option value="catalog">Arhiva modela</option>
            <option value="listed">Trenutno izlistani modeli</option>
          </select>

          <button className="btn-primary">Search</button>
        </div>
      </form>

      {q ? (
        <div className="mb-5 text-sm text-white/55">
          Režim pretrage:{" "}
          <span className="font-medium text-white/80">
            {scope === "listed" ? "Trenutno izlistani modeli" : "Arhiva modela"}
          </span>
        </div>
      ) : null}

      {result.kind === "empty" ? (
        <div className="panel">
          <p className="text-lg font-semibold">No results</p>
          <p className="mt-2 text-white/60">
            Nema rezultata za ovaj upit u izabranom režimu. Probaj puniji naziv modela,
            proizvođača, SKU deo ili skalu.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {result.bestMatch ? (
            <section className="panel border border-white/15 bg-white/[0.06]">
              <p className="kicker">Best match</p>
              <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-2xl font-semibold">{result.bestMatch.displayName}</p>
                  <p className="mt-2 text-white/60">
                    {result.bestMatch.manufacturer} · {result.bestMatch.manufacturerSku} ·{" "}
                    {result.bestMatch.scale} · {result.bestMatch.carBrand}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {result.bestMatch.activeListings > 0 ? (
                    <span className="badge-chip">
                      {result.bestMatch.activeListings} active listing
                      {result.bestMatch.activeListings === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="badge-chip">Catalog match</span>
                  )}

                  <Link
                    href={`/${locale}/models/${result.bestMatch.slug}`}
                    className="btn-primary"
                  >
                    Open model
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">Results</p>
              <p className="text-sm text-white/50">{result.total} shown</p>
            </div>

            {result.items.map((item) => (
              <Link
                key={item.id}
                href={`/${locale}/models/${item.slug}`}
                className="panel transition hover:bg-white/[0.08]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xl font-semibold">{item.displayName}</p>
                    <p className="mt-2 text-white/60">
                      {item.manufacturer} · {item.manufacturerSku} · {item.scale} · {item.carBrand}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.activeListings > 0 ? (
                      <span className="badge-chip">
                        {item.activeListings} active listing
                        {item.activeListings === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="badge-chip">Catalog only</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}