---
name: sales-pipeline
description: Read, plan, update, or audit Sales pipeline state through the shared customer source of truth with explicit allowed transitions, current-state/revision checks, bounded patches, authority, and effect reconciliation.
license: MIT
metadata:
  author: Turpial AI Academy
  version: "0.5.0"
---

# Sales Pipeline

Use when Sales pipeline/customer state must be inspected or changed.

## Shared source

Use woia-customer-data rather than creating a Sales-local copy.

## Update workflow

1. Resolve exact customer/lead ref and current source-of-truth state/revision.
2. Determine the intended bounded change: stage, owner, status, next action or other authorized Sales field.
3. Check organization/Project stage-transition rules when present.
4. Validate the proposed transition with the bundled deterministic validator.
5. Confirm effective authority.
6. Apply the update through woia-customer-data or the configured CRM implementation with concurrency protection when supported.
7. Confirm resulting source state. If effect outcome is unknown, reconcile before retry.
8. Return before/after/effect evidence and next action.

## Deterministic transition validator

Use scripts/validate-transition.mjs --file <transition.json>.

The document specifies current, target and allowed transitions. The tool only validates the transition graph; it never grants authority or performs the write.

## Effects

Reads are read effects. Pipeline changes are external-write effects and require applicable authority.
