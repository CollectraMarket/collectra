import {
  pgEnum,
  pgSchema,
  pgTable,
  serial,
  integer,
  boolean,
  text,
  timestamp,
  uuid,
  varchar,
  decimal,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", { id: uuid("id").primaryKey() });

export const listingTypeEnum = pgEnum("listing_type", ["fixed_price", "auction"]);
export const conditionEnum = pgEnum("condition", ["mint", "near_mint", "excellent", "good", "fair", "loose"]);
export const currencyEnum = pgEnum("currency_code", ["RSD", "EUR", "USD"]);
export const countryEnum = pgEnum("country_code", ["RS", "HR", "BA", "ME", "DE", "AT", "IT", "FR", "GB", "US"]);
export const auctionStatusEnum = pgEnum("auction_status", ["scheduled", "live", "ended", "cancelled", "settled"]);
export const statusEnum = pgEnum("status", ["active", "inactive", "draft", "pending", "approved", "rejected", "archived", "suspended"]);
export const profileRoleEnum = pgEnum("profile_role", ["user", "admin"]);
export const profileStatusEnum = pgEnum("profile_status", ["pending", "active", "suspended"]);

export const manufacturers = pgTable(
  "manufacturers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    country: varchar("country", { length: 2 }),
    status: statusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("manufacturers_slug_uidx").on(table.slug),
    nameIdx: index("manufacturers_name_idx").on(table.name),
  })
);

export const carBrands = pgTable(
  "car_brands",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("car_brands_slug_uidx").on(table.slug),
    nameIdx: index("car_brands_name_idx").on(table.name),
  })
);

export const scales = pgTable(
  "scales",
  {
    id: serial("id").primaryKey(),
    label: varchar("label", { length: 20 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => ({
    labelUnique: uniqueIndex("scales_label_uidx").on(table.label),
  })
);

export const models = pgTable(
  "models",
  {
    id: serial("id").primaryKey(),
    manufacturerId: integer("manufacturer_id").notNull().references(() => manufacturers.id),
    manufacturerSku: varchar("manufacturer_sku", { length: 120 }).notNull(),
    manufacturerSkuNormalized: varchar("manufacturer_sku_normalized", { length: 120 }).notNull(),
    originalSku: varchar("original_sku", { length: 160 }),
    carBrandId: integer("car_brand_id").notNull().references(() => carBrands.id),
    carModel: varchar("car_model", { length: 140 }).notNull(),
    carGeneration: varchar("car_generation", { length: 140 }),
    versionTrim: varchar("version_trim", { length: 180 }),
    year: integer("year"),
    scaleId: integer("scale_id").notNull().references(() => scales.id),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 280 }).notNull(),
    productType: varchar("product_type", { length: 120 }),
    sourceFile: varchar("source_file", { length: 255 }),
    sourceSheet: varchar("source_sheet", { length: 120 }),
    sourceRow: integer("source_row"),
    ruleApplied: text("rule_applied"),
    ruleStatus: varchar("rule_status", { length: 40 }),
    importNotes: text("import_notes"),
    isUserSubmitted: boolean("is_user_submitted").notNull().default(false),
    createdByUserId: uuid("created_by_user_id").references(() => authUsers.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    skuLookupIdx: index("models_sku_lookup_idx").on(table.manufacturerSkuNormalized),
    nameLookupIdx: index("models_name_lookup_idx").on(table.normalizedName),
    slugUnique: uniqueIndex("models_slug_uidx").on(table.slug),
    modelUnique: uniqueIndex("models_manufacturer_sku_scale_uidx").on(
      table.manufacturerId,
      table.manufacturerSkuNormalized,
      table.scaleId
    ),
  })
);

export const profiles = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => authUsers.id),
    username: varchar("username", { length: 40 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: profileRoleEnum("role").notNull().default("user"),
    status: profileStatusEnum("status").notNull().default("active"),
    preferredCurrency: currencyEnum("preferred_currency").notNull().default("EUR"),
    preferredLanguage: varchar("preferred_language", { length: 10 }).notNull().default("en"),
    isIdentityVerified: boolean("is_identity_verified").notNull().default(false),
    ratingAvg: decimal("rating_avg", { precision: 4, scale: 2 }).notNull().default("0"),
    ratingCount: integer("rating_count").notNull().default(0),
    completedSalesCount: integer("completed_sales_count").notNull().default(0),
    activeListingsCount: integer("active_listings_count").notNull().default(0),
    completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  },
  (table) => ({
    userIdUnique: uniqueIndex("profiles_user_id_uidx").on(table.userId),
    usernameUnique: uniqueIndex("profiles_username_uidx").on(table.username),
    roleIdx: index("profiles_role_idx").on(table.role),
  })
);

export const listings = pgTable(
  "listings",
  {
    id: serial("id").primaryKey(),
    modelId: integer("model_id").notNull().references(() => models.id),
    sellerUserId: uuid("seller_user_id").notNull().references(() => authUsers.id),
    listingType: listingTypeEnum("listing_type").notNull(),
    condition: conditionEnum("condition").notNull(),
    priceAmount: decimal("price_amount", { precision: 12, scale: 2 }),
    priceCurrency: currencyEnum("price_currency"),
    country: countryEnum("country").notNull(),
    city: varchar("city", { length: 120 }),
    description: text("description").notNull(),
    status: statusEnum("status").notNull().default("draft"),
    slug: varchar("slug", { length: 280 }).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("listings_slug_uidx").on(table.slug),
    sellerIdx: index("listings_seller_idx").on(table.sellerUserId),
    modelStatusIdx: index("listings_model_status_idx").on(table.modelId, table.status),
  })
);

export const auctions = pgTable(
  "auctions",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id").notNull().references(() => listings.id),
    startPrice: decimal("start_price", { precision: 12, scale: 2 }).notNull(),
    currentPrice: decimal("current_price", { precision: 12, scale: 2 }).notNull(),
    currency: currencyEnum("currency").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: auctionStatusEnum("status").notNull().default("scheduled"),
  },
  (table) => ({
    listingUnique: uniqueIndex("auctions_listing_id_uidx").on(table.listingId),
    statusIdx: index("auctions_status_idx").on(table.status),
  })
);
