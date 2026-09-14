import "dotenv/config";
import crypto from "crypto";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe";
import { isValidExtensionVersion, registerExtensionSync } from "../extension-sync";
import { extensionVersions } from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";

function isPortAvailable(port: number): Promise<boolean> { return new Promise((resolve) => { const server = net.createServer(); server.listen(port, () => server.close(() => resolve(true))); server.on("error", () => resolve(false)); }); }
async function findAvailablePort(startPort = 3000) { for (let port = startPort; port < startPort + 20; port += 1) if (await isPortAvailable(port)) return port; throw new Error(`No available port found starting from ${startPort}`); }
async function startServer() {
  const app = express(); const server = createServer(app);
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" })); registerStripeWebhook(app);
  app.post("/api/extension/upload", express.raw({ type: ["application/zip", "application/octet-stream"], limit: "25mb" }), async (req, res) => {
    try {
      const context = await createContext({ req, res } as any);
      if (context.user?.role !== "admin") return res.status(403).json({ ok: false, error: "Acesso restrito" });
      if (!Buffer.isBuffer(req.body) || req.body.length < 4) return res.status(400).json({ ok: false, error: "Envie um arquivo ZIP válido" });
      const version = String(req.headers["x-extension-version"] || "").trim().slice(0, 32);
      const changelog = String(req.headers["x-extension-changelog"] || "").trim().slice(0, 4000);
      if (!isValidExtensionVersion(version)) return res.status(400).json({ ok: false, error: "Informe uma versão semântica, como 2.3.0" });
      const checksum = crypto.createHash("sha256").update(req.body).digest("hex");
      const stored = await storagePut(`extensions/${version}/snyx.store.api-${version}.zip`, req.body, "application/zip");
      const db = await getDb();
      if (!db) return res.status(503).json({ ok: false, error: "Banco indisponível" });
      const inserted = await db.insert(extensionVersions).values({ version, fileKey: stored.key, fileUrl: stored.url, checksum, changelog, uploadedBy: context.user.id, active: 0 });
      return res.json({ ok: true, id: Number(inserted[0]?.insertId || 0), version, fileUrl: stored.url, checksum });
    } catch (error) {
      console.error("[Extension Upload]", error);
      return res.status(500).json({ ok: false, error: "Não foi possível armazenar a extensão" });
    }
  });
  app.use(express.json({ limit: "50mb" })); app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerExtensionSync(app); registerStorageProxy(app); registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  if (process.env.NODE_ENV === "development") await setupVite(app, server); else serveStatic(app);
  const preferredPort = parseInt(process.env.PORT || "3000", 10); const port = await findAvailablePort(preferredPort); if (port !== preferredPort) console.log(`Port ${preferredPort} is busy, using port ${port} instead`); server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}
startServer().catch(console.error);
