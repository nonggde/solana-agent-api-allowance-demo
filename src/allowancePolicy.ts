export type AllowanceMode = "fixed" | "recurring";

export type AgentAllowanceInput = {
  mode: AllowanceMode;
  agentName: string;
  apiName: string;
  merchantName: string;
  pricePerCallUsdc: string;
  maxBudgetUsdc: string;
  expiresInSeconds?: number;
  periodSeconds?: number;
};

export type AllowanceStep = {
  label: string;
  why: string;
  sdkInstruction: string;
};

export type AgentAllowancePlan = {
  mode: AllowanceMode;
  headline: string;
  agentName: string;
  apiName: string;
  merchantName: string;
  pricePerCallBaseUnits: bigint;
  maxBudgetBaseUnits: bigint;
  maxCalls: number;
  riskLimit: string;
  steps: AllowanceStep[];
};

const USDC_DECIMALS = 6;
const ONE_DAY_SECONDS = 24 * 60 * 60;

export function parseUsdcToBaseUnits(value: string): bigint {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(trimmed)) {
    throw new Error(`Invalid USDC amount: ${value}`);
  }

  const [whole, fraction = ""] = trimmed.split(".");
  return BigInt(whole) * 10n ** BigInt(USDC_DECIMALS) + BigInt(fraction.padEnd(USDC_DECIMALS, "0"));
}

export function formatUsdc(baseUnits: bigint): string {
  const whole = baseUnits / 1_000_000n;
  const fraction = (baseUnits % 1_000_000n).toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction} USDC` : `${whole} USDC`;
}

export function buildAgentAllowancePlan(input: AgentAllowanceInput): AgentAllowancePlan {
  const pricePerCall = parseUsdcToBaseUnits(input.pricePerCallUsdc);
  const maxBudget = parseUsdcToBaseUnits(input.maxBudgetUsdc);

  if (pricePerCall <= 0n) {
    throw new Error("pricePerCallUsdc must be greater than zero");
  }

  if (maxBudget < pricePerCall) {
    throw new Error("maxBudgetUsdc must cover at least one API call");
  }

  const maxCalls = Number(maxBudget / pricePerCall);
  const modeLabel = input.mode === "fixed" ? "one-shot allowance" : "recurring allowance";
  const riskLimit =
    input.mode === "fixed"
      ? `${formatUsdc(maxBudget)} total cap before expiry`
      : `${formatUsdc(maxBudget)} per ${input.periodSeconds ?? ONE_DAY_SECONDS} second period`;

  const steps: AllowanceStep[] = [
    {
      label: "Initialize subscription authority",
      why: "Create the per-user, per-mint authority PDA that becomes the only token-account delegate.",
      sdkInstruction: "initSubscriptionAuthority",
    },
    {
      label: input.mode === "fixed" ? "Create fixed delegation" : "Create recurring delegation",
      why:
        input.mode === "fixed"
          ? "Authorize one bounded spend window for a specific agent/API workflow."
          : "Authorize a reusable budget that resets every billing period.",
      sdkInstruction: input.mode === "fixed" ? "createFixedDelegation" : "createRecurringDelegation",
    },
    {
      label: "Merchant or API gateway pulls payment",
      why: "The API provider pulls only after serving a request, and cannot exceed the configured cap.",
      sdkInstruction: input.mode === "fixed" ? "transferFixed" : "transferRecurring",
    },
    {
      label: "Revoke or let the allowance expire",
      why: "The user keeps a clear kill switch and avoids unlimited API key style exposure.",
      sdkInstruction: "revokeDelegation",
    },
  ];

  return {
    mode: input.mode,
    headline: `${input.agentName} can call ${input.apiName} through a ${modeLabel}`,
    agentName: input.agentName,
    apiName: input.apiName,
    merchantName: input.merchantName,
    pricePerCallBaseUnits: pricePerCall,
    maxBudgetBaseUnits: maxBudget,
    maxCalls,
    riskLimit,
    steps,
  };
}

export function summarizePlan(plan: AgentAllowancePlan): string {
  const lines = [
    plan.headline,
    "",
    `Merchant: ${plan.merchantName}`,
    `Price per API call: ${formatUsdc(plan.pricePerCallBaseUnits)}`,
    `Allowance limit: ${plan.riskLimit}`,
    `Maximum successful calls before cap: ${plan.maxCalls}`,
    "",
    "Execution map:",
  ];

  for (const [index, step] of plan.steps.entries()) {
    lines.push(`${index + 1}. ${step.label} -> ${step.sdkInstruction}`);
    lines.push(`   ${step.why}`);
  }

  return lines.join("\n");
}
