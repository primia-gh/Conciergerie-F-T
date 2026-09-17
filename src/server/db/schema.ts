import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * `auth.users` est géré par Supabase Auth, pas par nos migrations.
 * Cette déclaration sert uniquement à établir la contrainte de clé étrangère.
 */
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// --- Enums ---

export const roleEnum = pgEnum("role", ["client", "concierge", "admin", "partner"]);

export const priorityEnum = pgEnum("priority", ["low", "normal", "high", "urgent"]);

export const requestStatusEnum = pgEnum("request_status", [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESEARCHING",
  "PROPOSAL_DRAFT",
  "PROPOSAL_SENT",
  "WAITING_CLIENT",
  "ACCEPTED",
  "REJECTED",
  "BOOKING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const paymentTypeEnum = pgEnum("payment_type", ["deposit", "full", "refund"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

export const partnerStatusEnum = pgEnum("partner_status", ["active", "inactive", "pending"]);

export const planCodeEnum = pgEnum("plan_code", ["free", "premium", "vip", "private"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "REQUEST_CREATED",
  "REQUEST_ASSIGNED",
  "MESSAGE_RECEIVED",
  "PROPOSAL_CREATED",
  "PROPOSAL_ACCEPTED",
  "PROPOSAL_REJECTED",
  "PAYMENT_SUCCESS",
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "REQUEST_COMPLETED",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "sms",
  "push",
  "in_app",
]);

// --- Identité ---

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  // Dupliqué depuis auth.users (synchronisé par le trigger handle_new_user) :
  // notre client applicatif n'a pas accès à auth.users (pas de clé service
  // role configurée) et a besoin de l'email pour les notifications (M11).
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  locale: text("locale").notNull().default("fr"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const conciergeProfiles = pgTable("concierge_profiles", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  bio: text("bio"),
  specialties: text("specialties").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  maxActiveRequests: integer("max_active_requests").notNull().default(20),
});

// --- Catalogue ---

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"),
  active: boolean("active").notNull().default(true),
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: planCodeEnum("code").notNull().unique(),
  name: text("name").notNull(),
  priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }).notNull(),
  requestLimit: integer("request_limit"),
  dedicatedConcierge: boolean("dedicated_concierge").notNull().default(false),
  features: jsonb("features").notNull().default({}),
});

// --- Abonnements (référence profiles, doit précéder client_profiles) ---

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "restrict" }),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clientProfiles = pgTable("client_profiles", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  preferences: jsonb("preferences").notNull().default({}),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
    onDelete: "set null",
  }),
});

// --- Partenaires ---

