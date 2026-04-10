import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db/client";
import { carBrands, listings, manufacturers, models, scales } from "@/db/schema";
import { normalizeName, normalizeSku } from "@/lib/utils";

export type SearchScope = "catalog" | "listed";

export type SearchItem = {
  id: number;
  slug: string;
  displayName: string;
  manufacturerSku: string;
  manufacturer: string;
  scale: string;
  carBrand: string;
  activeListings: number;
};

export type SearchResult =
  | {
      kind: "results";
      scope: SearchScope;
      query: string;
      bestMatch: SearchItem | null;
      items: SearchItem[];
      total: number;
    }
  | {
      kind: "empty";
      scope: SearchScope;
      query: string;
      bestMatch: null;
      items: [];
      total: 0;
    };

type SearchCandidateRow = {
  id: number;
  slug: string;
  displayName: string;
  manufacturerSku: string;
  manufacturer: string;
  scale: string;
  carBrand: string;
  year: number | null;
  activeListings: number;
};

export type BrowseFilters = {
  manufacturer?: string;
  scale?: string;
  carBrand?: string;
  page?: number;
  pageSize?: number;
};

export type BrowseItem = {
  id: number;
  slug: string;
  displayName: string;
  manufacturer: string;
  manufacturerSku: string;
  scale: string;
  carBrand: string;
  year: number | null;
  activeListings: number;
};

export type BrowseResult = {
  items: BrowseItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const COMMON_SCALE_MAP: Record<string, string> = {
  "112": "1:12",
  "118": "1:18",
  "124": "1:24",
  "132": "1:32",
  "143": "1:43",
  "150": "1:50",
  "164": "1:64",
  "187": "1:87",
};

const DOMAIN_STRONG_SHORT_TOKENS = new Set([
  "hf",
  "m2",
  "m3",
  "m4",
  "m5",
  "m6",
  "rs2",
  "rs3",
  "rs4",
  "rs5",
  "rs6",
  "gt2",
  "gt3",
  "gt4",
  "zr1",
  "z06",
  "e30",
  "e36",
  "e46",
  "e92",
  "f40",
  "f80",
  "g80",
  "g82",
]);

const WEAK_TOKENS = new Set([
  "gt",
  "rs",
  "gtr",
  "amg",
  "red",
  "blue",
  "black",
  "white",
  "silver",
  "grey",
  "gray",
  "green",
  "yellow",
  "orange",
  "gold",
  "car",
  "cars",
  "model",
  "models",
]);

function splitTerms(rawQuery: string) {
  return normalizeName(rawQuery)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function extractScaleCandidates(rawQuery: string) {
  const found = new Set<string>();
  const lower = rawQuery.toLowerCase();

  const explicitRegex = /(?:^|\D)1\s*[:/ ]\s*(\d{1,3})(?=\D|$)/g;
  let match: RegExpExecArray | null = null;

  while ((match = explicitRegex.exec(lower)) !== null) {
    found.add(`1:${match[1]}`);
  }

  for (const token of lower.split(/\s+/)) {
    const compact = token.replace(/[^\d]/g, "");
    if (COMMON_SCALE_MAP[compact]) {
      found.add(COMMON_SCALE_MAP[compact]);
    }
  }

  return [...found];
}

function extractYearCandidates(rawQuery: string) {
  const years = new Set<number>();
  const matches = rawQuery.match(/\b(19\d{2}|20\d{2})\b/g) ?? [];

  for (const value of matches) {
    years.add(Number(value));
  }

  return [...years];
}

function isWeakToken(token: string) {
  if (!token) return true;
  if (DOMAIN_STRONG_SHORT_TOKENS.has(token)) return false;
  if (/^\d+$/.test(token)) return true;
  if (/[a-z]/.test(token) && /\d/.test(token)) return false;
  if (token.length <= 2) return true;
  return WEAK_TOKENS.has(token);
}

function uniqueWords(input: string) {
  return Array.from(new Set(normalizeName(input).split(/\s+/).filter(Boolean)));
}

function makeBigrams(value: string) {
  const normalized = ` ${value} `;
  const result: string[] = [];

  for (let i = 0; i < normalized.length - 1; i += 1) {
    result.push(normalized.slice(i, i + 2));
  }

  return result;
}

function diceCoefficient(a: string, b: string) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const aBigrams = makeBigrams(a);
  const bBigrams = makeBigrams(b);

  const counts = new Map<string, number>();
  for (const bigram of aBigrams) {
    counts.set(bigram, (counts.get(bigram) ?? 0) + 1);
  }

  let intersection = 0;
  for (const bigram of bBigrams) {
    const count = counts.get(bigram) ?? 0;
    if (count > 0) {
      counts.set(bigram, count - 1);
      intersection += 1;
    }
  }

  return (2 * intersection) / (aBigrams.length + bBigrams.length);
}

function tokenMatchStrength(token: string, field: string, words: string[]) {
  if (!token || !field) return 0;

  if (words.includes(token)) return 1;

  if (/[a-z]/.test(token) && /\d/.test(token) && field.includes(token)) {
    return 0.96;
  }

  if (token.length >= 3 && field.includes(token)) {
    return 0.9;
  }

  for (const word of words) {
    if (!word) continue;

    if (word.length >= 3 && token.length >= 3) {
      if (word.startsWith(token) || token.startsWith(word)) {
        return 0.8;
      }
    }

    if (word.length >= 3 && token.length >= 3) {
      const similarity = diceCoefficient(word, token);
      if (similarity >= 0.9) return 0.8;

      if (word.length >= 4 && token.length >= 4) {
        if (similarity >= 0.84) return 0.78;
        if (similarity >= 0.76) return 0.64;
      }
    }
  }

  return 0;
}

function buildPhrases(tokens: string[]) {
  const phrases: string[] = [];

  for (let i = 0; i < tokens.length - 1; i += 1) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (a && b) {
      phrases.push(`${a} ${b}`);
    }
  }

  return phrases;
}

