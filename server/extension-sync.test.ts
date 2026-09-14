import { describe, expect, it } from "vitest";
import { isSuspiciousExtensionActivity, isUnlimitedPlan } from "./extension-sync";

describe("extension control rules", () => {
  it("treats only the founder plan as unlimited", () => {
    expect(isUnlimitedPlan("founder")).toBe(true);
    expect(isUnlimitedPlan("pro")).toBe(false);
    expect(isUnlimitedPlan("trial")).toBe(false);
  });

  it("detects suspicious extension activity without flagging normal events", () => {
    expect(isSuspiciousExtensionActivity("extension.heartbeat", { source: "service-worker" })).toBe(false);
    expect(isSuspiciousExtensionActivity("extension.bypass_attempt", {})).toBe(true);
    expect(isSuspiciousExtensionActivity("extension.event", { mode: "devtools-inject" })).toBe(true);
  });
});
