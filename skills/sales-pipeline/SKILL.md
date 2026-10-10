---
name: sales-pipeline
description: Read, plan, propose or audit typed commercial-intent pipeline state with accepted source authority, admitted domain references, scoped transitions and evidence.
license: MIT
metadata:
  author: Turpial AI Academy
  version: "0.5.8"
---

# Sales Pipeline

Use for scoped Sales, Leasing, Supply Acquisition and Executive Opportunity/pipeline views or accepted bounded proposals.

## Shared source

Resolve Opportunity through the accepted Source Authority Map and identity through woia-identity. Customer Data is an optional organization CRM adapter. Preserve separately owned typed `domain_refs`; their definitions and owners come from the admitted host descriptor.

## Update workflow

1. Resolve exact organization/Opportunity ref and current accepted source-of-truth state/revision. UNKNOWN/stale source fails closed.
2. Determine the intended bounded change: stage, owner, status, next action or other authorized Sales field.
3. Check organization/Project stage-transition rules when present.
4. For typed proposals, use scripts/validate-opportunity-projection.mjs with authenticated host-resolved current context, an admitted descriptor for domain links and exact competent acceptance. The validate-transition helper checks a supplied graph only.
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

Read [the Opportunity contract](references/opportunity-contract.md). A pipeline stage does not accept a separately owned business outcome. This provider preserves those references, dispatches no communication and grants no financial consequence. Never supply untrusted caller/model claims as authenticated context. The validator is an offline proposal check; the source owner enforces revision CAS, durable idempotency and effect reconciliation.
