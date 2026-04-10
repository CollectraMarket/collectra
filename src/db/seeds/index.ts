import { eq } from "drizzle-orm";
import { db } from "../client";
import { carBrands, manufacturers, models, scales } from "../schema";
import { normalizeName, normalizeSku, slugify } from "../../lib/utils";

const BASE_MANUFACTURERS = [
  { name: "MINI GT", country: "HK" },
  { name: "Norev", country: "FR" },
  { name: "Solido", country: "FR" },
  { name: "Minichamps", country: "DE" },
  { name: "IXO", country: "PT" },
  { name: "GT Spirit", country: "FR" },
  { name: "Dealer Model", country: null },
];

const BASE_CAR_BRANDS = [
  "Unknown / Imported",
  "Porsche",
  "BMW",
  "Mercedes-Benz",
  "Ferrari",
  "Volkswagen",
  "Audi",
  "Nissan",
  "Toyota",
  "Ford",
  "Lancia",
  "Citroën",
  "Peugeot",
  "Renault",
  "Škoda",
  "Land Rover",
  "Red Bull Racing",
];

const BASE_SCALES = ["Unknown", "1:87", "1:64", "1:43", "1:24", "1:18", "1:12", "1:10", "1:8", "1:2", "1:48"];

const DEMO_MODELS = [
  {
    manufacturer: "MINI GT",
    manufacturerSku: "TSM430734",
    originalSku: "MGT00591-R",
    carBrand: "Red Bull Racing",
    carModel: "RB16B",
    carGeneration: "Formula 1",
    versionTrim: "Abu Dhabi Winner 2021",
    year: 2021,
    scale: "1:64",
    displayName: "MINI GT Red Bull RB16B #33 Max Verstappen Abu Dhabi Winner 2021 1:64",
    productType: "Die-cast model",
  },
  {
    manufacturer: "Norev",
    manufacturerSku: "187366",
    originalSku: "POR911DAKAR23",
    carBrand: "Porsche",
    carModel: "911 Dakar",
    carGeneration: "992",
    versionTrim: "Oak Green Metallic",
    year: 2023,
    scale: "1:18",
    displayName: "Norev Porsche 911 Dakar Oak Green Metallic 2023 1:18",
    productType: "Die-cast model",
  },
  {
    manufacturer: "Solido",
    manufacturerSku: "S1810505",
    originalSku: "1810505",
    carBrand: "Lancia",
    carModel: "Delta HF Integrale",
    carGeneration: "Group A",
    versionTrim: "Safari Rallye Kenya 1991",
    year: 1991,
    scale: "1:18",
    displayName: "Solido Lancia Delta HF Integrale Safari Rallye Kenya 1991 1:18",
    productType: "Die-cast model",
  },
];

async function ensureManufacturers() {
  for (const item of BASE_MANUFACTURERS) {
    const slug = slugify(item.name);
    const existing = await db.query.manufacturers.findFirst({
      where: eq(manufacturers.slug, slug),
    });

    if (!existing) {
      await db.insert(manufacturers).values({
        name: item.name,
        slug,
        country: item.country,
      });
    }
  }
}

async function ensureCarBrands() {
  for (const name of BASE_CAR_BRANDS) {
    const slug = slugify(name);
    const existing = await db.query.carBrands.findFirst({
      where: eq(carBrands.slug, slug),
    });

    if (!existing) {
      await db.insert(carBrands).values({ name, slug });
    }
  }
}

async function ensureScales() {
  for (const [index, label] of BASE_SCALES.entries()) {
    const existing = await db.query.scales.findFirst({
      where: eq(scales.label, label),
    });

    if (!existing) {
      await db.insert(scales).values({
        label,
        sortOrder: (index + 1) * 10,
      });
    }
  }
}

async function ensureDemoModels() {
  for (const item of DEMO_MODELS) {
    const manufacturer = await db.query.manufacturers.findFirst({
      where: eq(manufacturers.slug, slugify(item.manufacturer)),
    });

    const carBrand = await db.query.carBrands.findFirst({
      where: eq(carBrands.slug, slugify(item.carBrand)),
    });

    const scale = await db.query.scales.findFirst({
      where: eq(scales.label, item.scale),
    });

    if (!manufacturer || !carBrand || !scale) {
      throw new Error(`Missing seed dependency for ${item.displayName}`);
    }

    const skuNormalized = normalizeSku(item.manufacturerSku);
    const existing = await db.query.models.findFirst({
      where: eq(models.slug, slugify(item.displayName)),
    });

    if (!existing) {
      await db.insert(models).values({
        manufacturerId: manufacturer.id,
        manufacturerSku: item.manufacturerSku,
        manufacturerSkuNormalized: skuNormalized,
        originalSku: item.originalSku,
        carBrandId: carBrand.id,
        carModel: item.carModel,
        carGeneration: item.carGeneration,
        versionTrim: item.versionTrim,
        year: item.year,
        scaleId: scale.id,
        displayName: item.displayName,
        normalizedName: normalizeName(item.displayName),
        slug: slugify(item.displayName),
        productType: item.productType,
        sourceFile: "db-seed",
        sourceSheet: "demo_models",
        ruleApplied: "manual_seed",
        ruleStatus: "seeded",
        importNotes: "Seeded starter catalog model",
      });
    }
  }
}

async function main() {
  await ensureManufacturers();
  await ensureCarBrands();
  await ensureScales();
  await ensureDemoModels();
  console.log("Base lookup seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