function buildCandidateWhere(rawQuery: string, relaxed: boolean) {
  const raw = rawQuery.trim();
  const rawNormalized = normalizeName(rawQuery);
  const rawSku = normalizeSku(rawQuery);
  const tokens = splitTerms(rawQuery);
  const strongTokens = tokens.filter((token) => !isWeakToken(token));
  const tokensForSearch = strongTokens.length ? strongTokens : tokens;
  const scaleCandidates = extractScaleCandidates(rawQuery);
  const yearCandidates = extractYearCandidates(rawQuery);

  const conditions: SQL[] = [];

  if (rawNormalized) {
    conditions.push(ilike(models.normalizedName, `%${rawNormalized}%`));
    conditions.push(ilike(models.displayName, `%${raw}%`));
    conditions.push(ilike(models.carModel, `%${raw}%`));
    conditions.push(ilike(manufacturers.name, `%${raw}%`));
    conditions.push(ilike(carBrands.name, `%${raw}%`));
  }

  if (rawSku) {
    conditions.push(eq(models.manufacturerSkuNormalized, rawSku));
    conditions.push(ilike(models.manufacturerSkuNormalized, `%${rawSku}%`));
    conditions.push(ilike(models.manufacturerSku, `%${raw}%`));
  }

  for (const token of tokensForSearch) {
    conditions.push(ilike(models.normalizedName, `%${token}%`));
    conditions.push(ilike(models.displayName, `%${token}%`));
    conditions.push(ilike(models.carModel, `%${token}%`));
    conditions.push(ilike(manufacturers.name, `%${token}%`));
    conditions.push(ilike(carBrands.name, `%${token}%`));

    const tokenSku = normalizeSku(token);
    if (tokenSku.length >= 2) {
      conditions.push(ilike(models.manufacturerSkuNormalized, `%${tokenSku}%`));
    }
  }

  if (relaxed) {
    for (const token of tokens) {
      if (token.length >= 4) {
        conditions.push(sql`similarity(${models.normalizedName}, ${token}) > 0.22`);
        conditions.push(sql`similarity(lower(${models.carModel}), ${token}) > 0.22`);
        conditions.push(sql`similarity(lower(${manufacturers.name}), ${token}) > 0.24`);
        conditions.push(sql`similarity(lower(${carBrands.name}), ${token}) > 0.24`);
      }
    }

    if (rawNormalized.length >= 5) {
      conditions.push(sql`similarity(${models.normalizedName}, ${rawNormalized}) > 0.2`);
      conditions.push(
        sql`similarity(lower(${models.displayName}), ${normalizeName(raw)}) > 0.2`
      );
    }
  }

  if (scaleCandidates.length) {
    conditions.push(inArray(scales.label, scaleCandidates));
  }

  if (yearCandidates.length) {
    conditions.push(inArray(models.year, yearCandidates));
  }

  return conditions.length ? or(...conditions) : undefined;
}

