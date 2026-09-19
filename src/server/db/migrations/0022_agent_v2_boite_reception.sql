CREATE TYPE "public"."activite" AS ENUM('ft', 'premium', 'commun');--> statement-breakpoint
CREATE TYPE "public"."demande_status" AS ENUM('nouveau', 'brouillon_pret', 'valide', 'corrige', 'escalade');--> statement-breakpoint
CREATE TABLE "demande" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activite" "activite" NOT NULL,
	"canal_origine" text DEFAULT 'colle_par_gerant' NOT NULL,
	"expediteur" text,
	"logement_id" uuid,
	"contenu_recu" text NOT NULL,
	"langue" text,
	"statut" "demande_status" DEFAULT 'nouveau' NOT NULL,
	"brouillon" text,
	"reponse_finale" text,
	"motif_escalade" text,
	"fiches_utilisees" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cout_traitement" numeric(10, 4),
	"traite_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "demande_activite_metier" CHECK ("demande"."activite" <> 'commun')
);
--> statement-breakpoint
ALTER TABLE "action" ADD COLUMN "activite" "activite" DEFAULT 'ft' NOT NULL;--> statement-breakpoint
ALTER TABLE "fiche_connaissance" ADD COLUMN "activite" "activite" DEFAULT 'ft' NOT NULL;--> statement-breakpoint
ALTER TABLE "message_agent" ADD COLUMN "activite" "activite" DEFAULT 'ft' NOT NULL;--> statement-breakpoint
ALTER TABLE "regle" ADD COLUMN "activite" "activite" DEFAULT 'ft' NOT NULL;--> statement-breakpoint
ALTER TABLE "demande" ADD CONSTRAINT "demande_logement_id_logement_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logement"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demande_statut_created_idx" ON "demande" USING btree ("statut","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "regle_activite_domaine_tache_idx" ON "regle" USING btree ("activite","domaine","tache");