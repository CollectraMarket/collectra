DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_role') THEN
    CREATE TYPE "public"."profile_role" AS ENUM('user', 'admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_status') THEN
    CREATE TYPE "public"."profile_status" AS ENUM('pending', 'active', 'suspended');
  END IF;
END $$;

ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "original_sku" varchar(160);
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "product_type" varchar(120);
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "source_file" varchar(255);
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "source_sheet" varchar(120);
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "source_row" integer;
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "rule_applied" text;
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "rule_status" varchar(40);
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "import_notes" text;

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "avatar_url" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "role" "profile_role" DEFAULT 'user' NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "status" "profile_status" DEFAULT 'active' NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'models_created_by_user_id_auth_users_id_fk'
  ) THEN
    ALTER TABLE "models"
      ADD CONSTRAINT "models_created_by_user_id_auth_users_id_fk"
      FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_auth_users_id_fk'
  ) THEN
    ALTER TABLE "profiles"
      ADD CONSTRAINT "profiles_user_id_auth_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'listings_seller_user_id_auth_users_id_fk'
  ) THEN
    ALTER TABLE "listings"
      ADD CONSTRAINT "listings_seller_user_id_auth_users_id_fk"
      FOREIGN KEY ("seller_user_id") REFERENCES "auth"."users"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "manufacturers_name_idx" ON "manufacturers" USING btree ("name");
CREATE INDEX IF NOT EXISTS "car_brands_name_idx" ON "car_brands" USING btree ("name");
CREATE INDEX IF NOT EXISTS "models_sku_lookup_idx" ON "models" USING btree ("manufacturer_sku_normalized");
CREATE INDEX IF NOT EXISTS "models_name_lookup_idx" ON "models" USING btree ("normalized_name");
CREATE UNIQUE INDEX IF NOT EXISTS "models_manufacturer_sku_scale_uidx" ON "models" USING btree ("manufacturer_id", "manufacturer_sku_normalized", "scale_id");
CREATE INDEX IF NOT EXISTS "profiles_role_idx" ON "profiles" USING btree ("role");
CREATE UNIQUE INDEX IF NOT EXISTS "listings_slug_uidx" ON "listings" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "listings_seller_idx" ON "listings" USING btree ("seller_user_id");
CREATE INDEX IF NOT EXISTS "listings_model_status_idx" ON "listings" USING btree ("model_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "auctions_listing_id_uidx" ON "auctions" USING btree ("listing_id");
CREATE INDEX IF NOT EXISTS "auctions_status_idx" ON "auctions" USING btree ("status");
