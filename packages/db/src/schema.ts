import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  datetime,
  timestamp,
  varchar
} from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
});

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: datetime("expires_at").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
  },
  (table) => ({
    userIdIdx: index("session_user_id_idx").on(table.userId)
  })
);

export const account = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: datetime("access_token_expires_at"),
    refreshTokenExpiresAt: datetime("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    userIdIdx: index("account_user_id_idx").on(table.userId)
  })
);

export const verification = mysqlTable("verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
});

export const workspaces = mysqlTable("workspaces", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  ownerId: varchar("owner_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
});

export const workspaceRole = mysqlEnum("workspace_role", ["owner", "admin", "member"]);

export const workspaceMembers = mysqlTable(
  "workspace_members",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    workspaceId: varchar("workspace_id", { length: 36 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceRole.notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    workspaceIdIdx: index("workspace_member_workspace_id_idx").on(table.workspaceId),
    userIdIdx: index("workspace_member_user_id_idx").on(table.userId)
  })
);

export const modelProviders = mysqlTable("model_providers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
});

export const modelMode = mysqlEnum("model_mode", ["text", "image", "voice", "video", "embedding"]);

export const models = mysqlTable(
  "models",
  {
    id: varchar("id", { length: 160 }).primaryKey(),
    providerId: varchar("provider_id", { length: 36 })
      .notNull()
      .references(() => modelProviders.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    mode: modelMode.notNull().default("text"),
    contextWindow: int("context_window"),
    inputCostPerMillion: int("input_cost_per_million"),
    outputCostPerMillion: int("output_cost_per_million"),
    enabled: boolean("enabled").notNull().default(true),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    providerIdIdx: index("models_provider_id_idx").on(table.providerId)
  })
);

export const generationStatus = mysqlEnum("generation_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled"
]);

export const generationJobs = mysqlTable(
  "generation_jobs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    workspaceId: varchar("workspace_id", { length: 36 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    modelId: varchar("model_id", { length: 160 }).references(() => models.id, {
      onDelete: "set null"
    }),
    status: generationStatus.notNull().default("queued"),
    prompt: text("prompt").notNull(),
    parameters: json("parameters"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    workspaceIdIdx: index("generation_jobs_workspace_id_idx").on(table.workspaceId),
    userIdIdx: index("generation_jobs_user_id_idx").on(table.userId)
  })
);

export const generationOutputs = mysqlTable(
  "generation_outputs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    jobId: varchar("job_id", { length: 36 })
      .notNull()
      .references(() => generationJobs.id, { onDelete: "cascade" }),
    contentType: varchar("content_type", { length: 80 }).notNull().default("text/plain"),
    content: text("content"),
    assetUrl: text("asset_url"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    jobIdIdx: index("generation_outputs_job_id_idx").on(table.jobId)
  })
);

export const savedItems = mysqlTable(
  "saved_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    workspaceId: varchar("workspace_id", { length: 36 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    outputId: varchar("output_id", { length: 36 }).references(() => generationOutputs.id, {
      onDelete: "set null"
    }),
    title: varchar("title", { length: 180 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    workspaceIdIdx: index("saved_items_workspace_id_idx").on(table.workspaceId),
    userIdIdx: index("saved_items_user_id_idx").on(table.userId)
  })
);

export const usageEvents = mysqlTable(
  "usage_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    workspaceId: varchar("workspace_id", { length: 36 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    modelId: varchar("model_id", { length: 160 }).references(() => models.id, {
      onDelete: "set null"
    }),
    jobId: varchar("job_id", { length: 36 }).references(() => generationJobs.id, {
      onDelete: "set null"
    }),
    inputTokens: int("input_tokens").notNull().default(0),
    outputTokens: int("output_tokens").notNull().default(0),
    estimatedCostCents: int("estimated_cost_cents").notNull().default(0),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => ({
    workspaceIdIdx: index("usage_events_workspace_id_idx").on(table.workspaceId),
    userIdIdx: index("usage_events_user_id_idx").on(table.userId)
  })
);

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  workspaceMemberships: many(workspaceMembers)
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id]
  })
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id]
  })
}));
