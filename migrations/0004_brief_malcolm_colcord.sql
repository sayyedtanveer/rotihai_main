CREATE TABLE "chef_preorder_settings" (
	"chef_id" text PRIMARY KEY NOT NULL,
	"lunch_enabled" boolean DEFAULT false NOT NULL,
	"lunch_min_notice_hours" integer DEFAULT 24 NOT NULL,
	"dinner_enabled" boolean DEFAULT false NOT NULL,
	"dinner_min_notice_hours" integer DEFAULT 12 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chef_preorder_settings" ADD CONSTRAINT "chef_preorder_settings_chef_id_chefs_id_fk" FOREIGN KEY ("chef_id") REFERENCES "public"."chefs"("id") ON DELETE no action ON UPDATE no action;