function computeScore(row: SearchCandidateRow, rawQuery: string, scope: SearchScope) {
  const queryNorm = normalizeName(rawQuery);
  const querySku = normalizeSku(rawQuery);
  const tokens = splitTerms(rawQuery);
  const strongTokens = tokens.filter((token) => !isWeakToken(token));
  const weakTokens = tokens.filter((token) => isWeakToken(token));
  const phrases = buildPhrases(tokens);
  const scaleCandidates = extractScaleCandidates(rawQuery);
  const yearCandidates = extractYearCandidates(rawQuery);

  const displayNorm = normalizeName(row.displayName);
  const manufacturerNorm = normalizeName(row.manufacturer);
  const brandNorm = normalizeName(row.carBrand);
  const modelNorm = normalizeName(row.displayName);
  const scaleNorm = normalizeName(row.scale);
  const skuNorm = normalizeSku(row.manufacturerSku);
  const combined = normalizeName(
    `${row.displayName} ${row.manufacturer} ${row.carBrand} ${row.scale} ${row.manufacturerSku}`
  );

  const displayWords = uniqueWords(row.displayName);
  const manufacturerWords = uniqueWords(row.manufacturer);
  const brandWords = uniqueWords(row.carBrand);
  const combinedWords = uniqueWords(combined);

  let score = 0;
  let matchedStrong = 0;

  if (querySku && skuNorm === querySku) score += 3200;
  if (querySku && querySku.length >= 3 && skuNorm.startsWith(querySku)) score += 1500;
  if (querySku && querySku.length >= 3 && skuNorm.includes(querySku)) score += 700;

  if (queryNorm && displayNorm === queryNorm) score += 2200;
  if (queryNorm && combined === queryNorm) score += 1800;
  if (queryNorm && displayNorm.includes(queryNorm)) score += 900;
  if (queryNorm && combined.includes(queryNorm)) score += 420;

  const queryContainsMiniGt = queryNorm.includes("mini gt");
  const queryContainsRedBull =
    queryNorm.includes("red bull") ||
    queryNorm.includes("red bul") ||
    queryNorm.includes("bull");

  const queryContainsBmwM3 = queryNorm.includes("bmw m3");
  const queryContainsDeltaHf = queryNorm.includes("delta hf");

  if (queryContainsMiniGt) {
    if (manufacturerNorm.includes("mini gt")) {
      score += 900;
    } else {
      score -= 420;
    }
  }

  if (queryContainsRedBull) {
    const redBullField = `${displayNorm} ${brandNorm} ${combined}`;
    const hasRedBullFamily =
      redBullField.includes("red bull") ||
      redBullField.includes("bull") ||
      redBullField.includes("oracle") ||
      redBullField.includes("alphatauri") ||
      redBullField.includes("verstappen") ||
      redBullField.includes("perez");

    if (hasRedBullFamily) {
      score += 720;
    } else {
      score -= 260;
    }
  }

  if (queryContainsBmwM3) {
    const hasBmw = brandNorm.includes("bmw") || displayNorm.includes("bmw");
    const hasM3 = displayNorm.includes("m3") || combined.includes("m3");

    if (hasBmw && hasM3) {
      score += 1100;
    } else if (hasBmw || hasM3) {
      score -= 260;
    } else {
      score -= 760;
    }
  }

  if (queryContainsDeltaHf) {
    const hasDelta = displayNorm.includes("delta") || combined.includes("delta");
    const hasHf = displayNorm.includes("hf") || combined.includes("hf");

    if (hasDelta && hasHf) {
      score += 1100;
    } else if (hasDelta || hasHf) {
      score -= 260;
    } else {
      score -= 760;
    }
  }

  for (const phrase of phrases) {
    if (phrase.length < 5) continue;

    if (displayNorm.includes(phrase)) score += 420;
    if (manufacturerNorm.includes(phrase)) score += 320;
    if (brandNorm.includes(phrase)) score += 260;
    if (combined.includes(phrase)) score += 120;
  }

  for (const token of strongTokens) {
    const displayMatch = tokenMatchStrength(token, displayNorm, displayWords);
    const manufacturerMatch = tokenMatchStrength(token, manufacturerNorm, manufacturerWords);
    const brandMatch = tokenMatchStrength(token, brandNorm, brandWords);
    const combinedMatch = tokenMatchStrength(token, combined, combinedWords);
    const best = Math.max(displayMatch, manufacturerMatch, brandMatch, combinedMatch);

    if (best >= 0.62) matchedStrong += 1;

    if (displayMatch > 0) score += Math.round(displayMatch * 300);
    if (manufacturerMatch > 0) score += Math.round(manufacturerMatch * 260);
    if (brandMatch > 0) score += Math.round(brandMatch * 220);
    if (combinedMatch > 0) score += Math.round(combinedMatch * 80);

    const tokenSku = normalizeSku(token);
    if (tokenSku && skuNorm.includes(tokenSku)) {
      score += 180;
      if (best < 0.62) matchedStrong += 1;
    }

    if (best < 0.45 && !(tokenSku && skuNorm.includes(tokenSku))) {
      score -= 260;
    }
  }

  for (const token of weakTokens) {
    const weakMatch = tokenMatchStrength(token, combined, combinedWords);
    if (weakMatch >= 0.8) score += 40;
    else if (weakMatch >= 0.6) score += 20;
  }

  if (scaleCandidates.length) {
    if (scaleCandidates.includes(row.scale)) {
      score += 420;
    } else {
      score -= 520;
    }
  }

  if (yearCandidates.length && row.year && yearCandidates.includes(row.year)) score += 220;
  if (scaleNorm && queryNorm && scaleNorm === queryNorm) score += 120;

  if (queryNorm.length >= 4) {
    score += Math.round(diceCoefficient(modelNorm, queryNorm) * 180);
    score += Math.round(diceCoefficient(combined, queryNorm) * 90);
  }

  const strongCount = strongTokens.length;
  const coverage = strongCount > 0 ? matchedStrong / strongCount : 1;

  if (strongCount >= 3) {
    if (coverage < 0.67) score -= 1400;
    else if (coverage === 1) score += 320;
  } else if (strongCount === 2) {
    if (coverage < 1) score -= 1000;
    else score += 220;
  } else if (strongCount === 1) {
    if (coverage < 1) score -= 700;
    else score += 120;
  }

  if (scope === "listed") {
    if (row.activeListings <= 0) score -= 6000;
    else score += Math.min(row.activeListings * 40, 260);
  } else {
    score += Math.min(row.activeListings * 12, 80);
  }

  return { score, coverage, strongCount };
}

