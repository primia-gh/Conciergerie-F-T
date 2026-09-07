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
