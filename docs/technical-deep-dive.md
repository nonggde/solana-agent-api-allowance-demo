# Technical Deep Dive: Agent-Scoped API Payments With Solana Subscriptions and Allowances

## Thesis

Solana subscriptions and allowances are useful for AI agents because they replace an unbounded secret, such as an API key tied to a card or monthly plan, with a bounded payment capability.

That distinction matters. Agents can decide when a paid tool call is worth making, but users still need hard limits. A fixed or recurring stablecoin allowance gives the agent enough autonomy to work while keeping the user's downside explicit, inspectable, and revocable.

This article uses a concrete use case: an AI agent that calls paid APIs for code review, document summarization, or workflow automation. The same architecture also fits SaaS subscriptions and merchant plans.

## The Core Problem

Most paid APIs are built for humans and servers:

- create an account;
- add a card;
- receive an API key;
- set a dashboard spending limit, if one exists;
- hope the key does not leak or get overused.

This model is awkward for agents. An agent may need one paid request during a task, not a month-long subscription. A developer may want the agent to call a search API, repository intelligence API, PDF extraction API, image model, or compliance checker only when the result is worth the cost.

The payment primitive should answer four questions before the agent starts:

1. Who is allowed to pull funds?
2. What token and mint are being used?
3. How much can be spent?
4. When does the permission expire or reset?

Solana subscriptions and allowances can express those constraints directly.

## Primitive Summary

The subscriptions program introduces a **Subscription Authority** PDA for each user and token mint. The authority becomes the delegated token authority for the user's token account. It receives broad token approval at the token-program level, but the subscriptions program only lets it transfer when a separate delegation account allows the transfer.

In simpler terms:

- the token account has one program-controlled delegate;
- the program enforces many smaller permissions through Delegation PDAs;
- every transfer checks the relevant delegation terms before moving tokens.

The useful authorization models are:

- **Fixed delegation**: a one-time spend cap with optional expiry.
- **Recurring delegation**: a per-period cap that resets on a schedule.
- **Subscription plan**: merchant-published terms that subscribers can accept.

For agent-paid APIs, fixed and recurring delegations are the cleanest first fit. Subscription plans become attractive when an API provider wants to publish standard pricing terms for many users.

## Architecture

The program works around a limitation in the SPL Token delegate model: a token account can only have one delegate. Instead of giving every merchant or agent its own token delegate, the user initializes one Subscription Authority per `(user, mint)` pair.

The flow is:

1. The user initializes the Subscription Authority for a token mint such as USDC.
2. The user's associated token account approves the Subscription Authority.
3. The user creates one or more Delegation PDAs with specific limits.
4. A delegatee, such as an API gateway wallet, calls the relevant transfer instruction.
5. The program validates the delegation's amount, period, expiry, and authority rules.
6. If the check passes, the Subscription Authority signs the token transfer.

This keeps the token account simple while allowing many simultaneous payment permissions.

## SDK Mapping

The official TypeScript package is `@solana/subscriptions`. The SDK exposes high-level Kit plugin instructions and lower-level instruction builders.

The agent API payment flow maps to these calls:

| Payment step | SDK instruction |
| --- | --- |
| Create the per-user authority PDA | `initSubscriptionAuthority` |
| Authorize one bounded task | `createFixedDelegation` |
| Authorize a budget that resets by period | `createRecurringDelegation` |
| Charge after a served request | `transferFixed` or `transferRecurring` |
| Stop the authorization | `revokeDelegation` |
| Publish reusable merchant terms | `createPlan` |
| Accept reusable merchant terms | `subscribe` |
| Charge a plan subscriber | `transferSubscription` |
| Cancel/resume plan subscription | `cancelSubscription` / `resumeSubscription` |

The demo repository contains a TypeScript policy layer that calculates spending caps and then names the matching SDK instructions. It is deliberately offline: it requires no private key, wallet, RPC endpoint, or live transaction.

## Example 1: Repository Intelligence Agent

Imagine a code-review agent that can optionally call a paid repository intelligence API. Each call costs `0.05 USDC`. The user wants to let the agent spend up to `3 USDC` during a one-hour review session.

The fixed-delegation flow:

1. The user initializes a Subscription Authority for their USDC account.
2. The user creates a fixed delegation for the API gateway wallet.
3. The agent calls the paid API only when it believes the result is useful.
4. The API gateway pulls `0.05 USDC` after each served request.
5. The gateway cannot pull more than `3 USDC` total.
6. The user can revoke the delegation or let it expire.

This supports up to 60 paid calls and makes the maximum loss obvious before the agent starts.

Why fixed delegation fits:

- the task is short-lived;
- the budget is known up front;
- a total cap is easier to reason about than a subscription;
- the user should not need to keep an account balance open after the review.

