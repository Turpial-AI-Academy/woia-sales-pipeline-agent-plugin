---
name: sales-pipeline
description: Read, plan, propose or audit typed Opportunity pipeline state with accepted source authority, scoped transitions and evidence; preserve the compatible graph-only validator.
license: MIT
metadata:
  author: Turpial AI Academy
  version: "0.5.7"
---

# Sales Pipeline

Use for scoped Sales, Leasing, Supply Acquisition and Executive Opportunity/pipeline views or accepted bounded proposals.

## Shared source

Resolve Opportunity through the accepted Source Authority Map and identity through woia-identity. Customer Data is an optional organization CRM adapter, never the canonical cross-role identity or Opportunity master. Preserve separately owned Negotiation/Offer/Reservation/Lease/SaleTransaction/Payment references.

## Update workflow

1. Resolve exact organization/Opportunity ref and current accepted source-of-truth state/revision. UNKNOWN/stale source fails closed.
2. Determine the intended bounded change: stage, owner, status, next action or other authorized Sales field.
3. Check organization/Project stage-transition rules when present.
4. For typed proposals, use scripts/validate-opportunity-projection.mjs with authenticated host-resolved current context and exact competent acceptance. The legacy validate-transition helper remains graph-only compatible.
5. Confirm effective authority.
6. Only the owning configured source adapter may apply a validated proposal, with mandatory atomic revision CAS, durable exact-request idempotency and immutable evidence. This plugin does not perform that write.
7. Confirm resulting source state. If effect outcome is unknown, reconcile before retry.
8. Return before/after/effect evidence and next action.

## Deterministic transition validator

Use scripts/validate-transition.mjs --file <transition.json>.

The document specifies current, target and allowed transitions. The tool only validates the transition graph; it never grants authority or performs the write.

## Effects

Reads are read effects. Pipeline changes are external-write effects and require applicable authority.

## Typed Opportunity boundary

Read [the Opportunity contract](references/opportunity-contract.md). A won stage is not closing, signature, lease activation, payment or possession. This provider does not mutate those facts, dispatch communication or accept financial consequences. Never supply untrusted caller/model claims as authenticated context. The validator is an offline proposal check, not a runtime authority grant.
