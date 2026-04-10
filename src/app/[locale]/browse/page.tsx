import Link from "next/link";
import BrowsePageJumpControl from "@/components/browse-page-jump-control";
import { getBrowseFilterOptions, getBrowseResults } from "@/lib/search";

function buildQueryString(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function FilterSelect({
  name,
  defaultValue,
  label,
  children,
}: {
  name: string;
  defaultValue: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-white/70">{label}</span>
      <div className="relative">
        <select
          name={name}
          defaultValue={defaultValue}
          className="field appearance-none pr-11"
        >
          {children}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/45">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </label>
  );
}

export default async function BrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ manufacturer?: string; scale?: string; carBrand?: string; page?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;

  const page = Math.max(1, Number(filters.page ?? "1") || 1);

  const [result, options] = await Promise.all([
    getBrowseResults({
      manufacturer: filters.manufacturer,
      scale: filters.scale,
      carBrand: filters.carBrand,
      page,
      pageSize: 40,
    }),
    getBrowseFilterOptions(),
  ]);

  const prevPage = result.page > 1 ? result.page - 1 : null;
  const nextPage = result.page < result.totalPages ? result.page + 1 : null;

  return (
    <main className="container-shell py-8 md:py-10">
      <div className="mb-6">
        <p className="kicker">Catalog archive</p>
        <h1 className="mt-2 text-3xl font-semibold">Browse all models</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          Ovde vidiš celu arhivu kroz pregledniji list prikaz. Fotografije su za sada
          rešene placeholder prikazom, dok ne uvedemo pravi catalog image sistem.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="panel h-fit">
          <p className="section-title">Browse filters</p>

          <form action={`/${locale}/browse`} className="mt-5 grid gap-4">
            <FilterSelect
              name="manufacturer"
              label="Manufacturer"
              defaultValue={filters.manufacturer ?? ""}
            >
              <option value="">All manufacturers</option>
              {options.manufacturers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              name="carBrand"
              label="Car brand"
              defaultValue={filters.carBrand ?? ""}
            >
              <option value="">All car brands</option>
              {options.carBrands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              name="scale"
              label="Scale"
              defaultValue={filters.scale ?? ""}
            >
              <option value="">All scales</option>
              {options.scales.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <button className="btn-primary">Apply filters</button>

            <Link href={`/${locale}/browse`} className="badge-chip justify-center text-center">
              Reset filters
            </Link>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">
            <p className="font-medium text-white/80">{result.total} models</p>
            <p className="mt-2">
              Strana {result.page} od {result.totalPages}
            </p>
          </div>

          <BrowsePageJumpControl
            locale={locale}
            currentPage={result.page}
            totalPages={result.totalPages}
            manufacturer={filters.manufacturer}
            carBrand={filters.carBrand}
            scale={filters.scale}
          />
        </aside>

        <section className="w-full">
          <div className="grid gap-4 max-w-[980px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-white/55">
                List view · model ispod modela · spremno za buduće thumbnail slike
              </p>
              <p className="text-sm text-white/50">
                Showing {result.items.length} on this page
              </p>
            </div>

            {result.items.length ? (
              result.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/${locale}/models/${item.slug}`}
                  className="panel w-full transition hover:bg-white/[0.08]"
                >
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_170px] md:items-center">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-xs font-medium text-white/45">
                        NO IMG
                      </div>

                      <div className="min-w-0">
                        <p className="text-xl font-semibold leading-tight">
                          {item.displayName}
                        </p>
                        <p className="mt-2 text-white/60">
                          {item.manufacturer} · {item.manufacturerSku} · {item.scale} · {item.carBrand}
                          {item.year ? ` · ${item.year}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex md:justify-end">
                      {item.activeListings > 0 ? (
                        <span className="badge-chip inline-flex min-w-[150px] justify-center whitespace-nowrap text-center">
                          {item.activeListings} active listing{item.activeListings === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span className="badge-chip inline-flex min-w-[150px] justify-center whitespace-nowrap text-center">
                          Catalog only
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="panel">
                <p className="text-lg font-semibold">No models for current filters</p>
                <p className="mt-2 text-white/60">
                  Probaj drugi manufacturer, car brand ili scale.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-sm text-white/50">
                Page {result.page} of {result.totalPages}
              </div>

              <div className="flex flex-wrap gap-3">
                {result.page > 1 ? (
                  <Link
                    href={`/${locale}/browse${buildQueryString({
                      manufacturer: filters.manufacturer,
                      carBrand: filters.carBrand,
                      scale: filters.scale,
                      page: 1,
                    })}`}
                    className="badge-chip"
                  >
                    First
                  </Link>
                ) : (
                  <span className="badge-chip opacity-40">First</span>
                )}

                {prevPage ? (
                  <Link
                    href={`/${locale}/browse${buildQueryString({
                      manufacturer: filters.manufacturer,
                      carBrand: filters.carBrand,
                      scale: filters.scale,
                      page: prevPage,
                    })}`}
                    className="badge-chip"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="badge-chip opacity-40">Previous</span>
                )}

                {nextPage ? (
                  <Link
                    href={`/${locale}/browse${buildQueryString({
                      manufacturer: filters.manufacturer,
                      carBrand: filters.carBrand,
                      scale: filters.scale,
                      page: nextPage,
                    })}`}
                    className="btn-primary"
                  >
                    Next page
                  </Link>
                ) : (
                  <span className="badge-chip opacity-40">Next page</span>
                )}

                {result.page < result.totalPages ? (
                  <Link
                    href={`/${locale}/browse${buildQueryString({
                      manufacturer: filters.manufacturer,
                      carBrand: filters.carBrand,
                      scale: filters.scale,
                      page: result.totalPages,
                    })}`}
                    className="badge-chip"
                  >
                    Last
                  </Link>
                ) : (
                  <span className="badge-chip opacity-40">Last</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}