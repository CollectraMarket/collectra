CREATE TYPE "public"."auction_status" AS ENUM('scheduled', 'live', 'ended', 'cancelled', 'settled');--> statement-breakpoint
CREATE TYPE "public"."condition" AS ENUM('mint', 'near_mint', 'excellent', 'good', 'fair', 'loose');--> statement-breakpoint
CREATE TYPE "public"."country_code" AS ENUM('RS', 'HR', 'BA', 'ME', 'DE', 'AT', 'IT', 'FR', 'GB', 'US');--> statement-breakpoint
CREATE TYPE "public"."currency_code" AS ENUM('RSD', 'EUR', 'USD');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('fixed_price', 'auction');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive', 'draft', 'pending', 'approved', 'rejected', 'archived', 'suspended');--> statement-breakpoint
CREATE TABLE "auctions" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"start_price" numeric(12, 2) NOT NULL,
	"current_price" numeric(12, 2) NOT NULL,
	"currency" "currency_code" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "auction_status" DEFAULT 'scheduled' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"seller_user_id" uuid NOT NULL,
	"listing_type" "listing_type" NOT NULL,
	"condition" "condition" NOT NULL,
	"price_amount" numeric(12, 2),
	"price_currency" "currency_code",
	"country" "country_code" NOT NULL,
	"city" varchar(120),
	"description" text NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"slug" varchar(280) NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"country" varchar(2),
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" serial PRIMARY KEY NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"manufacturer_sku" varchar(120) NOT NULL,
	"manufacturer_sku_normalized" varchar(120) NOT NULL,
	"car_brand_id" integer NOT NULL,
	"car_model" varchar(140) NOT NULL,
	"car_generation" varchar(140),
	"version_trim" varchar(180),
	"year" integer,
	"scale_id" integer NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"slug" varchar(280) NOT NULL,
	"is_user_submitted" boolean DEFAULT false NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"username" varchar(40) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"preferred_currency" "currency_code" DEFAULT 'EUR' NOT NULL,
	"preferred_language" varchar(10) DEFAULT 'en' NOT NULL,
	"is_identity_verified" boolean DEFAULT false NOT NULL,
	"rating_avg" numeric(4, 2) DEFAULT '0' NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"completed_sales_count" integer DEFAULT 0 NOT NULL,
	"active_listings_count" integer DEFAULT 0 NOT NULL,
	"completion_rate" numeric(5, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scales" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(20) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_car_brand_id_car_brands_id_fk" FOREIGN KEY ("car_brand_id") REFERENCES "public"."car_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_scale_id_scales_id_fk" FOREIGN KEY ("scale_id") REFERENCES "public"."scales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "car_brands_slug_uidx" ON "car_brands" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "manufacturers_slug_uidx" ON "manufacturers" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "models_slug_uidx" ON "models" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_id_uidx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_username_uidx" ON "profiles" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "scales_label_uidx" ON "scales" USING btree ("label");