## Example 2: Support Triage Agent

A support triage agent may need a daily budget for paid document summarization. Each call costs `0.025 USDC` and the daily budget is `10 USDC`.

A recurring delegation can express:

- amount: `10 USDC`;
- period: `86,400 seconds`;
- delegatee: the summarization API gateway;
- optional expiry: end of pilot, trial, or customer contract.

That gives the agent up to 400 calls per day, with automatic reset and no need to issue a new approval every morning.

Why recurring delegation fits:

- the task runs continuously;
- the user wants a daily or monthly operating budget;
- the API provider charges per fulfilled request;
- the agent should be able to continue working without asking for approval every time.

## Example 3: Merchant-Published API Plan

Subscription plans are a better fit when the provider wants reusable terms. For example, a developer API marketplace could publish a plan:

- mint: USDC;
- price: `5 USDC` per billing period;
- billing period: monthly;
- destinations: merchant treasury or split receivers;
- pullers: authorized collection services;
- metadata URI: plan details for wallets and UIs.

Users subscribe to the plan, creating subscription delegation accounts that reference the plan. At transfer time, `transferSubscription` checks the subscriber's state and the live plan rules.

This is closer to SaaS billing than agent tool calls. Still, both models share the same Subscription Authority infrastructure.

## Tradeoffs

### Benefits

- Hard spend caps are enforced by token transfer rules.
- Users do not need to expose unlimited API keys or card-backed accounts to an agent.
- Merchants can charge after serving a request.
- Recurring allowances match operational agent budgets.
- Revocation gives users a clear emergency stop.
- Subscription plans let merchants publish reusable terms for many customers.

### Costs

- The user still needs a wallet flow to initialize the authority and create delegation accounts.
- Rent is paid up front, though delegation and authority rent is recoverable when accounts are closed.
- API gateways must run collection logic and handle failed pulls.
- Wallet UX matters because users must understand who can pull how much and for how long.
- The user experience depends on indexers and dashboards that can show active allowances clearly.

### Security Considerations

- Delegatee identity must be shown clearly in wallet UI.
- Agent policy should check the expected price before calling a paid API.
- Gateways should not serve requests if the allowance is missing, expired, or exhausted.
- Users should prefer fixed delegations for one-off tasks and recurring delegations only for trusted long-running workflows.
- No private wallet keys or API keys should be passed into the agent context.
- Subscription plans should keep core billing terms immutable or clearly versioned so users are not surprised by changed terms.

## Canadian Relevance

Superteam Canada asks for Canadian relevance, and this primitive fits several Canadian product categories.

### Cohere-style AI APIs

Canadian AI API providers can benefit from per-request agent payments. Instead of asking every builder to create a full billing account before experimenting, an API gateway could accept a bounded USDC allowance for small agent workflows.

The user experience would be: "let this agent spend up to 5 USDC on embeddings or reranking during this task."

### Shopify-style Commerce Apps

Commerce automation agents often need small paid actions: enrichment, fraud checks, translation, product description generation, image cleanup, or fulfillment lookups. A merchant could approve a recurring daily budget for an automation agent without giving it broad access to a card-backed SaaS account.

The model is especially useful for app marketplaces where many small services charge by usage.

### Lightspeed-style Merchant Software

Retail and restaurant software often sits close to recurring operational workflows. A recurring allowance could pay for small add-on services, such as daily sales summaries, inventory enrichment, or AI-assisted support triage, while making the spending cap visible to the merchant.

These examples do not require those companies to adopt the primitive directly. They show the kinds of Canadian Web2 and AI businesses where bounded, programmable payment authority would be useful.

## When To Use Each Model

| Situation | Best fit |
| --- | --- |
| One agent task with a known maximum budget | Fixed delegation |
| Long-running agent with daily/monthly budget | Recurring delegation |
| SaaS provider with reusable public billing terms | Subscription plan |
| Untrusted or experimental tool | Fixed delegation with short expiry |
| Trusted production workflow | Recurring delegation with monitoring and revoke UI |

## Conclusion

Subscriptions and allowances make Solana useful as a payment-control layer for agents. The strongest near-term use case is not replacing every SaaS subscription. It is letting autonomous tools buy small digital services safely, with caps, expiry, and revocation built into the payment rail.

Agents need autonomy, but users need limits. Solana's subscriptions and allowances primitive is a practical way to give both sides what they need.

## References

- Solana announcement: https://solana.com/news/subscriptions-and-allowances
- Official program repository: https://github.com/solana-program/subscriptions
- TypeScript SDK package: https://www.npmjs.com/package/@solana/subscriptions
- Demo repository: https://github.com/nonggde/solana-agent-api-allowance-demo
