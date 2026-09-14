import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(), openId: varchar("openId", { length: 64 }).notNull().unique(), name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }), role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(), stripeCustomerId: varchar("stripeCustomerId", { length: 128 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export const licenses = mysqlTable("licenses", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), key: varchar("key", { length: 32 }).notNull().unique(), plan: varchar("plan", { length: 32 }).notNull().default("trial"), status: mysqlEnum("status", ["active", "trial", "paused", "expired", "revoked"]).notNull().default("trial"), stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }), maxDevices: int("maxDevices").notNull().default(1), expiresAt: timestamp("expiresAt"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const licenseDevices = mysqlTable("licenseDevices", { id: int("id").autoincrement().primaryKey(), licenseId: int("licenseId").notNull(), deviceId: varchar("deviceId", { length: 128 }).notNull(), label: varchar("label", { length: 128 }), lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() });
export const payments = mysqlTable("payments", { id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }), stripeInvoiceId: varchar("stripeInvoiceId", { length: 128 }), createdAt: timestamp("createdAt").defaultNow().notNull() });
export const extensionEvents = mysqlTable("extensionEvents", { id: int("id").autoincrement().primaryKey(), licenseId: int("licenseId"), userId: int("userId"), deviceId: varchar("deviceId", { length: 128 }), eventType: varchar("eventType", { length: 96 }).notNull(), payload: text("payload"), createdAt: timestamp("createdAt").defaultNow().notNull() });
export const supportTickets = mysqlTable("supportTickets", { id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), subject: varchar("subject", { length: 190 }).notNull(), message: text("message").notNull(), status: mysqlEnum("status", ["open", "pending", "resolved"]).notNull().default("open"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() });
export const userPreferences = mysqlTable("userPreferences", { id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull().unique(), extensionEnabled: int("extensionEnabled").notNull().default(1), emailAlerts: int("emailAlerts").notNull().default(1), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() });

export type User = typeof users.$inferSelect; export type InsertUser = typeof users.$inferInsert;
export type License = typeof licenses.$inferSelect; export type InsertLicense = typeof licenses.$inferInsert;
export type LicenseDevice = typeof licenseDevices.$inferSelect; export type InsertLicenseDevice = typeof licenseDevices.$inferInsert;
export type Payment = typeof payments.$inferSelect; export type InsertPayment = typeof payments.$inferInsert;
export type ExtensionEvent = typeof extensionEvents.$inferSelect; export type InsertExtensionEvent = typeof extensionEvents.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect; export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect; export type InsertUserPreference = typeof userPreferences.$inferInsert;

export const planCatalog = [
  { id: "trial", name: "Free trial", price: 0, cadence: "15 minutos", description: "Teste o fluxo completo sem compromisso.", accent: "neutral", features: ["1 dispositivo", "Todas as automações", "Suporte por e-mail"] },
  { id: "pro", name: "Pro mensal", price: 19, cadence: "/mês", description: "Para quem quer velocidade todos os dias.", accent: "coral", features: ["Até 3 dispositivos", "Workspace inteligente", "Atualizações contínuas"] },
  { id: "studio", name: "Studio anual", price: 190, cadence: "/ano", description: "Mais controle para equipes pequenas.", accent: "lime", features: ["Até 10 dispositivos", "Gestão de licenças", "Suporte prioritário"] },
] as const;
export type PlanId = (typeof planCatalog)[number]["id"];
export function planFromId(id: string) { return planCatalog.find((plan) => plan.id === id) ?? planCatalog[1]; }
export const licenseStatusLabels = { active: "Ativa", trial: "Em teste", paused: "Pausada", expired: "Expirada", revoked: "Revogada" } as const;
