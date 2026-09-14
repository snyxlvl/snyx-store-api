import { count, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, licenseDevices, licenses, payments, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] === undefined) continue;
    values[field] = user[field] ?? null;
    updateSet[field] = user[field] ?? null;
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const emptyDashboard = {
  totals: [
    { label: "MRR", value: "R$ 0", change: "Sem assinaturas", tone: "coral" },
    { label: "Licenças ativas", value: "0", change: "Nenhuma ativa", tone: "lime" },
    { label: "Em teste", value: "0", change: "Nenhum teste", tone: "amber" },
    { label: "Churn mensal", value: "—", change: "Sem histórico", tone: "blue" },
  ],
  activity: [] as Array<{ name: string; email: string; plan: string; status: string; key: string; createdAt: Date | null }>,
  chart: [] as number[],
  distribution: { active: 0, trial: 0, other: 0 },
  devices: 0,
};

export async function getAdminDashboardSummary() {
  const db = await getDb();
  if (!db) return emptyDashboard;
  const [activeRows, trialRows, deviceRows, paymentRows, recentRows] = await Promise.all([
    db.select({ total: count() }).from(licenses).where(eq(licenses.status, "active")),
    db.select({ total: count() }).from(licenses).where(eq(licenses.status, "trial")),
    db.select({ total: count() }).from(licenseDevices),
    db.select({ total: count() }).from(payments),
    db.select({ name: users.name, email: users.email, plan: licenses.plan, status: licenses.status, key: licenses.key, createdAt: licenses.createdAt })
      .from(licenses).leftJoin(users, eq(licenses.userId, users.id)).orderBy(desc(licenses.createdAt)).limit(20),
  ]);
  const active = Number(activeRows[0]?.total ?? 0);
  const trial = Number(trialRows[0]?.total ?? 0);
  const paymentsCount = Number(paymentRows[0]?.total ?? 0);
  const devices = Number(deviceRows[0]?.total ?? 0);
  return {
    totals: [
      { label: "MRR", value: paymentsCount > 0 ? "Consultar Stripe" : "R$ 0", change: paymentsCount > 0 ? `${paymentsCount} pagamento(s)` : "Sem assinaturas", tone: "coral" },
      { label: "Licenças ativas", value: String(active), change: active ? "Dados reais" : "Nenhuma ativa", tone: "lime" },
      { label: "Em teste", value: String(trial), change: trial ? "Dados reais" : "Nenhum teste", tone: "amber" },
      { label: "Dispositivos", value: String(devices), change: devices ? "Conectados" : "Nenhum conectado", tone: "blue" },
    ],
    activity: recentRows.map((row) => ({ name: row.name || "Sem nome", email: row.email || "Sem e-mail", plan: row.plan, status: row.status, key: row.key, createdAt: row.createdAt })),
    chart: [],
    distribution: { active, trial, other: Math.max(0, recentRows.length - active - trial) },
    devices,
  };
}
