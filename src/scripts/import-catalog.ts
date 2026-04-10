import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { importCatalogFromWorkbook } from "../lib/catalog-import";

dotenv.config({ path: ".env.local" });

function resolveInputPath() {
  const args = process.argv.slice(2);
  const fileArg = args.find((arg) => !arg.startsWith("--"));
  const fallback = path.join(process.cwd(), "clean_import_for_site.xlsx");
  const filePath = fileArg ? path.resolve(process.cwd(), fileArg) : fallback;
  const dryRun = args.includes("--dry-run");

  return {
    filePath,
    dryRun,
  };
}

async function main() {
  const { filePath, dryRun } = resolveInputPath();

  if (!fs.existsSync(filePath)) {
    throw new Error(`Import file not found: ${filePath}`);
  }

  console.log(`Starting catalog import from: ${filePath}`);
  if (dryRun) {
    console.log("Running in DRY RUN mode. No database writes will be made.");
  }

  const summary = await importCatalogFromWorkbook({
    filePath,
    sheetName: "clean_import_safe",
    dryRun,
  });

  console.log("\nCatalog import finished.");
  console.log(`Total rows:     ${summary.totalRows}`);
  console.log(`Inserted:       ${summary.inserted}`);
  console.log(`Updated:        ${summary.updated}`);
  console.log(`Skipped:        ${summary.skipped}`);
  console.log(`Review needed:  ${summary.reviewNeeded}`);
  console.log(`Report:         ${summary.reportPath}`);
}

main().catch((error) => {
  console.error("Catalog import failed:", error);
  process.exit(1);
});
