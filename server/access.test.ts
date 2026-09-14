import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "user" | "admin" | null): TrpcContext {
  return {
    user: role ? { id: 7, openId: "access-test", name: "Access Test", email: "access@example.com", loginMethod: "test", role, stripeCustomerId: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("access boundaries", () => {
  it("requires login for the customer account", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.customer.account()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps the admin dashboard restricted to administrators", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.dashboard.summary()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