async function runSearchPass(rawQuery: string, scope: SearchScope, relaxed: boolean) {
  const whereExpr = buildCandidateWhere(rawQuery, relaxed);
  const activeListingsExpr = sql<number>`count(distinct ${listings.id})`;

  const listingJoinCondition = and(
    eq(listings.modelId, models.id),
    inArray(listings.status, ["active", "approved"])
  );

  const rows: SearchCandidateRow[] = await db
    .select({
      id: models.id,
      slug: models.slug,
      displayName: models.displayName,
      manufacturerSku: models.manufacturerSku,
      manufacturer: manufacturers.name,
      scale: scales.label,
      carBrand: carBrands.name,
      year: models.year,
      activeListings: activeListingsExpr.as("activeListings"),
    })
    .from(models)
    .innerJoin(manufacturers, eq(models.manufacturerId, manufacturers.id))
    .innerJoin(scales, eq(models.scaleId, scales.id))
    .innerJoin(carBrands, eq(models.carBrandId, carBrands.id))
    .leftJoin(listings, listingJoinCondition)
    .where(whereExpr)
    .groupBy(
      models.id,
      models.slug,
      models.displayName,
      models.manufacturerSku,
      manufacturers.name,
      scales.label,
      carBrands.name,
      models.year
    )
    .orderBy(desc(activeListingsExpr), asc(models.displayName))
    .limit(relaxed ? 420 : 260);

  return rows
    .map((row) => {
      const normalizedRow = {
        ...row,
        activeListings: Number(row.activeListings ?? 0),
      };
      const result = computeScore(normalizedRow, rawQuery, scope);

      return {
        row: normalizedRow,
        score: result.score,
        coverage: result.coverage,
        strongCount: result.strongCount,
      };
    })
    .filter((entry) => {
      if (scope === "listed" && entry.row.activeListings <= 0) return false;

      const minimumScore = relaxed ? 120 : 220;
      if (entry.score < minimumScore) return false;

      if (!relaxed) {
        if (entry.strongCount >= 3 && entry.coverage < 0.67) return false;
        if (entry.strongCount === 2 && entry.coverage < 1) return false;
        if (entry.strongCount === 1 && entry.coverage < 1) return false;
      } else {
        if (entry.strongCount >= 3 && entry.coverage < 0.67) return false;
        if (entry.strongCount === 2 && entry.coverage < 0.5) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.row.activeListings !== a.row.activeListings) {
        return b.row.activeListings - a.row.activeListings;
      }
      return a.row.displayName.localeCompare(b.row.displayName);
    })
    .slice(0, 48);
}

