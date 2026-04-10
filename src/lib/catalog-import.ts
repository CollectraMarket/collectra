import fs from "node:fs";
import path from "node:path";
import { inArray, sql } from "drizzle-orm";
import * as XLSX from "xlsx";
import { db } from "@/db/client";
import { carBrands, manufacturers, models, scales } from "@/db/schema";
import {
  inferCarBrandName,
  normalizeName,
  normalizeScaleLabel,
  normalizeSku,
  slugify,
  titleCaseManufacturer,
} from "@/lib/utils";

export type CleanImportRow = {
  brand: string | null;
  product_name: string | null;
  clean_sku: string | null;
  original_sku: string | null;
  scale: string | null;
  year: number | string | null;
  product_type: string | null;
  price: number | string | null;
  source_file: string | null;
  source_sheet: string | null;
  source_row: number | string | null;
  rule_applied: string | null;
  rule_status: string | null;
  notes: string | null;
};

export type CatalogImportOptions = {
  filePath: string;
  sheetName?: string;
  dryRun?: boolean;
};

export type CatalogImportSummary = {
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  reviewNeeded: number;
  reportPath: string;
};

type ReviewRow = {
  brand: string | null;
  product_name: string | null;
  clean_sku: string | null;
  scale: string | null;
  year: number | null;
  reason: string;
  source_file: string | null;
  source_sheet: string | null;
  source_row: number | null;
};

type StagedCatalogRow = {
  manufacturerName: string;
  manufacturerSlug: string;
  carBrandName: string;
  carBrandSlug: string;
  scaleLabel: string;
  manufacturerSku: string;
  manufacturerSkuNormalized: string;
  originalSku: string | null;
  productName: string;
  displayName: string;
  normalizedName: string;
  slug: string;
  productType: string | null;
  sourceFile: string | null;
  sourceSheet: string | null;
  sourceRow: number | null;
  ruleApplied: string | null;
  ruleStatus: string | null;
  importNotes: string | null;
  year: number | null;
  reviewReasons: string[];
  businessKey: string;
};

function coerceYear(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/\b(19|20)\d{2}\b/);
    if (match) return Number(match[0]);
  }
  return null;
}

