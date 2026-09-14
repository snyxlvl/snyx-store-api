import { describe, expect, it } from "vitest";
import { isSuspiciousExtensionActivity, isUnlimitedPlan, isValidExtensionVersion } from "./extension-sync";

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

  it("accepts semantic extension versions and rejects malformed values", () => {
    expect(isValidExtensionVersion("2.3.0")).toBe(true);
    expect(isValidExtensionVersion("2.3.0-beta.1")).toBe(true);
    expect(isValidExtensionVersion("latest")).toBe(false);
  });
});
