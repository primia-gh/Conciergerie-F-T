CREATE TYPE "public"."autonomy_level" AS ENUM('propose', 'agit_apres_validation', 'agit_seul');--> statement-breakpoint
CREATE TYPE "public"."message_agent_author" AS ENUM('voyageur', 'agent', 'gerant');--> statement-breakpoint
CREATE TYPE "public"."message_agent_status" AS ENUM('propose', 'valide', 'envoye', 'corrige');--> statement-breakpoint
CREATE TYPE "public"."owner_status" AS ENUM('prospect', 'en_discussion', 'client', 'perdu');--> statement-breakpoint
CREATE TABLE "action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"entite_type" text,
	"entite_id" uuid,
	"decision" text NOT NULL,
	"regle_appliquee" text,
	"autonomie_au_moment" "autonomy_level",
	"auteur" text NOT NULL,
	"justification" text,
	"resultat" text,
	"cout_traitement" numeric(10, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bien_prospect" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proprietaire_id" uuid NOT NULL,
	"type" text,
	"adresse" text,
	"residence_principale" boolean,
	"capacite" integer,
	"equipements" text[] DEFAULT '{}' NOT NULL,
	"disponibilite_souhaitee" text,
	"estimation_preparee" text,
	"estimation_envoyee_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiche_connaissance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logement_id" uuid,
	"section" text NOT NULL,
	"contenu" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"auteur" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gravite" text,
	"statut" text DEFAULT 'ouvert' NOT NULL,
	"prestataire_id" uuid,
	"cout_estime" numeric(10, 2),
	"validation_proprietaire" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lien_acces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proprietaire_id" uuid,
	"prestataire_id" uuid,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lien_acces_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "logement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proprietaire_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"adresse" text NOT NULL,
	"capacite" integer,
	"equipements" text[] DEFAULT '{}' NOT NULL,
	"regles_maison" text,
	"heure_arrivee" time,
	"heure_depart" time,
	"duree_menage_minutes" integer,
	"statut" text DEFAULT 'inactif' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logement_id" uuid NOT NULL,
	"reservation_id" uuid,
	"prestataire_id" uuid,
	"date" date NOT NULL,
	"statut" text DEFAULT 'planifie' NOT NULL,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"photos_avant" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"photos_apres" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"anomalies_detectees" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid,
	"bien_prospect_id" uuid,
	"canal" text NOT NULL,
	"sens" text NOT NULL,
	"contenu" text NOT NULL,
	"langue" text DEFAULT 'fr' NOT NULL,
	"auteur" "message_agent_author" NOT NULL,
	"statut" "message_agent_status" DEFAULT 'propose' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prestataire" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"metier" text NOT NULL,
	"zone" text,
	"disponibilites" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"contact" text,
	"tarif" numeric(10, 2),
	"note" numeric(3, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proprietaire" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"email" text,
	"telephone" text,
	"statut" "owner_status" DEFAULT 'prospect' NOT NULL,
	"source" text,
	"ville" text,
	"date_signature" date,
	"taux_commission" numeric(5, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domaine" text NOT NULL,
	"tache" text NOT NULL,
	"condition" text,
	"action_autorisee" text,
	"plafond" numeric(10, 2),
	"niveau_autonomie" "autonomy_level" DEFAULT 'propose' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rendez_vous" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bien_prospect_id" uuid,
	"creneau" timestamp with time zone NOT NULL,
	"canal" text,
	"statut" text DEFAULT 'propose' NOT NULL,
	"compte_rendu" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logement_id" uuid NOT NULL,
	"canal" text,
	"identifiant_externe" text,
	"voyageur_id" uuid,
	"date_arrivee" date,
	"date_depart" date,
	"nombre_personnes" integer,
	"montant" numeric(10, 2),
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"derniere_synchronisation" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "secret_logement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logement_id" uuid NOT NULL,
	"type" text NOT NULL,
	"valeur_chiffree" text NOT NULL,
	"fenetre_envoi_debut" text,
	"fenetre_envoi_fin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voyageur" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text,
	"langue" text DEFAULT 'fr' NOT NULL,
	"telephone" text,
	"email" text,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"consentement_memoire" boolean DEFAULT false NOT NULL,
	"date_purge_prevue" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bien_prospect" ADD CONSTRAINT "bien_prospect_proprietaire_id_proprietaire_id_fk" FOREIGN KEY ("proprietaire_id") REFERENCES "public"."proprietaire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiche_connaissance" ADD CONSTRAINT "fiche_connaissance_logement_id_logement_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident" ADD CONSTRAINT "incident_logement_id_logement_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident" ADD CONSTRAINT "incident_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident" ADD CONSTRAINT "incident_prestataire_id_prestataire_id_fk" FOREIGN KEY ("prestataire_id") REFERENCES "public"."prestataire"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lien_acces" ADD CONSTRAINT "lien_acces_proprietaire_id_proprietaire_id_fk" FOREIGN KEY ("proprietaire_id") REFERENCES "public"."proprietaire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lien_acces" ADD CONSTRAINT "lien_acces_prestataire_id_prestataire_id_fk" FOREIGN KEY ("prestataire_id") REFERENCES "public"."prestataire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logement" ADD CONSTRAINT "logement_proprietaire_id_proprietaire_id_fk" FOREIGN KEY ("proprietaire_id") REFERENCES "public"."proprietaire"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menage" ADD CONSTRAINT "menage_logement_id_logement_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menage" ADD CONSTRAINT "menage_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menage" ADD CONSTRAINT "menage_prestataire_id_prestataire_id_fk" FOREIGN KEY ("prestataire_id") REFERENCES "public"."prestataire"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_agent" ADD CONSTRAINT "message_agent_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_agent" ADD CONSTRAINT "message_agent_bien_prospect_id_bien_prospect_id_fk" FOREIGN KEY ("bien_prospect_id") REFERENCES "public"."bien_prospect"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_bien_prospect_id_bien_prospect_id_fk" FOREIGN KEY ("bien_prospect_id") REFERENCES "public"."bien_prospect"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_logement_id_logement_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_voyageur_id_voyageur_id_fk" FOREIGN KEY ("voyageur_id") REFERENCES "public"."voyageur"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secret_logement" ADD CONSTRAINT "secret_logement_logement_id_logement_id_fk" FOREIGN KEY ("logement_id") REFERENCES "public"."logement"("id") ON DELETE cascade ON UPDATE no action;