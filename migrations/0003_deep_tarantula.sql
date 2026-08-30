CREATE TYPE "public"."fulfillment_mode" AS ENUM('instant', 'preorder', 'both');--> statement-breakpoint
CREATE TYPE "public"."product_fulfillment_mode" AS ENUM('inherit', 'instant', 'preorder');--> statement-breakpoint
ALTER TABLE "chefs" ADD COLUMN "fulfillment_mode" "fulfillment_mode" DEFAULT 'both' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "fulfillment_mode" "product_fulfillment_mode" DEFAULT 'inherit' NOT NULL;