export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Lie un partenaire à un compte (rôle "partner") pour l'auto-service en Phase M13.
  // Nullable : un partenaire peut exister dans le CRM avant d'avoir un accès direct.
  profileId: uuid("profile_id")
    .unique()
    .references(() => profiles.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  website: text("website"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
  status: partnerStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Cœur métier : Requests ---

export const requests = pgTable(
  "requests",
  {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  conciergeId: uuid("concierge_id").references(() => profiles.id, { onDelete: "set null" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  locationText: text("location_text"),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  requestedDate: date("requested_date"),
  requestedTime: time("requested_time"),
  budgetMin: numeric("budget_min", { precision: 10, scale: 2 }),
  budgetMax: numeric("budget_max", { precision: 10, scale: 2 }),
  preferences: text("preferences"),
  priority: priorityEnum("priority").notNull().default("normal"),
  status: requestStatusEnum("status").notNull().default("NEW"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("requests_status_idx").on(table.status),
    index("requests_concierge_id_idx").on(table.conciergeId),
    index("requests_client_id_idx").on(table.clientId),
    index("requests_category_status_idx").on(table.categoryId, table.status),
  ],
);

export const requestStatusHistory = pgTable("request_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  fromStatus: requestStatusEnum("from_status"),
  toStatus: requestStatusEnum("to_status").notNull(),
  changedBy: uuid("changed_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const requestAttachments = pgTable("request_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "set null" }),
  storagePath: text("storage_path").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    attachments: jsonb("attachments").notNull().default([]),
    isInternalNote: boolean("is_internal_note").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_request_created_idx").on(table.requestId, table.createdAt)],
);

// --- Propositions ---

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  conciergeId: uuid("concierge_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "set null" }),
  status: proposalStatusEnum("status").notNull().default("draft"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const proposalOptions = pgTable("proposal_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  photos: jsonb("photos").notNull().default([]),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  address: text("address"),
  conditions: text("conditions"),
  advantages: text("advantages"),
  isSelected: boolean("is_selected").notNull().default(false),
  clientFeedback: text("client_feedback"),
});

// --- Réservations & paiements ---

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  proposalOptionId: uuid("proposal_option_id")
    .notNull()
    .references(() => proposalOptions.id, { onDelete: "restrict" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  status: bookingStatusEnum("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  type: paymentTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  commissionAmount: numeric("commission_amount", { precision: 10, scale: 2 }),
  status: paymentStatusEnum("status").notNull().default("pending"),
  invoiceUrl: text("invoice_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Notifications, avis, audit ---

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    payload: jsonb("payload").notNull().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notifications_user_read_idx").on(table.userId, table.readAt)],
);

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  rating: smallint("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// =====================================================================
// Agent IA Conciergerie F&T — conciergerie de location courte durée.
// Produit séparé de Conciergerie Premium ci-dessus (voir CLAUDE.md et
// docs/cahier-des-charges.md) : personnes, données et permissions
// distinctes, coexistant dans la même base. Lot L0 (socle) — 2026-09-17.
//
// Noms de table en français, à l'identique du cahier des charges, pour
// que l'utilisateur (non développeur) puisse toujours faire le lien avec
// son document de référence. Seule exception : `message` du cahier des
// charges devient `message_agent` ici, car `messages` (Conciergerie
// Premium, ligne 262) existe déjà avec un sens différent.
// =====================================================================

export const ownerStatusEnum = pgEnum("owner_status", [
  "prospect",
  "en_discussion",
  "client",
  "perdu",
]);

// "auteur (voyageur, agent, gérant)" — cahier des charges, table `message`.
// "proprietaire" ajouté en L1 : le cahier des charges ne prévoyait que
// voyageur/agent/gérant pour la table `message`, mais le chat de prospection
// (L1) fait parler un propriétaire (prospect), pas un voyageur en séjour.
export const messageAgentAuthorEnum = pgEnum("message_agent_author", [
  "voyageur",
  "agent",
  "gerant",
  "proprietaire",
]);

// "statut (proposé, validé, envoyé, corrigé)" — cahier des charges, table `message`.
export const messageAgentStatusEnum = pgEnum("message_agent_status", [
  "propose",
  "valide",
  "envoye",
  "corrige",
]);

// Les 3 niveaux d'autonomie du cahier des charges (§ Comportement de l'agent).
export const autonomyLevelEnum = pgEnum("autonomy_level", [
  "propose",
  "agit_apres_validation",
  "agit_seul",
]);

export const proprietaire = pgTable("proprietaire", {
  id: uuid("id").primaryKey().defaultRandom(),
  nom: text("nom").notNull(),
  email: text("email"),
  telephone: text("telephone"),
  statut: ownerStatusEnum("statut").notNull().default("prospect"),
  source: text("source"),
  ville: text("ville"),
  dateSignature: date("date_signature"),
  tauxCommission: numeric("taux_commission", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Qualification avant signature — "le bien devient logement à la signature".
export const bienProspect = pgTable("bien_prospect", {
  id: uuid("id").primaryKey().defaultRandom(),
  proprietaireId: uuid("proprietaire_id")
    .notNull()
    .references(() => proprietaire.id, { onDelete: "cascade" }),
  type: text("type"),
  adresse: text("adresse"),
  residencePrincipale: boolean("residence_principale"),
  capacite: integer("capacite"),
  equipements: text("equipements").array().notNull().default([]),
  disponibiliteSouhaitee: text("disponibilite_souhaitee"),
  estimationPreparee: text("estimation_preparee"),
  estimationEnvoyeeLe: timestamp("estimation_envoyee_le", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const logement = pgTable("logement", {
  id: uuid("id").primaryKey().defaultRandom(),
  proprietaireId: uuid("proprietaire_id")
    .notNull()
    .references(() => proprietaire.id, { onDelete: "restrict" }),
  nom: text("nom").notNull(),
  adresse: text("adresse").notNull(),
  capacite: integer("capacite"),
  equipements: text("equipements").array().notNull().default([]),
  reglesMaison: text("regles_maison"),
  heureArrivee: time("heure_arrivee"),
  heureDepart: time("heure_depart"),
  dureeMenageMinutes: integer("duree_menage_minutes"),
  // "activé pour l'agent seulement si sa fiche est complète" (§ Base de connaissances).
  statut: text("statut").notNull().default("inactif"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Table séparée et chiffrée — "jamais injectée telle quelle dans un message du modèle".
// Le chiffrement applicatif (colonne `valeur`) arrive avec l'outil `lire_logement`
// au lot L2 ; L0 pose seulement la structure, sans données réelles dedans encore.
export const secretLogement = pgTable("secret_logement", {
  id: uuid("id").primaryKey().defaultRandom(),
  logementId: uuid("logement_id")
    .notNull()
    .references(() => logement.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  valeurChiffree: text("valeur_chiffree").notNull(),
  fenetreEnvoiDebut: text("fenetre_envoi_debut"),
  fenetreEnvoiFin: text("fenetre_envoi_fin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// "Alimentée par l'adaptateur PMS" (lot L2) — vide tant qu'aucun PMS n'est choisi.
export const reservation = pgTable("reservation", {
  id: uuid("id").primaryKey().defaultRandom(),
  logementId: uuid("logement_id")
    .notNull()
    .references(() => logement.id, { onDelete: "cascade" }),
  canal: text("canal"),
  identifiantExterne: text("identifiant_externe"),
  voyageurId: uuid("voyageur_id").references(() => voyageur.id, { onDelete: "set null" }),
  dateArrivee: date("date_arrivee"),
  dateDepart: date("date_depart"),
  nombrePersonnes: integer("nombre_personnes"),
  montant: numeric("montant", { precision: 10, scale: 2 }),
  statut: text("statut").notNull().default("en_attente"),
  derniereSynchronisation: timestamp("derniere_synchronisation", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const voyageur = pgTable("voyageur", {
  id: uuid("id").primaryKey().defaultRandom(),
  nom: text("nom"),
  langue: text("langue").notNull().default("fr"),
  telephone: text("telephone"),
  email: text("email"),
  preferences: jsonb("preferences").notNull().default({}),
  consentementMemoire: boolean("consentement_memoire").notNull().default(false),
  datePurgePrevue: date("date_purge_prevue"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// "Base du tableau de fiabilité" — voir cahier des charges, table `message`.
// Renommée `message_agent` pour éviter la collision avec `messages` (ligne 262).
export const messageAgent = pgTable("message_agent", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id").references(() => reservation.id, { onDelete: "cascade" }),
  bienProspectId: uuid("bien_prospect_id").references(() => bienProspect.id, {
    onDelete: "cascade",
  }),
  canal: text("canal").notNull(),
  sens: text("sens").notNull(),
  contenu: text("contenu").notNull(),
  langue: text("langue").notNull().default("fr"),
  auteur: messageAgentAuthorEnum("auteur").notNull(),
  statut: messageAgentStatusEnum("statut").notNull().default("propose"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Le journal — "jamais modifiable après écriture". Aucune politique RLS
// d'update n'est créée pour cette table (voir migration L0).
export const action = pgTable("action", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  entiteType: text("entite_type"),
  entiteId: uuid("entite_id"),
  decision: text("decision").notNull(),
  regleAppliquee: text("regle_appliquee"),
  autonomieAuMoment: autonomyLevelEnum("autonomie_au_moment"),
  auteur: text("auteur").notNull(),
  justification: text("justification"),
  resultat: text("resultat"),
  coutTraitement: numeric("cout_traitement", { precision: 10, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// "Le cadre de décision, modifiable sans toucher au code" — une ligne par
// tâche réglable (réponse factuelle, envoi infos d'arrivée, etc.).
export const regle = pgTable("regle", {
  id: uuid("id").primaryKey().defaultRandom(),
  domaine: text("domaine").notNull(),
  tache: text("tache").notNull(),
  condition: text("condition"),
  actionAutorisee: text("action_autorisee"),
  plafond: numeric("plafond", { precision: 10, scale: 2 }),
  niveauAutonomie: autonomyLevelEnum("niveau_autonomie").notNull().default("propose"),
  version: integer("version").notNull().default(1),
  actif: boolean("actif").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const incident = pgTable("incident", {
  id: uuid("id").primaryKey().defaultRandom(),
  logementId: uuid("logement_id")
    .notNull()
    .references(() => logement.id, { onDelete: "cascade" }),
  reservationId: uuid("reservation_id").references(() => reservation.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  photos: jsonb("photos").notNull().default([]),
  gravite: text("gravite"),
  statut: text("statut").notNull().default("ouvert"),
  prestataireId: uuid("prestataire_id").references(() => prestataire.id, { onDelete: "set null" }),
  coutEstime: numeric("cout_estime", { precision: 10, scale: 2 }),
  validationProprietaire: boolean("validation_proprietaire"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prestataire = pgTable("prestataire", {
  id: uuid("id").primaryKey().defaultRandom(),
  nom: text("nom").notNull(),
  metier: text("metier").notNull(),
  zone: text("zone"),
  disponibilites: jsonb("disponibilites").notNull().default({}),
  contact: text("contact"),
  tarif: numeric("tarif", { precision: 10, scale: 2 }),
  note: numeric("note", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Phase 4 — table posée en L0 (toutes les tables du modèle de données le
// sont), mais sans utilisation réelle avant le lot L4.
export const menage = pgTable("menage", {
  id: uuid("id").primaryKey().defaultRandom(),
  logementId: uuid("logement_id")
    .notNull()
    .references(() => logement.id, { onDelete: "cascade" }),
  reservationId: uuid("reservation_id").references(() => reservation.id, { onDelete: "set null" }),
  prestataireId: uuid("prestataire_id").references(() => prestataire.id, { onDelete: "set null" }),
  date: date("date").notNull(),
  statut: text("statut").notNull().default("planifie"),
  checklist: jsonb("checklist").notNull().default([]),
  photosAvant: jsonb("photos_avant").notNull().default([]),
  photosApres: jsonb("photos_apres").notNull().default([]),
  anomaliesDetectees: text("anomalies_detectees"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// "Ce que l'agent a le droit de dire" — fiche offre F&T (portée globale) et
// fiches par logement (portée = logementId), versionnées.
export const ficheConnaissance = pgTable("fiche_connaissance", {
  id: uuid("id").primaryKey().defaultRandom(),
  logementId: uuid("logement_id").references(() => logement.id, { onDelete: "cascade" }),
  section: text("section").notNull(),
  contenu: text("contenu").notNull(),
  version: integer("version").notNull().default(1),
  auteur: text("auteur"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rendezVous = pgTable("rendez_vous", {
  id: uuid("id").primaryKey().defaultRandom(),
  bienProspectId: uuid("bien_prospect_id").references(() => bienProspect.id, {
    onDelete: "cascade",
  }),
  creneau: timestamp("creneau", { withTimezone: true }).notNull(),
  canal: text("canal"),
  statut: text("statut").notNull().default("propose"),
  compteRendu: text("compte_rendu"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Infrastructure d'authentification légère pour propriétaire/prestataire
// ("compte avec lien de connexion à usage unique" / "lien de mission
// personnel") — pas des comptes Supabase Auth complets, juste un jeton à
// usage unique qui expire. Le "Gérant" utilise le compte admin existant
// de Conciergerie Premium, pas cette table.
export const lienAcces = pgTable("lien_acces", {
  id: uuid("id").primaryKey().defaultRandom(),
  proprietaireId: uuid("proprietaire_id").references(() => proprietaire.id, {
    onDelete: "cascade",
  }),
  prestataireId: uuid("prestataire_id").references(() => prestataire.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