function coerceSourceRow(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function sortOrderForScale(label: string) {
  const order: Record<string, number> = {
    Unknown: 5,
    "1:87": 10,
    "1:64": 20,
    "1:48": 25,
    "1:43": 30,
    "1:24": 40,
    "1:18": 50,
    "1:12": 60,
    "1:10": 70,
    "1:8": 80,
    "1:2": 90,
  };

  return order[label] ?? 999;
}

function buildDisplayName(manufacturerName: string, productName: string, scaleLabel: string) {
  return `${manufacturerName} ${productName}${scaleLabel !== "Unknown" ? ` ${scaleLabel}` : ""}`.trim();
}

function buildModelSlug(manufacturerName: string, productName: string, cleanSku: string, scaleLabel: string) {
  const raw = `${manufacturerName} ${productName} ${cleanSku} ${scaleLabel}`;
  return slugify(raw).slice(0, 270);
}

function loadRows(filePath: string, sheetName = "clean_import_safe") {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Sheet '${sheetName}' not found in ${path.basename(filePath)}`);
  }

  return XLSX.utils.sheet_to_json<CleanImportRow>(worksheet, {
    defval: null,
    raw: false,
  });
}

function writeReport(report: { summary: CatalogImportSummary; reviewRows: ReviewRow[] }) {
  const reportDir = path.join(process.cwd(), "import-reports");
  fs.mkdirSync(reportDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  const reportPath = path.join(reportDir, `catalog-import-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  return reportPath;
}

function makeBusinessKey(manufacturerSlug: string, manufacturerSkuNormalized: string, scaleLabel: string) {
  return `${manufacturerSlug}__${manufacturerSkuNormalized}__${scaleLabel}`;
}

async function ensureLookupRows(stagedRows: StagedCatalogRow[]) {
  const manufacturerValues = Array.from(
    new Map(stagedRows.map((row) => [row.manufacturerSlug, { name: row.manufacturerName, slug: row.manufacturerSlug }])).values()
  );

  const carBrandValues = Array.from(
    new Map(stagedRows.map((row) => [row.carBrandSlug, { name: row.carBrandName, slug: row.carBrandSlug }])).values()
  );

  const scaleValues = Array.from(
    new Map(stagedRows.map((row) => [row.scaleLabel, { label: row.scaleLabel, sortOrder: sortOrderForScale(row.scaleLabel) }])).values()
  );

  if (manufacturerValues.length) {
    await db.insert(manufacturers).values(manufacturerValues).onConflictDoNothing();
  }

  if (carBrandValues.length) {
    await db.insert(carBrands).values(carBrandValues).onConflictDoNothing();
  }

  if (scaleValues.length) {
    await db.insert(scales).values(scaleValues).onConflictDoNothing();
  }

  const manufacturerMap = new Map<string, number>();
  const carBrandMap = new Map<string, number>();
  const scaleMap = new Map<string, number>();

  const manufacturerSlugs = manufacturerValues.map((item) => item.slug);
  const carBrandSlugs = carBrandValues.map((item) => item.slug);
  const scaleLabels = scaleValues.map((item) => item.label);

  if (manufacturerSlugs.length) {
    const manufacturerRows = await db
      .select({ id: manufacturers.id, slug: manufacturers.slug })
      .from(manufacturers)
      .where(inArray(manufacturers.slug, manufacturerSlugs));

    for (const row of manufacturerRows) manufacturerMap.set(row.slug, row.id);
  }

  if (carBrandSlugs.length) {
    const carBrandRows = await db
      .select({ id: carBrands.id, slug: carBrands.slug })
      .from(carBrands)
      .where(inArray(carBrands.slug, carBrandSlugs));

    for (const row of carBrandRows) carBrandMap.set(row.slug, row.id);
  }

  if (scaleLabels.length) {
    const scaleRows = await db
      .select({ id: scales.id, label: scales.label })
      .from(scales)
      .where(inArray(scales.label, scaleLabels));

    for (const row of scaleRows) scaleMap.set(row.label, row.id);
  }

  return { manufacturerMap, carBrandMap, scaleMap };
}

async function loadExistingModelKeys() {
  const existingRows = await db
    .select({
      manufacturerSlug: manufacturers.slug,
      skuNormalized: models.manufacturerSkuNormalized,
      scaleLabel: scales.label,
    })
    .from(models)
    .innerJoin(manufacturers, sql`${models.manufacturerId} = ${manufacturers.id}`)
    .innerJoin(scales, sql`${models.scaleId} = ${scales.id}`);

  const keys = new Set<string>();
  for (const row of existingRows) {
    keys.add(makeBusinessKey(row.manufacturerSlug, row.skuNormalized, row.scaleLabel));
  }
  return keys;
}

export async function importCatalogFromWorkbook(options: CatalogImportOptions): Promise<CatalogImportSummary> {
  const rows = loadRows(options.filePath, options.sheetName ?? "clean_import_safe");
  const reviewRows: ReviewRow[] = [];
  const stagedRows: StagedCatalogRow[] = [];
  let skipped = 0;

  for (const [index, rawRow] of rows.entries()) {
    const brand = (rawRow.brand ?? "").toString().trim();
    const productName = (rawRow.product_name ?? "").toString().trim();
    const cleanSkuRaw = (rawRow.clean_sku ?? "").toString().trim();

    if (!brand || !productName || !cleanSkuRaw) {
      skipped += 1;
      reviewRows.push({
        brand: rawRow.brand,
        product_name: rawRow.product_name,
        clean_sku: rawRow.clean_sku,
        scale: rawRow.scale,
        year: coerceYear(rawRow.year),
        reason: "Missing one of required fields: brand, product_name, clean_sku",
        source_file: rawRow.source_file,
        source_sheet: rawRow.source_sheet,
        source_row: coerceSourceRow(rawRow.source_row),
      });
      continue;
    }

    const manufacturerName = titleCaseManufacturer(brand);
    const manufacturerSlug = slugify(manufacturerName);
    const manufacturerSku = cleanSkuRaw;
    const manufacturerSkuNormalized = normalizeSku(cleanSkuRaw);
    const scaleLabel = normalizeScaleLabel(rawRow.scale?.toString() ?? null);
    const carBrandName = inferCarBrandName(productName);
    const carBrandSlug = slugify(carBrandName);
    const year = coerceYear(rawRow.year);
    const displayName = buildDisplayName(manufacturerName, productName, scaleLabel).slice(0, 255);
    const normalizedName = normalizeName(displayName).slice(0, 255);
    const slug = buildModelSlug(manufacturerName, productName, manufacturerSku, scaleLabel);
    const reviewReasons: string[] = [];

    if (scaleLabel === "Unknown") {
      reviewReasons.push("Scale missing in source file");
    }
    if (carBrandName === "Unknown / Imported") {
      reviewReasons.push("Car brand could not be confidently parsed from product_name");
    }

    stagedRows.push({
      manufacturerName,
      manufacturerSlug,
      carBrandName,
      carBrandSlug,
      scaleLabel,
      manufacturerSku,
      manufacturerSkuNormalized,
      originalSku: rawRow.original_sku?.toString() ?? null,
      productName,
      displayName,
      normalizedName,
      slug,
      productType: rawRow.product_type?.toString() ?? null,
      sourceFile: rawRow.source_file?.toString() ?? path.basename(options.filePath),
      sourceSheet: rawRow.source_sheet?.toString() ?? options.sheetName ?? "clean_import_safe",
      sourceRow: coerceSourceRow(rawRow.source_row) ?? index + 2,
      ruleApplied: rawRow.rule_applied?.toString() ?? null,
      ruleStatus: rawRow.rule_status?.toString() ?? null,
      importNotes: rawRow.notes?.toString() ?? null,
      year,
      reviewReasons,
      businessKey: makeBusinessKey(manufacturerSlug, manufacturerSkuNormalized, scaleLabel),
    });

    if (reviewReasons.length) {
      reviewRows.push({
        brand: rawRow.brand,
        product_name: rawRow.product_name,
        clean_sku: rawRow.clean_sku,
        scale: rawRow.scale,
        year,
        reason: reviewReasons.join(" | "),
        source_file: rawRow.source_file?.toString() ?? null,
        source_sheet: rawRow.source_sheet?.toString() ?? null,
        source_row: coerceSourceRow(rawRow.source_row),
      });
    }

    if ((index + 1) % 250 === 0) {
      console.log(`Processed ${index + 1}/${rows.length} catalog rows...`);
    }
  }

  const dedupedRowsByBusinessKey = new Map<string, StagedCatalogRow>();
  const sourceDuplicateRows: ReviewRow[] = [];

  for (const row of stagedRows) {
    const existing = dedupedRowsByBusinessKey.get(row.businessKey);

    if (!existing) {
      dedupedRowsByBusinessKey.set(row.businessKey, row);
      continue;
    }

    sourceDuplicateRows.push({
      brand: row.manufacturerName,
      product_name: row.productName,
      clean_sku: row.manufacturerSku,
      scale: row.scaleLabel,
      year: row.year,
      reason: `Duplicate source business key detected: ${row.businessKey}. Keeping the later row and skipping the earlier source variant.`,
      source_file: row.sourceFile,
      source_sheet: row.sourceSheet,
      source_row: row.sourceRow,
    });

    const mergedReviewReasons = Array.from(new Set([...existing.reviewReasons, ...row.reviewReasons, `Duplicate source business key detected: ${row.businessKey}`]));

    dedupedRowsByBusinessKey.set(row.businessKey, {
      ...row,
      reviewReasons: mergedReviewReasons,
      importNotes: [existing.importNotes, row.importNotes, `Merged duplicate source rows for ${row.businessKey}`].filter(Boolean).join(' | '),
    });
  }

  if (sourceDuplicateRows.length) {
    reviewRows.push(...sourceDuplicateRows);
    console.log(`[dedupe] Collapsed ${sourceDuplicateRows.length} duplicate source rows before database write.`);
  }

  const dedupedRows = Array.from(dedupedRowsByBusinessKey.values());
  const existingKeys = await loadExistingModelKeys();
  let inserted = 0;
  let updated = 0;

  for (const row of dedupedRows) {
    if (existingKeys.has(row.businessKey)) {
      updated += 1;
    } else {
      inserted += 1;
      existingKeys.add(row.businessKey);
    }
  }

  const provisionalSummary: CatalogImportSummary = {
    totalRows: rows.length,
    inserted,
    updated,
    skipped,
    reviewNeeded: reviewRows.length,
    reportPath: "",
  };

  if (options.dryRun) {
    const reportPath = writeReport({ summary: provisionalSummary, reviewRows });
    return { ...provisionalSummary, reportPath };
  }

  const { manufacturerMap, carBrandMap, scaleMap } = await ensureLookupRows(dedupedRows);

  const payloads = dedupedRows.map((row) => {
    const manufacturerId = manufacturerMap.get(row.manufacturerSlug);
    const carBrandId = carBrandMap.get(row.carBrandSlug);
    const scaleId = scaleMap.get(row.scaleLabel);

    if (!manufacturerId || !carBrandId || !scaleId) {
      throw new Error(`Lookup resolution failed for ${row.displayName}`);
    }

    return {
      manufacturerId,
      manufacturerSku: row.manufacturerSku,
      manufacturerSkuNormalized: row.manufacturerSkuNormalized,
      originalSku: row.originalSku,
      carBrandId,
      carModel: row.productName.slice(0, 140),
      carGeneration: null,
      versionTrim: null,
      year: row.year,
      scaleId,
      displayName: row.displayName,
      normalizedName: row.normalizedName,
      slug: row.slug,
      productType: row.productType,
      sourceFile: row.sourceFile,
      sourceSheet: row.sourceSheet,
      sourceRow: row.sourceRow,
      ruleApplied: row.ruleApplied,
      ruleStatus: row.ruleStatus,
      importNotes: row.importNotes,
      updatedAt: new Date(),
    };
  });

  const batchSize = 250;
  const totalBatches = Math.ceil(payloads.length / batchSize);

  for (let start = 0; start < payloads.length; start += batchSize) {
    const batch = payloads.slice(start, start + batchSize);
    const batchNumber = Math.floor(start / batchSize) + 1;

    await db
      .insert(models)
      .values(batch)
      .onConflictDoUpdate({
        target: [models.manufacturerId, models.manufacturerSkuNormalized, models.scaleId],
        set: {
          manufacturerSku: sql`excluded.manufacturer_sku`,
          originalSku: sql`excluded.original_sku`,
          carBrandId: sql`excluded.car_brand_id`,
          carModel: sql`excluded.car_model`,
          carGeneration: sql`excluded.car_generation`,
          versionTrim: sql`excluded.version_trim`,
          year: sql`excluded.year`,
          displayName: sql`excluded.display_name`,
          normalizedName: sql`excluded.normalized_name`,
          slug: sql`excluded.slug`,
          productType: sql`excluded.product_type`,
          sourceFile: sql`excluded.source_file`,
          sourceSheet: sql`excluded.source_sheet`,
          sourceRow: sql`excluded.source_row`,
          ruleApplied: sql`excluded.rule_applied`,
          ruleStatus: sql`excluded.rule_status`,
          importNotes: sql`excluded.import_notes`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    console.log(`[batch ${batchNumber}/${totalBatches}] Upserted ${Math.min(start + batch.length, payloads.length)}/${payloads.length} catalog rows...`);
  }

  const reportPath = writeReport({ summary: provisionalSummary, reviewRows });
  return { ...provisionalSummary, reportPath };
}
