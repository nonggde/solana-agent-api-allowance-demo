import { describe, expect, it } from "vitest";
import { buildAgentAllowancePlan, formatUsdc, parseUsdcToBaseUnits } from "../src/allowancePolicy.js";

describe("USDC parsing", () => {
  it("converts decimal USDC amounts to six-decimal base units", () => {
    expect(parseUsdcToBaseUnits("0.05")).toBe(50_000n);
    expect(parseUsdcToBaseUnits("3.00")).toBe(3_000_000n);
    expect(formatUsdc(10_250_000n)).toBe("10.25 USDC");
  });

  it("rejects over-precise amounts", () => {
    expect(() => parseUsdcToBaseUnits("0.0000001")).toThrow("Invalid USDC amount");
  });
});

describe("agent allowance plans", () => {
  it("calculates a bounded fixed allowance", () => {
    const plan = buildAgentAllowancePlan({
      mode: "fixed",
      agentName: "Code-review agent",
      apiName: "paid repository intelligence API",
      merchantName: "API gateway",
      pricePerCallUsdc: "0.05",
      maxBudgetUsdc: "3.00",
    });

    expect(plan.maxCalls).toBe(60);
    expect(plan.steps.map((step) => step.sdkInstruction)).toEqual([
      "initSubscriptionAuthority",
      "createFixedDelegation",
      "transferFixed",
      "revokeDelegation",
    ]);
  });

  it("calculates a bounded recurring allowance", () => {
    const plan = buildAgentAllowancePlan({
      mode: "recurring",
      agentName: "Support triage agent",
      apiName: "document summarization API",
      merchantName: "AI workflow vendor",
      pricePerCallUsdc: "0.025",
      maxBudgetUsdc: "10",
      periodSeconds: 86_400,
    });

    expect(plan.maxCalls).toBe(400);
    expect(plan.riskLimit).toContain("per 86400 second period");
    expect(plan.steps[1]?.sdkInstruction).toBe("createRecurringDelegation");
  });

  it("rejects budgets too small for one API call", () => {
    expect(() =>
      buildAgentAllowancePlan({
        mode: "fixed",
        agentName: "Agent",
        apiName: "API",
        merchantName: "Merchant",
        pricePerCallUsdc: "0.10",
        maxBudgetUsdc: "0.05",
      }),
    ).toThrow("cover at least one API call");
  });
});
