import type { Express, Request, Response } from "express";
import { and, count, eq } from "drizzle-orm";
import { extensionEvents, licenseDevices, licenses } from "../drizzle/schema";
import { getDb } from "./db";
import { createSecurityAlert, getGlobalControl } from "./admin-data";

export function registerExtensionSync(app: Express) {
  app.post("/api/extension/sync", async (req: Request, res: Response) => {
    try {
      const { licenseKey, deviceId, eventType, payload } = req.body || {};
      const serial = String(licenseKey || "").trim().toUpperCase();
      const device = String(deviceId || "").trim();
      const type = String(eventType || "heartbeat").slice(0, 96);
      if (!serial || !device) return res.status(400).json({ ok: false, error: "licenseKey e deviceId são obrigatórios" });
      const db = await getDb();
      if (!db) return res.status(503).json({ ok: false, error: "Banco indisponível" });
      const rows = await db.select({ id: licenses.id, userId: licenses.userId, status: licenses.status, maxDevices: licenses.maxDevices }).from(licenses).where(eq(licenses.key, serial)).limit(1);
      const license = rows[0];
      const suspicious = /bypass|tamper|inject|debug|devtools|unauthorized|spoof|invalid/i.test(`${type} ${JSON.stringify(payload || {})}`);
      if (!license) {
        await createSecurityAlert({ deviceId: device, alertType: "invalid_license", message: "Tentativa de sincronização com licença inexistente.", payload: { eventType: type } });
        return res.status(403).json({ ok: false, error: "Licença não autorizada" });
      }
      if (suspicious) await createSecurityAlert({ userId: license.userId, licenseId: license.id, deviceId: device, alertType: "suspicious_activity", message: "Atividade suspeita detectada na extensão.", payload: { eventType: type, payload } });
      const control = await getGlobalControl();
      if (control.maintenanceEnabled) {
        await createSecurityAlert({ userId: license.userId, licenseId: license.id, deviceId: device, alertType: "maintenance_block", message: "Operação bloqueada pelo modo de manutenção global.", payload: { eventType: type } });
        return res.status(503).json({ ok: false, maintenance: true, message: control.maintenanceMessage });
      }
      if (!["active", "trial"].includes(license.status)) {
        await createSecurityAlert({ userId: license.userId, licenseId: license.id, deviceId: device, alertType: "revoked_license", message: "Tentativa de uso com licença não autorizada.", payload: { eventType: type } });
        return res.status(403).json({ ok: false, error: "Licença não autorizada" });
      }
      const existing = await db.select({ id: licenseDevices.id }).from(licenseDevices).where(and(eq(licenseDevices.licenseId, license.id), eq(licenseDevices.deviceId, device))).limit(1);
      if (existing[0]) await db.update(licenseDevices).set({ lastSeenAt: new Date() }).where(eq(licenseDevices.id, existing[0].id));
      else {
        const deviceCount = await db.select({ total: count() }).from(licenseDevices).where(eq(licenseDevices.licenseId, license.id));
        if (Number(deviceCount[0]?.total ?? 0) >= license.maxDevices) {
          await createSecurityAlert({ userId: license.userId, licenseId: license.id, deviceId: device, alertType: "device_limit", message: "Tentativa de conectar dispositivo acima do limite da licença.", payload: { eventType: type } });
          return res.status(409).json({ ok: false, error: "Limite de dispositivos atingido" });
        }
        await db.insert(licenseDevices).values({ licenseId: license.id, deviceId: device, label: "Extensão snyx.store.api" });
      }
      await db.insert(extensionEvents).values({ licenseId: license.id, userId: license.userId, deviceId: device, eventType: type, payload: JSON.stringify(payload || {}) });
      return res.json({ ok: true, maintenance: false, licenseStatus: license.status, deviceId: device });
    } catch (error) {
      console.error("[Extension Sync]", error);
      return res.status(500).json({ ok: false, error: "Não foi possível sincronizar o evento" });
    }
  });
}
