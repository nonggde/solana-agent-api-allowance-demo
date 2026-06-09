# Solana Agent API Allowance Demo

This is a technical demo for the Superteam Canada bounty:

`Technical Demo: Solana Native Subscriptions & Allowances Code Sample`

The demo shows how Solana subscriptions and allowances can be used for a practical AI-agent payment flow:

- an agent wants to call a paid API or tool;
- the user does not want to expose an unlimited API key or keep a monthly subscription open;
- the API gateway receives permission to pull only a bounded amount of stablecoins;
- the user can cap, expire, or revoke that authorization.

## Why This Use Case

AI agents are good at chaining tools, but tool calls often cross a payment boundary. A developer may want an agent to use a paid search API, repository intelligence API, PDF extraction API, or summarization API. Traditional billing choices are awkward:

- monthly plans are too heavy for occasional agent calls;
- prepaid balances are hard to scope per agent;
- API keys can leak or be overused;
- card-based billing is hard for autonomous software to reason about.

Solana subscriptions and allowances make a cleaner model possible: pay per request, but with an on-chain cap.

## What Runs Locally

This repo contains a small TypeScript policy demo that does not require a wallet, private key, RPC endpoint, or chain transaction. It calculates:

- a fixed allowance for one short-lived agent workflow;
- a recurring allowance for a daily agent budget;
- the maximum number of API calls possible before the allowance cap is hit;
- the matching `@solana/subscriptions` instruction flow.

Run it:

```bash
npm install
npm run demo
npm test
npm run typecheck
```

## Demo Video

Short demo video:

https://raw.githubusercontent.com/nonggde/solana-agent-api-allowance-demo/master/assets/agent-api-allowance-demo.mp4

## Technical Deep Dive

Long-form writeup:

https://github.com/nonggde/solana-agent-api-allowance-demo/blob/master/docs/technical-deep-dive.md

## Example Output

```text
Code-review agent can call paid repository intelligence API through a one-shot allowance

Merchant: API gateway
Price per API call: 0.05 USDC
Allowance limit: 3 USDC total cap before expiry
Maximum successful calls before cap: 60

Execution map:
1. Initialize subscription authority -> initSubscriptionAuthority
2. Create fixed delegation -> createFixedDelegation
3. Merchant or API gateway pulls payment -> transferFixed
4. Revoke or let the allowance expire -> revokeDelegation
```

## Mapping To The Official SDK

The official package is `@solana/subscriptions`.

Relevant SDK calls:

| Demo step | SDK instruction |
| --- | --- |
| Create the per-user authority PDA | `initSubscriptionAuthority` |
| Allow one bounded spend window | `createFixedDelegation` |
| Allow a budget that resets per period | `createRecurringDelegation` |
| Pull payment after a served API request | `transferFixed` or `transferRecurring` |
| Kill the approval | `revokeDelegation` |

SDK sketch:

```ts
import { address, createClient } from "@solana/kit";
import { solanaLocalRpc } from "@solana/kit-plugin-rpc";
import { signer } from "@solana/kit-plugin-signer";
import { subscriptionsProgram } from "@solana/subscriptions";

const client = createClient()
  .use(signer(walletSigner))
  .use(solanaLocalRpc({ rpcUrl: "http://127.0.0.1:8899" }))
  .use(subscriptionsProgram());

await client.subscriptions.instructions
  .initSubscriptionAuthority({
    tokenMint: address("USDC_MINT"),
    userAta: address("USER_USDC_ATA"),
    tokenProgram: address("TOKEN_PROGRAM"),
  })
  .sendTransaction();

await client.subscriptions.instructions
  .createFixedDelegation({
    tokenMint: address("USDC_MINT"),
    delegatee: address("API_GATEWAY_WALLET"),
    nonce: 0n,
    amount: 3_000_000n,
    expiryTs: BigInt(Math.floor(Date.now() / 1000) + 3600),
  })
  .sendTransaction();
```

## Architecture

The subscriptions program creates a Subscription Authority PDA for each user/mint pair. That authority becomes the single delegate on the user's token account. Individual Delegation PDAs then define what the authority may actually do.

For AI agents, this distinction matters:

- the token account has one delegate, not many scattered approvals;
- each agent or API gateway can get a separate delegation PDA;
- the user can revoke the delegation without changing the whole wallet setup;
- a fixed allowance is useful for one task;
- a recurring allowance is useful for daily or monthly agent budgets;
- subscription plans are useful when the API provider publishes standard terms.

## Sources

- Solana announcement: https://solana.com/news/subscriptions-and-allowances
- Official program repository: https://github.com/solana-program/subscriptions
- npm SDK package: https://www.npmjs.com/package/@solana/subscriptions

## Safety

This demo does not include private keys, wallet seed phrases, API keys, customer data, or live transactions. It is designed as a safe code sample and explanation layer for builders evaluating the primitive.
