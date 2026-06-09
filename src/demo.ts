import { buildAgentAllowancePlan, summarizePlan } from "./allowancePolicy.js";

const fixedPlan = buildAgentAllowancePlan({
  mode: "fixed",
  agentName: "Code-review agent",
  apiName: "paid repository intelligence API",
  merchantName: "API gateway",
  pricePerCallUsdc: "0.05",
  maxBudgetUsdc: "3.00",
  expiresInSeconds: 60 * 60,
});

const recurringPlan = buildAgentAllowancePlan({
  mode: "recurring",
  agentName: "Support triage agent",
  apiName: "customer-safe document summarization API",
  merchantName: "AI workflow vendor",
  pricePerCallUsdc: "0.025",
  maxBudgetUsdc: "10.00",
  periodSeconds: 24 * 60 * 60,
});

console.log("=== Fixed delegation demo ===");
console.log(summarizePlan(fixedPlan));
console.log("");
console.log("=== Recurring delegation demo ===");
console.log(summarizePlan(recurringPlan));
