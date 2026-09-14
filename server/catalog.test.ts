import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("catalog", () => {
  it("exposes the trial, monthly and annual plans", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const plans = await caller.catalog.plans();
    expect(plans).toHaveLength(3);
    expect(plans.map((plan) => plan.id)).toEqual(["trial", "pro", "studio"]);
    expect(plans.find((plan) => plan.id === "pro")?.price).toBe(19);
  });

  it("returns the snyx product positioning and operating metrics", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const product = await caller.catalog.product();
    expect(product.name).toBe("snyx.store.api");
    expect(product.stats).toHaveLength(3);
    expect(product.description).toContain("workspace");
  });
});
