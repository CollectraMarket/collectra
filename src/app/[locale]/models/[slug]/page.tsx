import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { carBrands, manufacturers, models, scales } from "@/db/schema";

type ModelRow = {
  id: number;
  slug: string;
  displayName: string;
  manufacturerSku: string;
  originalSku: string | null;
  carModel: string;
  carGeneration: string | null;
  versionTrim: string | null;
  year: number | null;
  productType: string | null;
  manufacturer: string | null;
  scale: string | null;
  carBrand: string | null;
};

export default async function ModelPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  let currentModel: ModelRow | null = null;
  let loadError: string | null = null;

  try {
    const rows = await db
      .select({
        id: models.id,
        slug: models.slug,
        displayName: models.displayName,
        manufacturerSku: models.manufacturerSku,
        originalSku: models.originalSku,
        carModel: models.carModel,
        carGeneration: models.carGeneration,
        versionTrim: models.versionTrim,
        year: models.year,
        productType: models.productType,
        manufacturer: manufacturers.name,
        scale: scales.label,
        carBrand: carBrands.name,
      })
      .from(models)
      .leftJoin(manufacturers, eq(models.manufacturerId, manufacturers.id))
      .leftJoin(scales, eq(models.scaleId, scales.id))
      .leftJoin(carBrands, eq(models.carBrandId, carBrands.id))
      .where(eq(models.slug, slug))
      .limit(1);

    currentModel = rows[0] ?? null;
  } catch (error) {
    console.error("Model page load failed:", { slug, error });
    loadError = "Model page query failed.";
  }

  if (loadError) {
    return (
      <main className="container-shell py-8 md:py-10">
        <div className="panel">
          <p className="kicker">Temporary model page fallback</p>
          <h1 className="mt-2 text-3xl font-semibold">
            Model page trenutno nije mogao da se učita
          </h1>
          <p className="mt-3 max-w-2xl text-white/65">
            Stranica se nije otvorila kako treba, ali smo sprečili rušenje celog sajta.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/${locale}/search`} className="btn-primary">
              Nazad na search
            </Link>
            <Link href={`/${locale}/browse`} className="badge-chip">
              Otvori browse
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!currentModel) {
    notFound();
  }

  const infoItems: Array<[string, string]> = [
    ["SKU", currentModel.manufacturerSku],
    ["Original SKU", currentModel.originalSku ?? "—"],
    ["Scale", currentModel.scale ?? "—"],
    ["Manufacturer", currentModel.manufacturer ?? "—"],
    ["Car brand", currentModel.carBrand ?? "—"],
    ["Catalog label", currentModel.carModel ?? "—"],
    ["Generation", currentModel.carGeneration ?? "—"],
    ["Version / trim", currentModel.versionTrim ?? "—"],
    ["Product type", currentModel.productType ?? "—"],
    ["Year", currentModel.year ? String(currentModel.year) : "—"],
  ];

  return (
    <main className="container-shell py-8 md:py-10">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="panel-strong">
          <div className="subtle-grid grid aspect-[4/3] place-items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03]">
            <div className="text-center">
              <p className="kicker">Catalog placeholder</p>
              <p className="mt-2 text-base text-white/80">No official model image yet</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="kicker">{currentModel.manufacturer ?? "Unknown manufacturer"}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {currentModel.displayName}
            </h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Javna model stranica sada prikazuje samo relevantne podatke o modelu, bez internih
              import informacija iz baze.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {infoItems.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="kicker">{label}</p>
                <p className="mt-2 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="panel">
            <p className="section-title">About this model</p>
            <p className="mt-2 text-sm text-white/60">
              Ovaj deo će kasnije dobiti market activity, value context i povezane oglase,
              ali bez prikaza internih source podataka iz baze.
            </p>
          </div>

          <div className="panel">
            <p className="section-title">Sell this model</p>
            <p className="mt-2 text-white/60">
              Kada listing flow bude potpuno povezan sa bazom, odavde će korisnik moći
              direktno da kreira oglas za ovaj model.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/${locale}/listings/create/${currentModel.id}`} className="btn-primary">
                Sell this model
              </Link>
              <Link href={`/${locale}/browse`} className="badge-chip">
                Back to browse
              </Link>
            </div>
          </div>

          <div className="panel">
            <p className="section-title">Marketplace status</p>
            <p className="mt-2 text-sm text-white/60">
              Trenutno je aktivan clean catalog view. Sledeći korak je uvođenje pravih slika
              i public listing sekcije bez rušenja stranice.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}