export async function searchModels(
  rawQuery: string,
  scope: SearchScope = "catalog"
): Promise<SearchResult> {
  const query = rawQuery.trim();

  if (!query) {
    return {
      kind: "empty",
      scope,
      query,
      bestMatch: null,
      items: [],
      total: 0,
    };
  }

  let scored = await runSearchPass(query, scope, false);

  if (!scored.length) {
    scored = await runSearchPass(query, scope, true);
  }

  if (!scored.length) {
    return {
      kind: "empty",
      scope,
      query,
      bestMatch: null,
      items: [],
      total: 0,
    };
  }

  const items: SearchItem[] = scored.map((entry) => ({
    id: entry.row.id,
    slug: entry.row.slug,
    displayName: entry.row.displayName,
    manufacturerSku: entry.row.manufacturerSku,
    manufacturer: entry.row.manufacturer,
    scale: entry.row.scale,
    carBrand: entry.row.carBrand,
    activeListings: entry.row.activeListings,
  }));

  return {
    kind: "results",
    scope,
    query,
    bestMatch: items[0] ?? null,
    items,
    total: items.length,
  };
}

export async function getBrowseResults(filters: BrowseFilters): Promise<BrowseResult> {
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = Math.min(100, Math.max(20, Number(filters.pageSize ?? 40)));
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];

  if (filters.manufacturer) {
    conditions.push(eq(manufacturers.name, filters.manufacturer));
  }

  if (filters.scale) {
    conditions.push(eq(scales.label, filters.scale));
  }

  if (filters.carBrand) {
    conditions.push(eq(carBrands.name, filters.carBrand));
  }

  const whereExpr = conditions.length ? and(...conditions) : undefined;
  const activeListingsExpr = sql<number>`count(distinct ${listings.id})`;

  const listingJoinCondition = and(
    eq(listings.modelId, models.id),
    inArray(listings.status, ["active", "approved"])
  );

  const items = await db
    .select({
      id: models.id,
      slug: models.slug,
      displayName: models.displayName,
      manufacturer: manufacturers.name,
      manufacturerSku: models.manufacturerSku,
      scale: scales.label,
      carBrand: carBrands.name,
      year: models.year,
      activeListings: activeListingsExpr.as("activeListings"),
    })
    .from(models)
    .innerJoin(manufacturers, eq(models.manufacturerId, manufacturers.id))
    .innerJoin(scales, eq(models.scaleId, scales.id))
    .innerJoin(carBrands, eq(models.carBrandId, carBrands.id))
    .leftJoin(listings, listingJoinCondition)
    .where(whereExpr)
    .groupBy(
      models.id,
      models.slug,
      models.displayName,
      models.manufacturerSku,
      manufacturers.name,
      scales.label,
      carBrands.name,
      models.year
    )
    .orderBy(asc(manufacturers.name), asc(models.displayName))
    .limit(pageSize)
    .offset(offset);

  const totalRows = await db
    .select({ total: sql<number>`count(*)` })
    .from(models)
    .innerJoin(manufacturers, eq(models.manufacturerId, manufacturers.id))
    .innerJoin(scales, eq(models.scaleId, scales.id))
    .innerJoin(carBrands, eq(models.carBrandId, carBrands.id))
    .where(whereExpr);

  const total = Number(totalRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: items.map((item) => ({
      ...item,
      activeListings: Number(item.activeListings ?? 0),
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getBrowseFilterOptions() {
  const manufacturerRows: Array<{ name: string }> = await db
    .select({ name: manufacturers.name })
    .from(manufacturers)
    .orderBy(asc(manufacturers.name));

  const scaleRows: Array<{ label: string }> = await db
    .select({ label: scales.label })
    .from(scales)
    .orderBy(asc(scales.sortOrder), asc(scales.label));

  const carBrandRows: Array<{ name: string }> = await db
    .select({ name: carBrands.name })
    .from(carBrands)
    .orderBy(asc(carBrands.name));

  return {
    manufacturers: manufacturerRows.map((row) => row.name),
    scales: scaleRows.map((row) => row.label),
    carBrands: carBrandRows.map((row) => row.name),
  };
}