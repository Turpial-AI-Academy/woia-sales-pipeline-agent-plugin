# woia-sales-pipeline

WOIA Sales v0.5.1 provider for `sales.pipeline`.

- Primary skill: `$sales-pipeline`
- Authoring profile: thin
- Origin: WOIA-native

Capability-owned deterministic tools/templates live in this plugin. Generic certification/release tooling lives in `woia-ecosystem`.

Adds typed Opportunity projection proposal validation for Sales, Leasing, Supply
Acquisition and Executive scoped consumers. CRM is optional; identity and domain
facts remain in their owning providers. Won stage never proves closing/payment.
The original graph-transition CLI remains compatible. See the
[Opportunity contract](skills/sales-pipeline/references/opportunity-contract.md).

Run `pnpm test`, `pnpm run ci:fast` and `pnpm run release:check`; then certify the
clean commit with Ecosystem `plugin:certify-thin`. No hosted services, dependencies,
MCP, universal writer or runtime authorization service is introduced.
