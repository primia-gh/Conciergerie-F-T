ALTER TABLE "partners" ADD COLUMN "profile_id" uuid;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_profile_id_unique" UNIQUE("profile_id");