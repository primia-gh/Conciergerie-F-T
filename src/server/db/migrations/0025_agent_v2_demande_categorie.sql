ALTER TABLE "demande" ADD COLUMN "categorie_escalade" text;--> statement-breakpoint
ALTER TABLE "demande" ADD COLUMN "escalade_urgente" boolean DEFAULT false NOT NULL;