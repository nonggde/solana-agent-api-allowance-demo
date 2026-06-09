# External Publishing Approval Packet

Status: GitHub repository published after user approval.

## Proposed GitHub Repository

Owner:

- `nonggde`

Repository name:

- `solana-agent-api-allowance-demo`

Visibility:

- Public

Repository description:

```text
TypeScript demo showing how Solana subscriptions and allowances can bound AI agent API spend.
```

Published repository:

https://github.com/nonggde/solana-agent-api-allowance-demo

## What Will Be Published

This local folder:

`C:\Users\Administrator\Desktop\新建文件夹\superteam-submissions\solana-agent-api-allowance-demo`

Files include:

- `README.md`
- `src/allowancePolicy.ts`
- `src/demo.ts`
- `test/allowancePolicy.test.ts`
- `docs/technical-deep-dive.md`
- `package.json`

Verification already run:

- `npm run demo`
- `npm test`
- `npm run typecheck`

## Superteam Listing

Technical demo bounty:

https://superteam.fun/earn/listing/technical-demo-solana-native-subscriptions-and-allowances-code-sample

## Exact Superteam Submission Text

Use this after the user approves Superteam submission:

```text
I built a TypeScript technical demo showing how Solana subscriptions and allowances can create bounded payment capabilities for AI agents that call paid APIs.

The demo models two practical flows:

1. A fixed USDC allowance for a one-off code-review agent workflow.
2. A recurring USDC allowance for a support triage agent with a daily API budget.

The repository includes a runnable policy demo, tests, a README, and a technical deep dive explaining how the flow maps to the official @solana/subscriptions SDK instructions: initSubscriptionAuthority, createFixedDelegation, createRecurringDelegation, transferFixed/transferRecurring, and revokeDelegation.

Public GitHub repository:
https://github.com/nonggde/solana-agent-api-allowance-demo
```

## Optional X Post Text

Only post if user approves separately:

```text
I built a small TypeScript demo for Solana subscriptions & allowances:

AI agents can call paid APIs with a bounded USDC allowance instead of an unlimited API key or monthly plan.

Fixed cap for one workflow.
Recurring cap for daily agent budgets.

#Solana #AIagents
```

## Safety Notes

- No private keys, wallet seed phrases, API keys, customer data, or live transactions are included.
- The demo is offline and deterministic.
- The README links to official Solana/subscriptions sources.
- Publishing the GitHub repo was approved and completed.
- Submitting to Superteam still requires explicit user approval of the exact submission text above.
