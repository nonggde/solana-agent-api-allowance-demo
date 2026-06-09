# Technical Deep Dive: Agent-Scoped API Payments With Solana Allowances

## Thesis

Solana subscriptions and allowances are interesting for AI agents because they turn "give this tool an API key" into "give this tool a bounded payment capability."

For autonomous software, that difference is large. Agents can make useful decisions about when to call a paid API, but users still need hard limits. A fixed or recurring stablecoin allowance gives the agent enough autonomy to work while keeping the user's downside explicit.

## Primitive Summary

The subscriptions program introduces a Subscription Authority PDA for each user and token mint. The authority is approved as the token account delegate, while separate Delegation PDAs define the actual permissions.

The useful delegation models are:

- fixed delegation: a one-time spend cap with optional expiry;
- recurring delegation: a per-period cap that resets;
- subscription plan: merchant-defined billing terms accepted by a subscriber.

For an AI agent calling APIs, fixed and recurring delegations are the cleanest first fit.

## Example: Repository Intelligence Agent

Imagine a code-review agent that can optionally call a paid repository intelligence API. Each call costs 0.05 USDC. The user wants to let the agent spend up to 3 USDC during a one-hour review session.

The flow:

1. The user initializes a Subscription Authority for their USDC account.
2. The user creates a fixed delegation for the API gateway wallet.
3. The agent calls the API only when it believes the paid result is worth it.
4. The API gateway pulls 0.05 USDC after each served request.
5. The gateway cannot pull more than 3 USDC total.
6. The user can revoke the delegation or let it expire.

This supports up to 60 paid calls and makes the maximum loss obvious before the agent starts.

## Example: Support Triage Agent

A support triage agent may need a daily budget for paid document summarization. Each call costs 0.025 USDC and the daily budget is 10 USDC.

A recurring delegation can express:

- amount: 10 USDC;
- period: 86,400 seconds;
- delegatee: the summarization API gateway;
- optional expiry: end of pilot or contract.

That gives the agent up to 400 calls per day, with automatic reset and no need to issue a new approval every morning.

## Tradeoffs

### Benefits

- Hard spend caps are enforceable by token transfer rules.
- Users do not need to expose unlimited API keys to an agent.
- Merchants can charge after serving a request.
- Recurring allowances match operational agent budgets.
- Revocation gives users a clear emergency stop.

### Costs

- The user still needs to initialize the authority and create delegation accounts.
- Rent is paid up front, though delegation and authority rent is recoverable when accounts are closed.
- API gateways must run collection logic and handle failed pulls.
- Wallet UX matters because users must understand who can pull how much and for how long.

### Security Considerations

- Delegatee identity must be shown clearly in wallet UI.
- Agent policy should check the expected price before calling a paid API.
- Gateways should not serve requests if the allowance is missing or exhausted.
- Users should prefer fixed delegations for one-off tasks and recurring delegations only for trusted long-running workflows.
- No private wallet keys or API keys should be passed into the agent context.

## Canadian Relevance

Canadian AI startups and developer-tool companies could use this primitive for pay-per-use AI workflows. Examples of product categories that fit:

- AI code review and repository analysis tools;
- data extraction APIs for finance, insurance, or logistics documents;
- creator and small-business automation tools that need occasional paid enrichment calls.

The important pattern is not the specific company. It is the user experience: a Canadian builder can publish a paid API, and an agent can call it with a bounded USDC allowance instead of a card subscription.

## Conclusion

Subscriptions and allowances make Solana useful as a payment-control layer for agents. The strongest near-term use case is not replacing every SaaS subscription. It is letting autonomous tools buy small digital services safely, with caps, expiry, and revocation built into the payment rail.
